export function validateOrder(req, res, next) {
    const items = req.body?.items;
    if (!Array.isArray(items) || items.length < 1 || items.length > 50)
        return res.status(400).json({ error: 'Validation failed' });
    const ids = new Set();
    for (const item of items) {
        if (!item || !Number.isSafeInteger(item.productId) || item.productId < 1 ||
            !Number.isInteger(item.quantity) || item.quantity < 1 || item.quantity > 100 || ids.has(item.productId))
            return res.status(400).json({ error: 'Validation failed' });
        ids.add(item.productId);
    }
    next();
}
