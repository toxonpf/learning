const svgPaths = {
  book: '<path d="M4 19V5a2 2 0 0 1 2-2h14v18H6a2 2 0 0 1 0-4h14M9 7h6M9 11h6"/>',
  journal: '<rect x="3" y="4" width="18" height="16" rx="2"/><path d="M3 9h18M9 9v11M15 9v11M3 14h18"/>',
  groups: '<path d="M3 7a2 2 0 0 1 2-2h4l2 2h8a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2Z"/>',
  users: '<path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2M22 21v-2a4 4 0 0 0-3-3.9M16 3.1a4 4 0 0 1 0 7.8"/><circle cx="9" cy="7" r="4"/>',
  status: '<path d="M4 7h16M4 12h16M4 17h16"/><circle cx="8" cy="7" r="2" fill="currentColor"/><circle cx="15" cy="12" r="2" fill="currentColor"/><circle cx="10" cy="17" r="2" fill="currentColor"/>',
  exit: '<path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4m7 14 5-5-5-5m5 5H9"/>',
  left: '<path d="m15 18-6-6 6-6"/>',
  right: '<path d="m9 18 6-6-6-6"/>',
  plus: '<path d="M12 5v14M5 12h14"/>',
  calendar: '<rect x="3" y="5" width="18" height="16" rx="2"/><path d="M16 3v4M8 3v4M3 10h18"/>',
  more: '<circle cx="5" cy="12" r="1"/><circle cx="12" cy="12" r="1"/><circle cx="19" cy="12" r="1"/>',
  check: '<path d="m5 12 4 4L19 6"/>',
  close: '<path d="m18 6-12 12M6 6l12 12"/>',
  search: '<circle cx="11" cy="11" r="6"/><path d="m16 16 4 4"/>',
};

export function icon(name) {
  const template = document.createElement('template');
  template.innerHTML = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${svgPaths[name]}</svg>`;
  return template.content.firstChild;
}

export function el(tag, attrs = {}, ...children) {
  const node = document.createElement(tag);
  for (const [name, value] of Object.entries(attrs)) {
    if (value === undefined || value === null || value === false) continue;
    if (name.startsWith('on')) node.addEventListener(name.slice(2), value);
    else if (name === 'class') node.className = value;
    else if (name === 'value') node.value = value;
    else node.setAttribute(name, value === true ? '' : String(value));
  }
  node.append(...children.flat(Infinity).filter((child) => child != null && child !== false));
  return node;
}

export function button(label, onClick, { glyph, variant = '', type = 'button', iconOnly = false, disabled } = {}) {
  return el('button', {
    class: `button ${variant} ${iconOnly ? 'icon-only' : ''}`,
    type, disabled, onclick: onClick,
    ...(iconOnly && { 'aria-label': label, title: label }),
  }, glyph && icon(glyph), !iconOnly && label);
}

let fieldId = 0;
export function field(label, input, hint) {
  const id = `field-${++fieldId}`;
  input.setAttribute('aria-labelledby', id);
  if (hint) input.setAttribute('aria-describedby', id + '-hint');
  return el('label', { class: 'field' }, el('span', { id }, label), input,
    hint && el('small', { id: id + '-hint', class: 'muted' }, hint));
}

export function input(name, value = '', options = {}) {
  return el('input', { name, value, ...options });
}

export function select(name, choices, value) {
  const node = el('select', { name, required: true },
    choices.map(([id, label]) => el('option', { value: id }, label)));
  if (value != null) node.value = value;
  return node;
}

export function formValues(form) {
  return Object.fromEntries(new FormData(form));
}

export function mark(status, { large = false } = {}) {
  const badge = el('span', { class: `mark ${large ? 'mark-large' : ''}`, title: status.name }, status.code);
  badge.style.setProperty('--mark-ink', status.color);
  return badge;
}

let noticeTimer;
export function notify(message) {
  const notice = document.getElementById('notice');
  notice.replaceChildren(icon('check'), message);
  notice.hidden = false;
  clearTimeout(noticeTimer);
  noticeTimer = setTimeout(() => { notice.hidden = true; }, 3600);
}

export function openDialog({ title, description, fields, onSubmit, submitLabel = 'Сохранить', onDelete, deleteLabel = 'Удалить' }) {
  const dialog = document.getElementById('dialog');
  const opener = document.activeElement;
  const focusKey = opener?.dataset.focusKey;
  const error = el('p', { class: 'form-error', role: 'alert', hidden: true });
  const submit = button(submitLabel, null, { type: 'submit', variant: 'primary' });
  const cancel = button(onSubmit ? 'Отмена' : 'Закрыть', () => dialog.close(), { variant: 'quiet' });
  const dismiss = button('Закрыть окно', () => dialog.close(), { glyph: 'close', iconOnly: true, variant: 'quiet' });
  const remove = onDelete && button(deleteLabel, () => execute(onDelete), { variant: 'danger' });

  async function execute(action, values) {
    error.hidden = true;
    submit.disabled = true;
    cancel.disabled = true;
    dismiss.disabled = true;
    if (remove) remove.disabled = true;
    try {
      await action(values);
      dialog.close();
    } catch (problem) {
      error.textContent = problem.message;
      error.hidden = false;
    } finally {
      submit.disabled = false;
      cancel.disabled = false;
      dismiss.disabled = false;
      if (remove) remove.disabled = false;
    }
  }

  const form = el('form', {
    onsubmit: (event) => {
      event.preventDefault();
      if (onSubmit && !submit.disabled) void execute(onSubmit, formValues(form));
    },
  }, el('div', { class: 'dialog-body' }, fields, error),
  el('div', { class: 'dialog-actions' }, remove, el('div', { class: 'actions' }, cancel, onSubmit && submit)));
  dialog.oncancel = (event) => { if (submit.disabled) event.preventDefault(); };
  dialog.onclose = () => {
    if (dialog.open || !focusKey || opener.isConnected) return;
    document.querySelector(`[data-focus-key="${CSS.escape(focusKey)}"]`)?.focus({ preventScroll: true });
  };
  dialog.replaceChildren(
    el('div', { class: 'dialog-heading' }, el('div', {}, el('h2', { id: 'dialog-title' }, title),
      description && el('p', { class: 'muted' }, description)), dismiss),
    form,
  );
  dialog.showModal();
}

export function empty(title, description, action) {
  return el('div', { class: 'empty' },
    el('h2', {}, title), description && el('p', {}, description), action);
}

export function pageHeader(title, description, action) {
  return el('header', { class: 'page-heading' },
    el('div', {}, el('h1', {}, title), description && el('p', {}, description)), action);
}
