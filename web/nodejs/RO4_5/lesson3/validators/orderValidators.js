import { body, checkExact } from 'express-validator';
export const createOrderValidation = [
    body('items').isArray({ min: 1, max: 50 }).bail().custom(items =>
        new Set(items.map(item => item?.productId)).size === items.length),
    body('items.*.productId').isInt({ min: 1, max: 2147483647 }).toInt(),
    body('items.*.quantity').isInt({ min: 1, max: 100 }).toInt(),
    checkExact([], { locations: ['body'], message: 'Unknown field' })
];
