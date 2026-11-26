import { button, el } from './dom.js';
import { displayDate, weekTitle } from './format.js';
import { datePicker } from './pickers.js';

export function dateNavigation({ date, week, dayView = false, move, pick, today, currentDay, scope = 'period' }) {
  const previous = button(dayView ? 'Предыдущий день' : 'Предыдущая неделя', () => move(-1),
    { glyph: 'left', iconOnly: true });
  const next = button(dayView ? 'Следующий день' : 'Следующая неделя', () => move(1),
    { glyph: 'right', iconOnly: true });
  previous.dataset.focusKey = scope + '-previous';
  next.dataset.focusKey = scope + '-next';
  const current = button('Сегодня', today);
  current.dataset.focusKey = scope + '-today';
  const calendar = datePicker('Перейти к дате', 'jump-date', date,
    { standalone: true, currentDay, focusKey: scope + '-date', onChange: (value) => { if (value) pick(value); } });
  return el('div', { class: 'period', role: 'group', 'aria-label': dayView ? 'Выбрать день' : 'Выбрать неделю' },
    el('div', { class: 'period-arrows' }, previous, next), current, calendar,
    el('span', { class: 'period-label', 'aria-live': 'polite' }, dayView ? displayDate(date) : weekTitle(week)));
}
