import { el } from './dom.js';

const collator = new Intl.Collator('ru', { numeric: true, sensitivity: 'base' });
export const sortable = (value, sortValue) => ({ value, sortValue });

export function sortableTable(headers, rows, { wrapper = 'management-scroll', table = 'data-table' } = {}) {
  const body = el('tbody');
  let column = -1;
  let direction = 1;
  const keys = rows.map((row) => row.map((cell) => cell?.sortValue ?? cell?.textContent?.trim() ?? cell));
  const rendered = rows.map((row) => el('tr', {}, row.map((cell, index) => el(
    index ? 'td' : 'th', index ? {} : { scope: 'row' }, cell?.sortValue === undefined ? cell : cell.value,
  ))));
  function draw() {
    const order = rendered.map((_, index) => index);
    if (column >= 0) order.sort((a, b) => {
      const x = keys[a][column], y = keys[b][column];
      if (x == null || x === '—') return y == null || y === '—' ? 0 : 1;
      if (y == null || y === '—') return -1;
      return direction * (typeof x === 'number' && typeof y === 'number' ? x - y : collator.compare(String(x), String(y)));
    });
    body.replaceChildren(...order.map((index) => rendered[index]));
  }
  const headings = headers.map((label, index) => {
    const heading = el('th', { scope: 'col' });
    if (label === 'Действия') heading.append(label);
    else heading.append(el('button', { type: 'button', class: 'column-sort', onclick: () => {
      direction = column === index ? -direction : 1;
      column = index;
      headings.forEach((cell, i) => {
        if (i === column) cell.setAttribute('aria-sort', direction === 1 ? 'ascending' : 'descending');
        else cell.removeAttribute('aria-sort');
      });
      draw();
    } }, label, el('span', { class: 'column-sort-arrow', 'aria-hidden': 'true' })));
    return heading;
  });
  draw();
  return el('div', { class: wrapper }, el('table', { class: table }, el('thead', {}, el('tr', {}, headings)), body));
}
