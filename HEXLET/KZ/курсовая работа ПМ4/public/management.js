import { button, el, empty, field, input, mark, openDialog, pageHeader, select } from './dom.js';
import { activeAt, dateInput, displayDate, roleLabel } from './format.js';

function dataTable(headers, rows) {
  return el('div', { class: 'management-scroll' }, el('table', { class: 'data-table' },
    el('thead', {}, el('tr', {}, headers.map((label) => el('th', { scope: 'col' }, label)))),
    el('tbody', {}, rows.map((row) => el('tr', {}, row.map((cell, index) =>
      el(index === 0 ? 'th' : 'td', index === 0 ? { scope: 'row' } : {}, cell)))))));
}

function toggle(name, label, checked) {
  return el('label', { class: 'toggle' }, input(name, 'yes', { type: 'checkbox', checked }), el('span', {}, label));
}

function groupEditor(context, group) {
  const { mutate, selectManageGroup } = context;
  openDialog({
    title: group ? 'Редактировать группу' : 'Новая группа',
    fields: [
      field('Код группы', input('code', group?.code, { placeholder: 'Например, ПО-24/1', required: true, maxlength: 32 })),
      field('Название программы', input('name', group?.name, { placeholder: 'Например, Программное обеспечение', required: true, maxlength: 120 })),
      group && toggle('archived', 'Переместить группу в архив', group.archived),
    ],
    submitLabel: group ? 'Сохранить' : 'Создать группу',
    onSubmit: ({ code, name, archived }) => group
      ? mutate(`/groups/${group.id}`, 'PATCH', { code, name, archived: archived === 'yes' }, 'Группа обновлена')
      : mutate('/groups', 'POST', { code, name }, 'Группа создана', {
        beforeRefresh: (created) => selectManageGroup(created.id, false),
      }),
  });
}

export function renderGroups(context) {
  const { groups, members, manageGroupId, selectManageGroup, openJournal, day } = context;
  const group = groups.find(({ id }) => id === manageGroupId);
  const groupRows = groups.map((item) => [
    el('span', { class: 'inline-code' }, item.code), item.name,
    el('span', { class: item.archived ? 'muted' : 'row-active' }, item.archived ? 'В архиве' : 'Действует'),
    el('div', { class: 'row-actions' },
      button('Состав', () => selectManageGroup(item.id), { variant: item.id === manageGroupId ? 'selected' : '' }),
      button('Изменить', () => groupEditor(context, item), { variant: 'quiet' })),
  ]);

  const assignments = group && el('section', { class: 'panel' },
    el('div', { class: 'panel-heading' }, el('div', {},
      el('h2', {}, `Состав группы ${group.code}`),
      el('p', { class: 'muted' }, 'Дата выхода — первый день вне группы')),
    el('div', { class: 'row-actions' },
      button('Открыть журнал', () => openJournal(group.id), { variant: 'quiet' }),
      !group.archived && button('Добавить участника', () => memberEditor(context, group), { glyph: 'plus' }))),
    members?.length ? dataTable(['Участник', 'Роль', 'Период', 'Состояние', 'Действия'],
      members.map((member) => [
        el('div', { class: 'table-person' }, member.user.name, el('small', { class: 'muted' }, member.user.email)),
        roleLabel[member.user.role],
        `${displayDate(member.joinedOn)} — ${member.leftOn ? displayDate(member.leftOn) : 'по настоящее время'}`,
        activeAt(member, day) ? 'В группе' : dateInput(member.joinedOn) > day ? 'Ожидает вступления' : 'Выбыл',
        button('Изменить период', () => memberEditor(context, group, member), { variant: 'quiet' }),
      ])) : empty(members ? 'Участников пока нет' : 'Загрузка состава',
      members && 'Добавьте зарегистрированных студентов и преподавателей'));

  return el('section', { class: 'page management-page' },
    pageHeader('Учебные группы', 'Состав групп и назначение преподавателей',
      button('Новая группа', () => groupEditor(context), { glyph: 'plus', variant: 'primary' })),
    el('section', { class: 'panel' }, groups.length ?
      dataTable(['Код группы', 'Программа', 'Состояние', 'Действия'], groupRows) :
      empty('Учебных групп пока нет', 'Создайте группу, чтобы открыть для неё журнал')),
    assignments);
}

function memberEditor({ api, day, mutate }, group, member) {
  const leftOn = field('Дата выхода', input('leftOn', dateInput(member?.leftOn), { type: 'date' }),
    'Первый день вне группы. Можно оставить пустым');
  if (member) {
    openDialog({
      title: 'Изменить период участия',
      description: `${member.user.name} · вступление ${displayDate(member.joinedOn)}`,
      fields: [leftOn],
      onSubmit: (values) => mutate(`/groups/${group.id}/members/${member.id}`, 'PATCH',
        { leftOn: values.leftOn || null }, 'Период обновлён'),
    });
    return;
  }

  const lookup = input('lookup', '', { type: 'search', placeholder: 'Имя или почта', 'aria-label': 'Имя или почта', maxlength: 120 });
  const feedback = el('small', { class: 'muted', role: 'status' }, 'Ищите среди зарегистрированных аккаунтов');
  const account = select('userId', [['', 'Выберите аккаунт']]);
  let searchId = 0;
  async function search() {
    const request = ++searchId;
    feedback.textContent = 'Поиск…';
    try {
      const people = await api(`/users?${new URLSearchParams({ q: lookup.value })}`);
      if (request !== searchId || !account.isConnected) return;
      account.replaceChildren(el('option', { value: '' }, people.length ? 'Выберите аккаунт' : 'Аккаунты не найдены'),
        ...people.map(({ id, name, email, role }) => el('option', { value: id }, `${name} · ${email} · ${roleLabel[role]}`)));
      feedback.textContent = people.length === 30 ? 'Показаны первые 30 аккаунтов. Уточните запрос' : `Найдено: ${people.length}`;
    } catch (error) {
      if (request === searchId) feedback.textContent = error.message;
    }
  }
  lookup.addEventListener('keydown', (event) => {
    if (event.key === 'Enter') {
      event.preventDefault();
      void search();
    }
  });
  openDialog({
    title: 'Добавить участника',
    description: group.code,
    fields: [
      el('div', { class: 'search-line' }, lookup, button('Найти', search, { glyph: 'search' })),
      feedback,
      field('Аккаунт', account),
      field('Дата вступления', input('joinedOn', day, { type: 'date', required: true })),
      leftOn,
    ],
    submitLabel: 'Добавить',
    onSubmit: (values) => mutate(`/groups/${group.id}/members`, 'POST',
      { userId: values.userId, joinedOn: values.joinedOn, leftOn: values.leftOn || null }, 'Участник добавлен'),
  });
  void search();
}

function statusEditor(context, status) {
  const { mutate } = context;
  const name = input('name', status?.name, { required: true, maxlength: 60, placeholder: 'Например, Дистанционно' });
  const code = input('code', status?.code, { required: true, maxlength: 6, placeholder: 'Д' });
  const color = input('color', status?.color ?? '#24735a', { type: 'color', required: true });
  const preview = mark({ name: 'Образец', code: status?.code ?? 'Д', color: color.value }, { large: true });
  const renderPreview = () => {
    preview.textContent = code.value.trim().toUpperCase() || 'Д';
    preview.style.setProperty('--mark-ink', color.value);
  };
  color.addEventListener('input', renderPreview);
  code.addEventListener('input', renderPreview);
  openDialog({
    title: status ? 'Редактировать статус' : 'Новый статус',
    fields: [
      field('Название', name),
      el('div', { class: 'status-fields' },
        field('Код в журнале', code, 'До 6 букв, цифр или знаков + и -'),
        field('Цвет', color),
        el('div', { class: 'field' }, el('span', {}, 'В журнале'), preview)),
      toggle('countsAsPresent', 'Считать как присутствие', status?.countsAsPresent),
      status && toggle('archived', 'Переместить в архив', status.archived),
      status && el('small', { class: 'muted' }, 'Ранее сохранённые отметки используют это название, код и цвет'),
    ],
    submitLabel: status ? 'Сохранить' : 'Создать статус',
    onSubmit: (values) => {
      const { name, code, color, countsAsPresent, archived } = values;
      const body = { name, code, color, countsAsPresent: countsAsPresent === 'yes' };
      if (status) body.archived = archived === 'yes';
      return mutate(status ? `/statuses/${status.id}` : '/statuses', status ? 'PATCH' : 'POST', body,
        status ? 'Статус обновлён' : 'Статус создан');
    },
  });
}

export function renderStatuses(context) {
  const { statuses } = context;
  return el('section', { class: 'page management-page' },
    pageHeader('Статусы посещаемости', 'Настройте отметки, которые преподаватели используют в журналах',
      button('Новый статус', () => statusEditor(context), { variant: 'primary', glyph: 'plus' })),
    el('section', { class: 'panel' }, statuses?.length ?
      dataTable(['Название', 'В журнале', 'Учитывать как присутствие', 'Состояние', 'Действия'],
        statuses.map((status) => [
          status.name, mark(status, { large: true }), status.countsAsPresent ? 'Да' : 'Нет',
          status.archived ? 'В архиве' : el('span', { class: 'row-active' }, 'Действует'),
          button('Изменить', () => statusEditor(context, status), { variant: 'quiet' }),
        ])) : empty(statuses ? 'Статусов пока нет' : 'Загрузка статусов')));
}

export function renderUsers(context) {
  const { users, searchTerm, findUsers, mutate } = context;
  const search = el('form', {
    class: 'search-line',
    onsubmit: (event) => {
      event.preventDefault();
      void findUsers(new FormData(event.currentTarget).get('q'));
    },
  }, input('q', searchTerm, { type: 'search', placeholder: 'Имя или почта', 'aria-label': 'Поиск по имени или почте', maxlength: 120 }),
  button('Найти', null, { glyph: 'search', type: 'submit' }));

  return el('section', { class: 'page management-page' },
    pageHeader('Пользователи', 'Назначайте роль преподавателя перед добавлением аккаунта в группу'),
    el('section', { class: 'panel' },
      el('div', { class: 'panel-heading' }, search,
        users?.length === 30 && el('small', { class: 'muted' }, 'Первые 30 аккаунтов')),
      users?.length ? dataTable(['Имя', 'Электронная почта', 'Роль', 'Действия'], users.map((person) => [
        person.name, person.email, roleLabel[person.role],
        button('Изменить роль', () => openDialog({
          title: 'Изменить роль',
          description: person.name,
          fields: [field('Роль', select('role', [['user', 'Студент'], ['teacher', 'Преподаватель']], person.role),
            'Роль можно изменить до добавления в первую группу')],
          onSubmit: (body) => mutate(`/users/${person.id}/role`, 'PATCH', body, 'Роль обновлена'),
        }), { variant: 'quiet' }),
      ])) : empty(users ? 'Пользователи не найдены' : 'Загрузка пользователей',
        users && 'Аккаунты появляются после регистрации')));
}
