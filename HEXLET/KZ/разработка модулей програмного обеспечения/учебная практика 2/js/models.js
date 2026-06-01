class User {
    constructor(name, email, password) {
        this.name = name;
        this.email = email;
        this.password = password;
    }

    checkPassword(password) {
        return this.password === password;
    }
}

class Product {
    constructor(id, title, price, description, image, category) {
        this.id = id;
        this.title = title;
        this.price = price;
        this.description = description;
        this.image = image;
        this.category = category;
    }

    renderCard() {
        return `
            <div class="card">
                <img src="${this.image}" alt="${this.title}">
                <h3 class="card-title">${this.title}</h3>
                <p class="card-price">${this.price} $</p>
                <a href="product.html?id=${this.id}" class="btn-details">Подробнее</a>
            </div>
        `;
    }
}

class CartItem {
    constructor(product, quantity = 1) {
        this.product = product;
        this.quantity = quantity;
    }

    getTotalPrice() {
        return +(this.product.price * this.quantity).toFixed(2);
    }
}

class Cart {
    constructor(items = []) {
        this.items = items;
    }

    addItem(product) {
        const existing = this.items.find(item => item.product.id === product.id);
        if (existing) {
            existing.quantity++;
        } else {
            this.items.push(new CartItem(product));
        }
    }

    removeItem(productId) {
        this.items = this.items.filter(item => item.product.id !== productId);
    }

    getTotal() {
        return +this.items.reduce((sum, item) => sum + item.getTotalPrice(), 0).toFixed(2);
    }

    clear() {
        this.items = [];
    }

    getCount() {
        return this.items.reduce((sum, item) => sum + item.quantity, 0);
    }
}
