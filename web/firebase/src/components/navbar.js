// src/components/navbar.js
import { onSnapshot, doc, collection } from 'firebase/firestore';
import { db } from '../firebase.js';
import { logout, onAuthChange, currentUser } from '../pages/auth.js';
import { openAuthModal } from '../pages/auth.js';
import { showToast } from './toast.js';

let cartUnsub = null;

export function initNavbar(searchCallback = null) {
  const navHtml = `
  <nav class="navbar" id="main-navbar">
    <div class="container navbar-inner">
      <a href="./index.html" class="navbar-logo">
        SHOP<span>.</span>
      </a>
      <div class="navbar-nav">
        <a href="./index.html" class="navbar-nav-link">Каталог</a>
        <a href="./profile.html" class="navbar-nav-link">Профиль</a>
      </div>
      ${searchCallback !== null ?`
      <div class="navbar-search">
        <input type="text" id="nav-search-input" placeholder="Поиск товаров..." autocomplete="off" />
        <span class="navbar-search-icon">🔍</span>
      </div>` : ''}
      <div class="navbar-actions" id="navbar-actions">
        <a href="./cart.html" class="btn-icon" id="navbar-cart-btn" title="Корзина">
          🛒
          <span class="cart-badge" id="cart-count" style="display:none">0</span>
        </a>
        <div id="navbar-user-area"></div>
      </div>
    </div>
  </nav>`;

  document.body.insertAdjacentHTML('afterbegin', navHtml);

  if (searchCallback) {
    const input = document.getElementById('nav-search-input');
    let debounce;
    input.addEventListener('input', () => {
      clearTimeout(debounce);
      debounce = setTimeout(() => searchCallback(input.value.trim().toLowerCase()), 350);
    });
  }

  onAuthChange(renderUserArea);
}

function renderUserArea(user, userData) {
  const area = document.getElementById('navbar-user-area');
  if (!area) return;

  if (cartUnsub) { cartUnsub(); cartUnsub = null; }

  if (user) {
    const isAdmin = userData?.role === 'admin';
    area.innerHTML = `
      <div style="display:flex;align-items:center;gap:8px;">
        ${isAdmin ? `<a href="./admin.html" class="btn btn-secondary btn-sm">Админ</a>` : ''}
        <a href="./profile.html" class="btn-icon" title="Профиль">👤</a>
        <button class="btn-icon" id="logout-btn" title="Выйти">🚪</button>
      </div>`;

    document.getElementById('logout-btn')?.addEventListener('click', async () => {
      await logout();
      showToast('Вы вышли из аккаунта', 'info');
      window.location.href = './index.html';
    });

    // Real-time cart badge
    const cartItemsRef = collection(db, 'cartItems', user.uid, 'items');
    cartUnsub = onSnapshot(cartItemsRef, (snap) => {
      const count = snap.size;
      const badge = document.getElementById('cart-count');
      if (!badge) return;
      if (count > 0) {
        badge.textContent = count > 99 ? '99+' : count;
        badge.style.display = 'flex';
      } else {
        badge.style.display = 'none';
      }
    });
  } else {
    area.innerHTML = `
      <button class="btn btn-primary btn-sm" id="navbar-login-btn">Войти</button>`;
    document.getElementById('navbar-login-btn')?.addEventListener('click', () => openAuthModal('login'));
    const badge = document.getElementById('cart-count');
    if (badge) badge.style.display = 'none';
  }
}
