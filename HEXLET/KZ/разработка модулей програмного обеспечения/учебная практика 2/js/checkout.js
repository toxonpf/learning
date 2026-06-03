document.addEventListener("DOMContentLoaded", () => {
    renderOrderSummary();
    setupCheckoutForm();
});

function loadCart() {
    const data = JSON.parse(localStorage.getItem("cart")) || [];
    return new Cart(data.map(item => new CartItem(
        new Product(item.product.id, item.product.title, item.product.price, item.product.description, item.product.image, item.product.category),
        item.quantity
    )));
}

function renderOrderSummary() {
    const cart = loadCart();
    const container = document.getElementById("order-summary");

    if (cart.items.length === 0) {
        container.innerHTML = '<p class="empty-cart">Корзина пуста. <a href="index.html">Перейти в каталог</a></p>';
        document.getElementById("checkout-form").style.display = "none";
        return;
    }

    container.innerHTML = `
        <h3>Ваш заказ</h3>
        <ul class="order-list">
            ${cart.items.map(item => `
                <li>
                    <span class="order-item-title">${item.product.title}</span>
                    <span class="order-item-qty">× ${item.quantity}</span>
                    <span class="order-item-price">${item.getTotalPrice()} $</span>
                </li>
            `).join('')}
        </ul>
        <p class="order-total">Итого: <b>${cart.getTotal()} $</b></p>
    `;
}

function setupCheckoutForm() {
    const form = document.getElementById("checkout-form");
    form.innerHTML = `
        <h3>Данные доставки</h3>
        <div id="checkout-error" class="form-error" style="display:none;"></div>
        <label>Имя<input type="text" id="checkout-name" placeholder="Иван Иванов"></label>
        <label>Адрес<input type="text" id="checkout-address" placeholder="г. Алматы, ул. Пушкина, д. 1"></label>
        <label>Телефон<input type="tel" id="checkout-phone" placeholder="+7 777 123 45 67"></label>
        <label>Способ оплаты
            <select id="checkout-payment" class="checkout-select">
                <option value="card">Картой онлайн</option>
                <option value="cash">Наличными при получении</option>
                <option value="transfer">Банковским переводом</option>
            </select>
        </label>
        <div class="checkout-actions">
            <button type="button" id="btn-confirm-order" class="btn-primary">Подтвердить заказ</button>
            <button type="button" onclick="window.location.href='cart.html'" class="btn-secondary">← Назад в корзину</button>
        </div>
    `;

    document.getElementById("btn-confirm-order").addEventListener("click", handleCheckout);
}

function handleCheckout() {
    const name = document.getElementById("checkout-name").value.trim();
    const address = document.getElementById("checkout-address").value.trim();
    const phone = document.getElementById("checkout-phone").value.trim();
    const payment = document.getElementById("checkout-payment").value;
    const errorEl = document.getElementById("checkout-error");

    if (!name || !address || !phone) {
        errorEl.textContent = "Заполните все поля";
        errorEl.style.display = "block";
        return;
    }

    errorEl.style.display = "none";

    const cart = loadCart();
    if (cart.items.length === 0) {
        alert("Корзина пуста!");
        return;
    }

    const user = getCurrentUser();
    const order = {
        id: Date.now(),
        date: new Date().toLocaleString("ru-RU"),
        items: cart.items,
        total: cart.getTotal(),
        name,
        address,
        phone,
        payment,
        userEmail: user ? user.email : null,
    };

    const orders = JSON.parse(localStorage.getItem("orders")) || [];
    orders.push(order);
    localStorage.setItem("orders", JSON.stringify(orders));

    localStorage.removeItem("cart");
    updateCartCount();

    window.location.href = "profile.html?success=1";
}
