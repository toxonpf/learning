import { button, el, empty, icon, pageHeader, select } from './dom.js';
import { addDays, columnDate, dayLabel, displayDate, weekTitle } from './format.js';

export const clock = (value) => [Math.floor(value / 60), value % 60]
  .map((digit) => String(digit).padStart(2, '0')).join(':');

export function weekControl(week, loadWeek) {
  return el('div', { class: 'period schedule-period', 'aria-label': 'Выбор недели' },
    button('Предыдущая неделя', () => loadWeek(-1), { glyph: 'left', iconOnly: true }),
    el('span', { class: 'period-label' }, icon('calendar'), weekTitle(week)),
    button('Следующая неделя', () => loadWeek(1), { glyph: 'right', iconOnly: true }),
    button('Текущая неделя', () => loadWeek(0, true), { variant: 'quiet current-week' }));
}

function scheduleCard(event) {
  return el('article', { class: 'agenda-card' },
    el('div', { class: 'agenda-time' }, `${clock(event.startMinute)}–${clock(event.endMinute)}`),
    el('h3', {}, event.subject),
    el('div', { class: 'agenda-room' }, event.room),
    el('p', { class: 'agenda-meta' }, event.kind, ' · ', event.audience),
    el('p', { class: 'agenda-meta' }, event.teacherName));
}

export function weekGrid(events, from, day) {
  const byDay = new Map();
  for (const event of events) {
    const lessons = byDay.get(event.date) ?? [];
    lessons.push(event);
    byDay.set(event.date, lessons);
  }
  return el('div', { class: 'schedule-scroll', tabindex: '0', role: 'region', 'aria-label': 'Занятия на неделю' },
    el('div', { class: 'schedule-grid' }, Array.from({ length: 7 }, (_, offset) => {
      const date = addDays(from, offset);
      const lessons = byDay.get(date) ?? [];
      return el('section', { class: `agenda-day ${date === day ? 'is-today' : ''}`, 'aria-label': displayDate(date) },
        el('header', { class: 'agenda-heading' },
          el('span', { class: 'agenda-weekday' }, dayLabel(date)),
          el('time', { datetime: date }, Number(date.slice(-2))),
          date === day && el('span', { class: 'sr-only' }, 'Сегодня')),
        el('div', { class: 'agenda-lessons' }, lessons.length
          ? lessons.map(scheduleCard)
          : el('span', { class: 'agenda-empty' }, 'Нет занятий')));
    })));
}

function calendarFilters(context, events, update) {
  const groupChoices = [['', 'Все группы'], ...context.groups.map(({ id, code }) => [id, code])];
  const names = new Map(events.map(({ teacherId, teacherName }) => [teacherId, teacherName]));
  const teacherChoices = [['', 'Все преподаватели'], ...[...names].sort((a, b) => a[1].localeCompare(b[1], 'ru'))];
  function filter(label, id, choices) {
    const control = select(id, choices);
    control.required = false;
    control.setAttribute('aria-label', label);
    control.addEventListener('change', update);
    return control;
  }
  return el('div', { class: 'schedule-filters' },
    filter('Группа в расписании', 'group', groupChoices),
    filter('Преподаватель в расписании', 'teacher', teacherChoices));
}

export function renderSchedule(context) {
  const { user, week, day, schedule, loadJournal, goTo } = context;
  const admin = user.role === 'admin';
  const heading = pageHeader(admin ? 'Расписание' : 'Моё расписание',
    admin ? 'Опубликованные занятия учебных групп' : 'Опубликованные занятия на неделю',
    admin && button('Открыть планировщик', () => goTo('planner'), { variant: 'primary', glyph: 'calendar' }));
  const content = el('section', { class: 'panel schedule-board' });
  const tone = el('p', { class: 'muted schedule-count', 'aria-live': 'polite' });
  let filters;
  function show() {
    if (schedule === null) {
      content.replaceChildren(empty('Загрузка расписания'));
      return;
    }
    const group = filters?.querySelector('[name="group"]').value;
    const teacher = filters?.querySelector('[name="teacher"]').value;
    const entries = schedule.filter((event) => (!group || event.groupIds.includes(group)) && (!teacher || event.teacherId === teacher));
    tone.textContent = `Занятий за неделю: ${entries.length}`;
    content.replaceChildren(weekGrid(entries, week.from, day));
  }
  if (admin && schedule?.length) filters = calendarFilters(context, schedule, show);
  show();
  return el('section', { class: 'page schedule-page' }, heading,
    el('div', { class: 'schedule-toolbar' }, weekControl(week, loadJournal), filters),
    el('div', { class: 'schedule-summary' }, tone,
      el('span', { class: 'muted' }, `${columnDate(week.from)} – ${columnDate(week.to)}`)),
    content);
}
