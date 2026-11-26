import { actionMenu, button, el, empty, openDialog, pageHeader, select } from './dom.js';
import { addDays, dayLabel, displayDate } from './format.js';
import { googleCalendarButton, openGoogleCalendarLink } from './google-calendar.js';
import { dateNavigation } from './date-navigation.js';
import { horizontalScroll } from './horizontal-scroll.js';

export const clock = (value) => [Math.floor(value / 60), value % 60]
  .map((digit) => String(digit).padStart(2, '0')).join(':');
let preferredMode;
const selection = { group: '', teacher: '' };
let selectedTeacherName = '';
const HOUR_HEIGHT = 96;
const minutePixels = (minutes) => minutes * HOUR_HEIGHT / 60;
const LANE_WIDTH = 122;

function scheduleCard(event, first, lane, width, journalLinks) {
  const time = `${clock(event.startMinute)}–${clock(event.endMinute)}`;
  const summary = `${time} · ${event.subject} · ${event.room} · ${event.audience}`;
  const height = Math.max(2, minutePixels(event.endMinute - event.startMinute) - 2);
  const density = height < 23 ? 'marker' : height < 45 ? 'compact' : height < 63 ? 'medium' : 'regular';
  const card = el('button', { class: `calendar-event is-${density}`, type: 'button', title: summary, 'aria-label': summary,
    onclick: () => openDialog({
      title: event.subject, description: `${displayDate(event.date)} · ${time}`,
      fields: [el('dl', { class: 'calendar-event-detail' },
        el('dt', {}, 'Кабинет'), el('dd', {}, event.room),
        el('dt', {}, 'Вид занятия'), el('dd', {}, event.kind),
        el('dt', {}, 'Группа'), el('dd', {}, event.audience),
        el('dt', {}, 'Преподаватель'), el('dd', {}, event.teacherName)), journalLinks?.(event)],
    }),
  }, el('strong', {}, event.subject), el('span', { class: 'agenda-time' }, time),
  el('span', { class: 'event-meta' }, `${event.room} · ${event.audience}`));
  card.style.top = `${minutePixels(event.startMinute - first) + 1}px`;
  card.style.height = `${height}px`;
  card.style.left = `calc(${lane / width * 100}% + 2px)`;
  card.style.width = `calc(${100 / width}% - 4px)`;
  return card;
}

function layoutDay(events, first, journalLinks) {
  const rendered = [];
  const sorted = [...events].sort((a, b) => a.startMinute - b.startMinute || b.endMinute - a.endMinute);
  let cluster = [];
  let laneEnds = [];
  let end = 0;
  let lanes = 1;
  function flush() {
    lanes = Math.max(lanes, laneEnds.length);
    for (const [event, lane] of cluster) rendered.push(scheduleCard(event, first, lane, laneEnds.length, journalLinks));
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
  return { cards: rendered, lanes };
}

export function weekGrid(events, from, day, length = 7, journalLinks) {
  const byDay = new Map();
  for (const event of events) {
    const lessons = byDay.get(event.date) ?? [];
    lessons.push(event);
    byDay.set(event.date, lessons);
  }
  const first = Math.floor(Math.min(480, ...events.map((event) => event.startMinute)) / 60) * 60;
  const last = Math.ceil(Math.max(1080, ...events.map((event) => event.endMinute)) / 60) * 60;
  const dates = Array.from({ length }, (_, offset) => addDays(from, offset));
  const days = dates.map((date) => ({ date, ...layoutDay(byDay.get(date) ?? [], first, journalLinks) }));
  const axis = el('div', { class: 'calendar-axis', 'aria-hidden': 'true' },
    Array.from({ length: (last - first) / 60 }, (_, i) => el('span', {}, clock(first + i * 60))));
  const grid = el('div', { class: 'calendar-grid' },
    el('div', { class: 'calendar-corner' }),
    dates.map((date) => el('header', { class: `calendar-day-heading ${date === day ? 'is-today' : ''}` },
      el('span', {}, dayLabel(date)), el('time', { datetime: date }, Number(date.slice(-2))),
      date === day && el('span', { class: 'sr-only' }, 'Сегодня'))),
    axis, days.map(({ date, cards }) => el('section', { class: 'calendar-track', 'aria-label': displayDate(date) }, cards)));
  grid.style.gridTemplateColumns = ['54px', ...days.map(({ lanes }) => `minmax(${LANE_WIDTH * lanes}px, 1fr)`)].join(' ');
  grid.style.setProperty('--calendar-hour', `${HOUR_HEIGHT}px`);
  grid.style.setProperty('--calendar-height', `${minutePixels(last - first)}px`);
  return horizontalScroll(grid, { className: 'schedule-scroll calendar-scroll', label: 'Сетка расписания', focusKey: 'calendar-scroll' });
}

function calendarFilters(context, events, update) {
  const groupChoices = [['', 'Все группы'], ...context.groups.map(({ id, code }) => [id, code])];
  const names = new Map(events.map(({ teacherId, teacherName }) => [teacherId, teacherName]));
  if (selection.teacher && !names.has(selection.teacher)) names.set(selection.teacher, selectedTeacherName);
  const teacherChoices = [['', 'Все преподаватели'], ...[...names].sort((a, b) => a[1].localeCompare(b[1], 'ru'))];
  function filter(label, id, choices) {
    if (!choices.some(([value]) => value === selection[id])) selection[id] = '';
    const control = select(id, choices, selection[id]);
    control.required = false;
    control.setAttribute('aria-label', label);
    control.addEventListener('change', () => {
      selection[id] = control.value;
      if (id === 'teacher') selectedTeacherName = names.get(control.value) ?? '';
      update();
    });
    return control;
  }
  return el('div', { class: 'schedule-filters' },
    filter('Группа в расписании', 'group', groupChoices),
    filter('Преподаватель в расписании', 'teacher', teacherChoices));
}

export function renderSchedule(context) {
  const { user, week, day, selectedDate, schedule, moveDate, pickDate, showToday, goTo, groups, openJournal, redraw } = context;
  const admin = user.role === 'admin';
  const heading = pageHeader(admin ? 'Расписание' : 'Моё расписание',
    admin ? 'Опубликованные занятия учебных групп' : 'Опубликованные занятия',
    el('div', { class: 'row-actions' },
      googleCalendarButton(context, showGoogle),
      admin && actionMenu('Действия расписания', [
        button('Открыть планировщик', () => goTo('planner'), { glyph: 'status' }),
      ])));
  const links = new Map(groups.map(({ id, code }) => [id, code]));
  function journalLinks(event) {
    const ids = event.groupIds.filter((id) => links.has(id));
    if (!ids.length) return null;
    return el('div', { class: 'row-actions' }, ids.map((id) =>
      button(ids.length === 1 ? 'Открыть журнал' : `Журнал · ${links.get(id)}`, () => {
        document.getElementById('dialog').close();
        openJournal(id, event.date);
      }, { glyph: 'journal' })));
  }
  const content = el('section', { class: 'panel schedule-board' });
  const google = el('section', { class: 'panel google-calendar-view', hidden: true, 'aria-label': 'Встроенный Google Календарь' });
  const tone = el('p', { class: 'muted schedule-count', 'aria-live': 'polite' });
  const mode = select('calendar-view', [['week', 'Неделя'], ['day', 'День']],
    preferredMode ?? (matchMedia('(max-width: 760px)').matches ? 'day' : 'week'));
  mode.setAttribute('aria-label', 'Вид расписания');
  mode.dataset.focusKey = 'calendar-view';
  const dayView = mode.value === 'day';
  mode.addEventListener('change', () => { preferredMode = mode.value; redraw(); });
  function show() {
    if (schedule === null) {
      content.replaceChildren(empty('Загрузка расписания'));
      return;
    }
    const { group, teacher } = admin ? selection : {};
    const entries = schedule.filter((event) => (!group || event.groupIds.includes(group)) && (!teacher || event.teacherId === teacher));
    const visible = dayView ? entries.filter((event) => event.date === selectedDate) : entries;
    tone.textContent = `Занятий ${dayView ? 'за день' : 'за неделю'}: ${visible.length}`;
    const previous = content.querySelector('.calendar-scroll');
    const next = weekGrid(visible, dayView ? selectedDate : week.from, day, dayView ? 1 : 7, journalLinks);
    content.replaceChildren(next);
    if (previous) {
      const grid = next.querySelector('.calendar-scroll');
      grid.scrollLeft = previous.scrollLeft;
      grid.scrollTop = previous.scrollTop;
    }
  }
  const filters = admin && calendarFilters(context, schedule ?? [], show);
  const toolbar = el('div', { class: 'schedule-toolbar' },
    dateNavigation({ date: selectedDate, week, dayView, move: (offset) => moveDate(offset * (dayView ? 1 : 7)),
      today: showToday, currentDay: day, pick: pickDate, scope: 'schedule-period' }),
    el('div', { class: 'row-actions' }, mode, filters));
  const summary = el('div', { class: 'schedule-summary' }, tone);
  function showGoogle(url) {
    if (!google.isConnected) return;
    const back = button('Вернуться к расписанию', () => {
      google.hidden = true;
      google.replaceChildren();
      toolbar.hidden = summary.hidden = content.hidden = false;
      heading.querySelector('.row-actions > button').focus();
    }, { glyph: 'left' });
    google.replaceChildren(
      el('div', { class: 'google-calendar-toolbar' }, back, openGoogleCalendarLink()),
      el('iframe', { src: url, title: 'Google Календарь — учебное расписание', referrerpolicy: 'no-referrer' }),
    );
    toolbar.hidden = summary.hidden = content.hidden = true;
    google.hidden = false;
    back.focus();
  }
  show();
  return el('section', { class: 'page schedule-page' }, heading, toolbar, summary, content, google);
}
