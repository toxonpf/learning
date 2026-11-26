import { button, closeDialogs, el, empty, field, icon, input, notify } from './dom.js';
import { addDays, initials, isDate, roleLabel, today, weekOf } from './format.js';
import { renderJournal } from './journal.js';
import { renderGroups, renderStatuses, renderUsers } from './management.js';
import { renderSchedule } from './schedule.js';
import { plannerTabs, renderPlanner } from './planner.js';
import { creationJson } from './form-json.js';
import { themeControl } from './theme.js';
import { createNavigation } from './navigation.js';

const root = document.getElementById('app');
const storageKey = 'attendance.accessToken';
const defaultTimeZone = 'Asia/Almaty';
const navItems = [
  ['journal', 'Посещаемость', 'journal'],
  ['schedule', 'Расписание', 'calendar'],
  ['planner', 'Планировщик', 'status'],
  ['groups', 'Учебные группы', 'groups'],
  ['users', 'Пользователи', 'users'],
  ['statuses', 'Настройки статусов', 'status'],
];
const viewRenderers = {
  journal: renderJournal, schedule: renderSchedule, planner: renderPlanner,
  groups: renderGroups, users: renderUsers, statuses: renderStatuses,
};

let token = sessionStorage.getItem(storageKey);
let user = null;
let timeZone = defaultTimeZone;
let day = today(timeZone);
let selectedDate = day;
let week = weekOf(day);
let groupId = null;
let manageGroupId = null;
let planId = null;
let plannerTab = 'calendar';
let navigation;
let groups = [];
let view = 'journal';
let content = null;
let searchTerm = '';
let issue = null;
let requestId = 0;
let authMode = 'login';

function setToken(value) {
  token = value;
  if (token) sessionStorage.setItem(storageKey, token);
  else sessionStorage.removeItem(storageKey);
}

async function api(path, method = 'GET', data) {
  const sentToken = token;
  let response;
  try {
    response = await fetch(`/api${path}`, {
      method,
      headers: {
        Accept: 'application/json',
        ...(sentToken && { Authorization: `Bearer ${sentToken}` }),
        ...(data != null && { 'Content-Type': 'application/json' }),
      },
      ...(data != null && { body: JSON.stringify(data) }),
    });
  } catch {
    throw new Error('Не удалось связаться с сервером. Проверьте подключение');
  }
  const body = await response.json();
  if (!response.ok) {
    const message = body.error?.message ?? 'Ошибка запроса';
    if (response.status === 401 && sentToken && sentToken === token) logout(message);
    const error = new Error(message);
    error.status = response.status;
    throw error;
  }
  return body.data;
}

function brand() {
  return el('div', { class: 'brand' }, el('span', { class: 'brand-mark' }, icon('book')),
    el('div', {}, el('strong', {}, 'Журнал'), el('span', {}, 'Колледж Хекслет')));
}

function authIllustration() {
  const rows = [
    ['А. Абдрахманова', 'П', 'П', 'О', ''],
    ['Д. Абрамов', 'П', 'Н', 'П', 'П'],
    ['А. Алтынбек', 'П', 'П', '', 'У'],
    ['Н. Белов', '', 'П', 'П', 'П'],
  ];
  const colors = { П: '#23745b', Н: '#af4644', О: '#976314', У: '#496793' };
  return el('section', { class: 'auth-cover', 'aria-hidden': 'true' },
    el('div', { class: 'cover-heading' }, el('span', {}, 'Учебный журнал'),
      el('p', {}, 'Посещаемость', el('br'), 'учебных групп')),
    el('div', { class: 'cover-grid' }, el('span', { class: 'cover-table-title' }, 'Журнал группы'),
      el('div', { class: 'cover-table' }, rows.map(([name, ...marks]) => el('div', { class: 'cover-row' },
        el('span', { class: 'cover-name' }, name),
        marks.map((code) => {
          const cell = el('span', { class: 'cover-cell' }, code ? el('span', {}, code) : '·');
          if (code) cell.style.setProperty('--color', colors[code]);
          return cell;
        }))))));
}

function renderAuth(message) {
  const registering = authMode === 'register';
  const error = el('p', { class: 'form-error', role: 'alert', hidden: !message }, message);
  const submit = button(registering ? 'Создать аккаунт' : 'Войти', null, { variant: 'primary', type: 'submit' });
  const email = input('email', '', {
    type: 'email', required: true, autocomplete: 'username', placeholder: 'name@example.com', maxlength: 254,
  });
  const form = el('form', {
    class: 'auth-form',
    onsubmit: async (event) => {
      event.preventDefault();
      error.hidden = true;
      submit.disabled = true;
      try {
        const data = Object.fromEntries(new FormData(event.currentTarget));
        const result = await api(`/auth/${authMode}`, 'POST', data);
        setToken(result.accessToken);
        await boot();
      } catch (problem) {
        error.textContent = problem.message;
        error.hidden = false;
      } finally {
        submit.disabled = false;
      }
    },
  }, registering && field('Имя и фамилия', input('name', '', { required: true, autocomplete: 'name', maxlength: 120 })),
  field('Электронная почта', email),
  field('Пароль', input('password', '', {
    type: 'password', required: true, autocomplete: registering ? 'new-password' : 'current-password',
    minlength: registering ? 10 : 1, maxlength: 128,
  }), registering && 'Не менее 10 символов'),
  error, submit);
  if (registering) error.before(creationJson(form, 'Регистрация аккаунта'));
  root.replaceChildren(el('main', { class: 'auth-layout' },
    el('div', { class: 'auth-main' }, el('header', { class: 'auth-header' }, brand(), themeControl()), el('div', { class: 'auth-content' },
      el('h1', {}, registering ? 'Регистрация' : 'Войти в журнал'),
      el('p', { class: 'muted' }, registering ? 'Создайте аккаунт, чтобы получить доступ к своей группе' : 'Используйте свой аккаунт для доступа к учебному журналу'),
      form, el('div', { class: 'auth-switch' }, registering ? 'Уже есть аккаунт?' : 'Впервые здесь?',
        button(registering ? 'Войти' : 'Зарегистрироваться', () => {
          authMode = registering ? 'login' : 'register';
          renderAuth();
          document.querySelector('.auth-form input')?.focus();
        }, { variant: 'text-button' })))),
    authIllustration()));
}

function navButton(id, title, glyph) {
  return el('button', {
    type: 'button', class: `nav-item ${view === id ? 'is-active' : ''}`,
    'aria-current': view === id ? 'page' : undefined, onclick: () => goTo(id),
  }, icon(glyph), title);
}

function sidebar() {
  return el('aside', { class: 'sidebar' }, brand(),
    el('nav', { class: 'nav', 'aria-label': 'Разделы' },
      (user.role === 'admin' ? navItems : navItems.slice(0, 2)).map((item) => navButton(...item))),
    groups.length > 0 && el('nav', { class: 'group-nav', 'aria-label': 'Журналы групп' },
      el('p', {}, user.role === 'admin' ? 'Журналы групп' : 'Мои группы'),
      el('div', { class: 'group-links' }, groups.map((group) => el('button', {
        class: `group-link ${view === 'journal' && groupId === group.id ? 'is-active' : ''}`,
        type: 'button', onclick: () => openJournal(group.id),
        title: `${group.code} · ${group.name}${group.archived ? ' · Архив' : ''}`,
        'aria-current': view === 'journal' && groupId === group.id ? 'page' : undefined,
      }, el('span', { class: 'group-link-mark' }, group.code.slice(0, 2)),
      el('span', { class: 'group-link-label' }, group.code),
      group.archived && el('small', { class: 'muted' }, 'Архив'))))),
    el('footer', { class: 'sidebar-footer' },
      el('span', { class: 'avatar profile-avatar', 'aria-hidden': 'true' }, initials(user.name)),
      el('div', { class: 'profile' }, el('span', { title: user.name }, user.name), el('small', {}, roleLabel[user.role])),
      button('Выйти', () => logout(), { iconOnly: true, glyph: 'exit', variant: 'quiet' })));
}

function render() {
  if (!user) return renderAuth();
  const scroll = root.querySelector('.journal-scroll, .calendar-scroll');
  const scrollClass = scroll?.classList.contains('journal-scroll') ? '.journal-scroll' : '.calendar-scroll';
  const left = scroll?.scrollLeft ?? 0;
  const top = scroll?.scrollTop ?? 0;
  const navScroll = root.querySelector('.group-links')?.scrollTop ?? 0;
  const focus = document.activeElement?.dataset.focusKey;
  const context = {
    api, mutate, user, day, week, selectedDate, groups, groupId, manageGroupId, searchTerm, plannerTab,
    pickDate, moveDate, showToday, jumpToWeek, goTo, selectManageGroup, openJournal, findUsers, selectPlan,
    selectPlannerTab, openSchedule, redraw: render,
    [view === 'groups' ? 'members' : view]: content,
  };
  const section = navItems.find(([id]) => id === view)[1];
  const page = issue
    ? el('div', { class: 'page panel' }, empty('Не удалось загрузить раздел', issue.message,
      button('Повторить', () => reload({ allGroups: true }), { variant: 'primary' })))
    : viewRenderers[view](context);
  const app = el('div', { class: 'workspace' }, sidebar(), el('main', { id: 'main', class: 'workspace-main' },
    el('div', { class: 'topbar' },
      navigation?.controls(),
      el('div', { class: 'breadcrumbs' }, el('span', {}, 'Учебный журнал'),
        el('span', { class: 'breadcrumb-divider', 'aria-hidden': 'true' }, '/'), el('span', {}, section)),
      themeControl()),
    page));
  root.replaceChildren(app);
  const currentScroll = scroll && root.querySelector(scrollClass);
  if (currentScroll) {
    currentScroll.scrollLeft = left;
    currentScroll.scrollTop = top;
  }
  const groupList = root.querySelector('.group-links');
  if (groupList) groupList.scrollTop = navScroll;
  if (focus) root.querySelector(`[data-focus-key="${CSS.escape(focus)}"]`)?.focus({ preventScroll: true });
}

async function reload({ allGroups = false, reset = false } = {}) {
  if (!user) return;
  const id = ++requestId;
  issue = null;
  if (reset) {
    content = null;
    render();
  }
  try {
    if (allGroups) {
      const received = await api('/groups');
      if (id !== requestId) return;
      groups = received;
      const initial = groups.find((group) => !group.archived)?.id ?? groups[0]?.id ?? null;
      if (!groups.some((group) => group.id === groupId)) groupId = initial;
      if (!groups.some((group) => group.id === manageGroupId)) manageGroupId = initial;
    }
    const path = {
      journal: groupId && `/groups/${groupId}/journal?${new URLSearchParams(week)}`,
      groups: manageGroupId && `/groups/${manageGroupId}/members`,
      users: `/users?${new URLSearchParams({ q: searchTerm })}`,
      statuses: '/statuses',
      schedule: `/schedule?${new URLSearchParams(week)}`,
      planner: planId ? `/schedule/planner?${new URLSearchParams({ id: planId })}` : '/schedule/planner',
    }[view];
    const loaded = path ? await api(path) : null;
    if (id === requestId) content = loaded;
  } catch (error) {
    if (id === requestId) issue = error;
  }
  if (id === requestId && user) {
    if (!issue && view === 'planner') planId = content?.plan?.id ?? null;
    savePage();
    render();
  }
}

function savePage(push = false) {
  navigation?.record({
    view, date: selectedDate, group: view === 'journal' ? groupId : view === 'groups' ? manageGroupId : null,
    plan: view === 'planner' ? planId : null, tab: view === 'planner' ? plannerTab : null,
    search: view === 'users' ? searchTerm : null,
  }, { push });
}

const routeId = (id) => typeof id === 'string' && /^[\da-f]{8}(?:-[\da-f]{4}){3}-[\da-f]{12}$/i.test(id) ? id : null;

function readPage(route = {}) {
  const allowed = user.role === 'admin' ? navItems : navItems.slice(0, 2);
  view = allowed.some(([name]) => name === route.view) ? route.view : 'journal';
  jumpToWeek(isDate(route.date) ? route.date : day);
  if (view === 'journal') groupId = routeId(route.group);
  if (view === 'groups') manageGroupId = routeId(route.group);
  if (view === 'planner') {
    planId = routeId(route.plan);
    plannerTab = plannerTabs.includes(route.tab) ? route.tab : plannerTabs[0];
  }
  if (view === 'users') searchTerm = typeof route.search === 'string' ? route.search : '';
}

function navigate({ allGroups = true } = {}) {
  savePage(true);
  void reload({ reset: true, allGroups });
}

function goTo(newView) {
  if (view === newView && !issue) return;
  const changed = view !== newView;
  view = newView;
  if (changed) navigate({ allGroups: view === 'schedule' || view === 'journal' });
  else void reload({ reset: true, allGroups: true });
}

function openJournal(id, date) {
  if (!date && groupId === id && view === 'journal' && !issue) return;
  view = 'journal';
  groupId = id;
  if (date) jumpToWeek(date);
  navigate({ allGroups: false });
}

function selectManageGroup(id, refresh = true) {
  const changed = manageGroupId !== id;
  manageGroupId = id;
  if (refresh && changed) navigate({ allGroups: false });
}

function selectPlan(id, refresh = true) {
  const changed = planId !== id;
  planId = id;
  if (refresh && changed) navigate({ allGroups: false });
}

function selectPlannerTab(tab, refresh = true) {
  if (plannerTab === tab) return;
  plannerTab = tab;
  if (refresh) {
    savePage(true);
    render();
  }
}

function openSchedule(date) {
  jumpToWeek(date);
  view = 'schedule';
  navigate();
}

function jumpToWeek(date) {
  selectedDate = date;
  week = weekOf(date);
}

function pickDate(date) {
  if (selectedDate === date) return;
  jumpToWeek(date);
  savePage();
  void reload();
}

function moveDate(days) {
  pickDate(addDays(selectedDate, days));
}

function showToday() {
  day = today(timeZone);
  pickDate(day);
}

async function findUsers(value) {
  searchTerm = value.trim();
  savePage();
  await reload({ reset: true });
}

async function mutate(path, method, data, message, { beforeRefresh } = {}) {
  const result = await api(path, method, data);
  beforeRefresh?.(result);
  await reload({ allGroups: view === 'groups' });
  if (user) notify(typeof message === 'function' ? message(result) : message);
}

function logout(message) {
  requestId += 1;
  setToken(null);
  user = null;
  groups = [];
  groupId = null;
  manageGroupId = null;
  planId = null;
  plannerTab = 'calendar';
  content = null;
  searchTerm = '';
  issue = null;
  view = 'journal';
  authMode = 'login';
  closeDialogs();
  document.getElementById('notice').hidden = true;
  navigation?.detach();
  navigation = null;
  history.replaceState(null, '', location.pathname);
  renderAuth(message);
}

async function boot() {
  if (!token) return renderAuth();
  root.replaceChildren(el('main', { class: 'auth-layout' }, el('div', { class: 'auth-main' },
    brand(), el('p', { class: 'muted' }, 'Открываем журнал…'))));
  try {
    ({ user, timeZone } = await api('/auth/me'));
    day = today(timeZone);
    const result = new URLSearchParams(window.location.search).get('googleCalendar');
    navigation?.detach();
    navigation = createNavigation(user.id, (route) => {
      closeDialogs();
      readPage(route);
      void reload({ reset: true, allGroups: true });
    }, ['view', 'date', 'group', 'plan', 'tab']);
    readPage(navigation.initial);
    if (result) {
      view = 'schedule';
    }
    savePage();
    await reload({ allGroups: true });
    if (result === 'connected') notify('Google Календарь подключён. Расписание появится после синхронизации.');
    if (result === 'error') {
      openDialog({ title: 'Google Календарь', description: 'Подключение не завершено. Откройте настройки календаря и повторите.' });
    }
  } catch (error) {
    if (error.status !== 401) logout(error.message);
  }
}

void boot();
