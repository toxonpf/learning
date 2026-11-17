export function calculateOrderTotal(items) {
    if (!Array.isArray(items)) throw new TypeError('items must be an array');
    return items.reduce((sum, item) => {
        if (!item || !Number.isSafeInteger(item.price) || item.price <= 0)
            throw new RangeError('price must be a positive integer');
        if (!Number.isInteger(item.quantity) || item.quantity < 1 || item.quantity > 100)
            throw new RangeError('quantity must be 1..100');
        const total = sum + item.price * item.quantity;
        if (!Number.isSafeInteger(total)) throw new RangeError('total exceeds safe integer range');
        return total;
    }, 0);
}
export const canCancelOrder = status => status === 'new';
