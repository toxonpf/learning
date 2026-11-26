import { asDay } from './config.js';

const time = (minute) => [Math.floor(minute / 60), minute % 60]
  .map((value) => String(value).padStart(2, '0')).join(':');
const slotKey = ({ groupId, date, startTime, title }) => JSON.stringify([groupId, asDay(date), startTime, title]);
const identity = ({ scheduleTeacherId, scheduleAudience }) => JSON.stringify([scheduleTeacherId, scheduleAudience]);

export async function openScheduledLessons(tx, sessions, from, to) {
  const lessons = sessions.flatMap((session) => session.groupIds.map((groupId) => ({
    groupId, title: session.subject, date: session.date, startTime: time(session.startMinute),
    scheduledSessionId: session.id, scheduleTeacherId: session.teacherId,
    scheduleAudience: session.audience, scheduledStudentIds: session.studentIds,
  })));
  if (!lessons.length) return;
  const existing = await tx.lesson.findMany({
    where: { groupId: { in: [...new Set(lessons.map(({ groupId }) => groupId))] }, date: { gte: from, lte: to } },
    include: { marks: { select: { membership: { select: { userId: true } } } } },
  });
  const current = Map.groupBy(existing, slotKey);
  const incoming = Map.groupBy(lessons, slotKey);
  const inserted = [];
  for (const [key, choices] of incoming) {
    const saved = current.get(key) ?? [];
    for (const lesson of choices) {
      const matching = saved.find((row) => identity(row) === identity(lesson));
      const manual = choices.length === 1 && saved.find((row) => !row.scheduleTeacherId &&
        row.marks.every(({ membership }) => lesson.scheduledStudentIds.includes(membership.userId)));
      const old = matching ?? manual;
      if (!old) {
        inserted.push(lesson);
        continue;
      }
      const ids = [...new Set([...lesson.scheduledStudentIds, ...old.marks.map(({ membership }) => membership.userId)])];
      await tx.lesson.update({ where: { id: old.id }, data: { ...lesson, scheduledStudentIds: ids } });
    }
  }
  if (inserted.length) await tx.lesson.createMany({ data: inserted });
}

export async function detachScheduledLessons(tx, where) {
  const lessons = await tx.lesson.findMany({ where: { scheduledSession: { is: where } }, select: { id: true } });
  const { count } = await tx.scheduledSession.deleteMany({ where });
  return { count, lessonIds: lessons.map(({ id }) => id) };
}

export async function discardUnmarkedLessons(tx, ids) {
  if (ids.length) await tx.lesson.deleteMany({
    where: { id: { in: ids }, scheduledSessionId: null, marks: { none: {} } },
  });
}
