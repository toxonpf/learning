import { AppError } from '../errors/AppError.js';
export function validateProductQuery(req, res, next) {
    const errors = [];
    for (const key of ['category', 'inStock', 'minPrice', 'maxPrice']) {
        const value = req.query[key];
        if (value !== undefined && typeof value !== 'string') errors.push(`${key} must be a single value`);
    }
    if (req.query.inStock !== undefined && !['true', 'false'].includes(req.query.inStock)) errors.push('inStock must be true or false');
    for (const key of ['minPrice', 'maxPrice']) {
        const value = req.query[key];
        if (value !== undefined && (typeof value !== 'string' || !/^\d+$/.test(value) || Number(value) > 2147483647)) errors.push(`${key} must be a non-negative integer`);
    }
    if (req.query.minPrice !== undefined && req.query.maxPrice !== undefined && Number(req.query.minPrice) > Number(req.query.maxPrice)) errors.push('minPrice must not exceed maxPrice');
    if (errors.length) return next(new AppError('Validation failed', 400, errors));
    next();
}
