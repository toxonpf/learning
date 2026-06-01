document.addEventListener("DOMContentLoaded", async () => {
    const params = new URLSearchParams(window.location.search);
    const id = params.get("id");

    if (!id) {
        window.location.href = "index.html";
        return;
    }

    const container = document.getElementById("product-details");
    container.innerHTML = '<p class="loading-text">Загрузка товара...</p>';

    const raw = await getProductById(id);
    const product = new Product(raw.id, raw.title, raw.price, raw.description, raw.image, raw.category);

    container.innerHTML = `
        <div class="product-detail">
            <img src="${product.image}" alt="${product.title}">
            <div class="product-info">
                <p class="product-category">${product.category}</p>
                <h2>${product.title}</h2>
                <p class="product-price">${product.price} $</p>
                <p class="product-description">${product.description}</p>
                <button id="add-to-cart" class="btn-add-cart">Добавить в корзину</button>
            </div>
        </div>
    `;

    document.getElementById("to-catalog").addEventListener("click", () => {
        window.location.href = "index.html";
    });

    document.getElementById("to-cart").addEventListener("click", () => {
        window.location.href = "cart.html";
    });

    document.getElementById("add-to-cart").addEventListener("click", () => {
        const cartData = JSON.parse(localStorage.getItem("cart")) || [];
        const cart = new Cart(cartData.map(item => new CartItem(
            new Product(item.product.id, item.product.title, item.product.price, item.product.description, item.product.image, item.product.category),
            item.quantity
        )));

        cart.addItem(product);
        localStorage.setItem("cart", JSON.stringify(cart.items));
        updateCartCount();

        const btn = document.getElementById("add-to-cart");
        btn.textContent = "✓ Добавлено!";
        btn.disabled = true;
        setTimeout(() => {
            btn.textContent = "Добавить в корзину";
            btn.disabled = false;
        }, 1500);
    });
});
