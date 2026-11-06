import { verifyAccessToken } from '../services/tokenService.js';
export function requireAuth(req, res, next) {
    const match = /^Bearer ([^\s]+)$/i.exec(req.get('authorization') || '');
    if (!match) return res.status(401).json({ error: 'Authentication required' });
    try {
        const payload = verifyAccessToken(match[1]);
        req.user = { id: Number(payload.sub), role: payload.role };
        next();
    } catch { res.status(401).json({ error: 'Invalid or expired token' }); }
}
