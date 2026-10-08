// src/pages/auth.js
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  sendPasswordResetEmail,
  onAuthStateChanged,
  updateProfile,
} from 'firebase/auth';
import { doc, setDoc, getDoc, serverTimestamp } from 'firebase/firestore';
import { auth, db } from '../firebase.js';
import { showToast } from '../components/toast.js';

// ===== Global auth state =====
export let currentUser = null;
export let currentUserData = null;

const authListeners = [];
export function onAuthChange(callback) {
  authListeners.push(callback);
}

onAuthStateChanged(auth, async (user) => {
  currentUser = user;
  if (user) {
    const snap = await getDoc(doc(db, 'users', user.uid));
    currentUserData = snap.exists() ? snap.data() : null;
  } else {
    currentUserData = null;
  }
  authListeners.forEach((cb) => cb(user, currentUserData));
});

// ===== Register =====
export async function register(email, password, displayName) {
  const cred = await createUserWithEmailAndPassword(auth, email, password);
  await updateProfile(cred.user, { displayName });
  await setDoc(doc(db, 'users', cred.user.uid), {
    uid: cred.user.uid,
    displayName,
    email,
    phone: '',
    role: 'user',
    createdAt: serverTimestamp(),
  });
  return cred.user;
}

// ===== Login =====
export async function login(email, password) {
  const cred = await signInWithEmailAndPassword(auth, email, password);
  return cred.user;
}

// ===== Logout =====
export async function logout() {
  await signOut(auth);
}

// ===== Password reset =====
export async function resetPassword(email) {
  await sendPasswordResetEmail(auth, email);
}

// ===== Auth Modal =====
let modalEl = null;

export function initAuthModal() {
  if (document.getElementById('auth-modal-overlay')) return;

  const html = `
  <div id="auth-modal-overlay" class="modal-overlay">
    <div class="modal" role="dialog" aria-modal="true" aria-labelledby="auth-modal-title">
      <button class="modal-close" id="auth-modal-close" aria-label="Close">✕</button>

      <!-- Login tab -->
      <div id="auth-view-login">
        <h2 class="modal-title" id="auth-modal-title">Войти</h2>
        <p class="modal-subtitle">Введите данные для входа в аккаунт</p>
        <form id="login-form" novalidate>
          <div class="form-group mb-16">
            <label class="form-label" for="login-email">Email</label>
            <input class="form-input" type="email" id="login-email" placeholder="you@example.com" autocomplete="email" required />
          </div>
          <div class="form-group mb-24">
            <label class="form-label" for="login-password">Пароль</label>
            <input class="form-input" type="password" id="login-password" placeholder="••••••••" autocomplete="current-password" required />
          </div>
          <p id="login-error" class="form-error mb-16" style="display:none"></p>
          <button type="submit" class="btn btn-primary btn-full btn-lg">Войти</button>
        </form>
        <div class="divider"></div>
        <div style="display:flex;justify-content:space-between;font-size:0.85rem;">
          <button class="btn-ghost" id="show-register">Регистрация</button>
          <button class="btn-ghost" id="show-reset">Забыли пароль?</button>
        </div>
      </div>

      <!-- Register tab -->
      <div id="auth-view-register" style="display:none">
        <h2 class="modal-title">Регистрация</h2>
        <p class="modal-subtitle">Создайте новый аккаунт</p>
        <form id="register-form" novalidate>
          <div class="form-group mb-16">
            <label class="form-label" for="reg-name">Имя</label>
            <input class="form-input" type="text" id="reg-name" placeholder="Иван Иванов" required />
          </div>
          <div class="form-group mb-16">
            <label class="form-label" for="reg-email">Email</label>
            <input class="form-input" type="email" id="reg-email" placeholder="you@example.com" autocomplete="email" required />
          </div>
          <div class="form-group mb-24">
            <label class="form-label" for="reg-password">Пароль</label>
            <input class="form-input" type="password" id="reg-password" placeholder="Минимум 6 символов" autocomplete="new-password" required />
          </div>
          <p id="reg-error" class="form-error mb-16" style="display:none"></p>
          <button type="submit" class="btn btn-primary btn-full btn-lg">Создать аккаунт</button>
        </form>
        <div class="divider"></div>
        <div style="text-align:center;font-size:0.85rem;">
          Уже есть аккаунт? <button class="btn-ghost" id="show-login">Войти</button>
        </div>
      </div>

      <!-- Reset tab -->
      <div id="auth-view-reset" style="display:none">
        <h2 class="modal-title">Сброс пароля</h2>
        <p class="modal-subtitle">Отправим ссылку на ваш email</p>
        <form id="reset-form" novalidate>
          <div class="form-group mb-24">
            <label class="form-label" for="reset-email">Email</label>
            <input class="form-input" type="email" id="reset-email" placeholder="you@example.com" required />
          </div>
          <p id="reset-error" class="form-error mb-16" style="display:none"></p>
          <button type="submit" class="btn btn-primary btn-full btn-lg">Отправить письмо</button>
        </form>
        <div class="divider"></div>
        <div style="text-align:center;font-size:0.85rem;">
          <button class="btn-ghost" id="show-login-from-reset">← Вернуться к входу</button>
        </div>
      </div>
    </div>
  </div>`;

  document.body.insertAdjacentHTML('beforeend', html);

  modalEl = document.getElementById('auth-modal-overlay');

  // Close handlers
  document.getElementById('auth-modal-close').addEventListener('click', closeAuthModal);
  modalEl.addEventListener('click', (e) => { if (e.target === modalEl) closeAuthModal(); });
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape') closeAuthModal(); });

  // Tab switches
  document.getElementById('show-register').addEventListener('click', () => switchView('register'));
  document.getElementById('show-login').addEventListener('click', () => switchView('login'));
  document.getElementById('show-reset').addEventListener('click', () => switchView('reset'));
  document.getElementById('show-login-from-reset').addEventListener('click', () => switchView('login'));

  // Login form
  document.getElementById('login-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const btn = e.submitter;
    const errEl = document.getElementById('login-error');
    errEl.style.display = 'none';
    btn.disabled = true;
    btn.textContent = 'Входим...';
    try {
      await login(
        document.getElementById('login-email').value.trim(),
        document.getElementById('login-password').value,
      );
      showToast('Добро пожаловать!', 'success');
      closeAuthModal();
    } catch (err) {
      errEl.textContent = friendlyError(err.code);
      errEl.style.display = 'block';
    } finally {
      btn.disabled = false;
      btn.textContent = 'Войти';
    }
  });

  // Register form
  document.getElementById('register-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const btn = e.submitter;
    const errEl = document.getElementById('reg-error');
    errEl.style.display = 'none';
    btn.disabled = true;
    btn.textContent = 'Создаём...';
    try {
      await register(
        document.getElementById('reg-email').value.trim(),
        document.getElementById('reg-password').value,
        document.getElementById('reg-name').value.trim(),
      );
      showToast('Аккаунт создан!', 'success');
      closeAuthModal();
    } catch (err) {
      errEl.textContent = friendlyError(err.code);
      errEl.style.display = 'block';
    } finally {
      btn.disabled = false;
      btn.textContent = 'Создать аккаунт';
    }
  });

  // Reset form
  document.getElementById('reset-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const btn = e.submitter;
    const errEl = document.getElementById('reset-error');
    errEl.style.display = 'none';
    btn.disabled = true;
    try {
      await resetPassword(document.getElementById('reset-email').value.trim());
      showToast('Письмо отправлено! Проверьте email.', 'success');
      closeAuthModal();
    } catch (err) {
      errEl.textContent = friendlyError(err.code);
      errEl.style.display = 'block';
    } finally {
      btn.disabled = false;
    }
  });
}

function switchView(view) {
  ['login', 'register', 'reset'].forEach((v) => {
    document.getElementById(`auth-view-${v}`).style.display = v === view ? 'block' : 'none';
  });
}

export function openAuthModal(view = 'login') {
  if (!modalEl) initAuthModal();
  switchView(view);
  modalEl.classList.add('active');
}

export function closeAuthModal() {
  if (modalEl) modalEl.classList.remove('active');
}

function friendlyError(code) {
  const map = {
    'auth/invalid-email': 'Некорректный email.',
    'auth/user-not-found': 'Пользователь не найден.',
    'auth/wrong-password': 'Неверный пароль.',
    'auth/email-already-in-use': 'Email уже занят.',
    'auth/weak-password': 'Пароль слишком простой (минимум 6 символов).',
    'auth/invalid-credential': 'Неверный email или пароль.',
    'auth/too-many-requests': 'Слишком много попыток. Попробуйте позже.',
    'auth/network-request-failed': 'Нет подключения к сети.',
  };
  return map[code] || 'Произошла ошибка. Попробуйте снова.';
}
