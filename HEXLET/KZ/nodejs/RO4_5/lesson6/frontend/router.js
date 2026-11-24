import { getAuthState } from './authState.js';
import { renderHome, renderLogin, renderProfile, renderForbidden, renderLoading } from './views.js';
export function requireUser() {
    if (getAuthState().status === 'authenticated') return true;
    location.hash = '#/login'; return false;
}
export function requireAdmin() { return requireUser() && getAuthState().user.role === 'admin'; }
export function renderNavigation() {
    const auth = getAuthState();
    document.querySelector('#navigation').innerHTML = '<a href="#/">Каталог</a>' +
        (auth.status === 'authenticated' ? '<a href="#/profile">Профиль</a><a href="#/orders">Мои заказы</a>' +
            (auth.user.role === 'admin' ? '<a href="#/admin">Admin</a>' : '') + '<button id="logout-button">Выйти</button>' : '<a href="#/login">Войти</a>');
}
export function renderRoute() {
    const app = document.querySelector('#app'); const auth = getAuthState();
    const route = location.hash || '#/';
    if (auth.status === 'loading') { renderLoading(app); return; }
    if (route === '#/login') {
        if (auth.status === 'authenticated') { location.hash = '#/profile'; return; }
        renderLogin(app); return;
    }
    if (['#/profile', '#/orders', '#/admin'].includes(route) && !requireUser()) { app.replaceChildren(); return; }
    if (route === '#/profile') { renderProfile(app, auth.user); return; }
    if (route === '#/orders') { app.innerHTML = '<h1>Мои заказы</h1><p id="orders-status">Загрузка...</p><div id="orders"></div>'; return; }
    if (route === '#/admin') {
        if (!requireAdmin()) { renderForbidden(app); return; }
        app.innerHTML = '<h1>Admin Panel</h1><p>Управление каталогом доступно администратору.</p><form id="product-form"><input name="name" placeholder="Название" minlength="2" required><input name="price" type="number" min="1" placeholder="Цена" required><input name="categoryId" type="number" min="1" value="1" required><button>Добавить товар</button></form><p id="admin-status"></p><div id="image-upload"><h2>Изображение товара</h2><form id="image-form"><input name="productId" type="number" min="1" value="1" required><input name="image" type="file" accept="image/jpeg,image/png" required><button>Загрузить</button></form><p id="image-status"></p></div>'; return;
    }
    renderHome(app);
}
