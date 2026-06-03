document.addEventListener("DOMContentLoaded", () => {
    const user = getCurrentUser();
    const container = document.getElementById("profile-container");

    if (!user) {
        container.innerHTML = '<p class="empty-cart">Вы не вошли в аккаунт. <a href="auth.html">Войти</a></p>';
        return;
    }

    const successParam = new URLSearchParams(window.location.search).get("success");
    const successBanner = successParam
        ? `<div class="success-banner">Заказ успешно оформлен! Спасибо за покупку.</div>`
        : "";

    const allOrders = JSON.parse(localStorage.getItem("orders")) || [];
    const orders = allOrders.filter(o => o.userEmail === user.email).slice().reverse();

    const paymentLabels = { card: "Картой онлайн", cash: "Наличными", transfer: "Банковским переводом" };

    container.innerHTML = `
        ${successBanner}
        <div class="profile-info">
            <div class="profile-avatar">${user.name[0].toUpperCase()}</div>
            <div>
                <h3>${user.name}</h3>
                <p class="profile-email">${user.email}</p>
            </div>
        </div>

        <h3 class="orders-heading">История заказов</h3>
        ${orders.length === 0
            ? '<p class="empty-cart">У вас пока нет заказов. <a href="index.html">Перейти в каталог</a></p>'
            : orders.map(order => `
                <div class="order-card">
                    <div class="order-card-header">
                        <span class="order-id">Заказ #${String(order.id).slice(-6)}</span>
                        <span class="order-date">${order.date}</span>
                        <span class="order-total-badge">${order.total} $</span>
                    </div>
                    <ul class="order-items-list">
                        ${order.items.map(item => `
                            <li>${item.product.title} <span class="order-qty">× ${item.quantity}</span></li>
                        `).join('')}
                    </ul>
                    <div class="order-meta">
                        <span>📍 ${order.address}</span>
                        <span>📞 ${order.phone}</span>
                        <span>💳 ${paymentLabels[order.payment] || order.payment}</span>
                    </div>
                </div>
            `).join('')}
    `;
});
