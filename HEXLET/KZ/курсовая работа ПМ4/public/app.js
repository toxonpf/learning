import { button, el, empty, field, icon, input, notify } from './dom.js';
import { initials, roleLabel, today, weekOf } from './format.js';
import { renderJournal } from './journal.js';
import { renderGroups, renderStatuses, renderUsers } from './management.js';

const root = document.getElementById('app');
const storageKey = 'attendance.accessToken';
const defaultTimeZone = 'Asia/Almaty';
const navItems = [
  ['journal', 'Посещаемость', 'journal'],
  ['groups', 'Учебные группы', 'groups'],
  ['users', 'Пользователи', 'users'],
  ['statuses', 'Настройки статусов', 'status'],
];
const viewRenderers = { journal: renderJournal, groups: renderGroups, users: renderUsers, statuses: renderStatuses };

let token = sessionStorage.getItem(storageKey);
let user = null;
let timeZone = defaultTimeZone;
let day = today(timeZone);
let week = weekOf(day);
let groupId = null;
let manageGroupId = null;
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
  root.replaceChildren(el('main', { class: 'auth-layout' },
    el('div', { class: 'auth-main' }, brand(), el('div', { class: 'auth-content' },
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
      (user.role === 'admin' ? navItems : navItems.slice(0, 1)).map((item) => navButton(...item))),
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
  const scroll = root.querySelector('.journal-scroll');
  const left = scroll?.scrollLeft ?? 0;
  const top = scroll?.scrollTop ?? 0;
  const navScroll = root.querySelector('.group-links')?.scrollTop ?? 0;
  const focus = document.activeElement?.dataset.focusKey;
  const context = {
    api, mutate, user, day, week, groups, groupId, manageGroupId, searchTerm,
    loadJournal, jumpToWeek, goTo, selectManageGroup, openJournal, findUsers,
    [view === 'groups' ? 'members' : view]: content,
  };
  const section = navItems.find(([id]) => id === view)[1];
  const page = issue
    ? el('div', { class: 'page panel' }, empty('Не удалось загрузить раздел', issue.message,
      button('Повторить', () => reload({ allGroups: true }), { variant: 'primary' })))
    : viewRenderers[view](context);
  const app = el('div', { class: 'workspace' }, sidebar(), el('main', { id: 'main', class: 'workspace-main' },
    el('div', { class: 'topbar' }, el('span', {}, 'Учебный журнал'),
      el('span', { class: 'breadcrumb-divider', 'aria-hidden': 'true' }, '/'), el('span', {}, section)),
    page));
  root.replaceChildren(app);
  const currentScroll = root.querySelector('.journal-scroll');
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
    }[view];
    const loaded = path ? await api(path) : null;
    if (id === requestId) content = loaded;
  } catch (error) {
    if (id === requestId) issue = error;
  }
  if (id === requestId && user) render();
}

function goTo(newView) {
  if (view === newView && !issue) return;
  view = newView;
  void reload({ reset: true });
}

function openJournal(id) {
  if (groupId === id && view === 'journal' && !issue) return;
  view = 'journal';
  groupId = id;
  void reload({ reset: true });
}

function selectManageGroup(id, refresh = true) {
  manageGroupId = id;
  if (refresh) void reload({ reset: true });
}

function jumpToWeek(date) {
  week = weekOf(date);
}

function loadJournal(offset, reset = false) {
  day = today(timeZone);
  week = weekOf(reset ? day : week.from, offset);
  void reload({ reset: true });
}

async function findUsers(value) {
  searchTerm = value.trim();
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
  content = null;
  searchTerm = '';
  issue = null;
  view = 'journal';
  authMode = 'login';
  document.getElementById('dialog').close();
  document.getElementById('notice').hidden = true;
  renderAuth(message);
}

async function boot() {
  if (!token) return renderAuth();
  root.replaceChildren(el('main', { class: 'auth-layout' }, el('div', { class: 'auth-main' },
    brand(), el('p', { class: 'muted' }, 'Открываем журнал…'))));
  try {
    ({ user, timeZone } = await api('/auth/me'));
    day = today(timeZone);
    week = weekOf(day);
    await reload({ allGroups: true });
  } catch (error) {
    if (error.status !== 401) logout(error.message);
  }
}

void boot();
