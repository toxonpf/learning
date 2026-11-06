import { AppError } from '../errors/AppError.js';
export function validateOrder(req, res, next) {
    const { userId, items } = req.body || {};
    const validId = id => Number.isSafeInteger(id) && id > 0;
    if (!validId(userId) || !Array.isArray(items) || !items.length || items.length > 100) return next(new AppError('userId and non-empty items (max 100) required', 400));
    const ids = new Set();
    for (const item of items) {
        if (!item || !validId(item.productId) || !validId(item.quantity) || item.quantity > 2147483647 || ids.has(item.productId)) return next(new AppError('Invalid or duplicate order item', 400));
        ids.add(item.productId);
    }
    next();
}
