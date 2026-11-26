import { actionMenu, button, confirmAction, el, empty, field, input, select } from './dom.js';
import { displayDate } from './format.js';
import { sortableTable } from './table.js';
import { datePicker, timePicker } from './pickers.js';

export const weekdays = [['1', 'Пн'], ['2', 'Вт'], ['3', 'Ср'], ['4', 'Чт'], ['5', 'Пт'], ['6', 'Сб'], ['7', 'Вс']];
export const names = (rows) => rows.map(({ id, name }) => [id, name]);
export const isChecked = (values, key) => values[key] === 'on';
export const number = (value) => value === '' || value == null ? null : Number(value);
export const wholeName = (user) => [user.lastName, user.firstName, user.patronymic].filter(Boolean).join(' ') || user.name;

export function textField(label, name, value = '', max = 120, options = {}) {
  return field(label, input(name, value, { required: true, maxlength: max, ...options }));
}

export const numberField = (label, name, value, min, max, required = false) =>
  field(label, input(name, value ?? '', { type: 'number', step: 1, min, max, required }));
export const dateField = datePicker;
export const timeField = (label, name, value, required = true) => timePicker(label, name, value, { required });

export function optionalSelect(label, name, options, value, placeholder) {
  const control = select(name, [['', placeholder], ...options], value ?? '');
  control.required = false;
  return field(label, control);
}

export function checkbox(label, name, checked) {
  return el('label', { class: 'toggle planner-toggle' },
    el('input', { type: 'checkbox', name, checked }), el('span', {}, label));
}

export function checklist(label, prefix, options, selected = [], { compact = false } = {}) {
  const values = new Set(selected.map(String));
  return el('fieldset', { class: `planner-checks ${compact ? 'is-compact' : ''}` },
    el('legend', {}, label),
    options.length
      ? el('div', { class: 'planner-checks-list' }, options.map(([id, name]) => checkbox(name, prefix + id, values.has(id))))
      : el('p', { class: 'muted' }, 'Справочник пока пуст'));
}

export const picked = (values, prefix, options) => options.map(([id]) => id).filter((id) => isChecked(values, prefix + id));

export function featureFields(label, features, current, minimum = 1) {
  if (!features.length) return null;
  const initial = new Map((current ?? []).map(({ featureId, quantity }) => [featureId, quantity]));
  return el('fieldset', { class: 'planner-checks' }, el('legend', {}, label),
    el('div', { class: 'planner-feature-list' }, features.map(({ id, name }) =>
      numberField(name, 'feature-' + id, initial.get(id), minimum, 10000))));
}

export function featureValues(values, features) {
  return features.flatMap(({ id }) => {
    const quantity = number(values['feature-' + id]);
    return quantity === null ? [] : [{ featureId: id, quantity }];
  });
}

export function saveChanges(context, change) {
  const { plan } = context.planner;
  const { id, revision, name, startsOn, endsOn } = plan;
  const work = { revision, name, startsOn, endsOn, config: structuredClone(plan.config) };
  change(work);
  return context.mutate(`/schedule/plans/${id}`, 'PUT', work, 'Параметры сохранены');
}

export function editItem(context, collection, existing, transform, key = 'id') {
  return saveChanges(context, ({ config }) => {
    if (!existing) {
      config[collection].push(transform());
      return;
    }
    config[collection] = config[collection].map((item) => item[key] === existing[key] ? transform() : item);
  });
}

export function removeItem(context, collection, item, name, key = 'id') {
  confirmAction({
    title: 'Удалить из плана?',
    description: name,
    code: name,
    submitLabel: 'Удалить из плана',
    onSubmit: () => saveChanges(context, ({ config }) => {
      config[collection] = config[collection].filter((entry) => entry[key] !== item[key]);
    }),
  });
}

export const editButton = (action, label = 'Изменить') => button(label, action, { variant: 'quiet', glyph: 'edit' });
export const addButton = (label, action) => button(label, action, { glyph: 'plus' });
export const actions = (...buttons) => actionMenu('Действия записи', buttons);
export const duplicate = (action) => button('Дублировать', action, { glyph: 'copy' });
export const deleteButton = (action) => button('Удалить', action, { glyph: 'trash', variant: 'danger' });
export const copyName = (name) => name ? `${name.slice(0, 112)} (копия)` : '';

export function resourceTable(headers, rows) {
  return sortableTable(headers, rows, { wrapper: 'management-scroll planner-table-wrap', table: 'data-table planner-table' });
}

export function panel(title, description, detail, action) {
  return el('section', { class: 'panel planner-panel' },
    el('header', { class: 'panel-heading' }, el('div', {}, el('h2', {}, title),
      description && el('p', { class: 'muted' }, description)), action),
    detail ?? empty('Пока пусто'));
}

export function gridFields(...fields) {
  return el('div', { class: 'planner-field-grid' }, fields);
}

export function rangeTitle(from, to) {
  return from === to ? displayDate(from) : `${displayDate(from)} — ${displayDate(to)}`;
}
