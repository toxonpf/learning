export function renderHome(app) { app.innerHTML = '<h1>Каталог товаров</h1><p id="catalog-status">Загрузка...</p><div id="catalog"></div>'; }
export function renderLogin(app) {
    app.innerHTML = '<h1>Вход</h1><form id="login-form"><label>Email <input id="email" type="email" autocomplete="username" required></label><label>Пароль <input id="password" type="password" autocomplete="current-password" required></label><button id="login-button">Войти</button></form><p id="login-error" role="alert"></p>';
}
export function renderProfile(app, user) {
    app.innerHTML = '<h1>Профиль</h1><div id="profile"></div><button id="me-button">Обновить профиль</button><p id="me-status"></p>';
    const text = document.createElement('p'); text.textContent = `${user.name} · ${user.email} · ${user.role}`;
    app.querySelector('#profile').append(text);
}
export function renderForbidden(app) { app.innerHTML = '<h1>403</h1><p>Недостаточно прав</p>'; }
export function renderLoading(app) { app.textContent = 'Загрузка...'; }
