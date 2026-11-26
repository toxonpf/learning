import { randomUUID } from 'node:crypto';
import { Prisma } from '@prisma/client';
import { HttpError } from '../lib/http.js';
import { writeTransaction } from '../lib/transaction.js';
import { detachScheduledLessons, discardUnmarkedLessons } from '../schedule/journal-sync.js';
import { endMembership } from './groups.js';

async function releaseTeachingAssignments(tx, userId, today) {
  const { lessonIds } = await detachScheduledLessons(tx, { teacherId: userId, date: { gte: today } });
  await discardUnmarkedLessons(tx, lessonIds);
  const plans = await tx.schedulePlan.findMany({
    select: { id: true, config: true },
  });
  for (const { id, config } of plans) {
    if (!config.teachers.some((teacher) => teacher.userId === userId) &&
        !config.exceptions.some((item) => item.scope === 'teacher' && item.resourceId === userId) &&
        !config.requirements.some((item) => item.teacherId === userId)) continue;
    config.teachers = config.teachers.filter((teacher) => teacher.userId !== userId);
    config.exceptions = config.exceptions.filter((item) => item.scope !== 'teacher' || item.resourceId !== userId);
    for (const requirement of config.requirements) {
      if (requirement.teacherId === userId) requirement.teacherId = null;
    }
    await tx.schedulePlan.update({
      where: { id }, data: { config, revision: { increment: 1 }, draft: Prisma.DbNull },
    });
  }
}

export function deleteUser(db, id, confirmation, today) {
  return writeTransaction(db, async (tx) => {
    const account = await tx.user.findUnique({ where: { id, deletedAt: null }, select: { role: true, email: true } });
    if (!account) throw new HttpError(404, 'Пользователь не найден');
    if (account.role === 'admin') throw new HttpError(403, 'Учетная запись администратора защищена');
    if (confirmation !== account.email) throw new HttpError(400, 'Введите точную электронную почту пользователя');
    const memberships = await tx.groupMembership.findMany({
      where: { userId: id, OR: [{ leftOn: null }, { leftOn: { gt: today } }] },
    });
    for (const member of memberships) await endMembership(tx, member, today);
    if (account.role === 'teacher') await releaseTeachingAssignments(tx, id, today);
    await tx.googleCalendarConnection.deleteMany({ where: { userId: id } });
    await tx.user.update({
      where: { id }, data: { deletedAt: new Date(), email: `deleted-${randomUUID()}@invalid.example`, passwordHash: '' },
    });
    return { id, deleted: true };
  });
}
