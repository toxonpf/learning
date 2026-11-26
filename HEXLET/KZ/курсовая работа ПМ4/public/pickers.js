import { button, el, icon, input, select } from './dom.js';
import { addDays, displayDate, isDate, today } from './format.js';

const pad = (number) => String(number).padStart(2, '0');
const dateValue = (year, month, day) => `${String(year).padStart(4, '0')}-${pad(month + 1)}-${pad(day)}`;
const monthNames = Array.from({ length: 12 }, (_, month) => new Intl.DateTimeFormat('ru', { month: 'long', timeZone: 'UTC' })
  .format(new Date(Date.UTC(2024, month, 1))));
let pickerId = 0;

export const datePicker = (label, name, value, options) => createPicker('date', label, name, value, options);
export const timePicker = (label, name, value, options) => createPicker('time', label, name, value, options);

function createPicker(type, label, name, value = '', { required = true, hint, onChange, focusKey, currentDay, standalone } = {}) {
  const identifier = `picker-${++pickerId}`;
  const isDay = type === 'date';
  const control = input(name, value, { type, class: 'picker-value', required, id: identifier, tabindex: '-1', 'aria-hidden': 'true' });
  const text = el('span', { id: identifier + '-value' });
  const error = el('p', { class: 'form-error picker-error', hidden: true, role: 'alert' });
  const trigger = el('button', { type: 'button', class: 'button picker-trigger',
    'aria-label': label, 'aria-describedby': text.id, 'aria-haspopup': 'dialog', 'data-focus-key': focusKey,
    onclick: open,
  }, text, icon(isDay ? 'calendar' : 'clock'));
  const holder = el('div', { class: 'picker-control' }, control, trigger, error);
  const markup = standalone ? holder : el('div', { class: 'field picker-field' },
    el('label', { class: 'picker-label', for: identifier }, el('span', {}, label)), holder,
    hint && el('small', { class: 'muted' }, hint));

  function update() {
    const selected = control.value;
    text.textContent = selected ? isDay ? selected.split('-').reverse().join('.') : selected
      : isDay ? 'Выбрать дату' : 'Выбрать время';
    trigger.removeAttribute('aria-invalid');
    error.hidden = true;
  }

  function open() {
    const title = isDay ? 'Выберите дату' : 'Выберите время';
    const editor = isDay ? calendarPanel(control.value, currentDay ?? today()) : clockPanel(control.value);
    const popup = el('dialog', { class: 'picker-dialog', 'aria-labelledby': identifier + '-title' });
    function commit(value) {
      popup.close();
      control.value = value;
      control.dispatchEvent(new Event('input', { bubbles: true }));
      control.dispatchEvent(new Event('change', { bubbles: true }));
    }
    popup.append(
      el('div', { class: 'picker-heading' }, el('h2', { id: identifier + '-title' }, title),
        button('Закрыть выбор', () => popup.close(), { glyph: 'close', iconOnly: true, variant: 'quiet' })),
      editor.view,
      el('div', { class: 'picker-actions' },
        !required && button('Очистить', () => commit(''), { variant: 'quiet' }),
        button('Отмена', () => popup.close(), { variant: 'quiet' }),
        button('Готово', () => {
          const next = editor.value();
          if (next !== null) commit(next);
        }, { variant: 'primary' })),
    );
    popup.addEventListener('close', () => {
      popup.remove();
      if (trigger.isConnected) trigger.focus({ preventScroll: true });
    }, { once: true });
    popup.addEventListener('keydown', (event) => {
      if (event.key !== 'Enter' || !event.target.matches('input')) return;
      event.preventDefault();
      if (isDay) event.target.blur();
      else {
        const next = editor.value();
        if (next !== null) commit(next);
      }
    });
    holder.append(popup);
    popup.showModal();
    editor.focus();
  }

  control.addEventListener('input', update);
  control.addEventListener('change', () => { update(); onChange?.(control.value); });
  control.addEventListener('focus', () => trigger.focus());
  control.addEventListener('invalid', (event) => {
    event.preventDefault();
    trigger.setAttribute('aria-invalid', 'true');
    error.textContent = `${label}. ${isDay ? 'Выберите дату.' : 'Укажите время.'}`;
    error.hidden = false;
    trigger.focus();
  });
  update();
  return markup;
}

function calendarPanel(value, currentDay) {
  let selected = isDate(value) ? value : currentDay;
  let cursor = selected;
  let [year, month] = cursor.split('-').map(Number);
  month -= 1;
  const previous = button('Предыдущий месяц', () => shift(-1), { glyph: 'left', iconOnly: true });
  const next = button('Следующий месяц', () => shift(1), { glyph: 'right', iconOnly: true });
  const months = select('', monthNames.map((name, index) => [String(index), name]), String(month));
  months.setAttribute('aria-label', 'Месяц');
  months.addEventListener('change', () => showMonth(year, Number(months.value)));
  const years = input('', String(year), { type: 'number', min: 1, max: 9999, 'aria-label': 'Год',
    onchange: () => showMonth(Number(years.value) || year, month),
  });
  const days = el('div', { class: 'picker-days', role: 'group', 'aria-label': 'Дни месяца' });
  const view = el('div', { class: 'picker-content' },
    el('div', { class: 'picker-month' }, previous, months, years, next),
    el('div', { class: 'picker-weekdays', 'aria-hidden': 'true' },
      ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс'].map((day) => el('span', {}, day))),
    days, button('Сегодня', () => choose(currentDay), { variant: 'quiet' }));

  function focus() { days.querySelector('[tabindex="0"]')?.focus(); }
  function shift(offset) {
    const absolute = 12 * year + month + offset;
    showMonth(Math.floor(absolute / 12), (absolute + 12) % 12);
  }
  function showMonth(nextYear, nextMonth) {
    if (!Number.isInteger(nextYear) || nextYear < 1 || nextYear > 9999) { years.value = String(year); return; }
    year = nextYear;
    month = nextMonth;
    cursor = dateValue(year, month, 1);
    draw();
  }
  function move(target) {
    if (!isDate(target)) return;
    cursor = target;
    [year, month] = target.split('-').map(Number);
    month -= 1;
    draw();
    focus();
  }
  function choose(target) { selected = target; move(target); }

  function draw() {
    months.value = String(month);
    years.value = String(year);
    previous.disabled = year === 1 && month === 0;
    next.disabled = year === 9999 && month === 11;
    const first = dateValue(year, month, 1);
    const gap = (new Date(first + 'T12:00:00Z').getUTCDay() + 6) % 7;
    const dayButtons = [];
    for (let day = 1; day <= 31; day += 1) {
      const target = dateValue(year, month, day);
      if (!isDate(target)) break;
      dayButtons.push(el('button', { type: 'button', class: 'picker-day',
        'aria-pressed': String(target === selected), 'aria-current': target === currentDay ? 'date' : null,
        'aria-label': displayDate(target), tabindex: target === cursor ? '0' : '-1',
        onclick: () => choose(target),
      }, day));
    }
    days.replaceChildren(...Array.from({ length: gap }, () => el('span', { 'aria-hidden': 'true' })), ...dayButtons);
  }
  days.addEventListener('keydown', (event) => {
    const offset = { ArrowLeft: -1, ArrowRight: 1, ArrowUp: -7, ArrowDown: 7 }[event.key];
    if (!offset) return;
    event.preventDefault();
    move(addDays(cursor, offset));
  });
  draw();
  return { view, value: () => selected, focus };
}

function clockPanel(value) {
  const [hour, minute] = (value || '09:00').split(':');
  let unit = 0;
  const messages = ['Выберите часы', 'Выберите минуты'];
  const dial = el('div', { class: 'clock-face', role: 'group', 'aria-label': messages[0] });
  const hint = el('p', { class: 'clock-hint', role: 'status' }, messages[0]);
  const fields = [hour, minute].map((part, index) => input('', part, {
    type: 'text', inputmode: 'numeric', maxlength: 2,
    'aria-label': index === 0 ? 'Часы' : 'Минуты',
    onfocus: () => { unit = index; draw(); },
    oninput: draw,
  }));
  const error = el('p', { class: 'form-error clock-error', role: 'alert', hidden: true });
  const view = el('div', { class: 'picker-content' },
    el('div', { class: 'clock-inputs' },
      el('label', {}, fields[0], 'Часы'), el('span', { 'aria-hidden': 'true' }, ':'),
      el('label', {}, fields[1], 'Минуты')),
    hint, dial, error);

  function read(index) {
    const entered = fields[index].value;
    return /^\d{1,2}$/.test(entered) && Number(entered) <= (index === 0 ? 23 : 59)
      ? Number(entered) : null;
  }

  function choose(number) {
    fields[unit].value = pad(number);
    if (unit === 0) {
      fields[1].focus();
      return;
    }
    draw();
    dial.querySelector('[tabindex="0"]')?.focus();
  }

  function draw() {
    hint.textContent = messages[unit];
    error.hidden = true;
    dial.setAttribute('aria-label', messages[unit]);
    for (const field of fields) field.removeAttribute('aria-invalid');
    const current = read(unit);
    const selected = unit === 0 ? current ?? 0 : Math.floor(((current ?? 0) + 2) / 5) * 5 % 60;
    const inner = unit === 0 && (current === 0 || current > 12);
    const turn = (current ?? 0) * (unit === 0 ? 30 : 6);
    const values = unit === 0 ? Array.from({ length: 24 }, (_, index) => index)
      : Array.from({ length: 12 }, (_, index) => index * 5);
    const hand = el('span', { class: 'clock-hand', 'aria-hidden': 'true' });
    hand.style.setProperty('--turn', turn + 'deg');
    hand.style.setProperty('--length', inner ? '25%' : '41%');
    dial.replaceChildren(hand, ...values.map((number) => {
      const ring = unit === 0 && (number === 0 || number > 12) ? 25 : 41;
      const angle = number * (unit === 0 ? 30 : 6) * Math.PI / 180;
      const item = el('button', { type: 'button', class: 'clock-tick', tabindex: number === selected ? '0' : '-1',
        'aria-pressed': String(number === current), onclick: () => choose(number),
      }, pad(number));
      item.style.left = `${50 + ring * Math.sin(angle)}%`;
      item.style.top = `${50 - ring * Math.cos(angle)}%`;
      return item;
    }));
  }

  dial.addEventListener('click', (event) => {
    if (event.target.closest('button') || unit !== 1) return;
    const rect = dial.getBoundingClientRect();
    const dx = event.clientX - rect.left - rect.width / 2;
    const dy = event.clientY - rect.top - rect.height / 2;
    if (Math.hypot(dx, dy) < 12) return;
    choose((Math.round(Math.atan2(dx, -dy) * 30 / Math.PI) + 60) % 60);
  });
  dial.addEventListener('keydown', (event) => {
    const delta = { ArrowLeft: -1, ArrowUp: -1, ArrowRight: 1, ArrowDown: 1 }[event.key];
    if (!delta) return;
    event.preventDefault();
    const count = unit === 0 ? 24 : 60;
    fields[unit].value = pad(((read(unit) ?? 0) + delta + count) % count);
    draw();
    dial.querySelector('[tabindex="0"]')?.focus();
  });
  draw();
  return {
    view,
    focus: () => fields[0].focus(),
    value: () => {
      const numbers = fields.map((_, index) => read(index));
      const invalid = numbers.indexOf(null);
      if (invalid >= 0) {
        fields[invalid].focus();
        fields[invalid].setAttribute('aria-invalid', 'true');
        error.textContent = invalid === 0 ? 'Введите часы от 00 до 23.' : 'Введите минуты от 00 до 59.';
        error.hidden = false;
        return null;
      }
      return numbers.map(pad).join(':');
    },
  };
}
