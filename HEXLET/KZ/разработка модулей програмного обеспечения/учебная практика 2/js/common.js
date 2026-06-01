function getCurrentUser() {
    return JSON.parse(localStorage.getItem("currentUser"));
}

function setCurrentUser(user) {
    localStorage.setItem("currentUser", JSON.stringify(user));
}

function logoutUser() {
    localStorage.removeItem("currentUser");
}

function getCartCount() {
    const data = JSON.parse(localStorage.getItem("cart")) || [];
    return data.reduce((sum, item) => sum + item.quantity, 0);
}

function updateCartCount() {
    const badge = document.getElementById("cart-count");
    if (badge) badge.textContent = getCartCount();
}

function renderHeader() {
    const header = document.getElementById("header");
    if (!header) return;

    const user = getCurrentUser();
    const count = getCartCount();

    header.innerHTML = `
        <div class="header-inner">
            <div class="logo"><a href="index.html">TOXON shop</a></div>
            <nav>
                <a href="index.html">Главная</a>
                <a href="cart.html" class="cart-link">
                    Корзина <span id="cart-count" class="cart-badge">${count}</span>
                </a>
                ${user
                    ? `<span class="user-greeting">Привет, ${user.name}</span>
                       <button id="logout-btn" class="btn-logout">Выйти</button>`
                    : `<a href="auth.html">Вход / Регистрация</a>`}
            </nav>
        </div>
    `;

    if (user) {
        document.getElementById("logout-btn").addEventListener("click", () => {
            logoutUser();
            window.location.reload();
        });
    }
}

document.addEventListener("DOMContentLoaded", renderHeader);
