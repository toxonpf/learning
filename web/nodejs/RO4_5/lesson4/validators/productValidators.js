import { body, param, checkExact } from 'express-validator';
function fields(optional = false) {
    const rule = name => optional ? body(name).optional() : body(name);
    return [
        rule('name').isString().bail().trim().isLength({ min: 2, max: 150 }),
        rule('price').isInt({ min: 1, max: 100000000 }).toInt(),
        rule('categoryId').isInt({ min: 1, max: 2147483647 }).toInt(),
        body('inStock').optional().isBoolean().toBoolean(),
        checkExact([], { locations: ['body'], message: 'Unknown field' })
    ];
}
export const createProductValidation = fields();
export const updateProductValidation = [
    (req, res, next) => {
        if (!req.body || Array.isArray(req.body) || !Object.keys(req.body).length)
            return res.status(400).json({ error: 'Validation failed' });
        next();
    }, ...fields(true)
];
export const productIdValidation = [param('id').isInt({ min: 1, max: 2147483647 }).toInt()];
