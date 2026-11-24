const container = document.querySelector('#products');
const message = document.querySelector('#message');
export function showMessage(text) { message.className = ''; message.textContent = text; }
export function showError(text) { message.className = 'error'; message.textContent = `Ошибка: ${text}`; }
export function renderProducts(products) {
    container.replaceChildren();
    if (!products.length) container.textContent = 'Товаров нет';
    for (const product of products) {
        const card = document.createElement('article');
        for (const [tag, text] of [['h3', product.name], ['p', `Цена: ${product.price} ₸`], ['p', `Категория: ${typeof product.category === 'object' ? product.category?.name : product.category}`], ['p', product.inStock ? 'В наличии' : 'Нет в наличии']]) {
            const element = document.createElement(tag); element.textContent = text; card.append(element);
        }
        for (const [action, text] of [['edit', 'Изменить цену'], ['delete', 'Удалить']]) {
            const button = document.createElement('button'); button.type = 'button'; button.dataset.action = action; button.dataset.id = product.id; button.textContent = text; card.append(button);
        }
        container.append(card);
    }
}
