import { asDate, activeOn } from '../lib/dates.js';
import { HttpError } from '../lib/http.js';
import { writeTransaction } from '../lib/transaction.js';
import { requireGroup } from './groups.js';

export async function requireLesson(db, id, user, today, options) {
  const lesson = await db.lesson.findUnique({ where: { id } });
  if (!lesson) throw new HttpError(404, 'Занятие не найдено');
  await requireGroup(db, lesson.groupId, user, today, options);
  if (user.role === 'user') {
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
    await requireGroup(tx, groupId, user, today, { writable: true });
    return tx.lesson.create({ data: { groupId, ...body, date: asDate(date) } });
  });
}

export function updateLesson(db, id, user, today, body) {
  return writeTransaction(db, async (tx) => {
    await requireLesson(tx, id, user, today, { writable: true });
    return tx.lesson.update({ where: { id }, data: body });
  });
}

export function deleteLesson(db, id, user, today) {
  return writeTransaction(db, async (tx) => {
    await requireLesson(tx, id, user, today, { writable: true });
    await tx.lesson.delete({ where: { id } });
    return { id, deleted: true };
  });
}
