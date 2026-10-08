// src/pages/cart.js
import {
  collection, doc, onSnapshot, setDoc, deleteDoc,
  getDocs, writeBatch, serverTimestamp,
} from 'firebase/firestore';
import { db } from '../firebase.js';
import { initNavbar } from '../components/navbar.js';
import { initAuthModal, onAuthChange, openAuthModal } from './auth.js';
import { showToast } from '../components/toast.js';

// ===== Shared helper (used by catalog & product pages) =====
export async function addToCart(uid, product, qty = 1) {
  const itemRef = doc(db, 'cartItems', uid, 'items', product.id);
  // Increment if already in cart
  const snap = await import('firebase/firestore').then(({ getDoc }) => getDoc(itemRef));
  if (snap.exists()) {
    const currentQty = snap.data().qty || 1;
    await setDoc(itemRef, { qty: currentQty + qty }, { merge: true });
  } else {
    await setDoc(itemRef, {
      productId: product.id,
      name: product.name,
      price: product.price,
      imageUrl: product.imageUrl || '',
      qty,
      addedAt: serverTimestamp(),
    });
  }
}

// ===== Cart page logic =====
function formatPrice(p) { return p.toLocaleString('ru-RU') + ' ₸'; }

let cartUnsub = null;
let cartData = {};

function renderCart(uid) {
  const ref = collection(db, 'cartItems', uid, 'items');
  cartUnsub = onSnapshot(ref, (snap) => {
    cartData = {};
    snap.forEach((d) => { cartData[d.id] = { id: d.id, ...d.data() }; });

    document.getElementById('cart-loader').style.display = 'none';

    if (snap.empty) {
      document.getElementById('cart-content').style.display = 'none';
      document.getElementById('cart-empty').style.display = 'block';
      return;
    }

    document.getElementById('cart-empty').style.display = 'none';
    document.getElementById('cart-content').style.display = 'block';

    const items = Object.values(cartData);
    const totalQty = items.reduce((s, i) => s + (i.qty || 1), 0);
    const totalPrice = items.reduce((s, i) => s + i.price * (i.qty || 1), 0);

    document.getElementById('cart-items-count').textContent = `${items.length} позиции`;
    document.getElementById('sum-count').textContent = totalQty;
    document.getElementById('sum-subtotal').textContent = formatPrice(totalPrice);
    document.getElementById('sum-total').textContent = formatPrice(totalPrice);

    const list = document.getElementById('cart-items-list');
    list.innerHTML = '';
    items.forEach((item) => {
      const row = document.createElement('div');
      row.className = 'cart-item animate-fade-up';
      row.innerHTML = `
        <img class="cart-item-img" src="${item.imageUrl || 'https://placehold.co/80x80/1a1a1a/555?text=📦'}" alt="${item.name}" />
        <div>
          <div class="cart-item-name">${item.name}</div>
          <div class="cart-item-price">${formatPrice(item.price)} за шт.</div>
          <div class="cart-item-controls mt-8">
            <button class="qty-btn-sm" data-action="dec" data-id="${item.id}">−</button>
            <span class="qty-val">${item.qty || 1}</span>
            <button class="qty-btn-sm" data-action="inc" data-id="${item.id}">+</button>
          </div>
        </div>
        <div style="display:flex;flex-direction:column;align-items:flex-end;gap:8px;">
          <span style="font-weight:700;font-family:'Space Grotesk',sans-serif;">${formatPrice(item.price * (item.qty || 1))}</span>
          <button class="btn btn-danger btn-sm" data-action="remove" data-id="${item.id}">🗑</button>
        </div>`;
      list.appendChild(row);
    });
  }, (error) => {
    console.error('Cart onSnapshot error:', error.code, error.message);
    document.getElementById('cart-loader').style.display = 'none';
    document.getElementById('cart-content').style.display = 'none';
    document.getElementById('cart-empty').style.display = 'block';
    showToast(`Ошибка корзины: ${error.code}`, 'error');
  });

  // Delegate qty & remove events
  document.getElementById('cart-items-list').addEventListener('click', async (e) => {
    const btn = e.target.closest('[data-action]');
    if (!btn) return;
    const { action, id } = btn.dataset;
    const itemRef = doc(db, 'cartItems', uid, 'items', id);
    if (action === 'remove') {
      await deleteDoc(itemRef);
      showToast('Товар удалён из корзины', 'info');
    } else if (action === 'inc') {
      const item = cartData[id];
      await setDoc(itemRef, { qty: (item.qty || 1) + 1 }, { merge: true });
    } else if (action === 'dec') {
      const item = cartData[id];
      const newQty = (item.qty || 1) - 1;
      if (newQty < 1) {
        await deleteDoc(itemRef);
        showToast('Товар удалён из корзины', 'info');
      } else {
        await setDoc(itemRef, { qty: newQty }, { merge: true });
      }
    }
  });
}

async function checkout(uid) {
  const address = document.getElementById('checkout-address').value.trim();
  const phone = document.getElementById('checkout-phone').value.trim();
  if (!address) { showToast('Введите адрес доставки', 'warning'); return; }

  const btn = document.getElementById('checkout-btn');
  btn.disabled = true;
  btn.textContent = 'Оформляем...';

  try {
    const items = Object.values(cartData);
    if (!items.length) return;

    const total = items.reduce((s, i) => s + i.price * (i.qty || 1), 0);

    // Create order
    const { doc: docFn, collection: colFn, addDoc } = await import('firebase/firestore');
    await addDoc(collection(db, 'orders'), {
      userId: uid,
      items: items.map((i) => ({ productId: i.id, name: i.name, price: i.price, qty: i.qty || 1, imageUrl: i.imageUrl || '' })),
      total,
      address,
      phone,
      status: 'pending',
      createdAt: serverTimestamp(),
    });

    // Clear cart
    const cartRef = collection(db, 'cartItems', uid, 'items');
    const snap = await getDocs(cartRef);
    const batch = writeBatch(db);
    snap.forEach((d) => batch.delete(d.ref));
    await batch.commit();

    showToast('Заказ оформлен! 🎉', 'success', 5000);
    setTimeout(() => { window.location.href = './profile.html'; }, 1500);
  } catch (err) {
    console.error(err);
    showToast('Ошибка при оформлении заказа', 'error');
    btn.disabled = false;
    btn.textContent = 'Оформить заказ';
  }
}

document.addEventListener('DOMContentLoaded', () => {
  const loaderEl = document.getElementById('cart-loader');
  const guardEl = document.getElementById('cart-auth-guard');
  if (!loaderEl && !guardEl) return; // Only run cart page logic on cart.html

  initAuthModal();
  initNavbar();

  const pageLoader = document.getElementById('page-loader');

  onAuthChange((user) => {
    if (pageLoader) pageLoader.classList.add('hidden');

    if (!user) {
      if (loaderEl) loaderEl.style.display = 'none';
      if (guardEl) guardEl.style.display = 'block';
      document.getElementById('cart-content')?.style.setProperty('display', 'none');
      document.getElementById('cart-empty')?.style.setProperty('display', 'none');
      document.getElementById('cart-login-btn')?.addEventListener('click', () => openAuthModal('login'));
      return;
    }

    if (guardEl) guardEl.style.display = 'none';
    if (cartUnsub) cartUnsub();
    renderCart(user.uid);
  });

  document.getElementById('clear-cart-btn')?.addEventListener('click', async () => {
    const { collection: colFn, getDocs: getDocsFn, writeBatch: wb } = await import('firebase/firestore');
    const uid = (await import('./auth.js')).currentUser?.uid;
    if (!uid) return;
    if (!confirm('Очистить корзину?')) return;
    const ref = collection(db, 'cartItems', uid, 'items');
    const snap = await getDocs(ref);
    const batch = writeBatch(db);
    snap.forEach((d) => batch.delete(d.ref));
    await batch.commit();
    showToast('Корзина очищена', 'info');
  });

  document.getElementById('checkout-btn')?.addEventListener('click', async () => {
    const uid = (await import('./auth.js')).currentUser?.uid;
    if (uid) checkout(uid);
  });
});
