import { button, el, empty, field, icon, input, mark, openDialog, pageHeader, select } from './dom.js';
import { activeAt, columnDate, dateInput, dayLabel, displayDate, initials, weekTitle } from './format.js';

function roster(members) {
  const rows = new Map();
  for (const member of members) {
    const row = rows.get(member.user.id) ?? { person: member.user, memberships: [] };
    row.memberships.push(member);
    rows.set(member.user.id, row);
  }
  return [...rows.values()];
}

function makeGrid({ members, lessons, statuses, marks }) {
  const recorded = new Map(marks.map((item) => [`${item.lessonId}/${item.membershipId}`, item]));
  const statusMap = new Map(statuses.map((item) => [item.id, item]));
  const rows = roster(members).map(({ person, memberships }) => ({
    person,
    cells: lessons.map((lesson) => {
      const member = memberships.find((item) => activeAt(item, dateInput(lesson.date)));
      const value = member && recorded.get(`${lesson.id}/${member.id}`);
      return { lesson, member, value, status: statusMap.get(value?.statusId) };
    }),
  }));
  const cells = rows.flatMap((row) => row.cells);
  return {
    rows,
    eligible: cells.filter((cell) => cell.member).length,
    recorded: cells.filter((cell) => cell.value).length,
    present: cells.filter((cell) => cell.status?.countsAsPresent).length,
  };
}

const stat = (label, value, detail) => el('div', { class: 'stat' },
  el('span', { class: 'stat-label' }, label),
  el('span', { class: 'stat-number' }, value, detail && el('small', {}, detail)));

export function renderJournal(context) {
  const { journal, groups, groupId, week, user, loadJournal, goTo } = context;
  const staff = user.role !== 'user';
  const group = journal?.group ?? groups.find((item) => item.id === groupId);
  const canWrite = staff && group && !group.archived;
  const add = canWrite && button('Добавить занятие', () => editLesson(context, group), { glyph: 'plus', variant: 'primary' });
  const title = pageHeader('Посещаемость', 'Журналы учебных групп', add);

  if (!group) return el('section', { class: 'page' }, title, el('div', { class: 'panel' },
    user.role === 'admin'
      ? empty('Создайте первую группу', 'Затем добавьте студентов и назначьте преподавателей',
        button('Открыть группы', () => goTo('groups'), { variant: 'primary', glyph: 'groups' }))
      : empty('У вас пока нет групп', 'Журнал появится, когда администратор добавит вас в учебную группу')));

  const options = el('div', { class: 'period' },
    button('Предыдущая неделя', () => loadJournal(-1), { glyph: 'left', iconOnly: true }),
    el('span', { class: 'period-label' }, icon('calendar'), weekTitle(week)),
    button('Следующая неделя', () => loadJournal(1), { glyph: 'right', iconOnly: true }),
    button('Текущая неделя', () => loadJournal(0, true), { variant: 'quiet current-week' }));
  if (!journal) return el('section', { class: 'page' }, title, el('div', { class: 'toolbar' }, options),
    el('div', { class: 'panel' }, empty('Загрузка журнала')));

  const grid = makeGrid(journal);
  const teacherNames = journal.teachers.map(({ name }) => name).join(', ');
  const groupLine = el('div', { class: 'group-heading' },
    el('div', { class: 'group-code' }, group.code),
    el('div', {}, el('h2', {}, group.name),
      el('p', { class: 'muted' }, teacherNames || 'Преподаватель не назначен', group.archived && ' · Архив')));
  const summary = el('div', { class: 'stats', 'aria-label': 'Сводка за неделю' },
    staff && stat('Студентов', grid.rows.length),
    stat('Занятий', journal.lessons.length),
    stat('Отметок', grid.recorded, grid.eligible ? `из ${grid.eligible}` : null),
    stat('Присутствие', grid.recorded ? `${Math.round(100 * grid.present / grid.recorded)}%` : '—',
      grid.recorded ? 'по отметкам' : null));
  const table = journal.lessons.length && grid.rows.length
    ? journalTable(context, grid.rows, canWrite)
    : empty(journal.lessons.length ? 'В журнале пока нет студентов' : 'На этой неделе нет занятий',
      journal.lessons.length ? 'Студент появится в журнале с даты вступления в группу' : 'Выберите другую неделю или добавьте занятие',
      !journal.lessons.length && canWrite && addLessonButton(context, group));
  const visibleStatuses = journal.statuses.filter((item) => !item.archived || journal.marks.some((entry) => entry.statusId === item.id));
  const legend = el('div', { class: 'legend', 'aria-label': 'Обозначения' },
    visibleStatuses.map((status) => el('span', {}, mark(status), status.name)),
    el('span', {}, el('span', { class: 'unmarked-sign', 'aria-hidden': 'true' }, '·'), 'Нет отметки'));

  return el('section', { class: 'page' }, title,
    el('div', { class: 'toolbar' }, groupLine, options), summary,
    el('section', { class: 'panel journal-panel', 'aria-label': 'Журнал группы' },
      el('div', { class: 'panel-heading' }, el('h2', {}, 'Журнал группы'),
        el('span', { class: 'muted' }, group.code)), table, legend));
}

function addLessonButton(context, group) {
  return button('Добавить занятие', () => editLesson(context, group), { glyph: 'plus', variant: 'primary' });
}

function journalTable(context, rows, canWrite) {
  const { journal, day } = context;
  const groupedDates = [];
  journal.lessons.forEach((lesson) => {
    const key = dateInput(lesson.date);
    const previous = groupedDates.at(-1);
    if (previous?.key === key) previous.count += 1;
    else groupedDates.push({ key, count: 1 });
  });
  const dates = groupedDates.map(({ key, count }) => el('th', {
    class: `day-heading ${key === day ? 'is-today' : ''}`, scope: 'colgroup', colspan: count,
  }, el('span', { class: 'day-short' }, dayLabel(key)), displayDate(key).split(' ').slice(0, 2).join(' ')));
  const lessonHeaders = journal.lessons.map((lesson, index) => {
    const newDay = dateInput(lesson.date) !== dateInput(journal.lessons[index - 1]?.date);
    const info = [el('span', { class: 'lesson-time' }, lesson.startTime), el('span', { class: 'lesson-title', title: lesson.title }, lesson.title)];
    const content = canWrite
      ? el('button', {
        class: 'lesson-button',
        type: 'button',
        'data-focus-key': `lesson-${lesson.id}`,
        'aria-label': `${lesson.title}, ${columnDate(lesson.date)}, ${lesson.startTime}. Действия занятия`,
        onclick: () => lessonActions(context, journal.group, lesson),
      }, info, icon('more'))
      : el('div', { class: 'lesson-button' }, info);
    return el('th', { scope: 'col', class: newDay ? 'day-start' : '' }, content);
  });
  const head = el('thead', {},
    el('tr', {}, el('th', { rowspan: 2, scope: 'col', class: 'sticky-student' }, 'Студент'), dates,
      el('th', { rowspan: 2, scope: 'col', class: 'row-total' }, 'Отмечено')),
    el('tr', {}, lessonHeaders));

  const body = el('tbody', {}, rows.map(({ person, cells }) => {
    const taken = cells.filter((cell) => cell.value).length;
    const possible = cells.filter((cell) => cell.member).length;
    return el('tr', {},
      el('th', { scope: 'row', class: 'sticky-student' }, el('span', { class: 'person' },
        el('span', { class: 'avatar', 'aria-hidden': 'true' }, initials(person.name)), el('span', {}, person.name))),
      cells.map((cell, index) => {
        const dayStart = dateInput(cell.lesson.date) !== dateInput(cells[index - 1]?.lesson.date);
        return el('td', { class: `journal-cell ${dayStart ? 'day-start' : ''}` }, cellView(context, person, cell, canWrite));
      }),
      el('td', { class: 'row-total' }, el('span', { class: 'text-number' }, taken), el('span', { class: 'muted' }, ` / ${possible}`)));
  }));
  return el('div', { class: 'journal-scroll', tabindex: '0', role: 'region', 'aria-label': 'Таблица посещаемости' },
    el('table', { class: 'journal-table' }, head, body));
}

function cellView(context, person, cell, canWrite) {
  const { member, status, lesson, value } = cell;
  if (!member) return el('span', { class: 'unmarked-sign', title: 'Студент не состоял в группе' }, '—');
  const badge = status ? mark(status) : el('span', { class: 'unmarked-sign', 'aria-hidden': 'true' }, '·');
  if (!canWrite && !status) return el('span', { class: 'cell-static', 'aria-label': 'Нет отметки' }, badge);
  const label = `${person.name}, ${lesson.title}, ${columnDate(lesson.date)}, ${lesson.startTime}: ${status?.name ?? 'нет отметки'}`;
  return el('button', { class: 'cell-button', type: 'button', title: label, 'aria-label': label,
    'data-focus-key': `mark-${lesson.id}-${person.id}`,
    onclick: () => editMark(context, person, cell, canWrite),
  }, badge, value?.note && el('span', { class: 'note-indicator', 'aria-label': 'Есть примечание' }));
}

function editMark({ journal, mutate }, person, { lesson, value, status }, canWrite) {
  const description = `${lesson.title} · ${displayDate(lesson.date)} · ${lesson.startTime}`;
  if (!canWrite) {
    openDialog({ title: person.name, description, fields: [
      el('div', { class: 'status-detail' }, mark(status, { large: true }), status.name),
      value.note && el('p', { class: 'note-text' }, value.note),
    ] });
    return;
  }
  const available = journal.statuses.filter((item) => !item.archived || item.id === status?.id);
  if (!available.length) {
    openDialog({ title: 'Нет активных статусов', description: 'Администратор может добавить статус в настройках журнала' });
    return;
  }
  openDialog({
    title: person.name,
    description,
    fields: [
      field('Статус', select('statusId', [['', 'Выберите статус'], ...available.map((item) => [item.id, item.name])], status?.id)),
      field('Примечание', el('textarea', { name: 'note', rows: 3, maxlength: 500 }, value?.note ?? '')),
    ],
    onSubmit: ({ statusId, note }) => value
      ? mutate(`/attendance/${value.id}`, 'PATCH', { statusId, note }, 'Отметка обновлена')
      : mutate('/attendance', 'POST', { lessonId: lesson.id, studentId: person.id, statusId, note }, 'Отметка сохранена'),
    onDelete: value && (() => mutate(`/attendance/${value.id}`, 'DELETE', null, 'Отметка удалена')),
    deleteLabel: 'Убрать отметку',
  });
}

function editLesson({ day, week, mutate, jumpToWeek }, group, existing) {
  const date = day >= week.from && day <= week.to ? day : week.from;
  openDialog({
    title: existing ? 'Редактировать занятие' : 'Добавить занятие',
    description: existing ? `${group.code} · ${displayDate(existing.date)}` : group.code,
    fields: [
      field('Название занятия', input('title', existing?.title, { placeholder: 'Например, Базы данных', required: true, maxlength: 120 })),
      !existing && field('Дата занятия', input('date', date, { type: 'date', required: true })),
      field('Время начала', input('startTime', existing?.startTime ?? '09:00', { type: 'time', required: true })),
    ],
    submitLabel: existing ? 'Сохранить' : 'Добавить занятие',
    onSubmit: async (values) => {
      if (existing) return mutate(`/lessons/${existing.id}`, 'PATCH', values, 'Занятие обновлено');
      await mutate(`/groups/${group.id}/lessons`, 'POST', values, 'Занятие добавлено', {
        beforeRefresh: () => jumpToWeek(values.date),
      });
    },
  });
}

function lessonActions(context, group, lesson) {
  const { journal, mutate } = context;
  const dialog = document.getElementById('dialog');
  const switchTo = (action) => {
    dialog.close();
    action();
  };
  const activeStatuses = journal.statuses.filter((status) => !status.archived);
  const hasMarks = journal.marks.some((item) => item.lessonId === lesson.id);
  openDialog({
    title: lesson.title,
    description: `${displayDate(lesson.date)} · ${lesson.startTime}`,
    fields: el('div', { class: 'dialog-menu' },
      button('Редактировать занятие', () => switchTo(() => editLesson(context, group, lesson))),
      button('Заполнить пустые отметки', () => switchTo(() => fillLesson(context, lesson, activeStatuses)), { disabled: !activeStatuses.length }),
      button('Удалить занятие', () => switchTo(() => openDialog({
        title: 'Удалить занятие?',
        description: lesson.title,
        submitLabel: 'Удалить',
        onSubmit: () => mutate(`/lessons/${lesson.id}`, 'DELETE', null, 'Занятие удалено'),
      })), { variant: 'danger', disabled: hasMarks }),
      hasMarks && el('small', { class: 'muted' }, 'Удалить занятие можно после удаления всех отметок')),
  });
}

function fillLesson({ mutate }, lesson, statuses) {
  openDialog({
    title: 'Заполнить пустые отметки',
    description: 'Уже внесённые отметки сохранятся',
    fields: [field('Статус для пустых ячеек', select('statusId', [['', 'Выберите статус'],
      ...statuses.map(({ id, name }) => [id, name])]))],
    submitLabel: 'Заполнить',
    onSubmit: (body) => mutate(`/lessons/${lesson.id}/fill`, 'POST', body, ({ count }) => `Добавлено отметок: ${count}`),
  });
}
