export function validateProductData(data, partial = false) {
    const errors = [];
    if (!data || typeof data !== 'object' || Array.isArray(data)) return ['JSON object required'];
    const fields = ['name', 'price', 'category', 'inStock'];
    if (partial && Object.keys(data).length === 0) errors.push('At least one field is required');
    for (const field of Object.keys(data)) {
        if (!fields.includes(field)) errors.push(`Unknown field: ${field}`);
    }
    if (!partial || 'name' in data) {
        if (typeof data.name !== 'string' || !data.name.trim() || data.name.length > 150) errors.push('name is required (max 150)');
    }
    if (!partial || 'price' in data) {
        if (!Number.isSafeInteger(data.price) || data.price <= 0 || data.price > 2147483647) errors.push('price must be a positive integer');
    }
    if (!partial || 'category' in data) { if (typeof data.category !== 'string' || !data.category.trim() || data.category.length > 100) errors.push('category is required (max 100)'); }
    if (!partial || 'inStock' in data) {
        if (typeof data.inStock !== 'boolean') errors.push('inStock must be boolean');
    }

    return errors;
}
