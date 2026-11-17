async function request(url, options = {}) {
    const response = await fetch(url, options);
    const data = response.status === 204 ? null : await response.json();
    if (!response.ok) throw new Error(data?.errors?.join('; ') || data?.message || data?.error || `HTTP ${response.status}`);
    return data;
}
export function getProducts() { return request('/api/products'); }
export function createProduct(product) { return request('/api/products', { method: 'POST', headers: { 'Content-Type': 'application/json', 'x-api-key': 'college-demo' }, body: JSON.stringify(product) }); }
export function updateProduct(id, changes) { return request(`/api/products/${id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(changes) }); }
export function deleteProduct(id) { return request(`/api/products/${id}`, { method: 'DELETE' }); }
