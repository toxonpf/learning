import assert from 'node:assert/strict';
import { randomBytes, randomUUID } from 'node:crypto';
import { once } from 'node:events';
import test from 'node:test';
import { PrismaClient } from '@prisma/client';
import jwt from 'jsonwebtoken';
import { createApp } from '../src/app.js';
import { DAY, localDay } from '../src/lib/dates.js';
import { hashPassword } from '../src/lib/password.js';

const url = process.env.TEST_DATABASE_URL;
const password = 'Attendance-Test-123';
const timeZone = 'Asia/Almaty';
const date = localDay(timeZone);
const before = localDay(timeZone, new Date(Date.now() - 5 * DAY));
const after = localDay(timeZone, new Date(Date.now() + 7 * DAY));

test('REST API writes attendance in PostgreSQL and enforces membership and roles', {
  skip: url ? false : 'Set TEST_DATABASE_URL to a migrated test database',
  timeout: 45_000,
}, async (t) => {
  assert.match(new URL(url).pathname, /_test$/, 'Use a separate database with a name ending in _test');
  const db = new PrismaClient({ datasourceUrl: url });
  const run = randomBytes(5).toString('hex');
  const secret = randomBytes(32).toString('hex');
  const app = createApp({ db, config: { APP_TIME_ZONE: timeZone, JWT_SECRET: secret } });
  const server = app.listen(0, '127.0.0.1');
  t.after(async () => {
    await new Promise((resolve) => server.close(resolve));
    await db.$disconnect();
  });
  await once(server, 'listening');
  const base = `http://127.0.0.1:${server.address().port}/api`;
  const email = (name) => `${name}-${run}@example.test`;

  async function request(method, path, expected, body, token) {
    const response = await fetch(base + path, {
      method,
      headers: {
        ...(body && { 'Content-Type': 'application/json' }),
        ...(token && { Authorization: `Bearer ${token}` }),
      },
      ...(body && { body: typeof body === 'string' ? body : JSON.stringify(body) }),
    });
    assert.match(response.headers.get('content-type'), /^application\/json/);
    const json = await response.json();
    assert.equal(response.status, expected, `${method} ${path} returned ${JSON.stringify(json)}`);
    assert.equal(JSON.stringify(json).includes('passwordHash'), false);
    if (expected >= 400) assert.equal(typeof json.error.message, 'string');
    return json.data;
  }

  let admin;
  let teacher;
  let first;
  let second;
  let group;
  let other;
  let status;
  let member;
  let lesson;
  let otherLesson;
  let mark;

  await t.test('registration, password hashing, JWT and guest errors', async () => {
    await db.user.create({
      data: { name: 'Администратор', role: 'admin', email: email('admin'), passwordHash: await hashPassword(password) },
    });
    const register = (name) => request('POST', '/auth/register', 201, { name, email: email(name.toLowerCase()), password });
    admin = await request('POST', '/auth/login', 200, { email: email('ADMIN'), password });
    teacher = await register('Teacher');
    first = await register('StudentA');
    second = await register('StudentB');
    assert.equal(first.user.role, 'user');
    assert.equal(admin.user.role, 'admin');
    const stored = await db.user.findUniqueOrThrow({ where: { id: first.user.id } });
    assert.match(stored.passwordHash, /^scrypt:[0-9a-f]{32}:[0-9a-f]{128}$/);
    assert.notEqual(stored.passwordHash, (await db.user.findUniqueOrThrow({ where: { id: second.user.id } })).passwordHash);
    await request('POST', '/auth/register', 400, { name: 'Example', email: email('other'), password, role: 'admin' });
    await request('POST', '/auth/register', 409, { name: 'Duplicate', email: first.user.email, password });
    await request('POST', '/auth/login', 401, { email: first.user.email, password: 'Incorrect' });
    await request('POST', '/auth/login', 400, '{');
    await request('GET', '/groups', 401);
    await request('GET', '/groups', 401, null, 'invalid.jwt.token');
    const expired = jwt.sign({}, secret, {
      subject: admin.user.id, issuer: 'attendance-journal', audience: 'attendance-api', expiresIn: -1,
    });
    await request('GET', '/groups', 401, null, expired);
    const me = await request('GET', '/auth/me', 200, null, first.accessToken);
    assert.equal(me.user.id, first.user.id);
    assert.equal(me.timeZone, timeZone);
  });

  await t.test('admin creates groups, assigns teacher and students, and configures a new status', async () => {
    const a = admin.accessToken;
    const s = first.accessToken;
    await request('POST', '/groups', 403, { code: 'TEST', name: 'Test' }, s);
    await request('POST', '/statuses', 403, { name: 'Fail', code: 'F', color: '#276452' }, s);
    group = await request('POST', '/groups', 201, { code: `A/${run}`, name: 'Group A' }, a);
    other = await request('POST', '/groups', 201, { code: `B/${run}`, name: 'Group B' }, a);
    const promoted = await request('PATCH', `/users/${teacher.user.id}/role`, 200, { role: 'teacher' }, a);
    assert.equal(promoted.role, 'teacher');
    const directory = await request('GET', `/users?q=${run}&role=teacher`, 200, null, a);
    assert.deepEqual(directory.map(({ id }) => id), [teacher.user.id]);
    await request('PATCH', `/users/${first.user.id}/role`, 400, { role: 'admin' }, a);
    for (const [destination, account, start] of [
      [group, teacher, before], [group, first, before], [group, second, before], [other, second, before],
    ]) {
      const assignment = await request('POST', `/groups/${destination.id}/members`, 201,
        { userId: account.user.id, joinedOn: start }, a);
      if (account === first) member = assignment;
    }
    await request('POST', `/groups/${group.id}/members`, 409, { userId: first.user.id, joinedOn: date }, a);
    await request('POST', `/groups/${group.id}/members`, 400,
      { userId: first.user.id, joinedOn: date, leftOn: before }, a);
    await request('PATCH', `/users/${first.user.id}/role`, 409, { role: 'teacher' }, a);
    await request('GET', `/groups/${group.id}/members`, 403, null, teacher.accessToken);
    const groupList = await request('GET', '/groups', 200, null, teacher.accessToken);
    assert.deepEqual(groupList.map(({ id }) => id), [group.id]);
    const code = `A${run.slice(0, 4)}`;
    status = await request('POST', '/statuses', 201,
      { name: `Дистанционно ${run}`, code, color: '#24735A', countsAsPresent: true }, a);
    assert.equal(status.color, '#24735a');
    assert.equal(status.countsAsPresent, true);
    await request('POST', '/statuses', 409, { name: `Иной ${run}`, code, color: '#24735a' }, a);
  });

  await t.test('lesson access and attendance CRUD preserve the student, group and date invariants', async () => {
    const a = admin.accessToken;
    const s = first.accessToken;
    const p = teacher.accessToken;
    const lessonData = { title: 'Базы данных', date, startTime: '09:00' };
    await request('POST', `/groups/${other.id}/lessons`, 404, lessonData, p);
    await request('POST', `/groups/${group.id}/lessons`, 403, lessonData, s);
    await request('POST', `/groups/${group.id}/lessons`, 400, { ...lessonData, startTime: '25:00' }, p);
    lesson = await request('POST', `/groups/${group.id}/lessons`, 201, lessonData, p);
    otherLesson = await request('POST', `/groups/${other.id}/lessons`, 201, lessonData, a);
    await request('POST', `/groups/${group.id}/lessons`, 409, lessonData, p);
    await request('GET', `/lessons/${lesson.id}`, 200, null, s);
    await request('GET', `/lessons/${otherLesson.id}`, 404, null, s);
    const patched = await request('PATCH', `/lessons/${lesson.id}`, 200, { title: 'Практика PostgreSQL' }, p);
    assert.equal(patched.title, 'Практика PostgreSQL');

    const record = { lessonId: lesson.id, studentId: first.user.id, statusId: status.id, note: 'Работал удалённо' };
    await request('POST', '/attendance', 403, record, s);
    await request('POST', '/attendance', 400, { ...record, userId: first.user.id }, p);
    await request('POST', '/attendance', 409, { ...record, lessonId: otherLesson.id }, a);
    await request('POST', '/attendance', 409, { ...record, studentId: teacher.user.id }, p);
    mark = await request('POST', '/attendance', 201, record, p);
    assert.equal(mark.membership.user.id, first.user.id);
    assert.equal(mark.markedBy.id, teacher.user.id);
    assert.equal(mark.status.id, status.id);
    assert.equal(mark.lesson.title, patched.title);
    await request('POST', '/attendance', 409, record, p);
    await request('GET', `/attendance/${mark.id}`, 404, null, second.accessToken);
    const saved = await request('GET', `/attendance/${mark.id}`, 200, null, s);
    assert.equal(saved.note, record.note);
    await request('PATCH', `/attendance/${mark.id}`, 403, { note: 'No access' }, s);
    const edited = await request('PATCH', `/attendance/${mark.id}`, 200, { note: '  Уточнено  ' }, a);
    assert.equal(edited.note, 'Уточнено');
    await request('PATCH', `/groups/${group.id}/members/${member.id}`, 409, { leftOn: date }, a);
    await request('DELETE', `/lessons/${lesson.id}`, 409, null, p);
  });

  await t.test('batch marking is idempotent and journals hide other students', async () => {
    const a = admin.accessToken;
    const p = teacher.accessToken;
    const s = first.accessToken;
    const path = `/lessons/${lesson.id}/fill`;
    const responses = await Promise.all([request('POST', path, 200, { statusId: status.id }, p),
      request('POST', path, 200, { statusId: status.id }, p)]);
    assert.equal(responses.reduce((sum, { count }) => sum + count, 0), 1);
    const marks = await request('GET', `/attendance?lessonId=${lesson.id}`, 200, null, a);
    assert.equal(marks.length, 2);
    const own = await request('GET', `/attendance?lessonId=${lesson.id}`, 200, null, s);
    assert.deepEqual(own.map(({ id }) => id), [mark.id]);
    const roster = await request('GET', `/groups/${group.id}/members`, 200, null, a);
    const otherMember = roster.find(({ user }) => user.id === second.user.id);
    const removalPath = `/groups/${group.id}/members/${otherMember.id}`;
    await request('DELETE', removalPath, 403, null, p);
    const departure = await request('DELETE', removalPath, 200, null, a);
    assert.equal(departure.deleted, false);
    assert.ok(departure.leftOn.slice(0, 10) > date);
    const history = await request('GET', `/attendance?lessonId=${lesson.id}`, 200, null, second.accessToken);
    assert.equal(history.length, 1);
    const pathToJournal = `/groups/${group.id}/journal?from=${before}&to=${after}`;
    const journal = await request('GET', pathToJournal, 200, null, s);
    assert.deepEqual(journal.members.map(({ user }) => user.id), [first.user.id]);
    assert.deepEqual(journal.marks.map(({ id }) => id), [mark.id]);
    assert.deepEqual(journal.teachers.map(({ id }) => id), [teacher.user.id]);
    assert.deepEqual(journal.lessons.map(({ id }) => id), [lesson.id]);
    const staffJournal = await request('GET', pathToJournal, 200, null, p);
    assert.equal(staffJournal.members.length, 2);
    assert.equal(staffJournal.marks.length, 2);
    await request('GET', `/groups/${other.id}/journal?from=${before}&to=${after}`, 404, null, s);
    await request('GET', `/groups/${group.id}/journal?from=${after}&to=${before}`, 400, null, s);
    await request('GET', `/attendance/${randomUUID()}`, 404, null, a);

    await request('PATCH', `/statuses/${status.id}`, 200, { archived: true }, a);
    await request('POST', path, 409, { statusId: status.id }, p);
    assert.equal((await request('GET', `/attendance/${mark.id}`, 200, null, s)).status.archived, true);
    await request('PATCH', `/attendance/${mark.id}`, 200, { note: null }, p);
    await request('PATCH', `/groups/${group.id}`, 200, { archived: true }, a);
    await request('DELETE', `/attendance/${mark.id}`, 409, null, p);
    await request('PATCH', `/groups/${group.id}`, 200, { archived: false }, a);
    const removed = await request('DELETE', `/attendance/${mark.id}`, 200, null, p);
    assert.equal(removed.deleted, true);
    await request('GET', `/attendance/${mark.id}`, 404, null, p);
    const memberAfter = await request('PATCH', `/groups/${group.id}/members/${member.id}`, 200, { leftOn: date }, a);
    assert.equal(memberAfter.leftOn.slice(0, 10), date);
    const past = await request('GET', pathToJournal, 200, null, s);
    assert.equal(past.lessons.length, 0);
    await request('POST', `/groups/${group.id}/members`, 201, { userId: first.user.id, joinedOn: after }, a);
    await request('PATCH', `/statuses/${status.id}`, 200, { archived: false }, a);
    const futureLesson = await request('POST', `/groups/${group.id}/lessons`, 201,
      { title: 'Будущее занятие', date: after, startTime: '09:00' }, p);
    const futureMark = await request('POST', '/attendance', 201,
      { lessonId: futureLesson.id, studentId: first.user.id, statusId: status.id }, p);
    const beforeEnrollment = await request('GET', pathToJournal, 200, null, s);
    assert.equal(beforeEnrollment.marks.length, 0);
    await request('GET', `/attendance/${futureMark.id}`, 404, null, s);
    const removedLesson = await request('DELETE', `/lessons/${otherLesson.id}`, 200, null, a);
    assert.equal(removedLesson.deleted, true);
  });
});
