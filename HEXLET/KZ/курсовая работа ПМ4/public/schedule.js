import { button, el, empty, icon, openDialog, pageHeader, select } from './dom.js';
import { addDays, columnDate, dayLabel, displayDate, weekTitle } from './format.js';
import { googleCalendarButton } from './google-calendar.js';

export const clock = (value) => [Math.floor(value / 60), value % 60]
  .map((digit) => String(digit).padStart(2, '0')).join(':');
let preferredMode;

export function weekControl(week, loadWeek) {
  return el('div', { class: 'period schedule-period', 'aria-label': 'Выбор недели' },
    button('Предыдущая неделя', () => loadWeek(-1), { glyph: 'left', iconOnly: true }),
    el('span', { class: 'period-label' }, icon('calendar'), weekTitle(week)),
    button('Следующая неделя', () => loadWeek(1), { glyph: 'right', iconOnly: true }),
    button('Текущая неделя', () => loadWeek(0, true), { variant: 'quiet current-week' }));
}

function scheduleCard(event, first, lane, width) {
  const time = `${clock(event.startMinute)}–${clock(event.endMinute)}`;
  const summary = `${time} · ${event.subject} · ${event.room}`;
  const card = el('button', { class: 'calendar-event', type: 'button', title: summary, 'aria-label': summary,
    onclick: () => openDialog({
      title: event.subject, description: `${displayDate(event.date)} · ${time}`,
      fields: el('dl', { class: 'calendar-event-detail' },
        el('dt', {}, 'Кабинет'), el('dd', {}, event.room),
        el('dt', {}, 'Вид занятия'), el('dd', {}, event.kind),
        el('dt', {}, 'Группа'), el('dd', {}, event.audience),
        el('dt', {}, 'Преподаватель'), el('dd', {}, event.teacherName)),
    }),
  }, el('span', { class: 'agenda-time' }, time),
  el('strong', {}, event.subject), el('span', {}, event.room), el('span', {}, event.audience));
  card.style.top = `${event.startMinute - first + 1}px`;
  card.style.height = `${Math.max(14, event.endMinute - event.startMinute - 2)}px`;
  card.style.left = `calc(${lane / width * 100}% + 2px)`;
  card.style.width = `calc(${100 / width}% - 4px)`;
  return card;
}

function layoutDay(events, first) {
  const rendered = [];
  const sorted = [...events].sort((a, b) => a.startMinute - b.startMinute || b.endMinute - a.endMinute);
  let cluster = [];
  let laneEnds = [];
  let end = 0;
  function flush() {
    for (const [event, lane] of cluster) rendered.push(scheduleCard(event, first, lane, laneEnds.length));
    cluster = [];
    laneEnds = [];
    end = 0;
  }
  for (const event of sorted) {
    if (event.startMinute >= end) flush();
    const available = laneEnds.findIndex((minute) => minute <= event.startMinute);
    const lane = available < 0 ? laneEnds.length : available;
    laneEnds[lane] = event.endMinute;
    end = Math.max(end, event.endMinute);
    cluster.push([event, lane]);
  }
  flush();
  return rendered;
}

export function weekGrid(events, from, day, length = 7) {
  const byDay = new Map();
  for (const event of events) {
    const lessons = byDay.get(event.date) ?? [];
    lessons.push(event);
    byDay.set(event.date, lessons);
  }
  const first = Math.floor(Math.min(480, ...events.map((event) => event.startMinute)) / 60) * 60;
  const last = Math.ceil(Math.max(1080, ...events.map((event) => event.endMinute)) / 60) * 60;
  const dates = Array.from({ length }, (_, offset) => addDays(from, offset));
  const axis = el('div', { class: 'calendar-axis', 'aria-hidden': 'true' },
    Array.from({ length: (last - first) / 60 }, (_, i) => el('span', {}, clock(first + i * 60))));
  const grid = el('div', { class: `calendar-grid ${length === 1 ? 'calendar-day-view' : ''}` },
    el('div', { class: 'calendar-corner' }),
    dates.map((date) => el('header', { class: `calendar-day-heading ${date === day ? 'is-today' : ''}` },
      el('span', {}, dayLabel(date)), el('time', { datetime: date }, Number(date.slice(-2))),
      date === day && el('span', { class: 'sr-only' }, 'Сегодня'))),
    axis, dates.map((date) => el('section', { class: 'calendar-track', 'aria-label': displayDate(date) },
      layoutDay(byDay.get(date) ?? [], first))));
  grid.style.setProperty('--calendar-height', `${last - first}px`);
  return el('div', { class: 'schedule-scroll calendar-scroll', tabindex: '0', role: 'region', 'aria-label': 'Сетка расписания' }, grid);
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
    el('div', { class: 'row-actions' }, googleCalendarButton(context),
      admin && button('Открыть планировщик', () => goTo('planner'), { variant: 'primary', glyph: 'calendar' })));
  const content = el('section', { class: 'panel schedule-board' });
  const tone = el('p', { class: 'muted schedule-count', 'aria-live': 'polite' });
  let filters;
  const mode = select('calendar-view', [['week', 'Неделя'], ['day', 'День']],
    preferredMode ?? (matchMedia('(max-width: 760px)').matches ? 'day' : 'week'));
  mode.setAttribute('aria-label', 'Вид расписания');
  const choices = Array.from({ length: 7 }, (_, offset) => addDays(week.from, offset));
  const dayCounts = new Map();
  for (const event of schedule ?? []) dayCounts.set(event.date, (dayCounts.get(event.date) ?? 0) + 1);
  const date = select('calendar-date', choices.map((value) => [value,
    columnDate(value) + (dayCounts.has(value) ? ` · ${dayCounts.get(value)}` : '')]),
  dayCounts.has(day) ? day : choices.find((value) => dayCounts.has(value)) ?? (choices.includes(day) ? day : week.from));
  date.setAttribute('aria-label', 'День расписания');
  mode.addEventListener('change', () => { preferredMode = mode.value; show(); });
  date.addEventListener('change', show);
  function show() {
    if (schedule === null) {
      content.replaceChildren(empty('Загрузка расписания'));
      return;
    }
    const group = filters?.querySelector('[name="group"]').value;
    const teacher = filters?.querySelector('[name="teacher"]').value;
    const entries = schedule.filter((event) => (!group || event.groupIds.includes(group)) && (!teacher || event.teacherId === teacher));
    tone.textContent = `Занятий за неделю: ${entries.length}`;
    date.hidden = mode.value === 'week';
    const visible = date.hidden ? entries : entries.filter((event) => event.date === date.value);
    content.replaceChildren(weekGrid(visible, date.hidden ? week.from : date.value, day, date.hidden ? 7 : 1));
  }
  if (admin && schedule?.length) filters = calendarFilters(context, schedule, show);
  show();
  return el('section', { class: 'page schedule-page' }, heading,
    el('div', { class: 'schedule-toolbar' }, weekControl(week, loadJournal), el('div', { class: 'row-actions' }, filters, mode, date)),
    el('div', { class: 'schedule-summary' }, tone,
      el('span', { class: 'muted' }, `${columnDate(week.from)} – ${columnDate(week.to)}`)),
    content);
}
