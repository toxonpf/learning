import { apiFetch } from './api.js';
import { setAuthenticated, setGuest, setLoading } from './authState.js';
import { renderRoute, renderNavigation } from './router.js';
async function loadList(path, id, statusId) {
    const container = document.getElementById(id); const status = document.getElementById(statusId);
    if (!container) return;
    status.textContent = 'Загрузка...';
    try {
        const data = await apiFetch(path);
        if (!container.isConnected) return;
        container.replaceChildren();
        for (const item of data) {
            const element = document.createElement('article');
            element.textContent = item.name ? `${item.name} — ${item.price} ₸` : `Заказ #${item.id}: ${item.status}`;
            container.append(element);
        }
        status.textContent = `Загружено: ${data.length}`;
    } catch (error) { if (status.isConnected) status.textContent = error.message; }
}
export function refresh() {
    renderNavigation(); renderRoute();
    loadList('/products', 'catalog', 'catalog-status');
    loadList('/orders/my', 'orders', 'orders-status');
}
document.addEventListener('submit', async event => {
    const form = event.target;
    if (form.id === 'login-form') {
        event.preventDefault();
        const button = form.querySelector('button'); const errorBox = document.querySelector('#login-error');
        button.disabled = true; errorBox.textContent = 'Вход...'; setLoading();
        try {
            const data = await apiFetch('/auth/login', { method: 'POST', body: {
                email: document.querySelector('#email').value, password: document.querySelector('#password').value } });
            setAuthenticated(data.user, data.accessToken); location.hash = '#/orders'; refresh();
        } catch (error) { setGuest(); refresh(); document.querySelector('#login-error').textContent = error.message; }
    }
    if (form.id === 'product-form') {
        event.preventDefault(); const box = document.querySelector('#admin-status'); box.textContent = 'Сохранение...';
        try { const body = Object.fromEntries(new FormData(form)); body.price = Number(body.price); body.categoryId = Number(body.categoryId);
            const product = await apiFetch('/products', { method: 'POST', body }); box.textContent = `Создан товар #${product.id}`;
        } catch (error) { box.textContent = error.message; }
    }
});
document.addEventListener('click', async event => {
    if (event.target.id === 'logout-button') { setGuest(); location.hash = '#/'; refresh(); }
    if (event.target.id === 'me-button') {
        const status = document.querySelector('#me-status'); status.textContent = 'Загрузка...';
        try { const data = await apiFetch('/auth/me'); status.textContent = `Профиль загружен: ${data.user.email}`; }
        catch (error) { status.textContent = error.message; }
    }
});
window.addEventListener('auth-expired', () => { location.hash = '#/login'; refresh(); });
window.addEventListener('hashchange', refresh);
refresh();
