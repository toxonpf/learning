import { Prisma } from '@prisma/client';
import { createHash, randomUUID } from 'node:crypto';
import { Worker } from 'node:worker_threads';
import { HttpError } from '../lib/http.js';
import { asDate, DAY } from '../lib/dates.js';
import { writeTransaction } from '../lib/transaction.js';
import { asDay, newConfig, validateConfig, validateRange } from './config.js';

const activeJobs = new Set();
const summary = {
  id: true, name: true, startsOn: true, endsOn: true, revision: true, publishedRevision: true,
  publishedStartsOn: true, publishedEndsOn: true, publishedAt: true,
};
const personSelect = {
  id: true, name: true, firstName: true, lastName: true, patronymic: true, role: true,
};
const groupSelect = { id: true, name: true, code: true };
const eventFields = {
  id: true, date: true, startMinute: true, endMinute: true, subject: true,
  kind: true, audience: true, teacherName: true, room: true, teacherId: true, groupIds: true,
};

function localDates(plan) {
  return { ...plan, startsOn: asDay(plan.startsOn), endsOn: asDay(plan.endsOn) };
}

async function getPlan(db, id) {
  const plan = await db.schedulePlan.findUnique({ where: { id } });
  if (!plan) throw new HttpError(404, 'Учебный период не найден');
  return plan;
}

function expectRevision(plan, revision) {
  if (plan.revision !== revision) throw new HttpError(409, 'Параметры изменились. Обновите период и повторите');
}

async function catalog(db) {
  const [groups, teachers] = await Promise.all([
    db.group.findMany({ where: { archived: false }, select: groupSelect, orderBy: { code: 'asc' } }),
    db.user.findMany({ where: { role: 'teacher' }, select: personSelect, orderBy: [{ name: 'asc' }, { id: 'asc' }] }),
  ]);
  return { groups, teachers };
}

export async function getPlanner(db, id) {
  const [plans, options] = await Promise.all([
    db.schedulePlan.findMany({ select: summary, orderBy: [{ startsOn: 'desc' }, { updatedAt: 'desc' }] }),
    catalog(db),
  ]);
  const chosen = id ?? plans[0]?.id;
  const plan = chosen ? await getPlan(db, chosen) : null;
  return { ...options, plans: plans.map(localDates), plan: plan && localDates(plan) };
}

export async function listPeople(db, { query, groupId }) {
  return db.user.findMany({
    where: {
      role: { in: ['teacher', 'user'] },
      ...(groupId && { memberships: { some: { groupId } } }),
      ...(query && { OR: ['name', 'firstName', 'lastName', 'patronymic', 'email'].map(
        (field) => ({ [field]: { contains: query, mode: 'insensitive' } }),
      ) }),
    },
    select: { ...personSelect, email: true },
    orderBy: [{ name: 'asc' }, { id: 'asc' }],
    take: 40,
  });
}

export function updateProfile(db, id, data) {
  return db.user.update({
    where: { id, role: { in: ['teacher', 'user'] } }, data, select: personSelect,
  });
}

export async function createPlan(db, { name, startsOn, endsOn }) {
  validateRange(startsOn, endsOn);
  const plan = await db.schedulePlan.create({
    data: { name, startsOn: asDate(startsOn), endsOn: asDate(endsOn), config: newConfig() },
  });
  return localDates(plan);
}

export async function savePlan(db, id, body) {
  const { name, startsOn, endsOn, config, revision } = body;
  const plan = await getPlan(db, id);
  expectRevision(plan, revision);
  validateConfig(body, await catalog(db));
  const settings = { name, startsOn: asDate(startsOn), endsOn: asDate(endsOn), config };
  const { count } = await db.schedulePlan.updateMany({
    where: { id, revision },
    data: { ...settings, revision: { increment: 1 }, draft: Prisma.DbNull },
  });
  if (!count) throw new HttpError(409, 'Параметры изменились. Обновите период и повторите');
  return localDates(await getPlan(db, id));
}

async function snapshot(db, plan) {
  const input = localDates(plan);
  const options = await catalog(db);
  validateConfig(input, options);
  const groupIds = new Set(plan.config.groups.map(({ groupId }) => groupId));
  const teacherIds = new Set(plan.config.teachers.map(({ userId }) => userId));
  const rows = await db.groupMembership.findMany({
    where: {
      groupId: { in: [...groupIds] },
      joinedOn: { lte: plan.endsOn },
      OR: [{ leftOn: null }, { leftOn: { gt: plan.startsOn } }],
      user: { role: 'user' },
    },
    select: { groupId: true, joinedOn: true, leftOn: true, user: { select: personSelect } },
    orderBy: { id: 'asc' },
  });
  const source = {
    groups: options.groups.filter(({ id }) => groupIds.has(id)),
    teachers: options.teachers.filter(({ id }) => teacherIds.has(id)),
    memberships: rows.map((row) => ({
      ...row, joinedOn: asDay(row.joinedOn), leftOn: row.leftOn && asDay(row.leftOn),
    })),
  };
  const sourceKey = createHash('sha256').update(JSON.stringify(source)).digest('hex');
  return { startsOn: input.startsOn, endsOn: input.endsOn, config: input.config, source, sourceKey };
}

function solve(input) {
  return new Promise((resolve, reject) => {
    const worker = new Worker(new URL('./worker.js', import.meta.url), { workerData: input });
    const timeout = setTimeout(() => {
      resolve({ state: 'limit', meetings: 0, events: [], diagnostics: ['Генерация достигла лимита времени. Сузьте учебный период.'] });
      void worker.terminate();
    }, 8000);
    worker.once('message', (result) => {
      clearTimeout(timeout);
      resolve(result);
    });
    worker.once('error', (error) => {
      clearTimeout(timeout);
      reject(error);
    });
    worker.once('exit', (code) => {
      clearTimeout(timeout);
      reject(new Error(`Генератор завершился без ответа (${code})`));
    });
  });
}

export async function generatePlan(db, id, revision) {
  if (activeJobs.has(id) || activeJobs.size >= 2) throw new HttpError(409, 'Уже выполняется генерация. Повторите позже');
  activeJobs.add(id);
  try {
    const plan = await getPlan(db, id);
    expectRevision(plan, revision);
    const input = await snapshot(db, plan);
    const draft = { ...(await solve(input)), id: randomUUID(), revision, sourceKey: input.sourceKey };
    const { count } = await db.schedulePlan.updateMany({ where: { id, revision }, data: { draft } });
    if (!count) throw new HttpError(409, 'Во время генерации параметры изменились. Запустите её снова');
    return draft;
  } finally {
    activeJobs.delete(id);
  }
}

export function publishPlan(db, id, { revision, draftId }) {
  return writeTransaction(db, async (tx) => {
    const plan = await getPlan(tx, id);
    expectRevision(plan, revision);
    const { draft } = plan;
    if (draft?.id !== draftId || draft.revision !== revision || draft.state !== 'feasible') {
      throw new HttpError(409, 'Сначала сгенерируйте допустимый черновик');
    }
    if (plan.publishedDraftId === draftId) return { count: draft.events.length };
    const overlap = await tx.schedulePlan.findFirst({
      where: { id: { not: id }, publishedStartsOn: { lte: plan.endsOn }, publishedEndsOn: { gte: plan.startsOn } },
      select: { name: true },
    });
    if (overlap) throw new HttpError(409, `Период пересекается с опубликованным расписанием «${overlap.name}»`);
    const result = await snapshot(tx, plan);
    if (result.sourceKey !== draft.sourceKey) throw new HttpError(409, 'Состав групп или преподавателей изменился. Сгенерируйте расписание заново');
    await tx.scheduledSession.deleteMany({ where: { planId: id } });
    const { count } = await tx.scheduledSession.createMany({
      data: draft.events.map((event) => ({ ...event, planId: id, date: asDate(event.date) })),
    });
    await tx.schedulePlan.update({
      where: { id }, data: {
        publishedAt: new Date(), publishedRevision: revision, publishedDraftId: draftId,
        publishedStartsOn: plan.startsOn, publishedEndsOn: plan.endsOn,
      },
    });
    return { count };
  });
}

export function unpublishPlan(db, id, revision) {
  return writeTransaction(db, async (tx) => {
    expectRevision(await getPlan(tx, id), revision);
    const { count } = await tx.scheduledSession.deleteMany({ where: { planId: id } });
    await tx.schedulePlan.update({
      where: { id }, data: {
        publishedAt: null, publishedRevision: null, publishedDraftId: null, publishedStartsOn: null, publishedEndsOn: null,
      },
    });
    return { count };
  });
}

export async function getSchedule(db, user, { from, to }) {
  validateRange(from, to, 31);
  const audience = user.role === 'user' ? { studentIds: { has: user.id } } :
    user.role === 'teacher' ? { teacherId: user.id } : {};
  const events = await db.scheduledSession.findMany({
    where: { date: { gte: asDate(from), lte: asDate(to) }, ...audience },
    select: eventFields,
    orderBy: [{ date: 'asc' }, { startMinute: 'asc' }, { audience: 'asc' }, { id: 'asc' }],
  });
  return events.map((event) => ({ ...event, date: asDay(event.date) }));
}
