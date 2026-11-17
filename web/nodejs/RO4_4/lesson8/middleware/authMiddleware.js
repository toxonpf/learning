import { verifyAccessToken } from '../services/tokenService.js';
export function requireAuth(req, res, next) {
    const match = /^Bearer ([^\s]+)$/i.exec(req.get('authorization') || '');
    if (!match) {
        req.log?.info({ reason: 'missing_authorization' }, 'Authentication denied');
        return res.status(401).json({ error: 'Authentication required' });
    }
    try {
        const payload = verifyAccessToken(match[1]);
        req.user = { id: Number(payload.sub), role: payload.role };
        next();
    } catch {
        req.log?.info({ reason: 'invalid_token' }, 'Authentication denied');
        res.status(401).json({ error: 'Invalid or expired token' });
    }
}
export function requireRole(...roles) {
    return (req, res, next) => {
        if (!req.user) return res.status(401).json({ error: 'Authentication required' });
        if (!roles.includes(req.user.role)) {
            req.log?.warn({ userId: req.user.id, reason: 'role' }, 'Authorization denied');
            return res.status(403).json({ error: 'Forbidden' });
        }
        next();
    };
}
