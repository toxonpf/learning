import { z } from 'zod';

export const DAY = 86_400_000;
export const isoDay = z.iso.date();
export const asDate = (day) => new Date(`${day}T00:00:00.000Z`);

export function localDay(timeZone, now = new Date()) {
  const format = new Intl.DateTimeFormat('en', {
    timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  });
  const parts = Object.fromEntries(format.formatToParts(now).map(({ type, value }) => [type, value]));
  return `${parts.year}-${parts.month}-${parts.day}`;
}

export const activeOn = (date) => ({
  joinedOn: { lte: date },
  OR: [{ leftOn: null }, { leftOn: { gt: date } }],
});

export const overlaps = (from, to) => ({
  ...(to ? { joinedOn: { lt: to } } : {}),
  OR: [{ leftOn: null }, { leftOn: { gt: from } }],
});
