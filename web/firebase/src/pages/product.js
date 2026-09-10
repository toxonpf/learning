// src/pages/product.js
import {
  doc, getDoc, collection, query, orderBy, limit, startAfter,
  getDocs, addDoc, deleteDoc, onSnapshot, serverTimestamp,
  runTransaction, increment,
} from 'firebase/firestore';
import { db } from '../firebase.js';
import { initNavbar } from '../components/navbar.js';
import { initAuthModal, onAuthChange, currentUser, openAuthModal } from './auth.js';
import { addToCart } from './cart.js';
import { showToast } from '../components/toast.js';

const REVIEWS_PAGE = 5;
const params = new URLSearchParams(location.search);
const productId = params.get('id');

let product = null;
let reviewsLastDoc = null;
let qty = 1;
let stockUnsub = null;

function renderStars(r) { return '★'.repeat(Math.round(r)) + '☆'.repeat(5 - Math.round(r)); }
function formatPrice(p) { return p.toLocaleString('ru-RU') + ' ₸'; }
function categoryLabel(cat) {
  const map = { electronics: 'Электроника', clothing: 'Одежда', home: 'Дом и сад', sports: 'Спорт', books: 'Книги' };
  return map[cat] || cat;
}

async function loadProduct() {
  if (!productId) { window.location.href = './index.html'; return; }

  const snap = await getDoc(doc(db, 'products', productId));
  if (!snap.exists()) { showToast('Товар не найден', 'error'); window.location.href = './index.html'; return; }

  product = { id: snap.id, ...snap.data() };

  document.title = `${product.name} — SHOP.`;
  document.getElementById('breadcrumb-name').textContent = product.name;
  document.getElementById('product-img').src = product.imageUrl || 'https://placehold.co/600x600/1a1a1a/555?text=Нет+фото';
  document.getElementById('product-img').alt = product.name;
  document.getElementById('product-name').textContent = product.name;
  document.getElementById('product-category').textContent = categoryLabel(product.category);
  document.getElementById('product-desc').textContent = product.description || '';
  document.getElementById('product-stars').textContent = renderStars(product.rating || 0);
  document.getElementById('product-stats').textContent = `${(product.rating || 0).toFixed(1)} · ${product.reviewCount || 0} отзывов`;
  document.getElementById('product-price').textContent = formatPrice(product.price);

  updateStockUI(product.stock);

  // Real-time stock watcher
  stockUnsub = onSnapshot(doc(db, 'products', productId), (s) => {
    if (s.exists()) updateStockUI(s.data().stock);
  });

  document.getElementById('page-loader')?.classList.add('hidden');
}

function updateStockUI(stock) {
  const dot = document.getElementById('stock-dot');
  const text = document.getElementById('stock-text');
  const btn = document.getElementById('add-to-cart-btn');
  if (stock > 0) {
    dot.className = 'stock-dot in';
    text.textContent = `В наличии (${stock} шт.)`;
    if (btn) { btn.disabled = false; btn.textContent = '🛒 Добавить в корзину'; }
  } else {
    dot.className = 'stock-dot out';
    text.textContent = 'Нет в наличии';
    if (btn) { btn.disabled = true; btn.textContent = 'Нет в наличии'; }
  }
}

// ===== Qty controls =====
function setupQty() {
  document.getElementById('qty-minus')?.addEventListener('click', () => {
    if (qty > 1) { qty--; document.getElementById('qty-val').textContent = qty; }
  });
  document.getElementById('qty-plus')?.addEventListener('click', () => {
    if (qty < (product?.stock || 99)) { qty++; document.getElementById('qty-val').textContent = qty; }
  });
}

// ===== Add to cart =====
function setupAddToCart() {
  document.getElementById('add-to-cart-btn')?.addEventListener('click', async () => {
    if (!currentUser) { openAuthModal('login'); return; }
    const btn = document.getElementById('add-to-cart-btn');
    btn.disabled = true;
    btn.textContent = 'Добавляем...';
    try {
      await addToCart(currentUser.uid, { id: product.id, name: product.name, price: product.price, imageUrl: product.imageUrl }, qty);
      showToast(`${product.name} (${qty} шт.) добавлен в корзину`, 'success');
      btn.textContent = '✓ Добавлено';
      setTimeout(() => { btn.disabled = false; btn.textContent = '🛒 Добавить в корзину'; }, 1800);
    } catch (err) {
      showToast('Ошибка', 'error');
      btn.disabled = false;
      btn.textContent = '🛒 Добавить в корзину';
    }
  });
}

// ===== Reviews =====
async function loadReviews(reset = false) {
  const reviewsRef = collection(db, 'products', productId, 'reviews');
  const constraints = [orderBy('createdAt', 'desc'), limit(REVIEWS_PAGE)];
  if (!reset && reviewsLastDoc) constraints.push(startAfter(reviewsLastDoc));

  const q = query(reviewsRef, ...constraints);
  const snap = await getDocs(q);

  const list = document.getElementById('reviews-list');
  if (reset) list.innerHTML = '';

  if (snap.empty && reset) {
    list.innerHTML = `<div class="empty-state"><span class="empty-state-icon">💬</span><h3>Нет отзывов</h3><p>Станьте первым!</p></div>`;
    document.getElementById('reviews-count-label').textContent = 'Нет отзывов';
    return;
  }

  document.getElementById('reviews-count-label').textContent = `${product?.reviewCount || snap.size} отзывов`;

  snap.forEach((d) => { list.appendChild(createReviewCard(d.id, d.data())); });
  reviewsLastDoc = snap.docs[snap.docs.length - 1];
  document.getElementById('reviews-load-more').style.display = snap.size === REVIEWS_PAGE ? 'inline-flex' : 'none';
}

function createReviewCard(id, data) {
  const card = document.createElement('div');
  card.className = 'review-card animate-fade-up';
  card.dataset.id = id;
  const date = data.createdAt?.toDate?.().toLocaleDateString('ru-RU') || '';
  const canDelete = currentUser && (currentUser.uid === data.userId);
  card.innerHTML = `
    <div class="review-header">
      <div class="avatar" style="font-size:0.9rem;">${(data.userName || 'А')[0].toUpperCase()}</div>
      <div class="review-meta">
        <div class="review-author">${data.userName || 'Аноним'}</div>
        <div class="review-date">${date}</div>
      </div>
      <span class="stars" style="font-size:0.9rem;">${renderStars(data.rating)}</span>
      ${canDelete ? `<button class="btn btn-danger btn-sm" data-delete-review="${id}">🗑</button>` : ''}
    </div>
    <p class="review-text">${data.text || ''}</p>`;

  card.querySelector(`[data-delete-review="${id}"]`)?.addEventListener('click', async () => {
    if (!confirm('Удалить отзыв?')) return;
    try {
      await runTransaction(db, async (tx) => {
        const productRef = doc(db, 'products', productId);
        const reviewRef = doc(db, 'products', productId, 'reviews', id);
        tx.delete(reviewRef);
        tx.update(productRef, { reviewCount: increment(-1) });
      });
      card.remove();
      showToast('Отзыв удалён', 'info');
    } catch (err) { showToast('Ошибка удаления', 'error'); }
  });

  return card;
}

async function submitReview() {
  if (!currentUser) { openAuthModal('login'); return; }
  const text = document.getElementById('review-text-input').value.trim();
  const rating = parseInt(document.querySelector('input[name="rating"]:checked')?.value || '3');
  if (!text) { showToast('Введите текст отзыва', 'warning'); return; }

  const btn = document.getElementById('submit-review-btn');
  btn.disabled = true;
  try {
    await runTransaction(db, async (tx) => {
      const productRef = doc(db, 'products', productId);
      const reviewRef = doc(collection(db, 'products', productId, 'reviews'));
      tx.set(reviewRef, {
        userId: currentUser.uid,
        userName: currentUser.displayName || 'Аноним',
        rating,
        text,
        productId,
        createdAt: serverTimestamp(),
      });
      tx.update(productRef, { reviewCount: increment(1) });
    });
    document.getElementById('review-text-input').value = '';
    document.getElementById('review-form-wrap').style.display = 'none';
    showToast('Отзыв опубликован!', 'success');
    loadReviews(true);
  } catch (err) {
    showToast('Ошибка публикации', 'error');
  } finally {
    btn.disabled = false;
  }
}

// ===== Related products =====
async function loadRelated() {
  if (!product) return;
  const rq = query(
    collection(db, 'products'),
    where('category', '==', product.category),
    limit(5),
  );
  const snap = await getDocs(rq);
  const grid = document.getElementById('related-grid');
  grid.innerHTML = '';
  let added = 0;
  snap.forEach((d) => {
    if (d.id === productId || added >= 4) return;
    added++;
    const data = d.data();
    const card = document.createElement('a');
    card.href = `./product.html?id=${d.id}`;
    card.className = 'product-card animate-fade-up';
    card.innerHTML = `
      <div class="product-card-img" style="aspect-ratio:1">
        <img src="${data.imageUrl || 'https://placehold.co/200x200/1a1a1a/555?text=📦'}" alt="${data.name}" loading="lazy" />
      </div>
      <div class="product-card-body">
        <div class="product-card-name">${data.name}</div>
      </div>
      <div class="product-card-footer">
        <span class="product-price">${formatPrice(data.price)}</span>
      </div>`;
    grid.appendChild(card);
  });
  if (added === 0) grid.innerHTML = '<p style="color:var(--text-muted);font-size:0.875rem;">Нет похожих товаров</p>';
}

document.addEventListener('DOMContentLoaded', async () => {
  initAuthModal();
  initNavbar();
  onAuthChange(() => {});

  await loadProduct();
  setupQty();
  setupAddToCart();
  loadReviews(true);
  loadRelated();

  document.getElementById('open-review-btn')?.addEventListener('click', () => {
    if (!currentUser) { openAuthModal('login'); return; }
    const wrap = document.getElementById('review-form-wrap');
    wrap.style.display = wrap.style.display === 'none' ? 'block' : 'none';
  });
  document.getElementById('cancel-review-btn')?.addEventListener('click', () => {
    document.getElementById('review-form-wrap').style.display = 'none';
  });
  document.getElementById('submit-review-btn')?.addEventListener('click', submitReview);
  document.getElementById('reviews-load-more')?.addEventListener('click', () => loadReviews(false));
});
