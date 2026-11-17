import { getProducts, createProduct, updateProduct, deleteProduct } from './api.js';
import { renderProducts, showMessage, showError } from './ui.js';
async function loadProducts() { renderProducts(await getProducts()); }
document.addEventListener('DOMContentLoaded', () => loadProducts().catch(error => showError(error.message)));
const form = document.querySelector('#product-form');
form.addEventListener('submit', async event => {
    event.preventDefault();
    const product = { name: form.querySelector('#name').value.trim(), price: Number(form.querySelector('#price').value), categoryId: Number(form.querySelector('#category').value), inStock: form.querySelector('#inStock').checked };
    try { await createProduct(product); form.reset(); await loadProducts(); showMessage('Товар успешно добавлен'); }
    catch (error) { showError(error.message); }
});
document.querySelector('#products').addEventListener('click', async event => {
    const button = event.target.closest('button[data-action]');
    if (!button) return;
    const id = Number(button.dataset.id);
    try {
        if (button.dataset.action === 'delete') {
            if (!confirm('Удалить этот товар?')) return;
            await deleteProduct(id);
        } else {
            const value = prompt('Введите новую цену');
            if (value === null) return;
            if (!value.trim() || !Number.isFinite(Number(value))) throw new Error('Цена должна быть числом');
            await updateProduct(id, { price: Number(value) });
        }
        await loadProducts(); showMessage('Изменения сохранены');
    } catch (error) { showError(error.message); }
});
