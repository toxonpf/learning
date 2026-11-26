import { el, icon, select } from './dom.js';

const choices = [['system', 'Как в системе'], ['light', 'Светлая'], ['dark', 'Тёмная']];
const preference = matchMedia('(prefers-color-scheme: dark)');
const key = 'attendance.theme';
let mode = 'system';
try {
  const stored = localStorage.getItem(key);
  if (choices.some(([value]) => value === stored)) mode = stored;
} catch {}

function apply() {
  const dark = mode === 'dark' || (mode === 'system' && preference.matches);
  document.documentElement.dataset.theme = dark ? 'dark' : 'light';
  document.querySelector('meta[name="theme-color"]')?.setAttribute('content', dark ? '#17201d' : '#f7f7f4');
}

apply();
preference.addEventListener('change', apply);

export function themeControl() {
  const chooser = select('theme', choices, mode);
  chooser.setAttribute('aria-label', 'Тема оформления');
  chooser.setAttribute('data-focus-key', 'theme');
  chooser.addEventListener('change', () => {
    mode = chooser.value;
    try { localStorage.setItem(key, mode); } catch {}
    apply();
  });
  return el('label', { class: 'theme-control' }, icon('theme'), chooser);
}
