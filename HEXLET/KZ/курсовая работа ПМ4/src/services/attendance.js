import { activeOn } from '../lib/dates.js';
import { HttpError } from '../lib/http.js';
import { writeTransaction } from '../lib/transaction.js';
import { requireLesson } from './lessons.js';

const related = {
  lesson: { select: { id: true, title: true, date: true, startTime: true } },
  membership: { select: { user: { select: { id: true, name: true } } } },
  status: true,
  markedBy: { select: { id: true, name: true } },
};
const writable = { writable: true };

function scope(user, today) {
  return user.role === 'user' ? { membership: { userId: user.id, joinedOn: { lte: today } } } : {};
}

async function requireMark(db, id, user, today, options) {
  const mark = await db.attendance.findUnique({ where: { id, ...scope(user, today) }, include: related });
  if (!mark) throw new HttpError(404, 'Отметка не найдена');
  await requireLesson(db, mark.lessonId, user, today, options);
  return mark;
}

export const getMark = (db, id, user, today) => requireMark(db, id, user, today);

export async function listMarks(db, lessonId, user, today) {
  await requireLesson(db, lessonId, user, today);
  return db.attendance.findMany({
    where: { lessonId, ...scope(user, today) },
    include: related,
    orderBy: [{ membership: { user: { name: 'asc' } } }, { id: 'asc' }],
  });
}

async function requireStatus(db, id) {
  const status = await db.attendanceStatus.findUnique({ where: { id } });
  if (!status) throw new HttpError(404, 'Статус не найден');
  if (status.archived) throw new HttpError(409, 'Статус находится в архиве');
}

async function resolveMember(db, lesson, userId) {
  if (lesson.scheduleTeacherId && !lesson.scheduledStudentIds.includes(userId)) {
    throw new HttpError(409, 'Студент не назначен на это занятие');
  }
  const member = await db.groupMembership.findFirst({
    where: { groupId: lesson.groupId, userId, user: { role: 'user', deletedAt: null }, ...activeOn(lesson.date) },
    select: { id: true },
  });
  if (!member) throw new HttpError(409, 'Студент не состоит в группе на дату занятия');
  return member;
}

function markData(lesson, member, user, statusId, note) {
  return {
    groupId: lesson.groupId,
    lessonId: lesson.id,
    membershipId: member.id,
    markedById: user.id,
    statusId,
    note,
  };
}

export function createMark(db, user, today, { lessonId, studentId, statusId, note }) {
  return writeTransaction(db, async (tx) => {
    const lesson = await requireLesson(tx, lessonId, user, today, writable);
    const member = await resolveMember(tx, lesson, studentId);
    await requireStatus(tx, statusId);
    return tx.attendance.create({ data: markData(lesson, member, user, statusId, note), include: related });
  });
}

export function updateMark(db, id, user, today, body) {
  return writeTransaction(db, async (tx) => {
    const mark = await requireMark(tx, id, user, today, writable);
    if (body.statusId && body.statusId !== mark.statusId) await requireStatus(tx, body.statusId);
    return tx.attendance.update({ where: { id }, data: { ...body, markedById: user.id }, include: related });
  });
}

export function deleteMark(db, id, user, today) {
  return writeTransaction(db, async (tx) => {
    await requireMark(tx, id, user, today, writable);
    await tx.attendance.delete({ where: { id } });
    return { id, deleted: true };
  });
}

export function fillUnmarked(db, lessonId, user, today, statusId) {
  return writeTransaction(db, async (tx) => {
    const lesson = await requireLesson(tx, lessonId, user, today, writable);
    await requireStatus(tx, statusId);
    const members = await tx.groupMembership.findMany({
      where: { groupId: lesson.groupId, user: { role: 'user', deletedAt: null }, ...activeOn(lesson.date),
        ...(lesson.scheduleTeacherId && { userId: { in: lesson.scheduledStudentIds } }),
      },
      select: { id: true },
    });
    const data = members.map((member) => markData(lesson, member, user, statusId));
    const result = data.length ? await tx.attendance.createMany({ data, skipDuplicates: true }) : { count: 0 };
    return { count: result.count };
  });
}

export const listStatuses = (db) => db.attendanceStatus.findMany({ orderBy: [{ archived: 'asc' }, { name: 'asc' }] });
export const createStatus = (db, data) => db.attendanceStatus.create({ data });
export const updateStatus = (db, id, data) => db.attendanceStatus.update({ where: { id }, data });
