import { validationResult, matchedData } from 'express-validator';
export function validateRequest(req, res, next) {
    const result = validationResult(req);
    if (!result.isEmpty()) return res.status(400).json({ error: 'Validation failed',
        details: result.array().map(({ value, ...error }) => error) });
    req.validated = matchedData(req, { includeOptionals: false });
    next();
}
