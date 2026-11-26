import { button, el } from './dom.js';

const stateKey = 'attendancePage';

export function createNavigation(account, onPop, queryKeys = ['view', 'date', 'group']) {
  let trail;
  let index;
  let last;
  function begin(entry) {
    const existing = entry?.account === account && Number.isSafeInteger(entry.index) && entry.index >= 0;
    trail = existing ? entry.trail : Date.now().toString(36) + Math.random().toString(36).slice(2);
    index = existing ? entry.index : 0;
    last = index;
    try { last = Math.max(index, Number(sessionStorage.getItem(stateKey + ':' + trail)) || 0); } catch {}
    const query = new URLSearchParams(location.search);
    return existing ? entry.route : Object.fromEntries(queryKeys.map((key) => [key, query.get(key)]));
  }
  const initial = begin(history.state?.[stateKey]);

  function record(route, { push = false } = {}) {
    if (push) {
      index += 1;
      last = index;
      try { sessionStorage.setItem(stateKey + ':' + trail, String(last)); } catch {}
    }
    const query = new URLSearchParams();
    for (const key of queryKeys) if (route[key]) query.set(key, route[key]);
    const state = { [stateKey]: { account, trail, index, route } };
    const url = location.pathname + (query.size ? '?' + query : '');
    if (push) history.pushState(state, '', url);
    else history.replaceState(state, '', url);
  }
  function restore({ state }) {
    const entry = state?.[stateKey];
    if (entry?.account === account && entry.trail === trail) {
      index = entry.index;
      onPop(entry.route);
    } else onPop(begin(entry));
  }
  window.addEventListener('popstate', restore);

  function controls() {
    const back = button('Назад', () => history.back(), { glyph: 'left', disabled: index <= 0 });
    const forward = button('Вперёд', () => history.forward(), { glyph: 'right', variant: 'arrow-after', disabled: index >= last });
    back.title = 'Предыдущая страница';
    forward.title = 'Следующая страница';
    back.dataset.focusKey = 'page-back';
    forward.dataset.focusKey = 'page-forward';
    return el('nav', { class: 'page-history', 'aria-label': 'История страниц' }, back, forward);
  }
  return { initial, record, controls, detach: () => window.removeEventListener('popstate', restore) };
}
