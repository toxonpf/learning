import { randomUUID } from 'node:crypto';
import { logger } from '../config/logger.js';
export function requestContext(req, res, next) {
    const supplied = req.get('X-Request-Id');
    req.requestId = /^[a-zA-Z0-9_-]{1,80}$/.test(supplied || '') ? supplied : randomUUID();
    req.log = logger.child({ requestId: req.requestId });
    res.set('X-Request-Id', req.requestId); next();
}
