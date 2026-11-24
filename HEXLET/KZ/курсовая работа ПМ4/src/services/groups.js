import { activeOn, asDate, DAY, overlaps } from '../lib/dates.js';
import { HttpError } from '../lib/http.js';
import { writeTransaction } from '../lib/transaction.js';
import { publicUser } from './auth.js';

const person = { id: true, name: true, role: true };
const membersWithUser = { user: { select: publicUser } };
const groupOrder = [{ archived: 'asc' }, { code: 'asc' }];

function groupVisibility(user, today) {
  if (user.role === 'admin') return {};
  const period = user.role === 'teacher' ? activeOn(today) : { joinedOn: { lte: today } };
  return { memberships: { some: { userId: user.id, ...period } } };
}

export async function requireGroup(db, id, user, today, { writable = false } = {}) {
  const group = await db.group.findUnique({ where: { id, ...groupVisibility(user, today) } });
  if (!group) throw new HttpError(404, 'Группа не найдена');
  if (writable && group.archived) throw new HttpError(409, 'Группа находится в архиве');
  return group;
}

export function listGroups(db, user, today) {
  return db.group.findMany({ where: groupVisibility(user, today), orderBy: groupOrder });
}

export const createGroup = (db, data) => db.group.create({ data });
export const updateGroup = (db, id, data) => db.group.update({ where: { id }, data });

export async function listUsers(db, { q, role }) {
  return db.user.findMany({
    where: {
      role: role ?? { in: ['teacher', 'user'] },
      OR: [
        { name: { contains: q, mode: 'insensitive' } },
        { email: { contains: q, mode: 'insensitive' } },
      ],
    },
    select: publicUser,
    orderBy: [{ name: 'asc' }, { id: 'asc' }],
    take: 30,
  });
}

export function updateUserRole(db, id, role) {
  return writeTransaction(db, async (tx) => {
    const account = await tx.user.findUnique({ where: { id }, select: publicUser });
    if (!account) throw new HttpError(404, 'Пользователь не найден');
    if (account.role === 'admin') throw new HttpError(403, 'Роль администратора защищена');
    if (account.role === role) return account;
    const membership = await tx.groupMembership.findFirst({ where: { userId: id }, select: { id: true } });
    if (membership) throw new HttpError(409, 'У аккаунта уже есть история участия в группе');
    return tx.user.update({ where: { id }, data: { role }, select: publicUser });
  });
}

export async function listMembers(db, groupId, user, today) {
  await requireGroup(db, groupId, user, today);
  return db.groupMembership.findMany({
    where: { groupId },
    include: membersWithUser,
    orderBy: [{ user: { name: 'asc' } }, { joinedOn: 'desc' }],
  });
}

async function checkOverlap(tx, { groupId, userId, joinedOn, leftOn, id }) {
  const existing = await tx.groupMembership.findFirst({
    where: {
      groupId,
      userId,
      ...(id && { id: { not: id } }),
      ...overlaps(joinedOn, leftOn),
    },
    select: { id: true },
  });
  if (existing) throw new HttpError(409, 'Периоды участия в группе пересекаются');
}

export function addMember(db, groupId, user, today, body) {
  return writeTransaction(db, async (tx) => {
    await requireGroup(tx, groupId, user, today, { writable: true });
    const account = await tx.user.findUnique({ where: { id: body.userId }, select: publicUser });
    if (!account || account.role === 'admin') {
      throw new HttpError(404, 'Укажите аккаунт студента или преподавателя');
    }
    const joinedOn = asDate(body.joinedOn);
    const leftOn = body.leftOn ? asDate(body.leftOn) : null;
    if (leftOn && leftOn <= joinedOn) throw new HttpError(400, 'Дата выхода должна быть позже даты вступления');
    const data = { groupId, userId: account.id, joinedOn, leftOn };
    await checkOverlap(tx, data);
    return tx.groupMembership.create({ data, include: membersWithUser });
  });
}

export function updateMember(db, groupId, id, user, today, { leftOn }) {
  return writeTransaction(db, async (tx) => {
    await requireGroup(tx, groupId, user, today);
    const member = await tx.groupMembership.findUnique({ where: { id, groupId } });
    if (!member) throw new HttpError(404, 'Участник группы не найден');
    const end = leftOn ? asDate(leftOn) : null;
    if (end && end <= member.joinedOn) {
      throw new HttpError(400, 'Дата выхода должна быть позже даты вступления');
    }
    if (end) {
      const mark = await tx.attendance.findFirst({
        where: { membershipId: id, lesson: { date: { gte: end } } },
        select: { id: true },
      });
      if (mark) throw new HttpError(409, 'На дату выхода или позднее уже есть отметки');
    }
    await checkOverlap(tx, { ...member, leftOn: end });
    return tx.groupMembership.update({ where: { id }, data: { leftOn: end }, include: membersWithUser });
  });
}

export function removeMember(db, groupId, id, user, today) {
  return writeTransaction(db, async (tx) => {
    await requireGroup(tx, groupId, user, today);
    const member = await tx.groupMembership.findUnique({ where: { id, groupId } });
    if (!member) throw new HttpError(404, 'Участник группы не найден');
    const latest = await tx.attendance.findFirst({
      where: { membershipId: id },
      orderBy: { lesson: { date: 'desc' } },
      select: { lesson: { select: { date: true } } },
    });
    if (!latest && member.joinedOn >= today) {
      await tx.groupMembership.delete({ where: { id } });
      return { deleted: true, leftOn: null };
    }
    const firstDayOutside = latest ? new Date(Math.max(+today, +latest.lesson.date + DAY)) : today;
    const leftOn = member.leftOn && member.leftOn <= firstDayOutside ? member.leftOn : firstDayOutside;
    if (+leftOn !== +member.leftOn) {
      await tx.groupMembership.update({ where: { id }, data: { leftOn } });
    }
    return { deleted: false, leftOn };
  });
}

function attends(member, lesson) {
  return member.joinedOn <= lesson.date && (!member.leftOn || member.leftOn > lesson.date);
}

export async function getJournal(db, groupId, user, today, from, to) {
  return db.$transaction(
    (tx) => readJournal(tx, groupId, user, today, from, to),
    { isolationLevel: 'RepeatableRead' },
  );
}

async function readJournal(db, groupId, user, today, from, to) {
  const group = await requireGroup(db, groupId, user, today);
  const student = user.role === 'user';
  const endsAt = new Date(to.getTime() + DAY);
  const [members, lessons, statuses, teachers] = await Promise.all([
    db.groupMembership.findMany({
      where: {
        groupId,
        user: { role: 'user' },
        ...(student && { userId: user.id }),
        ...overlaps(from, endsAt),
        ...(student && { joinedOn: { lte: today, lt: endsAt } }),
      },
      select: { id: true, joinedOn: true, leftOn: true, user: { select: person } },
      orderBy: [{ user: { name: 'asc' } }, { joinedOn: 'asc' }],
    }),
    db.lesson.findMany({
      where: { groupId, date: { gte: from, lte: to } },
      orderBy: [{ date: 'asc' }, { startTime: 'asc' }],
    }),
    db.attendanceStatus.findMany({ orderBy: [{ archived: 'asc' }, { name: 'asc' }] }),
    db.user.findMany({
      where: { role: 'teacher', memberships: { some: { groupId, ...activeOn(today) } } },
      select: person,
      orderBy: { name: 'asc' },
    }),
  ]);
  const visibleLessons = student ? lessons.filter((lesson) => members.some((member) => attends(member, lesson))) : lessons;
  const marks = await db.attendance.findMany({
    where: {
      groupId,
      lessonId: { in: visibleLessons.map(({ id }) => id) },
      ...(student && { membership: { userId: user.id, joinedOn: { lte: today } } }),
    },
    select: { id: true, lessonId: true, membershipId: true, statusId: true, note: true },
  });
  return { group, members, lessons: visibleLessons, statuses, marks, teachers };
}
