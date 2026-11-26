const DAY = 86_400_000;
const date = (day) => new Date(`${day.slice(0, 10)}T12:00:00Z`);
export const addDays = (day, count) => new Date(date(day).getTime() + count * DAY).toISOString().slice(0, 10);
const dates = (options) => new Intl.DateTimeFormat('ru-KZ', { timeZone: 'UTC', ...options });
const full = dates({ day: 'numeric', month: 'long', year: 'numeric' });
const monthAndDay = dates({ day: 'numeric', month: 'long' });
const weekday = dates({ weekday: 'short' });
const weekdayAndDate = dates({ weekday: 'short', day: 'numeric', month: 'short' });

export function today(timeZone = 'Asia/Almaty') {
  const formatter = new Intl.DateTimeFormat('sv-SE', { timeZone, year: 'numeric', month: '2-digit', day: '2-digit' });
  return formatter.format(new Date());
}

export const dateInput = (day) => day?.slice(0, 10) ?? '';
export const isDate = (day) => typeof day === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(day) &&
  day >= '0001-01-01' && Number.isFinite(+date(day)) && date(day).toISOString().startsWith(day);
export const displayDate = (day) => full.format(date(day));
export const columnDate = (day) => weekdayAndDate.format(date(day));
export const dayLabel = (day) => weekday.format(date(day));

export function weekOf(day, offset = 0) {
  const weekdayIndex = (date(day).getUTCDay() + 6) % 7;
  const from = addDays(day, offset * 7 - weekdayIndex);
  return { from, to: addDays(from, 6) };
}

export function weekTitle({ from, to }) {
  const start = from.slice(0, 7) === to.slice(0, 7) ? Number(from.slice(-2)) : monthAndDay.format(date(from));
  return `${start} – ${monthAndDay.format(date(to))} ${to.slice(0, 4)}`;
}

export const activeAt = (member, day) => dateInput(member.joinedOn) <= day &&
  (!member.leftOn || dateInput(member.leftOn) > day);

export function initials(name) {
  return name.trim().split(/\s+/).slice(0, 2).map((part) => [...part][0]).join('').toUpperCase();
}

export const roleLabel = { admin: 'Администратор', teacher: 'Преподаватель', user: 'Студент' };
