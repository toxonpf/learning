import { validateProductData } from '../validators/productValidator.js';
import { AppError } from '../errors/AppError.js';
export function validateCreateProduct(req, res, next) {
    const errors = validateProductData(req.body, false);
    if (errors.length) return next(new AppError('Validation failed', 400, errors));
    next();
}
