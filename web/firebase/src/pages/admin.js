// src/pages/admin.js
import {
  collection, query, orderBy, limit, startAfter, getDocs,
  doc, addDoc, updateDoc, deleteDoc, onSnapshot,
  serverTimestamp, collectionGroup, getCountFromServer,
} from 'firebase/firestore';
import { db } from '../firebase.js';
import { initNavbar } from '../components/navbar.js';
import { initAuthModal, onAuthChange } from './auth.js';
import { showToast } from '../components/toast.js';
import { generateNameTokens } from '../utils/tokens.js';

const PAGE_SIZE = 15;

const STATUS_LABELS = {
  pending: { label: 'Ожидает', cls: 'badge-warning' },
  processing: { label: 'В обработке', cls: 'badge-info' },
  shipped: { label: 'Отправлен', cls: 'badge-info' },
  delivered: { label: 'Доставлен', cls: 'badge-success' },
  cancelled: { label: 'Отменён', cls: 'badge-error' },
};

const CATEGORY_LABELS = { electronics: 'Электроника', clothing: 'Одежда', home: 'Дом и сад', sports: 'Спорт', books: 'Книги' };

function formatPrice(p) { return p.toLocaleString('ru-RU') + ' ₸'; }
function formatDate(ts) { return ts?.toDate?.().toLocaleDateString('ru-RU') || '—'; }

// ===== Guard =====
function initGuard(callback) {
  onAuthChange(async (user, userData) => {
    document.getElementById('page-loader')?.classList.add('hidden');
    if (!user || userData?.role !== 'admin') {
      document.getElementById('admin-guard').style.display = 'block';
      document.getElementById('admin-content').style.display = 'none';
    } else {
      document.getElementById('admin-guard').style.display = 'none';
      document.getElementById('admin-content').style.display = 'block';
      callback(user, userData);
    }
  });
}

// ===== Stats =====
async function loadStats() {
  try {
    const [products, orders, users] = await Promise.all([
      getCountFromServer(collection(db, 'products')),
      getCountFromServer(collection(db, 'orders')),
      getCountFromServer(collection(db, 'users')),
    ]);
    document.getElementById('stat-products').textContent = products.data().count;
    document.getElementById('stat-orders').textContent = orders.data().count;
    document.getElementById('stat-users').textContent = users.data().count;

    // Revenue from orders
    const ordersSnap = await getDocs(collection(db, 'orders'));
    let revenue = 0;
    ordersSnap.forEach((d) => { revenue += d.data().total || 0; });
    document.getElementById('stat-revenue').textContent = formatPrice(revenue);
  } catch (err) {
    console.error('Stats error:', err);
  }
}

// ===== Products CRUD =====
let productsLastDoc = null;

async function loadProductsTable(reset = false) {
  if (reset) { document.getElementById('products-tbody').innerHTML = ''; productsLastDoc = null; }
  const q = query(collection(db, 'products'), orderBy('createdAt', 'desc'), limit(PAGE_SIZE), ...(productsLastDoc ? [startAfter(productsLastDoc)] : []));
  const snap = await getDocs(q);
  const tbody = document.getElementById('products-tbody');
  snap.forEach((d) => {
    const data = d.data();
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td style="max-width:200px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;" title="${data.name}">${data.name}</td>
      <td><span class="badge badge-accent">${CATEGORY_LABELS[data.category] || data.category}</span></td>
      <td>${formatPrice(data.price)}</td>
      <td><span class="${data.stock === 0 ? 'badge badge-error' : 'badge badge-success'}">${data.stock}</span></td>
      <td>★ ${(data.rating || 0).toFixed(1)}</td>
      <td style="display:flex;gap:8px;">
        <button class="btn btn-secondary btn-sm" data-edit="${d.id}">✏️</button>
        <button class="btn btn-danger btn-sm" data-delete="${d.id}">🗑</button>
      </td>`;

    tr.querySelector(`[data-edit="${d.id}"]`).addEventListener('click', () => openProductModal(d.id, data));
    tr.querySelector(`[data-delete="${d.id}"]`).addEventListener('click', async () => {
      if (!confirm(`Удалить товар "${data.name}"?`)) return;
      await deleteDoc(doc(db, 'products', d.id));
      tr.remove();
      showToast('Товар удалён', 'info');
    });

    tbody.appendChild(tr);
  });
  productsLastDoc = snap.docs[snap.docs.length - 1];
  document.getElementById('products-load-more').style.display = snap.size === PAGE_SIZE ? 'inline-flex' : 'none';
}

function openProductModal(id = null, data = {}) {
  const modal = document.getElementById('product-modal-overlay');
  document.getElementById('product-modal-title').textContent = id ? 'Редактировать товар' : 'Добавить товар';
  document.getElementById('product-form-id').value = id || '';
  document.getElementById('pf-name').value = data.name || '';
  document.getElementById('pf-category').value = data.category || 'electronics';
  document.getElementById('pf-price').value = data.price || '';
  document.getElementById('pf-stock').value = data.stock ?? '';
  document.getElementById('pf-desc').value = data.description || '';
  document.getElementById('pf-image').value = data.imageUrl || '';
  document.getElementById('product-form-error').style.display = 'none';
  modal.classList.add('active');
}

function closeProductModal() {
  document.getElementById('product-modal-overlay').classList.remove('active');
}

async function saveProduct(e) {
  e.preventDefault();
  const errEl = document.getElementById('product-form-error');
  errEl.style.display = 'none';
  const btn = document.getElementById('product-form-submit');
  btn.disabled = true;
  btn.textContent = 'Сохраняем...';

  const id = document.getElementById('product-form-id').value;
  const name = document.getElementById('pf-name').value.trim();
  const category = document.getElementById('pf-category').value;
  const price = parseFloat(document.getElementById('pf-price').value);
  const stock = parseInt(document.getElementById('pf-stock').value);
  const description = document.getElementById('pf-desc').value.trim();
  const imageUrl = document.getElementById('pf-image').value.trim();

  if (!name || isNaN(price) || isNaN(stock)) {
    errEl.textContent = 'Заполните все обязательные поля.';
    errEl.style.display = 'block';
    btn.disabled = false;
    btn.textContent = 'Сохранить';
    return;
  }

  // Generate search tokens with prefix support
  const nameTokens = generateNameTokens(name);

  const payload = { name, nameTokens, category, price, stock, description, imageUrl, updatedAt: serverTimestamp() };

  try {
    if (id) {
      await updateDoc(doc(db, 'products', id), payload);
      showToast('Товар обновлён', 'success');
    } else {
      payload.createdAt = serverTimestamp();
      payload.rating = 0;
      payload.reviewCount = 0;
      await addDoc(collection(db, 'products'), payload);
      showToast('Товар добавлен', 'success');
    }
    closeProductModal();
    loadProductsTable(true);
    loadStats();
  } catch (err) {
    console.error(err);
    errEl.textContent = 'Ошибка сохранения.';
    errEl.style.display = 'block';
  } finally {
    btn.disabled = false;
    btn.textContent = 'Сохранить';
  }
}

// ===== Orders =====
let ordersLastDoc = null;

async function loadOrdersTable(reset = false) {
  if (reset) { document.getElementById('orders-tbody').innerHTML = ''; ordersLastDoc = null; }
  const q = query(collection(db, 'orders'), orderBy('createdAt', 'desc'), limit(PAGE_SIZE), ...(ordersLastDoc ? [startAfter(ordersLastDoc)] : []));
  const snap = await getDocs(q);
  const tbody = document.getElementById('orders-tbody');
  snap.forEach((d) => {
    const order = d.data();
    const status = STATUS_LABELS[order.status] || { label: order.status, cls: 'badge-info' };
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td style="font-family:'Space Grotesk',sans-serif;font-size:0.8rem;color:var(--text-muted);">${d.id.slice(0, 8).toUpperCase()}</td>
      <td style="font-size:0.85rem;">${order.userId?.slice(0, 10)}...</td>
      <td>${formatPrice(order.total)}</td>
      <td>${formatDate(order.createdAt)}</td>
      <td><span class="badge ${status.cls}" id="status-badge-${d.id}">${status.label}</span></td>
      <td>
        <select class="sort-select" style="padding:6px 28px 6px 10px;font-size:0.8rem;" data-order-id="${d.id}">
          ${Object.entries(STATUS_LABELS).map(([val, { label }]) => `<option value="${val}" ${val === order.status ? 'selected' : ''}>${label}</option>`).join('')}
        </select>
      </td>`;

    tr.querySelector('select').addEventListener('change', async (e) => {
      await updateDoc(doc(db, 'orders', d.id), { status: e.target.value });
      const badge = document.getElementById(`status-badge-${d.id}`);
      if (badge) {
        const s = STATUS_LABELS[e.target.value];
        badge.textContent = s.label;
        badge.className = `badge ${s.cls}`;
      }
      showToast('Статус обновлён', 'success');
    });

    tbody.appendChild(tr);
  });
  ordersLastDoc = snap.docs[snap.docs.length - 1];
  document.getElementById('orders-load-more').style.display = snap.size === PAGE_SIZE ? 'inline-flex' : 'none';
}

// ===== Users =====
async function loadUsers() {
  const list = document.getElementById('users-list');
  list.innerHTML = '<div class="loader"><div class="spinner"></div></div>';
  const snap = await getDocs(query(collection(db, 'users'), orderBy('createdAt', 'desc'), limit(50)));
  list.innerHTML = '';
  if (snap.empty) { list.innerHTML = '<p style="color:var(--text-muted);">Нет пользователей</p>'; return; }

  snap.forEach((d) => {
    const u = d.data();
    const el = document.createElement('div');
    el.className = 'user-row animate-fade-up';
    const isAdmin = u.role === 'admin';
    el.innerHTML = `
      <div class="avatar">${(u.displayName || u.email || 'А')[0].toUpperCase()}</div>
      <div style="flex:1;">
        <div style="font-weight:600;font-size:0.9rem;">${u.displayName || '—'}</div>
        <div style="font-size:0.8rem;color:var(--text-muted);">${u.email}</div>
      </div>
      <span class="badge ${isAdmin ? 'badge-accent' : 'badge-info'}">${isAdmin ? 'Admin' : 'User'}</span>
      <button class="btn btn-secondary btn-sm" data-uid="${d.id}" data-role="${u.role}">
        ${isAdmin ? 'Снять права' : 'Сделать Admin'}
      </button>`;

    el.querySelector('button').addEventListener('click', async (e) => {
      const uid = e.currentTarget.dataset.uid;
      const currentRole = e.currentTarget.dataset.role;
      const newRole = currentRole === 'admin' ? 'user' : 'admin';
      await updateDoc(doc(db, 'users', uid), { role: newRole });
      showToast(`Роль изменена на ${newRole}`, 'success');
      loadUsers();
    });

    list.appendChild(el);
  });
}

// ===== Moderation (reviews) =====
async function loadModReviews() {
  const list = document.getElementById('mod-reviews-list');
  list.innerHTML = '<div class="loader"><div class="spinner"></div></div>';
  try {
    const snap = await getDocs(query(collectionGroup(db, 'reviews'), orderBy('createdAt', 'desc'), limit(50)));
    list.innerHTML = '';
    if (snap.empty) { list.innerHTML = '<div class="empty-state"><span class="empty-state-icon">✅</span><h3>Нет отзывов</h3></div>'; return; }

    snap.forEach((d) => {
      const data = d.data();
      const productId = d.ref.parent.parent.id;
      const el = document.createElement('div');
      el.className = 'review-manage-item animate-fade-up';
      el.innerHTML = `
        <div style="flex:1;">
          <div style="display:flex;align-items:center;gap:10px;margin-bottom:6px;">
            <span style="font-size:0.85rem;font-weight:600;">${data.userName || 'Аноним'}</span>
            <span class="stars" style="font-size:0.8rem;">${'★'.repeat(data.rating)}${'☆'.repeat(5-data.rating)}</span>
            <span style="font-size:0.75rem;color:var(--text-muted);">${formatDate(data.createdAt)}</span>
          </div>
          <a href="./product.html?id=${productId}" style="font-size:0.75rem;color:var(--accent);text-decoration:underline;">Товар ${productId.slice(0,8)}</a>
          <p style="font-size:0.875rem;color:var(--text-secondary);margin-top:4px;">${data.text}</p>
        </div>
        <button class="btn btn-danger btn-sm" data-rid="${d.id}" data-pid="${productId}">🗑 Удалить</button>`;

      el.querySelector('button').addEventListener('click', async (e) => {
        const rid = e.currentTarget.dataset.rid;
        const pid = e.currentTarget.dataset.pid;
        if (!confirm('Удалить отзыв?')) return;
        await deleteDoc(doc(db, 'products', pid, 'reviews', rid));
        el.remove();
        showToast('Отзыв удалён', 'info');
      });

      list.appendChild(el);
    });
  } catch (err) {
    console.error('Reviews load error:', err);
    list.innerHTML = `<div class="empty-state">
      <span class="empty-state-icon">⚠️</span>
      <h3>Ошибка загрузки</h3>
      <p style="font-size:0.875rem;color:var(--text-secondary);max-width:300px;margin:10px auto;">
        ${err.message}
      </p>
      <p style="font-size:0.75rem;color:var(--text-muted);">
        Откройте консоль (F12) и нажмите на ссылку от Firebase, чтобы создать индекс для коллекции отзывов.
      </p>
    </div>`;
  }
}

// ===== Init =====
document.addEventListener('DOMContentLoaded', () => {
  initAuthModal();
  initNavbar();

  initGuard(async () => {
    loadStats();
    loadProductsTable(true);

    // Panel nav
    document.querySelectorAll('.admin-nav-item').forEach((btn) => {
      btn.addEventListener('click', () => {
        document.querySelectorAll('.admin-nav-item').forEach((b) => b.classList.remove('active'));
        btn.classList.add('active');
        const panel = btn.dataset.panel;
        document.querySelectorAll('.admin-panel').forEach((p) => p.classList.remove('active'));
        document.getElementById(`panel-${panel}`)?.classList.add('active');

        if (panel === 'orders') loadOrdersTable(true);
        if (panel === 'users') loadUsers();
        if (panel === 'reviews') loadModReviews();
      });
    });

    // Product modal
    document.getElementById('add-product-btn')?.addEventListener('click', () => openProductModal());
    document.getElementById('product-modal-close')?.addEventListener('click', closeProductModal);
    document.getElementById('product-modal-cancel')?.addEventListener('click', closeProductModal);
    document.getElementById('product-modal-overlay')?.addEventListener('click', (e) => { if (e.target === e.currentTarget) closeProductModal(); });
    document.getElementById('product-form')?.addEventListener('submit', saveProduct);

    // Load more
    document.getElementById('products-load-more')?.addEventListener('click', () => loadProductsTable(false));
    document.getElementById('orders-load-more')?.addEventListener('click', () => loadOrdersTable(false));
  });
});
