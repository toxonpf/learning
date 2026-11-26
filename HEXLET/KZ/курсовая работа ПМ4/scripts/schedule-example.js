import { randomUUID } from 'node:crypto';
import { readFile } from 'node:fs/promises';
import { PrismaClient } from '@prisma/client';
import { getConfig } from '../src/config/env.js';
import { asDate } from '../src/lib/dates.js';
import { hashPassword } from '../src/lib/password.js';
import { writeTransaction } from '../src/lib/transaction.js';
import { asDay, newConfig, validateRange } from '../src/schedule/config.js';
import { generatePlan, publishPlan } from '../src/schedule/service.js';

const { requirements } = JSON.parse(await readFile(new URL('./schedule-example.json', import.meta.url), 'utf8'));
const month = process.argv[2] ?? '2027-01';
if (!/^\d{4}-(0[1-9]|1[0-2])$/.test(month)) throw new Error('Укажите месяц как ГГГГ-ММ');
const startsOn = asDate(month + '-01');
const endsOn = new Date(startsOn);
endsOn.setUTCMonth(endsOn.getUTCMonth() + 1, 0);
validateRange(asDay(startsOn), asDay(endsOn), 31);
const name = `Демо ${month} · данные ноября 2026`;
const { DATABASE_URL } = getConfig();
const db = new PrismaClient({ datasourceUrl: DATABASE_URL });
const unique = (array) => [...new Set(array)];
const entries = (values) => unique(values).map((name) => ({ id: randomUUID(), name }));
const timeSlots = [
  ['08:00', '08:45'], ['08:55', '09:40'], ['09:50', '10:35'], ['10:45', '11:30'],
  ['13:15', '14:00'], ['14:10', '14:55'], ['15:05', '15:50'], ['16:00', '16:45'],
];

async function createExample() {
  const passwordHash = await hashPassword(process.env.DEMO_PASSWORD || randomUUID());
  return writeTransaction(db, async (tx) => {
    const existing = await tx.schedulePlan.findFirst({ where: { name } });
    if (existing) return existing;
    const overlap = await tx.schedulePlan.findFirst({
      where: { publishedStartsOn: { lte: endsOn }, publishedEndsOn: { gte: startsOn } },
      select: { name: true },
    });
    if (overlap) throw new Error(`Этот месяц пересекается с публикацией «${overlap.name}». Укажите свободный месяц.`);

    const config = newConfig();
    config.slots = timeSlots.map(([start, end]) => ({ start, end }));
    config.disciplines = entries(requirements.map(({ subject }) => subject));
    const disciplineId = new Map(config.disciplines.map(({ id, name }) => [name, id]));
    const teachers = new Map();
    for (const [index, [teacher, rows]] of [...Map.groupBy(requirements, ({ teacher }) => teacher)].entries()) {
      const email = `schedule-teacher-${index + 1}@demo.example.test`;
      const user = await tx.user.upsert({
        where: { email }, create: { name: teacher, email, role: 'teacher', passwordHash }, update: {},
      });
      teachers.set(teacher, user.id);
      config.teachers.push({
        userId: user.id, disciplineIds: unique(rows.map(({ subject }) => disciplineId.get(subject))),
        weekdays: config.workingDays, maxDailyMinutes: null, maxWeeklyMinutes: null, groupMode: 'any', groupIds: [],
      });
    }
    const groups = new Map();
    for (const [index, sourceCode] of unique(requirements.map(({ group }) => group)).entries()) {
      const code = `ДЕМО ${sourceCode}`;
      const group = await tx.group.upsert({ where: { code }, create: { code, name: sourceCode }, update: {} });
      groups.set(sourceCode, group.id);
      config.groups.push({ groupId: group.id, studyYear: null, capacity: null, dailyLimit: { unit: 'lessons', value: 4 }, split: null });
      const email = `schedule-student-${index + 1}@demo.example.test`;
      const user = await tx.user.upsert({
        where: { email }, create: { email, name: `Демо-студент ${index + 1}`, passwordHash }, update: {},
      });
      const joinedOn = asDate('2026-09-01');
      await tx.groupMembership.upsert({
        where: { groupId_userId_joinedOn: { groupId: group.id, userId: user.id, joinedOn } },
        create: { groupId: group.id, userId: user.id, joinedOn }, update: {},
      });
    }
    const roomMatrix = requirements.map((row) => ({
      ...row, feature: { id: randomUUID(), name: `Допуск · ${row.group} · ${row.subject}` },
    }));
    config.features = roomMatrix.map(({ feature }) => feature);
    config.rooms = entries(requirements.flatMap(({ rooms }) => rooms)).map((room) => ({
      ...room, capacity: 24, typeId: null, jointGroups: false,
      features: roomMatrix.filter(({ rooms }) => rooms.includes(room.name)).map(({ feature }) => ({ featureId: feature.id, quantity: 1 })),
    }));
    config.requirements = roomMatrix.map(({ group, subject, teacher, feature, meetings }) => ({
      id: randomUUID(), disciplineId: disciplineId.get(subject), groupIds: [groups.get(group)], split: false,
      kind: subject.endsWith('-УП') ? 'Учебная практика' : 'Занятие', periodId: null,
      totalHours: meetings, hoursPerMeeting: 1, durationMinutes: 45, maxPerWeek: null, teacherId: teachers.get(teacher),
      roomTypeId: null, features: [{ featureId: feature.id, quantity: 1 }],
    }));
    return tx.schedulePlan.create({ data: { name, startsOn, endsOn, config } });
  });
}

try {
  const plan = await createExample();
  if (plan.publishedAt) {
    const count = await db.scheduledSession.count({ where: { planId: plan.id } });
    console.log(`«${name}» уже опубликовано. Занятий: ${count}`);
  } else {
    const draft = await generatePlan(db, plan.id, plan.revision);
    if (draft.state !== 'feasible') throw new Error(draft.diagnostics.join('\n'));
    const { count } = await publishPlan(db, plan.id, { revision: plan.revision, draftId: draft.id });
    console.log(`«${name}» сгенерировано и опубликовано. Занятий: ${count}`);
  }
} finally {
  await db.$disconnect();
}
