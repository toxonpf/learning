import { button, el } from './dom.js';

export function horizontalScroll(content, { className, label, focusKey = className }) {
  const viewport = el('div', { class: className, tabindex: '0', role: 'region', 'aria-label': label }, content);
  const previous = button('Влево', () => move(-1), { glyph: 'left' });
  const next = button('Вправо', () => move(1), { glyph: 'right', variant: 'arrow-after' });
  previous.dataset.focusKey = focusKey + '-left';
  next.dataset.focusKey = focusKey + '-right';
  const slider = el('input', { class: 'horizontal-slider', type: 'range', min: '0', max: '0', value: '0',
    'aria-label': 'Положение просмотра', 'data-focus-key': focusKey + '-position',
    oninput: () => position(Number(slider.value)),
  });
  const tools = el('div', { class: 'horizontal-tools', hidden: true, role: 'group', 'aria-label': `Прокрутка · ${label}` },
    previous, slider, next);
  const shell = el('div', { class: 'horizontal-shell' }, tools, viewport);
  let mounted = false;
  let maximum = 0;
  const resize = new ResizeObserver(sync);
  resize.observe(viewport);
  resize.observe(content);

  function sync() {
    if (!shell.isConnected) {
      if (mounted) resize.disconnect();
      return;
    }
    mounted = true;
    maximum = viewport.scrollWidth - viewport.clientWidth;
    tools.hidden = maximum < 3;
    if (tools.hidden) return;
    slider.max = maximum;
    slider.value = Math.round(viewport.scrollLeft);
    slider.setAttribute('aria-valuetext', `${Math.round(viewport.scrollLeft / maximum * 100)} %`);
    previous.setAttribute('aria-disabled', String(viewport.scrollLeft < 2));
    next.setAttribute('aria-disabled', String(viewport.scrollLeft >= maximum - 2));
  }

  function position(value) {
    viewport.scrollLeft = value;
    sync();
  }

  function move(direction) {
    const pinned = content.querySelector('.sticky-student, .calendar-axis')?.getBoundingClientRect().width ?? 0;
    const step = Math.max(100, viewport.clientWidth - pinned - 32);
    position(Math.max(0, Math.min(maximum, viewport.scrollLeft + direction * step)));
  }

  viewport.addEventListener('scroll', sync, { passive: true });
  viewport.addEventListener('keydown', (event) => {
    if (event.target !== viewport || !['Home', 'End'].includes(event.key)) return;
    event.preventDefault();
    position(event.key === 'Home' ? 0 : maximum);
  });
  requestAnimationFrame(sync);
  return shell;
}
