import { actionMenu, button, confirmAction, el, empty, field, input, mark, openDialog, pageHeader, select } from './dom.js';
import { activeAt, dateInput, displayDate, roleLabel } from './format.js';
import { sortable, sortableTable as dataTable } from './table.js';
import { datePicker } from './pickers.js';

function toggle(name, label, checked) {
  return el('label', { class: 'toggle' }, input(name, 'yes', { type: 'checkbox', checked }), el('span', {}, label));
}

function groupEditor(context, group, copy) {
  const { mutate, selectManageGroup } = context;
  openDialog({
    title: group ? 'Редактировать группу' : copy ? 'Дублировать группу' : 'Новая группа',
    json: !group,
    fields: [
      field('Код группы', input('code', group?.code ?? (copy && `${copy.code.slice(0, 26)}-КОПИЯ`), { placeholder: 'Например, ПО-24/1', required: true, maxlength: 32 })),
      field('Название программы', input('name', group?.name ?? copy?.name, { placeholder: 'Например, Программное обеспечение', required: true, maxlength: 120 })),
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
    actionMenu(`Действия группы ${item.code}`, [
      button('Состав', () => selectManageGroup(item.id), { glyph: 'users', variant: item.id === manageGroupId ? 'selected' : '' }),
      button('Изменить', () => groupEditor(context, item), { glyph: 'edit' }),
      button('Дублировать', () => groupEditor(context, null, item), { glyph: 'copy' }),
    ], `group-actions-${item.id}`),
  ]);

  const roster = el('div', {});
  const history = input('showHistory', 'yes', { type: 'checkbox', onchange: () => showRoster() });
  function showRoster() {
    const visible = members?.filter((item) => history.checked || !item.leftOn || dateInput(item.leftOn) > day);
    roster.replaceChildren(visible?.length ? dataTable(['Участник', 'Роль', 'Период', 'Состояние', 'Действия'],
      visible.map((member) => [
        sortable(el('div', { class: 'table-person' }, member.user.name,
          el('small', { class: 'muted' }, member.user.deletedAt ? 'Аккаунт удалён' : member.user.email)), member.user.name),
        roleLabel[member.user.role],
        sortable(`${displayDate(member.joinedOn)} — ${member.leftOn ? displayDate(member.leftOn) : 'по настоящее время'}`, dateInput(member.joinedOn)),
        activeAt(member, day) ? member.leftOn ? `До ${displayDate(member.leftOn)}` : 'В группе'
          : dateInput(member.joinedOn) > day ? 'Ожидает вступления' : 'Выбыл',
        !member.user.deletedAt && actionMenu(`Действия участника ${member.user.name}`, [
          button('Изменить период', () => memberEditor(context, group, member), { glyph: 'edit' }),
          (!member.leftOn || dateInput(member.leftOn) > day) && button('Удалить из группы', () => confirmAction({
            title: 'Удалить участника из группы?',
            description: `${member.user.name} · ${group.code}. Отметки сохранятся. Если уже есть отметка за сегодня, выход будет оформлен со следующего дня.`,
            code: group.code, submitLabel: 'Удалить из группы',
            onSubmit: () => context.mutate(`/groups/${group.id}/members/${member.id}`, 'DELETE', null,
              (result) => result.leftOn && dateInput(result.leftOn) > day
                ? `Выход оформлен с ${displayDate(result.leftOn)}` : 'Участник удалён из текущего состава'),
          }), { glyph: 'trash', variant: 'danger' }),
        ], `member-actions-${member.id}`),
      ])) : empty(members ? 'Участников пока нет' : 'Загрузка состава',
      members && 'Добавьте зарегистрированных студентов и преподавателей'));
  }
  if (group) showRoster();
  const assignments = group && el('section', { class: 'panel' },
    el('div', { class: 'panel-heading' }, el('div', {},
      el('h2', {}, `Состав группы ${group.code}`),
      el('p', { class: 'muted' }, 'Дата выхода — первый день вне группы')),
    el('div', { class: 'row-actions' },
      el('label', { class: 'toggle' }, history, 'Показать выбывших'),
      actionMenu('Действия с составом группы', [
        !group.archived && button('Добавить участника', () => memberEditor(context, group), { glyph: 'plus' }),
        button('Открыть журнал', () => openJournal(group.id), { glyph: 'journal' }),
      ], 'roster-actions'))),
    roster);

  return el('section', { class: 'page management-page' },
    pageHeader('Учебные группы', 'Состав групп и назначение преподавателей',
      button('Новая группа', () => groupEditor(context), { glyph: 'plus', variant: 'primary' })),
    el('section', { class: 'panel' }, groups.length ?
      dataTable(['Код группы', 'Программа', 'Состояние', 'Действия'], groupRows) :
      empty('Учебных групп пока нет', 'Создайте группу, чтобы открыть для неё журнал')),
    assignments);
}

function memberEditor({ api, day, mutate }, group, member) {
  const leftOn = datePicker('Дата выхода', 'leftOn', dateInput(member?.leftOn),
    { required: false, currentDay: day, hint: 'Первый день вне группы. Можно оставить пустым' });
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
    json: true,
    description: group.code,
    fields: [
      el('div', { class: 'search-line' }, lookup, button('Найти', search, { glyph: 'search' })),
      feedback,
      field('Аккаунт', account),
      datePicker('Дата вступления', 'joinedOn', day, { currentDay: day }),
      leftOn,
    ],
    submitLabel: 'Добавить',
    onSubmit: (values) => mutate(`/groups/${group.id}/members`, 'POST',
      { userId: values.userId, joinedOn: values.joinedOn, leftOn: values.leftOn || null }, 'Участник добавлен'),
  });
  void search();
}

function statusEditor(context, status, copy) {
  const { mutate } = context;
  const name = input('name', status?.name ?? (copy && `${copy.name.slice(0, 52)} (копия)`), { required: true, maxlength: 60, placeholder: 'Например, Дистанционно' });
  const code = input('code', status?.code, { required: true, maxlength: 6, placeholder: 'Д' });
  const color = input('color', status?.color ?? copy?.color ?? '#24735a', { type: 'color', required: true });
  const preview = mark({ name: 'Образец', code: status?.code ?? 'Д', color: color.value }, { large: true });
  const renderPreview = () => {
    preview.textContent = code.value.trim().toUpperCase() || 'Д';
    preview.style.setProperty('--mark-ink', color.value);
  };
  color.addEventListener('input', renderPreview);
  code.addEventListener('input', renderPreview);
  openDialog({
    title: status ? 'Редактировать статус' : copy ? 'Дублировать статус' : 'Новый статус',
    json: !status,
    fields: [
      field('Название', name),
      el('div', { class: 'status-fields' },
        field('Код в журнале', code, 'До 6 букв, цифр или знаков + и -'),
        field('Цвет', color),
        el('div', { class: 'field' }, el('span', {}, 'В журнале'), preview)),
      toggle('countsAsPresent', 'Считать как присутствие', status?.countsAsPresent ?? copy?.countsAsPresent),
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
          actionMenu(`Действия статуса ${status.name}`, [
            button('Изменить', () => statusEditor(context, status), { glyph: 'edit' }),
            button('Дублировать', () => statusEditor(context, null, status), { glyph: 'copy' }),
          ], `status-actions-${status.id}`),
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
        actionMenu(`Действия пользователя ${person.name}`, [
          button('Изменить роль', () => openDialog({
            title: 'Изменить роль',
            description: person.name,
            fields: [field('Роль', select('role', [['user', 'Студент'], ['teacher', 'Преподаватель']], person.role),
              'Роль можно изменить до добавления в первую группу')],
            onSubmit: (body) => mutate(`/users/${person.id}/role`, 'PATCH', body, 'Роль обновлена'),
          }), { glyph: 'edit' }),
          button('Удалить пользователя', () => confirmAction({
            title: 'Удалить пользователя?',
            description: `${person.name} потеряет доступ к аккаунту. Отметки останутся в журнале.`,
            code: person.email,
            submitLabel: 'Удалить пользователя',
            onSubmit: ({ confirmation }) => mutate(`/users/${person.id}`, 'DELETE', { confirmation }, 'Пользователь удалён'),
          }), { glyph: 'trash', variant: 'danger' }),
        ], `user-actions-${person.id}`),
      ])) : empty(users ? 'Пользователи не найдены' : 'Загрузка пользователей',
        users && 'Аккаунты появляются после регистрации')));
}
