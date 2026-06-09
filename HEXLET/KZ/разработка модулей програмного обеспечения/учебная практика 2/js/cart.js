document.addEventListener("DOMContentLoaded", () => {
    renderCart();

    document.getElementById("cart-items").addEventListener("click", (e) => {
        const id = parseInt(e.target.dataset.id);
        if (!id) return;

        const cart = loadCart();

        if (e.target.classList.contains("btn-remove")) {
            cart.removeItem(id);
        } else if (e.target.dataset.action === "increase") {
            const item = cart.items.find(i => i.product.id === id);
            if (item) item.quantity++;
        } else if (e.target.dataset.action === "decrease") {
            const item = cart.items.find(i => i.product.id === id);
            if (item) {
                item.quantity--;
                if (item.quantity <= 0) cart.removeItem(id);
            }
        } else {
            return;
        }

        saveCart(cart);
        updateCartCount();
        renderCart();
    });

    document.getElementById("btn-checkout").addEventListener("click", () => {
        const cart = loadCart();
        if (cart.items.length === 0) {
            alert("Корзина пуста!");
            return;
        }
        window.location.href = "checkout.html";
    });
});

function loadCart() {
    const data = JSON.parse(localStorage.getItem("cart")) || [];
    return new Cart(data.map(item => new CartItem(
        new Product(item.product.id, item.product.title, item.product.price, item.product.description, item.product.image, item.product.category),
        item.quantity
    )));
}

function saveCart(cart) {
    localStorage.setItem("cart", JSON.stringify(cart.items));
}

function renderCart() {
    const cart = loadCart();
    const container = document.getElementById("cart-items");
    const totalEl = document.getElementById("cart-total");

    if (cart.items.length === 0) {
        container.innerHTML = '<p class="empty-cart">Корзина пуста</p>';
        totalEl.textContent = "0 $";
        return;
    }

    container.innerHTML = cart.items.map(item => `
        <div class="cart-item" data-id="${item.product.id}">
            <img src="${item.product.image}" alt="${item.product.title}">
            <div class="cart-item-info">
                <a href="product.html?id=${item.product.id}">${item.product.title}</a>
                <p>${item.product.price} $ × ${item.quantity} = <b>${item.getTotalPrice()} $</b></p>
            </div>
            <div class="cart-item-controls">
                <button class="btn-qty" data-action="decrease" data-id="${item.product.id}">−</button>
                <span class="qty-value">${item.quantity}</span>
                <button class="btn-qty" data-action="increase" data-id="${item.product.id}">+</button>
                <button class="btn-remove" data-id="${item.product.id}">Удалить</button>
            </div>
        </div>
    `).join('');

    totalEl.textContent = `${cart.getTotal()} $`;
}
