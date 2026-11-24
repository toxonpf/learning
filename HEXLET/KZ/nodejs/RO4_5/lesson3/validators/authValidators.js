import { body, checkExact } from 'express-validator';
export const loginValidation = [
    body('email').isString().bail().trim().isEmail().isLength({ max: 150 }).toLowerCase(),
    body('password').isString().bail().isLength({ min: 8, max: 128 }),
    checkExact([], { locations: ['body'], message: 'Unknown field' })
];
export const registerValidation = [
    body('name').isString().bail().trim().isLength({ min: 2, max: 100 }),
    ...loginValidation.slice(0, 2)
];
