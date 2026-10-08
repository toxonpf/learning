// src/pages/profile.js
import {
  collection, query, where, orderBy, onSnapshot,
  doc, updateDoc, getDocs, deleteDoc, serverTimestamp,
  collectionGroup,
} from 'firebase/firestore';
import { db } from '../firebase.js';
import { initNavbar } from '../components/navbar.js';
import { initAuthModal, onAuthChange, openAuthModal, currentUser } from './auth.js';
import { showToast } from '../components/toast.js';

const STATUS_LABELS = {
  pending: { label: 'Ожидает', cls: 'badge-warning' },
  processing: { label: 'В обработке', cls: 'badge-info' },
  shipped: { label: 'Отправлен', cls: 'badge-info' },
  delivered: { label: 'Доставлен', cls: 'badge-success' },
  cancelled: { label: 'Отменён', cls: 'badge-error' },
};

function formatPrice(p) { return p.toLocaleString('ru-RU') + ' ₸'; }
function formatDate(ts) { return ts?.toDate?.().toLocaleDateString('ru-RU', { day: 'numeric', month: 'long', year: 'numeric' }) || ''; }
function renderStars(r) { return '★'.repeat(Math.round(r)) + '☆'.repeat(5 - Math.round(r)); }

let ordersUnsub = null;

function initProfile(user, userData) {
  document.getElementById('profile-loader')?.remove();
  document.getElementById('profile-auth-guard').style.display = 'none';
  document.getElementById('profile-content').style.display = 'block';

  const name = user.displayName || userData?.displayName || 'Пользователь';
  const letter = name[0].toUpperCase();

  document.getElementById('profile-avatar').textContent = letter;
  document.getElementById('profile-name-display').textContent = name;
  document.getElementById('profile-email-display').textContent = user.email;

  // Settings form
  document.getElementById('profile-name-input').value = name;
  document.getElementById('profile-phone-input').value = userData?.phone || '';
  document.getElementById('profile-email-input').value = user.email;

  loadOrders(user.uid);
  loadMyReviews(user.uid);

  // Tab nav
  document.querySelectorAll('.profile-nav-item').forEach((btn) => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.profile-nav-item').forEach((b) => b.classList.remove('active'));
      btn.classList.add('active');
      const tab = btn.dataset.tab;
      document.querySelectorAll('.tab-panel').forEach((p) => p.classList.remove('active'));
      document.getElementById(`tab-${tab}`)?.classList.add('active');
    });
  });

  // Profile form
  document.getElementById('profile-form')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const btn = e.submitter;
    btn.disabled = true;
    try {
      const { updateProfile } = await import('firebase/auth');
      const { auth } = await import('../firebase.js');
      const newName = document.getElementById('profile-name-input').value.trim();
      const phone = document.getElementById('profile-phone-input').value.trim();
      await updateProfile(auth.currentUser, { displayName: newName });
      await updateDoc(doc(db, 'users', user.uid), { displayName: newName, phone, updatedAt: serverTimestamp() });
      document.getElementById('profile-name-display').textContent = newName;
      document.getElementById('profile-avatar').textContent = newName[0].toUpperCase();
      showToast('Профиль сохранён', 'success');
    } catch (err) {
      showToast('Ошибка сохранения', 'error');
    } finally {
      btn.disabled = false;
    }
  });
}

function loadOrders(uid) {
  const ref = collection(db, 'orders');
  const q = query(ref, where('userId', '==', uid), orderBy('createdAt', 'desc'));

  if (ordersUnsub) ordersUnsub();
  ordersUnsub = onSnapshot(q, (snap) => {
    const list = document.getElementById('orders-list');
    list.innerHTML = '';

    if (snap.empty) {
      list.innerHTML = `
        <div class="empty-state">
          <span class="empty-state-icon">📦</span>
          <h3>Заказов нет</h3>
          <p>Оформите первый заказ в каталоге.</p>
          <a href="./index.html" class="btn btn-primary mt-16">В каталог</a>
        </div>`;
      return;
    }

    snap.forEach((d) => {
      const order = d.data();
      const status = STATUS_LABELS[order.status] || { label: order.status, cls: 'badge-info' };
      const el = document.createElement('div');
      el.className = 'order-item animate-fade-up';
      el.innerHTML = `
        <div class="order-header">
          <div>
            <div class="order-id"># ${d.id.slice(0, 8).toUpperCase()}</div>
            <div style="font-size:0.8rem;color:var(--text-muted);">${formatDate(order.createdAt)}</div>
          </div>
          <span class="badge ${status.cls}">${status.label}</span>
          <span style="font-weight:700;">${formatPrice(order.total)}</span>
        </div>
        <div class="order-products">
          ${(order.items || []).slice(0, 3).map((item) => `
            <div class="order-product-row">
              <img class="order-product-img" src="${item.imageUrl || 'https://placehold.co/44x44/1a1a1a/555?text=📦'}" alt="${item.name}" />
              <span style="flex:1;">${item.name}</span>
              <span style="color:var(--text-muted);">${item.qty} шт.</span>
              <span>${formatPrice(item.price * item.qty)}</span>
            </div>`).join('')}
          ${order.items?.length > 3 ? `<p style="font-size:0.8rem;color:var(--text-muted);">и ещё ${order.items.length - 3} позиции...</p>` : ''}
        </div>
        <div class="order-footer">
          <span style="color:var(--text-muted);">📍 ${order.address || 'Адрес не указан'}</span>
          <span>${order.phone || ''}</span>
        </div>`;
      list.appendChild(el);
    });
  }, (error) => {
    console.error("Orders load error:", error);
    const list = document.getElementById('orders-list');
    list.innerHTML = `<div class="empty-state">
      <span class="empty-state-icon">⚠️</span>
      <h3>Ошибка загрузки</h3>
      <p style="font-size:0.875rem;color:var(--text-secondary);max-width:300px;margin:10px auto;">
        ${error.message}
      </p>
      <p style="font-size:0.75rem;color:var(--text-muted);">
        Откройте консоль (F12) и нажмите на ссылку от Firebase, чтобы создать индекс.
      </p>
    </div>`;
  });
}

async function loadMyReviews(uid) {
  const list = document.getElementById('my-reviews-list');
  list.innerHTML = '<div class="loader"><div class="spinner"></div></div>';

  // collectionGroup query
  const q = query(
    collectionGroup(db, 'reviews'),
    where('userId', '==', uid),
    orderBy('createdAt', 'desc')
  );

  try {
    const snap = await getDocs(q);
    list.innerHTML = '';

    if (snap.empty) {
      list.innerHTML = `<div class="empty-state"><span class="empty-state-icon">⭐</span><h3>Нет отзывов</h3><p>Вы ещё не оставляли отзывов.</p></div>`;
      return;
    }

    snap.forEach((d) => {
      const data = d.data();
      const el = document.createElement('div');
      el.className = 'review-manage-item animate-fade-up';
      const productId = d.ref.parent.parent.id;
      el.innerHTML = `
        <div style="flex:1;">
          <div style="display:flex;align-items:center;gap:8px;margin-bottom:8px;">
            <span class="stars" style="font-size:0.85rem;">${renderStars(data.rating)}</span>
            <span style="font-size:0.75rem;color:var(--text-muted);">${data.createdAt?.toDate?.().toLocaleDateString('ru-RU') || ''}</span>
          </div>
          <a href="./product.html?id=${productId}" style="font-size:0.8rem;color:var(--accent);text-decoration:underline;">Перейти к товару</a>
          <p style="font-size:0.875rem;color:var(--text-secondary);margin-top:6px;line-height:1.6;">${data.text}</p>
        </div>
        <button class="btn btn-danger btn-sm" data-rid="${d.id}" data-pid="${productId}">🗑</button>`;

      el.querySelector('button')?.addEventListener('click', async (e) => {
        if (!confirm('Удалить отзыв?')) return;
        const { increment, updateDoc, doc: docFn } = await import('firebase/firestore');
        const rid = e.currentTarget.dataset.rid;
        const pid = e.currentTarget.dataset.pid;
        await deleteDoc(doc(db, 'products', pid, 'reviews', rid));
        await updateDoc(doc(db, 'products', pid), { reviewCount: increment(-1) });
        el.remove();
        showToast('Отзыв удалён', 'info');
      });

      list.appendChild(el);
    });
  } catch (err) {
    console.error(err);
    list.innerHTML = '<p style="color:var(--text-muted);padding:24px;">Не удалось загрузить отзывы.</p>';
  }
}

document.addEventListener('DOMContentLoaded', () => {
  initAuthModal();
  initNavbar();

  const pageLoader = document.getElementById('page-loader');

  onAuthChange((user, userData) => {
    if (pageLoader) pageLoader.classList.add('hidden');
    if (!user) {
      document.getElementById('profile-auth-guard').style.display = 'block';
      document.getElementById('profile-content').style.display = 'none';
      document.getElementById('profile-login-btn')?.addEventListener('click', () => openAuthModal('login'));
      return;
    }
    initProfile(user, userData);
  });
});
