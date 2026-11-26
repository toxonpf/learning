import { button, el, empty, field, input, notify, openDialog, select } from './dom.js';
import { roleLabel } from './format.js';
import { sortable } from './table.js';
import {
  actions, addButton, checklist, checkbox, deleteButton, duplicate, editButton, editItem, featureFields, featureValues, gridFields,
  isChecked, names, number, numberField, optionalSelect, panel, picked, removeItem, resourceTable,
  textField, weekdays, wholeName,
} from './planner-controls.js';
import { dictionaryPanel } from './planner-resources.js';

const groupChoices = (groups) => groups.map(({ id, code, name }) => [id, `${code} · ${name}`]);
const accountChoices = (users) => users.map((user) => [user.id, wholeName(user)]);
const codes = (ids, groups) => ids.map((id) => groups.find((group) => group.id === id)?.code ?? 'Архивная группа').join(', ');

function teacherEditor(context, existing, copy) {
  const item = existing ?? copy;
  const { teachers, groups, plan } = context.planner;
  const disciplines = names(plan.config.disciplines);
  const choices = accountChoices(teachers.filter(({ id }) => !plan.config.teachers.some(({ userId }) => userId === id)));
  const availableGroups = groupChoices(groups);
  const mode = select('groupMode', [['any', 'Все группы'], ['only', 'Только выбранные группы']], item?.groupMode ?? 'any');
  const allowed = checklist('Разрешённые группы', 'allowed-', availableGroups, item?.groupIds);
  const modeChanged = () => { allowed.hidden = mode.value !== 'only'; };
  mode.addEventListener('change', modeChanged);
  modeChanged();
  openDialog({
    title: existing ? 'Изменить назначение преподавателя' : 'Добавить преподавателя',
    json: !existing,
    fields: [
      existing
        ? el('p', {}, teachers.find(({ id }) => id === item.userId)?.name ?? 'Преподаватель')
        : field('Преподаватель', select('userId', [['', 'Выберите аккаунт'], ...choices])),
      checklist('Дисциплины преподавателя', 'discipline-', disciplines, item?.disciplineIds),
      checklist('Дни доступности', 'day-', weekdays, item?.weekdays ?? plan.config.workingDays, { compact: true }),
      gridFields(numberField('Лимит в день, минут', 'maxDailyMinutes', item?.maxDailyMinutes, 1, 1440),
        numberField('Лимит в неделю, минут', 'maxWeeklyMinutes', item?.maxWeeklyMinutes, 1, 10080)),
      field('Может вести занятия', mode), allowed,
    ],
    onSubmit: (values) => {
      const disciplineIds = picked(values, 'discipline-', disciplines);
      const chosenDays = picked(values, 'day-', weekdays).map(Number);
      if (!disciplineIds.length) throw new Error('Выберите хотя бы одну дисциплину');
      if (!chosenDays.length) throw new Error('Выберите хотя бы один день доступности');
      return editItem(context, 'teachers', existing, () => ({
        userId: existing?.userId ?? values.userId, disciplineIds, weekdays: chosenDays,
        maxDailyMinutes: number(values.maxDailyMinutes), maxWeeklyMinutes: number(values.maxWeeklyMinutes),
        groupMode: values.groupMode, groupIds: values.groupMode === 'only' ? picked(values, 'allowed-', availableGroups) : [],
      }), 'userId');
    },
  });
}

function groupEditor(context, existing, copy) {
  const item = existing ?? copy;
  const { groups, plan } = context.planner;
  const options = groupChoices(groups.filter(({ id }) => !plan.config.groups.some(({ groupId }) => groupId === id)));
  const split = item?.split;
  const splitSwitch = checkbox('Группу можно делить на подгруппы', 'splittable', !!split);
  const method = select('method', [['balanced', 'Поровну'], ['percent', 'По процентам']], split?.method ?? 'balanced');
  const ratios = textField('Проценты подгрупп', 'percentages', split?.percentages.join(', ') ?? '', 100,
    { required: false, placeholder: 'Например, 40, 60' });
  const order = select('order', [
    ['lastName', 'По фамилии'], ['firstName', 'По имени'], ['patronymic', 'По отчеству'],
    ['id', 'По идентификатору'], ['random', 'Случайно'],
  ], split?.order ?? 'lastName');
  const seed = textField('Ключ случайного деления', 'seed', split?.seed ?? crypto.randomUUID(), 60);
  const subgroups = el('div', { class: 'planner-dependent' },
    gridFields(numberField('Количество подгрупп', 'count', split?.count ?? 2, 2, 12, true), field('Распределение', method)),
    ratios, field('Порядок студентов', order), seed);
  function syncSplit() {
    subgroups.hidden = !splitSwitch.querySelector('input').checked;
    ratios.hidden = method.value !== 'percent';
    seed.hidden = order.value !== 'random';
    seed.querySelector('input').disabled = subgroups.hidden || seed.hidden;
    subgroups.querySelector('[name="count"]').disabled = subgroups.hidden;
  }
  splitSwitch.addEventListener('change', syncSplit);
  method.addEventListener('change', syncSplit);
  order.addEventListener('change', syncSplit);
  syncSplit();
  const limit = select('unit', [['none', 'Без лимита'], ['lessons', 'Количество занятий'], ['minutes', 'Минуты нагрузки']], item?.dailyLimit?.unit ?? 'none');
  const amount = numberField('Значение дневного лимита', 'value', item?.dailyLimit?.value, 1, 1440, true);
  function syncLimit() {
    amount.hidden = limit.value === 'none';
    amount.querySelector('input').disabled = amount.hidden;
  }
  limit.addEventListener('change', syncLimit);
  syncLimit();
  openDialog({
    title: existing ? 'Изменить настройки группы' : 'Добавить группу в план',
    json: !existing,
    fields: [
      existing
        ? el('p', {}, codes([item.groupId], groups))
        : field('Учебная группа', select('groupId', [['', 'Выберите группу'], ...options])),
      gridFields(numberField('Курс', 'studyYear', item?.studyYear, 1, 20),
        numberField('Предельная численность', 'capacity', item?.capacity, 1, 10000)),
      gridFields(field('Дневной лимит на студента', limit), amount),
      splitSwitch, subgroups,
    ],
    onSubmit: (values) => {
      const percentages = values.method === 'percent' && isChecked(values, 'splittable')
        ? values.percentages.split(',').map((value) => Number(value.trim())) : [];
      if (percentages.length && (percentages.length !== number(values.count) || percentages.some((value) => !Number.isInteger(value) || value < 1))) {
        throw new Error('Укажите целые проценты через запятую для каждой подгруппы');
      }
      return editItem(context, 'groups', existing, () => ({
        groupId: existing?.groupId ?? values.groupId, studyYear: number(values.studyYear), capacity: number(values.capacity),
        dailyLimit: values.unit === 'none' ? null : { unit: values.unit, value: number(values.value) },
        split: isChecked(values, 'splittable') ? {
          count: number(values.count), method: values.method, order: values.order,
          percentages, seed: values.seed || split?.seed || crypto.randomUUID(),
        } : null,
      }), 'groupId');
    },
  });
}

export function participantPanels(context) {
  const { plan, groups, teachers } = context.planner;
  const { config } = plan;
  const disciplineNames = new Map(config.disciplines.map(({ id, name }) => [id, name]));
  const teachersById = new Map(teachers.map((teacher) => [teacher.id, teacher]));
  return el('div', { class: 'planner-stack' },
    panel('Группы учебного периода', 'Состав берётся из учебных групп на дату занятия.',
      config.groups.length ? resourceTable(['Группа', 'Курс', 'Вместимость', 'Подгруппы', 'Действия'], config.groups.map((item) => {
        const code = codes([item.groupId], groups);
        return [code, item.studyYear ?? '—', item.capacity ?? '—', item.split?.count ?? '—',
          actions(editButton(() => groupEditor(context, item)), duplicate(() => groupEditor(context, null, item)),
            deleteButton(() => removeItem(context, 'groups', item, code, 'groupId')))];
      })) : null, addButton('Добавить группу', () => groupEditor(context))),
    panel('Преподаватели учебного периода', 'Выберите дисциплины, дни доступности и лимиты нагрузки.',
      config.teachers.length ? resourceTable(['Преподаватель', 'Дисциплины', 'Назначения', 'Действия'], config.teachers.map((item) => {
        const name = teachersById.get(item.userId) ? wholeName(teachersById.get(item.userId)) : 'Аккаунт недоступен';
        return [name, item.disciplineIds.map((id) => disciplineNames.get(id)).join(', '),
          item.groupMode === 'any' ? 'Все группы' : codes(item.groupIds, groups),
          actions(editButton(() => teacherEditor(context, item)), duplicate(() => teacherEditor(context, null, item)),
            deleteButton(() => removeItem(context, 'teachers', item, name, 'userId')))];
      })) : null, addButton('Добавить преподавателя', () => teacherEditor(context))),
    profilePanel(context));
}

function profilePanel(context) {
  const { groups } = context.planner;
  const rows = el('div', { class: 'planner-profile-list', 'aria-live': 'polite' }, empty('Введите имя или выберите группу'));
  const group = optionalSelect('Фильтр по группе', 'groupId', groupChoices(groups), '', 'Все группы');
  const query = input('query', '', { type: 'search', placeholder: 'Имя, фамилия или почта', 'aria-label': 'Поиск участника' });
  const requestButton = button('Найти участников', null, { type: 'submit', glyph: 'search' });
  let searchId = 0;
  async function search() {
    const id = ++searchId;
    requestButton.disabled = true;
    rows.replaceChildren(empty('Загрузка участников'));
    try {
      const groupId = group.querySelector('select').value;
      const queryString = new URLSearchParams({ query: query.value, ...(groupId && { groupId }) });
      const people = await context.api(`/schedule/people?${queryString}`);
      if (id !== searchId) return;
      rows.replaceChildren(people.length
        ? resourceTable(['Аккаунт', 'Роль', 'ФИО для сортировки', 'Действия'], people.map((person) => [
          el('div', { class: 'table-person' }, person.name, el('small', { class: 'muted' }, person.email)),
          roleLabel[person.role], [person.lastName, person.firstName, person.patronymic].filter(Boolean).join(' ') || '—',
          actions(editButton(() => editProfile(context, person, search), 'Редактировать ФИО')),
        ])) : empty('Участники не найдены'));
      if (people.length === 40) rows.append(el('p', { class: 'planner-edge muted' }, 'Первые 40 результатов. Уточните поиск по имени или группе.'));
    } catch (error) {
      if (id === searchId) rows.replaceChildren(empty('Ошибка поиска', error.message));
    } finally {
      if (id === searchId) requestButton.disabled = false;
    }
  }
  const form = el('form', { class: 'planner-profile-form', onsubmit: (event) => { event.preventDefault(); void search(); } },
    field('Поиск участника', query), group, requestButton);
  return panel('ФИО участников', 'Эти поля используются при сортировке студентов для подгрупп.', el('div', {}, form, rows));
}

function editProfile(context, person, refresh) {
  openDialog({
    title: 'ФИО для расписания',
    description: person.name,
    fields: [
      textField('Фамилия', 'lastName', person.lastName ?? '', 80, { required: false }),
      textField('Имя', 'firstName', person.firstName ?? '', 80, { required: false }),
      textField('Отчество', 'patronymic', person.patronymic ?? '', 80, { required: false }),
    ],
    onSubmit: async (values) => {
      const data = Object.fromEntries(Object.entries(values).map(([key, value]) => [key, value.trim() || null]));
      await context.api(`/schedule/people/${person.id}`, 'PATCH', data);
      notify('ФИО сохранено');
      void refresh();
    },
  });
}

function requirementEditor(context, existing, copy) {
  const item = existing ?? copy;
  const { plan, groups, teachers } = context.planner;
  const { config } = plan;
  const allowed = new Set(config.groups.map(({ groupId }) => groupId));
  const groupOptions = groupChoices(groups.filter(({ id }) => allowed.has(id)));
  const discipline = select('disciplineId', [['', 'Выберите дисциплину'], ...names(config.disciplines)], item?.disciplineId ?? '');
  const available = el('div', {});
  function updateTeachers() {
    const eligible = new Set(config.teachers.filter(({ disciplineIds }) => disciplineIds.includes(discipline.value)).map(({ userId }) => userId));
    const options = accountChoices(teachers.filter(({ id }) => eligible.has(id)));
    available.replaceChildren(optionalSelect('Закреплённый преподаватель', 'teacherId', options,
      eligible.has(item?.teacherId) ? item.teacherId : null, 'Назначить автоматически'));
  }
  discipline.addEventListener('change', updateTeachers);
  updateTeachers();
  openDialog({
    title: existing ? 'Изменить строку нагрузки' : 'Новая строка учебного плана',
    json: !existing,
    fields: [
      gridFields(field('Дисциплина', discipline), textField('Вид занятия', 'kind', item?.kind ?? 'Лекция', 48)),
      checklist('Учебные группы', 'group-', groupOptions, item?.groupIds),
      checkbox('Провести отдельно для каждой подгруппы', 'split', item?.split),
      gridFields(numberField('Академических часов всего', 'totalHours', item?.totalHours ?? 2, 1, 1000, true),
        numberField('Академических часов за занятие', 'hoursPerMeeting', item?.hoursPerMeeting ?? 2, 1, 12, true)),
      gridFields(numberField('Фактическая длительность, мин', 'durationMinutes', item?.durationMinutes, 1, 600),
        numberField('Максимум занятий в неделю', 'maxPerWeek', item?.maxPerWeek, 1, 100)),
      optionalSelect('Модуль', 'periodId', names(config.periods), item?.periodId, 'Весь учебный период'),
      available,
      optionalSelect('Требуемый тип кабинета', 'roomTypeId', names(config.roomTypes), item?.roomTypeId, 'Любой тип'),
      featureFields('Требуемое количество оборудования', config.features, item?.features),
    ],
    onSubmit: (values) => {
      const groupIds = picked(values, 'group-', groupOptions);
      if (!groupIds.length) throw new Error('Выберите учебную группу');
      if (groupIds.length > 4) throw new Error('Для одного занятия можно выбрать до четырёх групп');
      return editItem(context, 'requirements', existing, () => ({
        id: existing?.id ?? crypto.randomUUID(), disciplineId: values.disciplineId, kind: values.kind, groupIds,
        split: isChecked(values, 'split'), periodId: values.periodId || null,
        totalHours: number(values.totalHours), hoursPerMeeting: number(values.hoursPerMeeting),
        durationMinutes: number(values.durationMinutes), maxPerWeek: number(values.maxPerWeek),
        teacherId: values.teacherId || null, roomTypeId: values.roomTypeId || null, features: featureValues(values, config.features),
      }));
    },
  });
}

export function studyPanels(context) {
  const { plan, groups } = context.planner;
  const { config } = plan;
  const disciplines = new Map(config.disciplines.map(({ id, name }) => [id, name]));
  return el('div', { class: 'planner-stack' },
    dictionaryPanel(context, 'disciplines', 'Дисциплины', 'дисциплину', null, 'Добавить дисциплину'),
    panel('Учебная нагрузка', 'Для каждой группы и дисциплины задайте вид занятий, объём и условия проведения.',
      config.requirements.length ? resourceTable(['Дисциплина', 'Группы', 'Объём', 'Действия'], config.requirements.map((item) => {
        const subject = disciplines.get(item.disciplineId) ?? 'Дисциплина удалена';
        return [el('div', { class: 'table-person' }, subject, el('small', { class: 'muted' }, item.kind)),
          codes(item.groupIds, groups) + (item.split ? ' · по подгруппам' : ''),
          sortable(`${item.totalHours} ак. ч. · по ${item.hoursPerMeeting} ак. ч.`, item.totalHours),
          actions(editButton(() => requirementEditor(context, item)), duplicate(() => requirementEditor(context, null, item)),
            deleteButton(() => removeItem(context, 'requirements', item, subject)))];
      })) : null, addButton('Добавить строку плана', () => requirementEditor(context))));
}
