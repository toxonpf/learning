import { AppError } from '../errors/AppError.js';
function validate(data, register) {
    const errors = [];
    if (!data || typeof data !== 'object' || Array.isArray(data)) return ['JSON object required'];
    if (typeof data.email !== 'string' || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email.trim()) || data.email.length > 150) errors.push('Valid email required');
    if (typeof data.password !== 'string' || data.password.length < 8 || data.password.length > 128) errors.push('Password must contain 8–128 characters');
    if (register && (typeof data.name !== 'string' || !data.name.trim() || data.name.trim().length > 100)) errors.push('Name required (max 100)');
    const allowed = register ? ['name', 'email', 'password'] : ['email', 'password'];
    if (Object.keys(data).some(key => !allowed.includes(key))) errors.push('Unknown field');
    return errors;
}
export function validateRegister(req, res, next) {
    const errors = validate(req.body, true);
    if (errors.length) return next(new AppError('Validation failed', 400, errors));
    next();
}
export function validateLogin(req, res, next) {
    const errors = validate(req.body, false);
    if (errors.length) return next(new AppError('Validation failed', 400, errors));
    next();
}
