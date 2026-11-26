import { asDate, activeOn } from '../lib/dates.js';
import { HttpError } from '../lib/http.js';
import { writeTransaction } from '../lib/transaction.js';
import { requireGroup } from './groups.js';

export async function requireLesson(db, id, user, today, options) {
  const lesson = await db.lesson.findUnique({ where: { id } });
  if (!lesson) throw new HttpError(404, 'Занятие не найдено');
  const scheduled = Boolean(lesson.scheduleTeacherId);
  if (scheduled && user.role === 'teacher' && lesson.scheduleTeacherId !== user.id) {
    throw new HttpError(404, 'Занятие не найдено');
  }
  await requireGroup(db, lesson.groupId, user, today, { ...options, manual: !scheduled });
  if (scheduled && !lesson.scheduledSessionId && options?.writable) {
    throw new HttpError(409, 'Занятие снято с расписания. Отметки доступны в истории');
  }
  if (user.role === 'user') {
    if (scheduled && !lesson.scheduledStudentIds.includes(user.id)) throw new HttpError(404, 'Занятие не найдено');
    const member = await db.groupMembership.findFirst({
      where: {
        groupId: lesson.groupId,
        userId: user.id,
        ...activeOn(lesson.date),
        AND: { joinedOn: { lte: today } },
      },
      select: { id: true },
    });
    if (!member) throw new HttpError(404, 'Занятие не найдено');
  }
  return lesson;
}

export function createLesson(db, groupId, user, today, { date, ...body }) {
  return writeTransaction(db, async (tx) => {
    await requireGroup(tx, groupId, user, today, { writable: true, manual: true });
    const duplicate = await tx.lesson.findFirst({
      where: { groupId, date: asDate(date), startTime: body.startTime, scheduledSessionId: { not: null } },
      select: { id: true },
    });
    if (duplicate) throw new HttpError(409, 'Занятие в это время уже добавлено из расписания');
    return tx.lesson.create({ data: { groupId, ...body, date: asDate(date) } });
  });
}

export function updateLesson(db, id, user, today, body) {
  return writeTransaction(db, async (tx) => {
    const lesson = await requireLesson(tx, id, user, today, { writable: true });
    if (lesson.scheduleTeacherId) throw new HttpError(409, 'Измените это занятие в планировщике расписания');
    if (body.startTime && body.startTime !== lesson.startTime && await tx.lesson.findFirst({
      where: { groupId: lesson.groupId, date: lesson.date, startTime: body.startTime, scheduledSessionId: { not: null } },
      select: { id: true },
    })) throw new HttpError(409, 'Занятие в это время уже добавлено из расписания');
    return tx.lesson.update({ where: { id }, data: body });
  });
}

export function deleteLesson(db, id, user, today) {
  return writeTransaction(db, async (tx) => {
    const lesson = await requireLesson(tx, id, user, today, { writable: true });
    if (lesson.scheduleTeacherId) throw new HttpError(409, 'Удалите это занятие в планировщике расписания');
    await tx.lesson.delete({ where: { id } });
    return { id, deleted: true };
  });
}
