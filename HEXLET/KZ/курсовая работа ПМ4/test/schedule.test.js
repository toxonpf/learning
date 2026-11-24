import assert from 'node:assert/strict';
import { randomBytes, randomUUID } from 'node:crypto';
import { once } from 'node:events';
import test from 'node:test';
import jwt from 'jsonwebtoken';
import { PrismaClient } from '@prisma/client';
import { createApp } from '../src/app.js';
import { asDate } from '../src/lib/dates.js';
import { newConfig } from '../src/schedule/config.js';
import { solveSchedule, splitRoster } from '../src/schedule/solver.js';

const start = '2031-01-06';
const end = '2031-01-12';
const feature = randomUUID();
const roomType = randomUUID();
const subject = randomUUID();

function sample(groups, teachers) {
  const config = newConfig();
  config.workingDays = [1, 2, 3];
  config.slots = [{ start: '08:30', end: '10:00' }, { start: '10:15', end: '11:45' }];
  config.disciplines = [{ id: subject, name: 'Программирование' }];
  config.features = [{ id: feature, name: 'Компьютер' }];
  config.roomTypes = [{ id: roomType, name: 'Лаборатория', features: [] }];
  config.rooms = [{ id: randomUUID(), name: 'Лаборатория 210', capacity: 22, typeId: roomType,
    jointGroups: false, features: [{ featureId: feature, quantity: 22 }] }];
  config.groups = groups.map(({ id }) => ({ groupId: id, studyYear: 2, capacity: 25,
    dailyLimit: { unit: 'lessons', value: 2 }, split: null }));
  config.teachers = teachers.map(({ id }) => ({ userId: id, disciplineIds: [subject], weekdays: [1, 2, 3],
    maxDailyMinutes: 180, maxWeeklyMinutes: 360, groupMode: 'any', groupIds: [] }));
  config.requirements = groups.map(({ id }) => ({ id: randomUUID(), disciplineId: subject, kind: 'Практика',
    groupIds: [id], split: false, periodId: null, totalHours: 2, hoursPerMeeting: 2, durationMinutes: null,
    maxPerWeek: null, teacherId: null, roomTypeId: roomType, features: [{ featureId: feature, quantity: 1 }] }));
  return config;
}

function member(id, groupId, leftOn = null) {
  return { groupId, user: { id, name: 'Студент' }, joinedOn: start, leftOn };
}

test('subgroup allocation is reproducible, balanced and conserves the roster', () => {
  const people = Array.from({ length: 7 }, (_, index) => ({ id: String(index), lastName: `Имя ${index % 2}` }));
  const policy = { count: 3, order: 'random', seed: 'fixed', method: 'balanced' };
  const a = splitRoster(people, policy).map((part) => [...part]);
  const b = splitRoster([...people].reverse(), policy).map((part) => [...part]);
  assert.deepEqual(a, b);
  assert.deepEqual(a.map((part) => part.length), [3, 2, 2]);
  const percentage = splitRoster(people, { ...policy, method: 'percent', percentages: [50, 30, 20] });
  assert.deepEqual(percentage.map((part) => part.size), [4, 2, 1]);
  assert.equal(new Set(percentage.flatMap((part) => [...part])).size, people.length);
});

test('generation checks actual roster, resource availability and shared students', () => {
  const groups = [{ id: randomUUID(), code: 'А' }, { id: randomUUID(), code: 'Б' }];
  const teachers = [{ id: randomUUID(), name: 'Анна' }, { id: randomUUID(), name: 'Борис' }];
  const shared = randomUUID();
  const config = sample(groups, teachers);
  config.rooms.push({ ...config.rooms[0], id: randomUUID(), name: 'Лаборатория 211' });
  config.teachers[0].groupMode = 'only';
  config.teachers[0].groupIds = [groups[0].id];
  config.requirements[0].teacherId = teachers[0].id;
  config.requirements[1].teacherId = teachers[1].id;
  config.exceptions = [{
    id: randomUUID(), name: 'Выходной', scope: 'school', resourceId: null,
    from: start, to: start, start: null, end: null,
  }];
  const input = { startsOn: start, endsOn: '2031-01-07', config, source: {
    groups, teachers, memberships: [
      member(shared, groups[0].id), member(shared, groups[1].id),
      member(randomUUID(), groups[0].id, '2031-01-07'),
    ],
  } };
  const result = solveSchedule(input);
  assert.equal(result.state, 'feasible');
  assert.equal(result.meetings, 2);
  assert.equal(result.events[0].date, '2031-01-07');
  assert.equal(result.events[1].date, '2031-01-07');
  assert.ok(result.events[0].endMinute <= result.events[1].startMinute);
  assert.deepEqual(result.events.map(({ studentIds }) => studentIds), [[shared], [shared]]);

  config.requirements[0].features[0].quantity = 99;
  const blocked = solveSchedule(input);
  assert.equal(blocked.state, 'infeasible');
  assert.match(blocked.diagnostics[0], /оснащения/);
});

test('separate subgroups can run in parallel, with separate teachers and rooms', () => {
  const groups = [{ id: randomUUID(), code: 'А' }];
  const teachers = [{ id: randomUUID(), name: 'Анна' }, { id: randomUUID(), name: 'Борис' }];
  const config = sample(groups, teachers);
  config.groups[0].split = { count: 2, order: 'id', method: 'balanced', percentages: [], seed: 'fixed' };
  config.requirements[0].split = true;
  config.rooms.push({ ...config.rooms[0], id: randomUUID(), name: 'Лаборатория 211' });
  config.slots = config.slots.slice(0, 1);
  const input = { startsOn: start, endsOn: start, config, source: {
    groups, teachers, memberships: Array.from({ length: 4 }, () => member(randomUUID(), groups[0].id)),
  } };
  const result = solveSchedule(input);
  assert.equal(result.state, 'feasible');
  assert.equal(result.events[0].startMinute, result.events[1].startMinute);
  assert.notEqual(result.events[0].teacherId, result.events[1].teacherId);
  assert.notEqual(result.events[0].room, result.events[1].room);
  assert.equal(new Set(result.events.flatMap(({ studentIds }) => studentIds)).size, 4);
  config.requirements[0].teacherId = teachers[0].id;
  assert.equal(solveSchedule(input).state, 'infeasible');
});

const url = process.env.TEST_DATABASE_URL;
test('REST publishing makes the authoritative schedule visible only to its audience', {
  skip: url ? false : 'Set TEST_DATABASE_URL to a migrated test database',
  timeout: 35_000,
}, async (t) => {
  assert.match(new URL(url).pathname, /_test$/);
  const db = new PrismaClient({ datasourceUrl: url });
  const secret = randomBytes(32).toString('hex');
  const tag = randomUUID().slice(0, 8);
  const plans = [];
  const groupIds = [];
  const userIds = [];
  const app = createApp({ db, config: { APP_TIME_ZONE: 'Asia/Almaty', JWT_SECRET: secret } });
  const server = app.listen(0, '127.0.0.1');
  t.after(async () => {
    await new Promise((resolve) => server.close(resolve));
    await db.schedulePlan.deleteMany({ where: { id: { in: plans } } });
    await db.groupMembership.deleteMany({ where: { groupId: { in: groupIds } } });
    await db.group.deleteMany({ where: { id: { in: groupIds } } });
    await db.user.deleteMany({ where: { id: { in: userIds } } });
    await db.$disconnect();
  });
  await once(server, 'listening');
  const origin = `http://127.0.0.1:${server.address().port}/api/schedule`;
  async function account(label, role) {
    const user = await db.user.create({ data: {
      email: `${label}-${tag}@planner.example.test`, name: label, role, passwordHash: 'access tested using issued test tokens',
    } });
    userIds.push(user.id);
    const token = jwt.sign({}, secret, {
      algorithm: 'HS256', subject: user.id, issuer: 'attendance-journal', audience: 'attendance-api', expiresIn: '5m',
    });
    return { ...user, token };
  }
  async function request(path, expected, user, method = 'GET', data) {
    const response = await fetch(origin + path, {
      method, headers: { ...(user && { Authorization: `Bearer ${user.token}` }), ...(data && { 'Content-Type': 'application/json' }) },
      ...(data && { body: JSON.stringify(data) }),
    });
    const result = await response.json();
    assert.equal(response.status, expected, JSON.stringify(result));
    return result.data;
  }

  const [admin, teacher, student, unrelated] = await Promise.all([
    account('admin', 'admin'), account('teacher', 'teacher'), account('student', 'user'), account('another', 'user'),
  ]);
  const group = await db.group.create({ data: { code: `ПЛАН-${tag}`, name: 'Группа планировщика' } });
  groupIds.push(group.id);
  await db.groupMembership.create({ data: { groupId: group.id, userId: student.id, joinedOn: asDate(start) } });
  const window = `?from=${start}&to=${end}`;
  const config = sample([group], [teacher]);
  await request(window, 401);
  await request('/planner', 403, teacher);
  await request('/people', 403, student);

  const form = { name: 'Проверка расписания', startsOn: start, endsOn: end };
  const created = await request('/plans', 201, admin, 'POST', form);
  plans.push(created.id);
  const path = `/plans/${created.id}`;
  const saved = await request(path, 200, admin, 'PUT', { ...form, revision: created.revision, config });
  assert.equal(saved.revision, created.revision + 1);
  await request(path, 409, admin, 'PUT', { ...form, revision: created.revision, config });
  let draft = await request(path + '/generate', 200, admin, 'POST', { revision: saved.revision });
  assert.equal(draft.state, 'feasible');
  assert.equal((await request(window, 200, student)).length, 0);
  await request(`/people/${student.id}`, 200, admin, 'PATCH', { firstName: 'Анна', lastName: 'Власова', patronymic: null });
  await request(path + '/publish', 409, admin, 'POST', { revision: saved.revision, draftId: draft.id });
  draft = await request(path + '/generate', 200, admin, 'POST', { revision: saved.revision });
  const publication = await request(path + '/publish', 200, admin, 'POST', { revision: saved.revision, draftId: draft.id });
  assert.equal(publication.count, 1);
  const first = await request(window, 200, student);
  assert.equal(first.length, 1);
  assert.equal(first[0].teacherId, teacher.id);
  assert.equal(first[0].room, config.rooms[0].name);
  assert.equal('studentIds' in first[0], false);
  assert.deepEqual(await request(window, 200, teacher), first);
  assert.deepEqual(await request(window, 200, unrelated), []);
  await request(path + '/publish', 200, admin, 'POST', { revision: saved.revision, draftId: draft.id });
  assert.deepEqual(await request(window, 200, student), first);
  await db.groupMembership.updateMany({
    where: { groupId: group.id, userId: student.id },
    data: { joinedOn: asDate('2031-01-05'), leftOn: asDate(first[0].date) },
  });
  assert.deepEqual(await request(window, 200, student), []);
  assert.deepEqual(await request(window, 200, teacher), first);
  await request(path + '/unpublish', 200, admin, 'POST', { revision: saved.revision });
  assert.deepEqual(await request(window, 200, student), []);
});
