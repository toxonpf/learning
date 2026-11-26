import assert from 'node:assert/strict';
import { once } from 'node:events';
import test from 'node:test';
import express from 'express';
import jwt from 'jsonwebtoken';
import { createGoogleCalendar } from '../src/schedule/google-calendar.js';
import { handleError } from '../src/middleware/errors.js';

test('Google connection requires its browser state and reconciles only managed classes', async (t) => {
  const user = { id: 'aece77f5-ca5a-4c09-af21-680de7c95171', role: 'user' };
  const config = {
    JWT_SECRET: 'private-test-key-1234567890123456789', APP_TIME_ZONE: 'Asia/Almaty',
    GOOGLE_CALENDAR_CLIENT_ID: 'example', GOOGLE_CALENDAR_CLIENT_SECRET: 'test-secret',
    GOOGLE_CALENDAR_REDIRECT_URI: 'http://127.0.0.1:3000/integrations/google-calendar/callback',
  };
  let record;
  const groupId = '54dc44fa-67ba-462e-bba2-8c4e8c68456a';
  const rows = [{ date: new Date('2026-11-24'), startMinute: 510, endMinute: 600, groupIds: [groupId],
    subject: 'Алгоритмы', kind: 'Практика', audience: 'ПО-24/1', teacherName: 'Преподаватель', room: '214' }];
  let leftOn = null;
  let calendarCalls = 0;
  const events = new Map([['personal', { id: 'personal', summary: 'Личная встреча' }]]);
  const db = {
    $transaction: (operation) => operation(db),
    user: { findUnique: async () => user },
    scheduledSession: { findMany: async ({ where }) => {
      assert.deepEqual(where, { studentIds: { has: user.id } });
      return rows;
    } },
    groupMembership: { findMany: async () => [{ groupId, joinedOn: new Date('2026-09-01'), leftOn }] },
    googleCalendarConnection: {
      findUnique: async () => record && { ...record, user },
      upsert: async ({ create }) => { record = { ...create }; },
      updateMany: async ({ data }) => { record = { ...record, ...data }; },
      findMany: async () => [{ userId: user.id }],
    },
  };
  const google = createGoogleCalendar(db, config, async (url, options) => {
    if (url === 'https://oauth2.googleapis.com/token') {
      if (options.body.get('grant_type') === 'authorization_code') assert.ok(options.body.get('code_verifier'));
      else assert.equal(options.body.get('refresh_token'), 'refresh-fixture');
      return Response.json({ access_token: 'test-access', refresh_token: 'refresh-fixture' });
    }
    calendarCalls++;
    assert.equal(options.headers.Authorization, 'Bearer test-access');
    const path = new URL(url).pathname;
    if (path.endsWith('/calendars') || path.endsWith('/calendars/school%40example.test')) {
      return Response.json({ id: 'school@example.test' });
    }
    if (options.method === 'GET') return Response.json({ items: [...events.values()] });
    if (options.method === 'POST') {
      const body = JSON.parse(options.body);
      assert.equal(body.start.timeZone, 'Asia/Almaty');
      assert.equal(body.start.dateTime, '2026-11-24T08:30:00');
      const id = 'event-' + calendarCalls;
      events.set(id, { ...body, id });
      return Response.json({ id });
    }
    events.delete(path.split('/').at(-1));
    return new Response(null, { status: 204 });
  });
  const app = express();
  app.use('/google', express.json({ limit: '2kb' }), google.router);
  app.get(google.callback, google.authorize);
  app.use(handleError({ error() {} }));
  const server = app.listen(0, '127.0.0.1');
  t.after(() => server.close());
  await once(server, 'listening');
  const origin = `http://127.0.0.1:${server.address().port}`;
  const token = jwt.sign({}, config.JWT_SECRET, {
    subject: user.id, issuer: 'attendance-journal', audience: 'attendance-api',
  });
  const headers = { Authorization: `Bearer ${token}` };
  const status = async () => (await (await fetch(origin + '/google', { headers })).json()).data;
  assert.deepEqual(await status(), { enabled: true, connected: false });
  const start = await fetch(origin + '/google/connect', { method: 'POST', headers });
  const authorization = new URL((await start.json()).data.url);
  assert.equal(authorization.searchParams.get('scope'), 'https://www.googleapis.com/auth/calendar.app.created');
  const callback = origin + google.callback + '?' + new URLSearchParams({ state: authorization.searchParams.get('state'), code: 'demo' });
  const rejected = await fetch(callback, { redirect: 'manual' });
  assert.equal(rejected.headers.get('location'), '/?googleCalendar=error');
  const accepted = await fetch(callback, { redirect: 'manual', headers: { Cookie: start.headers.get('set-cookie').split(';')[0] } });
  assert.equal(accepted.headers.get('location'), '/?googleCalendar=connected');
  assert.ok(record.credential);
  assert.notEqual(record.credential, 'refresh-fixture');
  const connected = await status();
  assert.equal(connected.connected, true);
  assert.equal(connected.embedUrl, 'https://calendar.google.com/calendar/embed?src=school%40example.test&ctz=Asia%2FAlmaty');
  assert.equal(connected.credential, undefined);
  await google.refreshLinked();
  assert.deepEqual([...events.values()].map((event) => event.summary), ['Личная встреча', 'Алгоритмы']);
  const again = await fetch(origin + '/google/sync', { method: 'POST', headers });
  assert.equal((await again.json()).data.count, 1);
  assert.equal(events.size, 2);
  leftOn = new Date('2026-11-24');
  await google.refreshLinked();
  assert.deepEqual([...events.keys()], ['personal']);
  const popup = await fetch(origin + '/google/connect', {
    method: 'POST', headers: { ...headers, 'Content-Type': 'application/json' }, body: JSON.stringify({ popup: true }),
  });
  const flow = new URL((await popup.json()).data.url).searchParams.get('state');
  const result = await fetch(origin + google.callback + '?' + new URLSearchParams({ state: flow, code: 'demo' }), {
    redirect: 'manual', headers: { Cookie: popup.headers.get('set-cookie').split(';')[0] },
  });
  assert.equal(result.headers.get('location'), `/google-calendar-result.html?result=connected&flow=${flow}`);
});
