import { validateProductData } from '../validators/productValidator.js';
import { AppError } from '../errors/AppError.js';
export function validateUpdateProduct(req, res, next) {
    const errors = validateProductData(req.body, true);
    if (errors.length) return next(new AppError('Validation failed', 400, errors));
    next();
}
