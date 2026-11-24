import 'dotenv/config';
import assert from 'node:assert/strict';
import { randomBytes } from 'node:crypto';
import { localDay } from '../src/lib/dates.js';

const origin = `http://127.0.0.1:${process.env.PORT || 3000}/api`;
const suffix = randomBytes(3).toString('hex').slice(0, 5);
const adminPassword = process.env.ADMIN_PASSWORD;
const demoPassword = process.env.DEMO_PASSWORD;

async function request(method, path, expected, { token, body, label } = {}) {
  const response = await fetch(origin + path, {
    method,
    headers: {
      ...(token && { Authorization: `Bearer ${token}` }),
      ...(body && { 'Content-Type': 'application/json' }),
    },
    ...(body && { body: JSON.stringify(body) }),
  });
  const result = await response.json();
  assert.equal(response.status, expected, `${method} ${path}: ${result.error?.message ?? 'неожиданный статус'}`);
  if (label) console.log(`${method} ${path} → ${response.status}  ${label}`);
  return result.data;
}

function login(email, password, label) {
  return request('POST', '/auth/login', 200, { body: { email, password }, label });
}

function openTime(lessons) {
  const occupied = new Set(lessons.map(({ startTime }) => startTime));
  for (let minute = 17 * 60; minute < 24 * 60; minute += 1) {
    const time = [Math.floor(minute / 60), minute % 60].map((value) => String(value).padStart(2, '0')).join(':');
    if (!occupied.has(time)) return time;
  }
  throw new Error('На сегодня не осталось демонстрационных слотов после 17:00');
}

async function demonstrate() {
  assert.ok(process.env.ADMIN_EMAIL && adminPassword && demoPassword,
    'Заполните ADMIN_EMAIL, ADMIN_PASSWORD и DEMO_PASSWORD в .env и загрузите демонстрационные данные');
  await request('GET', '/groups', 401, { label: 'Гость без JWT' });
  const admin = await login(process.env.ADMIN_EMAIL, adminPassword, 'Вход администратора');
  const student = await login('student1-1@demo.example.test', demoPassword, 'Вход студента');
  const teacher = await login('teacher@demo.example.test', demoPassword, 'Вход преподавателя');
  assert.equal(admin.user.role, 'admin');
  assert.equal(student.user.role, 'user');
  assert.equal(teacher.user.role, 'teacher');
  const { accessToken: teacherToken } = teacher;
  const groups = await request('GET', '/groups', 200, { token: teacherToken });
  const group = groups.find(({ code, archived }) => code === 'ПО-24/1' && !archived);
  assert.ok(group, 'Откройте действующую демонстрационную группу ПО-24/1');
  const { timeZone } = await request('GET', '/auth/me', 200, { token: teacherToken });
  const date = localDay(timeZone);
  const journal = await request('GET', `/groups/${group.id}/journal?${new URLSearchParams({ from: date, to: date })}`,
    200, { token: teacherToken });
  assert.ok(journal.members.some(({ user }) => user.id === student.user.id), 'Демонстрационный студент должен входить в группу');

  const registered = await request('POST', '/auth/register', 201, {
    body: { name: 'Демонстрация регистрации', email: `registration-${suffix}@demo.example.test`, password: demoPassword },
    label: 'Публичная регистрация',
  });
  assert.equal(registered.user.role, 'user');

  const body = { name: `Практика ${suffix}`, code: `Д${suffix}`, color: '#24735a', countsAsPresent: true };
  await request('POST', '/statuses', 403, { token: student.accessToken, body, label: 'Студент пытается настроить справочник' });
  const status = await request('POST', '/statuses', 201,
    { token: admin.accessToken, body, label: 'Администратор создаёт новый статус' });
  let lesson;
  let created;
  try {
    lesson = await request('POST', `/groups/${group.id}/lessons`, 201, {
      token: teacherToken,
      body: { title: 'Демонстрация защиты', date, startTime: openTime(journal.lessons) },
      label: 'Занятие преподавателя',
    });
    created = await request('POST', '/attendance', 201, {
      token: teacherToken,
      body: { lessonId: lesson.id, studentId: student.user.id, statusId: status.id, note: 'Демонстрационная отметка' },
      label: 'Создание отметки',
    });
    const path = `/attendance/${created.id}`;
    const list = await request('GET', `/attendance?lessonId=${lesson.id}`, 200, {
      token: teacherToken, label: 'Список отметок занятия',
    });
    assert.equal(list.length, 1);
    const saved = await request('GET', path, 200, { token: student.accessToken, label: 'Студент читает свою отметку' });
    console.log(JSON.stringify({
      lesson: saved.lesson.title,
      student: saved.membership.user.name,
      status: saved.status.name,
      markedBy: saved.markedBy.name,
    }, null, 2));
    await request('PATCH', path, 200,
      { token: teacherToken, body: { note: 'Примечание уточнено' }, label: 'Изменение примечания' });
    await request('DELETE', path, 200, { token: teacherToken, label: 'Удаление отметки' });
    created = null;
    await request('GET', path, 404, { token: teacherToken, label: 'Отметка удалена' });
  } finally {
    if (created) await request('DELETE', `/attendance/${created.id}`, 200, { token: teacherToken });
    if (lesson) await request('DELETE', `/lessons/${lesson.id}`, 200, { token: teacherToken });
    await request('PATCH', `/statuses/${status.id}`, 200,
      { token: admin.accessToken, body: { archived: true } });
  }
}

try {
  await demonstrate();
} catch (error) {
  console.error(error.message);
  process.exitCode = 1;
}
