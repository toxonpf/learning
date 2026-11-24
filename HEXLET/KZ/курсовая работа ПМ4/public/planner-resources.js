import { el, field, openDialog, select } from './dom.js';
import {
  actions, addButton, checklist, checkbox, dateField, editButton, editItem, featureFields, featureValues,
  gridFields, isChecked, names, number, numberField, optionalSelect, panel, picked, rangeTitle,
  removeItem, resourceTable, saveChanges, textField, timeField, weekdays,
} from './planner-controls.js';

function basicCalendar(context) {
  const { academicMinutes, workingDays } = context.planner.plan.config;
  openDialog({
    title: 'Рабочие дни и учебный час',
    fields: [
      numberField('Минут в академическом часе', 'academicMinutes', academicMinutes, 1, 120, true),
      checklist('Рабочие дни', 'day-', weekdays, workingDays, { compact: true }),
    ],
    onSubmit: (values) => saveChanges(context, ({ config }) => {
      config.academicMinutes = number(values.academicMinutes);
      config.workingDays = picked(values, 'day-', weekdays).map(Number);
    }),
  });
}

function slotEditor(context, slot = null) {
  openDialog({
    title: slot ? 'Изменить слот' : 'Новый слот',
    fields: [gridFields(timeField('Начало слота', 'start', slot?.start), timeField('Конец слота', 'end', slot?.end))],
    onSubmit: ({ start, end }) => saveChanges(context, ({ config }) => {
      if (slot) config.slots = config.slots.map((item) => item.start === slot.start ? { start, end } : item);
      else config.slots.push({ start, end });
    }),
  });
}

function periodEditor(context, record) {
  const { startsOn, endsOn } = context.planner.plan;
  openDialog({
    title: record ? 'Изменить модуль' : 'Новый модуль',
    fields: [
      textField('Название модуля', 'name', record?.name),
      gridFields(dateField('Начало модуля', 'from', record?.from ?? startsOn),
        dateField('Конец модуля', 'to', record?.to ?? endsOn)),
    ],
    onSubmit: ({ name, from, to }) => editItem(context, 'periods', record,
      () => ({ id: record?.id ?? crypto.randomUUID(), name, from, to })),
  });
}

function exceptionEditor(context, record) {
  const { plan, teachers } = context.planner;
  const scopes = [['school', 'Всё учреждение'], ['teacher', 'Преподаватель'], ['room', 'Кабинет']];
  const scope = select('scope', scopes, record?.scope ?? 'school');
  const resource = el('div', {});
  function scopeChanged() {
    const options = scope.value === 'teacher' ? names(teachers) : names(plan.config.rooms);
    const value = scope.value === record?.scope ? record.resourceId : '';
    resource.replaceChildren();
    if (scope.value !== 'school') {
      resource.append(field(scope.value === 'teacher' ? 'Преподаватель для исключения' : 'Кабинет для исключения',
        select('resourceId', [['', 'Выберите ресурс'], ...options], value)));
    }
  }
  scope.addEventListener('change', scopeChanged);
  scopeChanged();
  openDialog({
    title: record ? 'Изменить исключение' : 'Добавить исключение',
    description: 'Выходной или период недоступности. Пустое время блокирует день целиком.',
    fields: [
      textField('Причина', 'name', record?.name, 120, { placeholder: 'Например, каникулы' }),
      field('Кого касается', scope), resource,
      gridFields(dateField('С даты', 'from', record?.from ?? plan.startsOn),
        dateField('По дату', 'to', record?.to ?? plan.startsOn)),
      gridFields(timeField('С какого времени', 'start', record?.start ?? '', false),
        timeField('До какого времени', 'end', record?.end ?? '', false)),
    ],
    onSubmit: ({ name, from, to, scope, resourceId, start, end }) => editItem(context, 'exceptions', record, () => ({
      id: record?.id ?? crypto.randomUUID(), name, from, to, scope, resourceId: resourceId || null, start: start || null, end: end || null,
    })),
  });
}

export function calendarPanels(context) {
  const { config } = context.planner.plan;
  const days = config.workingDays.map((day) => weekdays[day - 1][1]).join(', ');
  const refs = new Map([...context.planner.teachers, ...config.rooms].map(({ id, name }) => [id, name]));
  return el('div', { class: 'planner-stack' },
    panel('Рабочая неделя', null,
      el('dl', { class: 'planner-facts' },
        el('div', {}, el('dt', {}, 'Дни занятий'), el('dd', {}, days)),
        el('div', {}, el('dt', {}, 'Академический час'), el('dd', {}, `${config.academicMinutes} мин`))),
      editButton(() => basicCalendar(context))),
    panel('Временные слоты', 'Добавьте интервалы занятий. Промежутки между ними остаются свободными.',
      resourceTable(['Начало', 'Конец', 'Действия'], [...config.slots].sort((a, b) => a.start.localeCompare(b.start)).map((slot) => [
        slot.start, slot.end,
        actions(editButton(() => slotEditor(context, slot)),
          config.slots.length > 1 && editButton(() => openDialog({
            title: 'Удалить слот?',
            description: `${slot.start} – ${slot.end}`,
            submitLabel: 'Удалить слот',
            onSubmit: () => saveChanges(context, ({ config: work }) => {
              work.slots = work.slots.filter((item) => item.start !== slot.start);
            }),
          }), 'Удалить')),
      ])), addButton('Добавить слот', () => slotEditor(context))),
    panel('Модули периода', 'Строку учебного плана можно ограничить датами одного модуля.',
      config.periods.length ? resourceTable(['Модуль', 'Даты', 'Действия'], config.periods.map((item) => [
        item.name, rangeTitle(item.from, item.to), actions(editButton(() => periodEditor(context, item)),
          editButton(() => removeItem(context, 'periods', item, item.name), 'Удалить')),
      ])) : null, addButton('Добавить модуль', () => periodEditor(context))),
    panel('Выходные и исключения', 'Каникулы, праздники и интервалы недоступности преподавателей или кабинетов.',
      config.exceptions.length ? resourceTable(['Причина', 'Даты', 'Время', 'Кого касается', 'Действия'], config.exceptions.map((item) => [
        item.name, rangeTitle(item.from, item.to), item.start ? `${item.start} – ${item.end}` : 'Весь день',
        item.scope === 'school' ? 'Всё учреждение' : refs.get(item.resourceId) ?? 'Ресурс недоступен',
        actions(editButton(() => exceptionEditor(context, item)),
          editButton(() => removeItem(context, 'exceptions', item, item.name), 'Удалить')),
      ])) : null, addButton('Добавить исключение', () => exceptionEditor(context))));
}

export function dictionaryEditor(context, collection, label, item) {
  openDialog({
    title: item ? `Переименовать ${label}` : `Добавить ${label}`,
    fields: [textField('Название', 'name', item?.name)],
    onSubmit: ({ name }) => editItem(context, collection, item, () => ({ id: item?.id ?? crypto.randomUUID(), name })),
  });
}

export function dictionaryPanel(context, collection, title, label, description, addLabel) {
  const rows = context.planner.plan.config[collection];
  return panel(title, description, rows.length ? resourceTable(['Название', 'Действия'], rows.map((item) => [
    item.name,
    actions(editButton(() => dictionaryEditor(context, collection, label, item)),
      editButton(() => removeItem(context, collection, item, item.name), 'Удалить')),
  ])) : null, addButton(addLabel, () => dictionaryEditor(context, collection, label)));
}

function roomTypeEditor(context, item) {
  const { features } = context.planner.plan.config;
  openDialog({
    title: item ? 'Изменить тип кабинета' : 'Новый тип кабинета',
    fields: [textField('Название типа кабинета', 'name', item?.name),
      featureFields('Стандартное оснащение этого типа', features, item?.features)],
    onSubmit: (values) => editItem(context, 'roomTypes', item, () => ({
      id: item?.id ?? crypto.randomUUID(), name: values.name, features: featureValues(values, features),
    })),
  });
}

function roomEditor(context, item) {
  const { features, roomTypes } = context.planner.plan.config;
  openDialog({
    title: item ? 'Изменить кабинет' : 'Новый кабинет',
    fields: [textField('Кабинет или аудитория', 'name', item?.name),
      gridFields(numberField('Количество мест', 'capacity', item?.capacity, 1, 10000, true),
        optionalSelect('Тип кабинета', 'typeId', names(roomTypes), item?.typeId, 'Любой тип')),
      checkbox('Разрешить совместное занятие нескольких групп', 'jointGroups', item?.jointGroups),
      featureFields('Оснащение кабинета. Укажите 0, если позиция отсутствует', features, item?.features, 0)],
    onSubmit: (values) => editItem(context, 'rooms', item, () => ({
      id: item?.id ?? crypto.randomUUID(), name: values.name, capacity: number(values.capacity),
      typeId: values.typeId || null, jointGroups: isChecked(values, 'jointGroups'), features: featureValues(values, features),
    })),
  });
}

export const quantitySummary = (quantities, features) => {
  const byId = new Map(features.map(({ id, name }) => [id, name]));
  return quantities.map(({ featureId, quantity }) => `${byId.get(featureId)} × ${quantity}`).join(', ') || '—';
};

export function roomPanels(context) {
  const { features, roomTypes, rooms } = context.planner.plan.config;
  const types = new Map(roomTypes.map(({ id, name }) => [id, name]));
  return el('div', { class: 'planner-stack' },
    panel('Кабинеты', 'Количество мест и доступное оснащение учитываются при назначении.',
      rooms.length ? resourceTable(['Кабинет', 'Тип', 'Места', 'Оснащение', 'Действия'], rooms.map((item) => [
        item.name, types.get(item.typeId) ?? '—', item.capacity, quantitySummary(item.features, features),
        actions(editButton(() => roomEditor(context, item)), editButton(() => removeItem(context, 'rooms', item, item.name), 'Удалить')),
      ])) : null, addButton('Добавить кабинет', () => roomEditor(context))),
    panel('Типы кабинетов', 'Оснащение типа используется по умолчанию. Для отдельного кабинета можно задать своё количество.',
      roomTypes.length ? resourceTable(['Тип', 'Стандартное оснащение', 'Действия'], roomTypes.map((item) => [
        item.name, quantitySummary(item.features, features),
        actions(editButton(() => roomTypeEditor(context, item)),
          editButton(() => removeItem(context, 'roomTypes', item, item.name), 'Удалить')),
      ])) : null, addButton('Добавить тип', () => roomTypeEditor(context))),
    dictionaryPanel(context, 'features', 'Виды оснащения', 'оснащение', null, 'Добавить оснащение'));
}
