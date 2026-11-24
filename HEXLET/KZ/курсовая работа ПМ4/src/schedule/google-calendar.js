import { createCipheriv, createDecipheriv, createHash, randomBytes } from 'node:crypto';
import { Router } from 'express';
import { HttpError, send } from '../lib/http.js';
import { requireAuth } from '../middleware/auth.js';
import { scheduleAudience } from './service.js';

const scope = 'https://www.googleapis.com/auth/calendar.app.created';
const callback = '/integrations/google-calendar/callback';
const cookie = 'pm4_google_calendar';
const tokenUrl = 'https://oauth2.googleapis.com/token';
const calendarBase = 'https://www.googleapis.com/calendar/v3';
const marker = 'pm4-schedule';
const hash = (data) => createHash('sha256').update(data).digest('hex');
const clock = (value) => `${String(Math.floor(value / 60)).padStart(2, '0')}:${String(value % 60).padStart(2, '0')}:00`;
const oauthCookie = (secure) => ({ path: callback, httpOnly: true, sameSite: 'lax', secure });

function targetEvent(row, timeZone) {
  const day = row.date.toISOString().slice(0, 10);
  const event = {
    summary: row.subject,
    location: row.room,
    description: [row.kind, row.audience, row.teacherName].join(' · '),
    start: { dateTime: `${day}T${clock(row.startMinute)}`, timeZone },
    end: { dateTime: `${day}T${clock(row.endMinute)}`, timeZone },
  };
  const fingerprint = hash(JSON.stringify(event));
  return { fingerprint, body: { ...event, extendedProperties: { private: { source: marker, fingerprint } } } };
}

function credentialBox(secret) {
  const key = createHash('sha256').update('pm4-google-calendar\0' + secret).digest();
  return {
    seal(value) {
      const iv = randomBytes(12);
      const cipher = createCipheriv('aes-256-gcm', key, iv);
      const data = Buffer.concat([cipher.update(value, 'utf8'), cipher.final()]);
      return [iv, cipher.getAuthTag(), data].map((part) => part.toString('base64url')).join('.');
    },
    open(value) {
      const [iv, tag, data] = value.split('.').map((part) => Buffer.from(part, 'base64url'));
      const decipher = createDecipheriv('aes-256-gcm', key, iv);
      decipher.setAuthTag(tag);
      return Buffer.concat([decipher.update(data), decipher.final()]).toString('utf8');
    },
  };
}

export function createGoogleCalendar(db, config, request = fetch) {
  const { GOOGLE_CALENDAR_CLIENT_ID: clientId, GOOGLE_CALENDAR_CLIENT_SECRET: clientSecret,
    GOOGLE_CALENDAR_REDIRECT_URI: redirect, APP_TIME_ZONE: timeZone, JWT_SECRET: secret } = config;
  const enabled = Boolean(clientId && clientSecret && redirect);
  const secure = enabled && new URL(redirect).protocol === 'https:';
  const opts = oauthCookie(secure);
  const pending = new Map();
  const busy = new Set();
  const credentials = credentialBox(secret);
  const router = Router();
  router.use(requireAuth(db, secret));
  router.use((_req, res, next) => { res.setHeader('Cache-Control', 'no-store'); next(); });

  async function google(path, token, options = {}) {
    const { body, method = 'GET', missing = false } = options;
    const response = await request(calendarBase + path, {
      method, signal: AbortSignal.timeout(12_000),
      headers: { Authorization: `Bearer ${token}`, ...(body && { 'Content-Type': 'application/json' }) },
      ...(body && { body: JSON.stringify(body) }),
    });
    if (missing && [404, 410].includes(response.status)) return null;
    if (!response.ok) throw new HttpError(502, 'Google Календарь отклонил запрос');
    return response.status === 204 ? null : response.json();
  }

  async function getTokens(params) {
    const response = await request(tokenUrl, {
      method: 'POST', signal: AbortSignal.timeout(12_000),
      body: new URLSearchParams({ client_id: clientId, client_secret: clientSecret, ...params }),
    });
    if (!response.ok) throw new HttpError(502, 'Google не подтвердил доступ. Подключите календарь заново.');
    return response.json();
  }

  async function desired(user) {
    const rows = await db.scheduledSession.findMany({
      where: scheduleAudience(user),
      select: { date: true, startMinute: true, endMinute: true, subject: true, room: true,
        kind: true, audience: true, teacherName: true },
    });
    return new Map(rows.map((row) => targetEvent(row, timeZone)).map(({ fingerprint, body }) => [fingerprint, body]));
  }

  async function reconcile(userId, force = false) {
    if (busy.has(userId)) {
      if (force) throw new HttpError(409, 'Синхронизация уже выполняется');
      return null;
    }
    busy.add(userId);
    try {
      const connection = await db.googleCalendarConnection.findUnique({
        where: { userId }, include: { user: { select: { id: true, role: true } } },
      });
      if (!connection) return null;
      const events = await desired(connection.user);
      const sourceHash = hash(JSON.stringify([...events.keys()].sort()));
      const { credential } = connection;
      const save = (data) => db.googleCalendarConnection.updateMany({
        where: { userId, credential }, data: { lastChecked: new Date(), ...data },
      });
      if (!force && sourceHash === connection.sourceHash && !connection.failed) {
        await save({});
        return { count: events.size };
      }
      try {
        const { access_token: access } = await getTokens({
          grant_type: 'refresh_token', refresh_token: credentials.open(credential),
        });
        const path = `/calendars/${encodeURIComponent(connection.calendarId)}/events`;
        const obsolete = [];
        const existing = new Set();
        let nextToken;
        do {
          const query = new URLSearchParams({
            privateExtendedProperty: 'source=' + marker, maxResults: '2500',
            ...(nextToken && { pageToken: nextToken }),
          });
          const page = await google(`${path}?${query}`, access);
          for (const event of page.items ?? []) {
            const fingerprint = event.extendedProperties?.private?.fingerprint;
            if (event.extendedProperties?.private?.source !== marker) continue;
            if (!events.has(fingerprint) || existing.has(fingerprint)) obsolete.push(event.id);
            else existing.add(fingerprint);
          }
          nextToken = page.nextPageToken;
        } while (nextToken);
        for (const [fingerprint, body] of events) {
          if (!existing.has(fingerprint)) await google(path, access, { method: 'POST', body });
        }
        for (const id of obsolete) await google(`${path}/${encodeURIComponent(id)}`, access, { method: 'DELETE', missing: true });
        await save({ sourceHash, lastSynced: new Date(), failed: false });
        return { count: events.size };
      } catch (error) {
        await save({ failed: true });
        if (force) throw error;
        return null;
      }
    } finally {
      busy.delete(userId);
    }
  }

  router.get('/', async (req, res) => {
    const record = enabled && await db.googleCalendarConnection.findUnique({
      where: { userId: req.user.id }, select: { lastSynced: true, failed: true },
    });
    send(res, { enabled, connected: Boolean(record), lastSynced: record?.lastSynced, failed: record?.failed });
  });
  router.post('/connect', (req, res) => {
    if (!enabled) throw new HttpError(503, 'Google OAuth не настроен');
    const now = Date.now();
    for (const [state, item] of pending) if (item.expires <= now) pending.delete(state);
    if (pending.size >= 1024) throw new HttpError(429, 'Слишком много подключений. Повторите позже');
    const state = randomBytes(32).toString('base64url');
    const verifier = randomBytes(32).toString('base64url');
    pending.set(state, { userId: req.user.id, verifier, expires: now + 600_000 });
    const query = new URLSearchParams({
      client_id: clientId, redirect_uri: redirect, response_type: 'code', scope, state,
      access_type: 'offline', prompt: 'consent', code_challenge_method: 'S256',
      code_challenge: createHash('sha256').update(verifier).digest('base64url'),
    });
    res.cookie(cookie, state, { ...opts, maxAge: 600_000 });
    send(res, { url: 'https://accounts.google.com/o/oauth2/v2/auth?' + query });
  });
  router.post('/sync', async (req, res) => {
    if (!enabled) throw new HttpError(503, 'Google OAuth не настроен');
    const result = await reconcile(req.user.id, true);
    if (!result) throw new HttpError(404, 'Сначала подключите Google Календарь');
    send(res, result);
  });
  router.delete('/', async (req, res) => {
    if (busy.has(req.user.id)) throw new HttpError(409, 'Дождитесь окончания синхронизации');
    await db.googleCalendarConnection.deleteMany({ where: { userId: req.user.id } });
    send(res, { disconnected: true });
  });

  async function authorize(req, res) {
    const { state, code } = req.query;
    const match = req.headers.cookie?.split(';').map((value) => value.trim())
      .find((value) => value.startsWith(cookie + '='))?.slice(cookie.length + 1);
    res.clearCookie(cookie, opts);
    res.setHeader('Cache-Control', 'no-store');
    const failure = () => res.redirect('/?googleCalendar=error');
    if (!enabled || typeof state !== 'string' || state !== match) return failure();
    const entry = pending.get(state);
    pending.delete(state);
    if (!entry || entry.expires <= Date.now() || typeof code !== 'string') return failure();
    if (busy.has(entry.userId)) return failure();
    busy.add(entry.userId);
    try {
      const { refresh_token: refresh, access_token: token } = await getTokens({
        code, code_verifier: entry.verifier, redirect_uri: redirect, grant_type: 'authorization_code',
      });
      if (!refresh) return failure();
      const previous = await db.googleCalendarConnection.findUnique({
        where: { userId: entry.userId }, select: { calendarId: true },
      });
      const calendar = previous ? await google(`/calendars/${encodeURIComponent(previous.calendarId)}`, token, { missing: true }) : null;
      const { id: calendarId } = calendar ?? await google('/calendars', token, {
        method: 'POST', body: { summary: 'Учебное расписание', timeZone },
      });
      const data = { calendarId, credential: credentials.seal(refresh), sourceHash: null,
        lastChecked: null, lastSynced: null, failed: false };
      await db.googleCalendarConnection.upsert({
        where: { userId: entry.userId }, create: { userId: entry.userId, ...data }, update: data,
      });
      return res.redirect('/?googleCalendar=connected');
    } catch {
      return failure();
    } finally {
      busy.delete(entry.userId);
    }
  }

  async function refreshLinked() {
    if (!enabled) return;
    const records = await db.googleCalendarConnection.findMany({
      where: { OR: [{ lastChecked: null }, { lastChecked: { lt: new Date(Date.now() - 60_000) } }] },
      orderBy: { lastChecked: { sort: 'asc', nulls: 'first' } }, take: 10, select: { userId: true },
    });
    await Promise.allSettled(records.map(({ userId }) => reconcile(userId)));
  }

  return { router, callback, authorize, refreshLinked, enabled };
}
