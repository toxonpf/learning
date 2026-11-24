import { PrismaClient } from '@prisma/client';
import { z } from 'zod';
import { getConfig } from '../src/config/env.js';
import { asDate, DAY, localDay } from '../src/lib/dates.js';
import { hashPassword } from '../src/lib/password.js';
import { email, password, text } from '../src/lib/validation.js';

const config = getConfig();
const db = new PrismaClient({ datasourceUrl: config.DATABASE_URL });
const defaults = [
  { name: 'Присутствовал', code: 'П', color: '#24735a', countsAsPresent: true },
  { name: 'Отсутствовал', code: 'Н', color: '#af4644' },
  { name: 'Опоздал', code: 'О', color: '#936112', countsAsPresent: true },
  { name: 'Уважительная причина', code: 'У', color: '#466492' },
];
const adminConfig = z.object({ ADMIN_EMAIL: email, ADMIN_NAME: text(120), ADMIN_PASSWORD: password });

async function seedAdmin() {
  const result = adminConfig.safeParse(process.env);
  if (!result.success) throw new Error('Заполните ADMIN_EMAIL, ADMIN_NAME и ADMIN_PASSWORD в .env');
  const { ADMIN_EMAIL: email, ADMIN_NAME: name, ADMIN_PASSWORD: password } = result.data;
  const existing = await db.user.findUnique({ where: { email }, select: { id: true, role: true } });
  if (existing?.role === 'admin') return existing;
  if (existing) throw new Error('Почта администратора уже занята другим аккаунтом');
  return db.user.create({ data: { email, name, role: 'admin', passwordHash: await hashPassword(password) } });
}

const demo = [
  {
    code: 'ПО-24/1', name: 'Программное обеспечение',
    students: ['Алина Абдрахманова', 'Даниил Абрамов', 'Аяжан Алтынбек', 'Никита Белов', 'Аружан Даулетова',
      'Тимур Исмагулов', 'Мария Ким', 'Арман Курманов', 'Алихан Нурланов', 'София Орлова', 'Дарья Соколова'],
  },
  {
    code: 'ПО-24/2', name: 'Программное обеспечение',
    students: ['Жасулан Акимов', 'Полина Захарова', 'Ильяс Сагындыков', 'Алексей Тен'],
  },
  {
    code: 'ИС-25/1', name: 'Информационные системы',
    students: ['Диас Акылбеков', 'Екатерина Громова', 'Амина Омарова', 'Руслан Хан'],
  },
];
const subjects = [
  ['Базы данных', 0, '09:00'], ['Веб-разработка', 0, '10:40'], ['Алгоритмы', 1, '09:00'],
  ['Проектирование ПО', 1, '10:40'], ['Базы данных', 2, '09:00'], ['Веб-разработка', 3, '10:40'],
];

async function seedDemo(admin, statuses) {
  const demoPassword = password.safeParse(process.env.DEMO_PASSWORD);
  if (!demoPassword.success) throw new Error('Для примера задайте DEMO_PASSWORD длиной от 10 символов');
  const existingGroup = await db.group.findFirst({ where: { code: { in: demo.map(({ code }) => code) } } });
  if (existingGroup) throw new Error('Группы примера уже существуют. Демоданные добавляются один раз');
  const passwordHash = await hashPassword(demoPassword.data);
  const today = asDate(localDay(config.APP_TIME_ZONE));
  const monday = new Date(today.getTime() - ((today.getUTCDay() + 6) % 7) * DAY);
  const joinedOn = new Date(monday.getTime() - 28 * DAY);

  await db.$transaction(async (tx) => {
    const teacher = await tx.user.create({
      data: { email: 'teacher@demo.example.test', name: 'Ольга Соколова', role: 'teacher', passwordHash },
    });
    for (const [groupIndex, { students, ...data }] of demo.entries()) {
      const group = await tx.group.create({ data });
      await tx.groupMembership.create({ data: { groupId: group.id, userId: teacher.id, joinedOn } });
      const people = await tx.user.createManyAndReturn({
        data: students.map((name, index) => ({
          name, email: `student${groupIndex + 1}-${index + 1}@demo.example.test`, passwordHash,
        })),
      });
      const members = await tx.groupMembership.createManyAndReturn({
        data: people.map(({ id }) => ({ groupId: group.id, userId: id, joinedOn })),
      });
      const lessons = await tx.lesson.createManyAndReturn({
        data: subjects.map(([title, offset, startTime]) => ({
          groupId: group.id, title, date: new Date(monday.getTime() + offset * DAY), startTime,
        })),
      });
      const markedLessons = lessons.filter((lesson) => lesson.date <= today).slice(0, 4);
      await tx.attendance.createMany({
        data: markedLessons.flatMap((lesson, column) => members.flatMap((member, row) => {
          if ((row + column * 3) % 13 === 9) return [];
          const index = (row * 7 + column * 13) % 23;
          const status = statuses[index < 14 ? 0 : index < 18 ? 1 : index < 21 ? 2 : 3];
          return [{
            groupId: group.id, lessonId: lesson.id, membershipId: member.id,
            statusId: status.id, markedById: admin.id,
          }];
        })),
      });
    }
  }, { timeout: 15_000 });
}

try {
  const admin = await seedAdmin();
  const statuses = [];
  for (const data of defaults) {
    statuses.push(await db.attendanceStatus.upsert({ where: { code: data.code }, create: data, update: {} }));
  }
  if (process.argv.includes('--demo')) await seedDemo(admin, statuses);
  console.log('Начальное заполнение завершено');
} catch (error) {
  console.error(error.code ? `Ошибка начального заполнения: ${error.code}` : error.message);
  process.exitCode = 1;
} finally {
  await db.$disconnect();
}
