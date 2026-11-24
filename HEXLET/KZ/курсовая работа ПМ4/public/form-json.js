import { button, el, field } from './dom.js';

const controls = (form) => [...form.querySelectorAll('input[name], select[name], textarea[name]')]
  .filter((node) => !node.disabled && !node.closest('[hidden]') && node.type !== 'search' && !node.dataset.noJson);

function fieldValue(node) {
  if (node.type === 'checkbox') return node.checked;
  if (node.type === 'password') return 'укажите-пароль';
  if (node.type === 'number' && node.value) return Number(node.value);
  return node.value;
}

function setField(node, value) {
  if (node.type === 'checkbox') {
    if (typeof value !== 'boolean') throw new Error(`${node.name} принимает true или false`);
    node.checked = value;
  } else {
    if (value !== null && !['string', 'number'].includes(typeof value)) throw new Error(`Проверьте тип поля ${node.name}`);
    const next = value === null ? '' : String(value);
    if (node.tagName === 'SELECT' && ![...node.options].some((item) => item.value === next)) {
      throw new Error(`В поле ${node.name} нет значения «${next}». Проверьте варианты в гайде.`);
    }
    node.value = next;
    if (node.value !== next) throw new Error(`Некорректное значение поля ${node.name}`);
  }
  node.dispatchEvent(new Event('input', { bubbles: true }));
  node.dispatchEvent(new Event('change', { bubbles: true }));
}

export function creationJson(form, title) {
  const json = el('textarea', { rows: 5, spellcheck: 'false', placeholder: '{ … }' });
  const feedback = el('p', { role: 'status', class: 'json-feedback' });
  const help = el('div', { class: 'json-guide', hidden: true });
  const link = el('a', { href: '#json-guide', 'aria-expanded': 'false', onclick: (event) => {
    event.preventDefault();
    help.hidden = !help.hidden;
    link.setAttribute('aria-expanded', String(!help.hidden));
    if (!help.hidden) guide();
  } }, 'Гайд для этой формы');
  const guide = () => {
    const nodes = controls(form);
    const sample = JSON.stringify(Object.fromEntries(nodes.map((node) => [node.name, fieldValue(node)])), null, 2);
    help.replaceChildren(el('strong', {}, title),
      el('p', {}, 'Вставьте объект JSON с нужными полями. Ключи и доступные значения приведены ниже. После применения проверьте форму и сохраните её. Для ИИ можно скопировать шаблон и этот список полей.'),
      el('pre', {}, sample), button('Вставить шаблон', () => { json.value = sample; json.focus(); }),
      el('dl', {}, nodes.map((node) => {
        const label = node.labels?.[0]?.querySelector('span')?.textContent ?? node.name;
        const options = node.tagName === 'SELECT' ? [...node.options].filter((option) => option.value)
          .map((option) => `${option.value} — ${option.label}`) : [];
        return [el('dt', {}, el('code', {}, node.name), ` · ${label}`), el('dd', {},
          [node.required ? 'Обязательное поле' : 'Необязательное поле',
            node.type === 'checkbox' ? 'true / false' : node.type === 'date' ? 'ГГГГ-ММ-ДД' :
              node.type === 'time' ? 'ЧЧ:ММ' : node.type === 'number' ? `Число${node.min ? ` от ${node.min}` : ''}${node.max ? ` до ${node.max}` : ''}` : null]
            .filter(Boolean).join(' · '), options.length ? el('ul', {}, options.map((option) => el('li', {}, option))) : null)];
      })));
  };
  form.addEventListener('change', (event) => {
    if (!help.hidden && event.target.name) guide();
  });
  const apply = () => {
    const original = controls(form).map((node) => [node.name, node.type === 'checkbox' ? node.checked : node.value]);
    try {
      const value = JSON.parse(json.value);
      if (!value || Array.isArray(value) || typeof value !== 'object') throw new Error('Нужен объект JSON с именами полей');
      const patch = new Map(Object.entries(value));
      while (patch.size) {
        const pending = patch.size;
        for (const node of controls(form)) {
          if (!patch.has(node.name)) continue;
          const fresh = controls(form).find((item) => item.name === node.name);
          if (!fresh) continue;
          setField(fresh, patch.get(node.name));
          patch.delete(node.name);
        }
        if (pending === patch.size) throw new Error(`Неизвестные или недоступные поля: ${[...patch.keys()].join(', ')}`);
      }
      feedback.textContent = 'Поля заполнены. Проверьте данные перед сохранением.';
      feedback.classList.remove('form-error');
    } catch (error) {
      for (const [key, value] of original) {
        const node = controls(form).find((item) => item.name === key);
        if (node) setField(node, value);
      }
      feedback.textContent = error instanceof SyntaxError ? 'Некорректный синтаксис JSON' : error.message;
      feedback.classList.add('form-error');
    }
    if (!help.hidden) guide();
  };
  return el('details', { class: 'form-json' }, el('summary', {}, 'Заполнить из JSON'),
    field('JSON для заполнения формы', json), el('div', { class: 'row-actions' }, button('Применить JSON', apply), link),
    feedback, help);
}
