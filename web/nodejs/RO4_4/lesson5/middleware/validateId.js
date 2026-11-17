import { AppError } from '../errors/AppError.js';
export function validateId(req, res, next) {
    if (!Number.isSafeInteger(Number(req.params.id)) || Number(req.params.id) <= 0) return next(new AppError('Invalid id', 400));
    next();
}
