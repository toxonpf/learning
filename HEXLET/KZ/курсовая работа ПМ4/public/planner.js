import { button, confirmAction, el, empty, field, openDialog, pageHeader, select } from './dom.js';
import { addDays, dateInput, weekOf } from './format.js';
import { calendarPanels, roomPanels } from './planner-resources.js';
import { participantPanels, studyPanels } from './planner-study.js';
import { copyName, dateField, gridFields, panel, rangeTitle, saveChanges, textField } from './planner-controls.js';
import { weekControl, weekGrid } from './schedule.js';

const sections = [
  ['calendar', 'Календарь', calendarPanels],
  ['rooms', 'Кабинеты', roomPanels],
  ['participants', 'Участники', participantPanels],
  ['study', 'Учебный план', studyPanels],
  ['draft', 'Черновик', draftPanel],
];

let activeSection = 'calendar';

function editPeriod(context, plan, copy) {
  const start = (plan ?? copy)?.startsOn ?? weekOf(context.day).from;
  openDialog({
    title: plan ? 'Изменить учебный период' : copy ? 'Дублировать учебный период' : 'Новый учебный период',
    json: !plan,
    description: 'Диапазон дат, на который нужно составить расписание. Длина периода — до 185 дней.',
    fields: [
      textField('Название учебного периода', 'name', plan?.name ?? copyName(copy?.name), 120, { placeholder: 'Например, Осенний семестр' }),
      gridFields(dateField('Начало периода', 'startsOn', start),
        dateField('Конец периода', 'endsOn', (plan ?? copy)?.endsOn ?? addDays(start, 13))),
    ],
    submitLabel: plan ? 'Сохранить' : 'Создать период',
    onSubmit: (values) => {
      if (plan) return saveChanges(context, (data) => Object.assign(data, values));
      return context.mutate('/schedule/plans', 'POST', { ...values, ...(copy && { sourceId: copy.id }) }, 'Учебный период создан', {
        beforeRefresh: (created) => {
          activeSection = 'calendar';
          context.selectPlan(created.id, false);
        },
      });
    },
  });
}

function publication(plan) {
  if (!plan.publishedAt) return 'Черновик';
  if (plan.publishedRevision !== plan.revision ||
    (plan.draft?.state === 'feasible' && plan.publishedDraftId !== plan.draft.id)) return 'Опубликована предыдущая версия';
  return 'Опубликовано';
}

function generateControl(context) {
  const { plan } = context.planner;
  const error = el('p', { class: 'form-error planner-generate-error', role: 'alert', hidden: true });
  const trigger = button('Сгенерировать', async () => {
    error.hidden = true;
    trigger.disabled = true;
    const original = trigger.lastChild.textContent;
    trigger.lastChild.textContent = 'Генерация…';
    try {
      await context.mutate(`/schedule/plans/${plan.id}/generate`, 'POST', { revision: plan.revision },
        (result) => result.state === 'feasible' ? 'Черновик готов' : 'Проверьте результат генерации', {
          beforeRefresh: () => { activeSection = 'draft'; },
        });
    } catch (problem) {
      error.textContent = problem.message;
      error.hidden = false;
    } finally {
      trigger.disabled = false;
      trigger.lastChild.textContent = original;
    }
  }, { variant: 'primary', glyph: 'calendar', disabled: !plan.config.requirements.length });
  return el('div', { class: 'planner-generate' }, trigger, error);
}

function processPublication(context, publish) {
  const { plan } = context.planner;
  openDialog({
    title: publish ? 'Опубликовать расписание?' : 'Снять расписание с публикации?',
    description: publish ? 'Студенты и преподаватели увидят назначенные им занятия.' :
      'Этот период исчезнет из расписаний студентов и преподавателей. Черновик сохранится.',
    submitLabel: publish ? 'Опубликовать' : 'Снять с публикации',
    confirmation: publish ? null : plan.name,
    onSubmit: () => context.mutate(`/schedule/plans/${plan.id}/${publish ? 'publish' : 'unpublish'}`, 'POST',
      { revision: plan.revision, ...(publish && { draftId: plan.draft.id }) },
      publish ? 'Расписание опубликовано' : 'Публикация снята'),
  });
}

const outcome = {
  invalid: ['Проверьте исходные данные', 'Для запуска нужно заполнить учебный план'],
  infeasible: ['Расписание не удалось составить', 'Ограничения не позволяют разместить все занятия'],
  limit: ['Поиск завершился по лимиту', 'Допустимое расписание пока не найдено'],
};

function draftPanel(context) {
  const { plan } = context.planner;
  const { draft } = plan;
  const published = !!plan.publishedAt;
  const canPublish = draft?.state === 'feasible' && plan.publishedDraftId !== draft.id;
  const controls = el('div', { class: 'planner-draft-actions' },
    published && button('Смотреть опубликованное', () => context.openSchedule(dateInput(plan.publishedStartsOn))),
    published && button('Снять публикацию', () => processPublication(context, false), { variant: 'quiet' }),
    canPublish && button('Опубликовать', () => processPublication(context, true), { variant: 'primary', glyph: 'check' }));
  if (!draft) return panel('Черновик расписания', null,
    empty('Черновик ещё не создан', 'После ввода данных нажмите «Сгенерировать».'), controls);
  if (draft.state !== 'feasible') {
    const [title, description] = outcome[draft.state];
    return panel('Результат генерации', null,
      el('div', { class: 'planner-diagnostics', role: 'status' }, el('h3', {}, title), el('p', {}, description),
        el('ul', {}, draft.diagnostics.map((message) => el('li', {}, message)))), controls);
  }
  let week = weekOf(draft.events[0]?.date ?? plan.startsOn);
  const preview = el('div', { class: 'planner-draft-preview' });
  function show() {
    const events = draft.events.filter(({ date }) => week.from <= date && date <= week.to);
    preview.replaceChildren(el('div', { class: 'planner-preview-tools' },
      weekControl(week, (offset, reset) => {
        week = weekOf(reset ? context.day : week.from, offset);
        show();
      }), el('span', { class: 'muted' }, `Занятий за неделю: ${events.length}`)),
    weekGrid(events, week.from, context.day));
  }
  show();
  return panel(plan.publishedDraftId === draft.id ? 'Опубликованный вариант' : 'Просмотр черновика',
    `Размещено занятий на весь период: ${draft.meetings}`, preview, controls);
}

function periodSummary(context) {
  const { plan, plans } = context.planner;
  const chooser = select('planner-period', plans.map(({ id, name }) => [id, name]), plan.id);
  chooser.addEventListener('change', () => context.selectPlan(chooser.value));
  const status = publication(plan);
  return el('section', { class: 'planner-period-card' },
    el('div', { class: 'planner-period-top' },
      field('Учебный период', chooser),
      el('div', { class: 'planner-period-actions' },
        button('Параметры периода', () => editPeriod(context, plan), { variant: 'quiet' }),
        button('Дублировать', () => editPeriod(context, null, plan), { variant: 'quiet' }),
        !plan.publishedAt && button('Удалить период', () => confirmAction({
          title: 'Удалить учебный период?', code: plan.name, submitLabel: 'Удалить период',
          onSubmit: () => context.mutate(`/schedule/plans/${plan.id}`, 'DELETE', { revision: plan.revision },
            'Период удалён', { beforeRefresh: () => context.selectPlan(null, false) }),
        }), { variant: 'quiet' }), generateControl(context))),
    el('div', { class: 'planner-period-meta' },
      el('span', { class: 'planner-period-date' }, rangeTitle(plan.startsOn, plan.endsOn)),
      el('span', { class: `planner-state ${status === 'Опубликовано' ? 'is-published' : ''}` }, status),
      el('span', { class: 'muted' }, `Строк учебного плана: ${plan.config.requirements.length}`)));
}

export function renderPlanner(context) {
  const { planner } = context;
  const page = pageHeader('Планировщик расписания', 'Учебные периоды, исходные данные и публикация расписания',
    button('Новый период', () => editPeriod(context), { variant: 'primary', glyph: 'plus' }));
  if (!planner || !planner.plan) {
    return el('section', { class: 'page planner-page' }, page,
      el('div', { class: 'panel planner-first' }, planner
        ? empty('Создайте учебный период', 'Затем задайте календарь, добавьте кабинеты, преподавателей и учебный план.')
        : empty('Загрузка планировщика')));
  }
  const current = sections.find(([id]) => id === activeSection);
  const menu = el('nav', { class: 'planner-tabs', 'aria-label': 'Разделы планировщика' },
    sections.map(([id, name]) => el('button', {
      type: 'button', class: `planner-tab ${id === activeSection ? 'is-active' : ''}`,
      'aria-current': id === activeSection ? 'page' : undefined, 'data-focus-key': `planner-${id}`,
      onclick: () => { activeSection = id; context.redraw(); },
    }, name)));
  return el('section', { class: 'page planner-page' }, page, periodSummary(context), menu, current[2](context));
}
