// src/pages/catalog.js
import {
  collection, query, where, orderBy, limit, startAfter,
  getDocs, onSnapshot,
} from 'firebase/firestore';
import { db } from '../firebase.js';
import { initNavbar } from '../components/navbar.js';
import { initAuthModal, currentUser } from './auth.js';
import { showToast } from '../components/toast.js';
import { addToCart } from './cart.js';

const PAGE_SIZE = 12;
let lastDoc = null;
let isLoading = false;
let currentCategory = '';
let currentSort = 'createdAt_desc';
let searchQuery = '';
let realtimeUnsub = null;

const grid = () => document.getElementById('catalog-grid');
const loadMoreBtn = () => document.getElementById('load-more-btn');
const catalogLoader = () => document.getElementById('catalog-loader');
const pageLoader = () => document.getElementById('page-loader');

function buildQuery(afterDoc = null) {
  const ref = collection(db, 'products');
  const constraints = [];

  if (searchQuery) {
    // Search mode: only filter by nameTokens, no orderBy to avoid composite index requirement
    constraints.push(where('nameTokens', 'array-contains', searchQuery));
  } else {
    if (currentCategory) {
      constraints.push(where('category', '==', currentCategory));
    }
    const [sortField, sortDir] = currentSort.split('_');
    constraints.push(orderBy(sortField, sortDir));
  }

  constraints.push(limit(PAGE_SIZE));
  if (afterDoc) constraints.push(startAfter(afterDoc));

  return query(ref, ...constraints);
}

function renderStars(rating = 0) {
  const full = Math.round(rating);
  return '★'.repeat(full) + '☆'.repeat(5 - full);
}

function categoryLabel(cat) {
  const map = { electronics: 'Электроника', clothing: 'Одежда', home: 'Дом и сад', sports: 'Спорт', books: 'Книги' };
  return map[cat] || cat;
}

function formatPrice(p) {
  return p.toLocaleString('ru-RU') + ' ₸';
}

function createCard(doc) {
  const d = doc.data();
  const card = document.createElement('div');
  card.className = 'product-card animate-fade-up';
  card.dataset.id = doc.id;
  card.innerHTML = `
    <div class="product-card-img">
      <img src="${d.imageUrl || 'https://placehold.co/400x300/1a1a1a/555?text=Нет+фото'}" alt="${d.name}" loading="lazy" />
      ${d.stock === 0 ? '<span class="product-card-badge" style="background:var(--text-muted)">Нет в наличии</span>' : ''}
    </div>
    <div class="product-card-body">
      <span class="product-card-category">${categoryLabel(d.category)}</span>
      <div class="product-card-name">${d.name}</div>
      <div class="product-card-stars">
        <span class="stars">${renderStars(d.rating)}</span>
        <span class="stars-count">${d.reviewCount || 0} отзывов</span>
      </div>
    </div>
    <div class="product-card-footer">
      <div>
        <span class="product-price">${formatPrice(d.price)}</span>
      </div>
      <button class="btn-add-cart" data-id="${doc.id}" title="В корзину" ${d.stock === 0 ? 'disabled style="opacity:0.4;cursor:not-allowed"' : ''}>+</button>
    </div>`;

  card.addEventListener('click', (e) => {
    if (e.target.closest('.btn-add-cart')) return;
    window.location.href = `./product.html?id=${doc.id}`;
  });

  card.querySelector('.btn-add-cart')?.addEventListener('click', async (e) => {
    e.stopPropagation();
    if (!currentUser) {
      showToast('Войдите, чтобы добавить в корзину', 'warning');
      return;
    }
    const btn = e.currentTarget;
    btn.disabled = true;
    try {
      await addToCart(currentUser.uid, { id: doc.id, name: d.name, price: d.price, imageUrl: d.imageUrl });
      showToast(`${d.name} добавлен в корзину`, 'success');
      btn.textContent = '✓';
      setTimeout(() => { btn.textContent = '+'; btn.disabled = false; }, 1500);
    } catch (err) {
      showToast('Ошибка при добавлении', 'error');
      btn.disabled = false;
    }
  });

  return card;
}

async function loadProducts(reset = false) {
  if (isLoading) return;
  isLoading = true;

  if (reset) {
    grid().innerHTML = '';
    lastDoc = null;
    loadMoreBtn().style.display = 'none';
  }

  catalogLoader().style.display = 'flex';
  loadMoreBtn().style.display = 'none';

  try {
    const q = buildQuery(reset ? null : lastDoc);
    const snap = await getDocs(q);

    if (snap.empty && reset) {
      grid().innerHTML = `
        <div class="empty-state" style="grid-column:1/-1">
          <span class="empty-state-icon">🔍</span>
          <h3>Ничего не найдено</h3>
          <p>Попробуйте изменить фильтры или поисковый запрос.</p>
        </div>`;
    } else {
      snap.forEach((doc) => grid().appendChild(createCard(doc)));
      lastDoc = snap.docs[snap.docs.length - 1];
      loadMoreBtn().style.display = snap.size === PAGE_SIZE ? 'inline-flex' : 'none';
    }
  } catch (err) {
    console.error(err);
    showToast('Ошибка загрузки товаров', 'error');
    if (reset) {
      const match = err.message && err.message.match(/https:\/\/console\.firebase\.google\.com[^\s]+/);
      const indexUrl = match ? match[0] : null;

      grid().innerHTML = `
        <div class="empty-state" style="grid-column:1/-1">
          <span class="empty-state-icon">⚠️</span>
          <h3>Требуется индекс Firestore</h3>
          <p style="font-size:0.875rem;color:var(--text-secondary);max-width:480px;margin:10px auto;line-height:1.5;">
            Для фильтрации по этой категории требуется составной индекс. Нажмите кнопку ниже, чтобы создать его в консоли Firebase:
          </p>
          ${indexUrl ? `<a href="${indexUrl}" target="_blank" class="btn btn-primary mt-12" style="display:inline-flex;align-items:center;gap:6px;text-decoration:none;">🔗 Создать индекс в 1 клик</a>` : ''}
        </div>`;
    }
  } finally {
    isLoading = false;
    catalogLoader().style.display = 'none';
  }
}

function setupRealtime() {
  if (realtimeUnsub) realtimeUnsub();
  // Real-time: watch first page and refresh grid on new additions (no category/search filter for simplicity)
  const q = query(collection(db, 'products'), orderBy('createdAt', 'desc'), limit(1));
  realtimeUnsub = onSnapshot(q, (snap) => {
    if (!snap.metadata.hasPendingWrites && !snap.empty) {
      // Only reload if item not already rendered
      const newest = snap.docs[0];
      const existing = document.querySelector(`[data-id="${newest.id}"]`);
      if (!existing) {
        const card = createCard(newest);
        card.style.border = '1px solid var(--border-accent)';
        grid().insertBefore(card, grid().firstChild);
        setTimeout(() => { if (card.parentNode) card.style.border = ''; }, 3000);
      }
    }
  });
}

// ===== Init =====
document.addEventListener('DOMContentLoaded', () => {
  initAuthModal();
  initNavbar((q) => {
    if (q.length === 1) return; // minimum 2 chars
    searchQuery = q;
    loadProducts(true);
  });

  // Filters
  document.getElementById('filters-bar').addEventListener('click', (e) => {
    const chip = e.target.closest('.filter-chip');
    if (!chip) return;
    document.querySelectorAll('.filter-chip').forEach((c) => c.classList.remove('active'));
    chip.classList.add('active');
    currentCategory = chip.dataset.category;
    searchQuery = '';
    const navInput = document.getElementById('nav-search-input');
    if (navInput) navInput.value = '';
    loadProducts(true);
  });

  document.getElementById('sort-select').addEventListener('change', (e) => {
    currentSort = e.target.value;
    loadProducts(true);
  });

  document.getElementById('load-more-btn').addEventListener('click', () => loadProducts(false));

  loadProducts(true);
  setupRealtime();

  // Hide page loader
  setTimeout(() => {
    const pl = pageLoader();
    if (pl) pl.classList.add('hidden');
  }, 400);
});
