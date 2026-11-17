import { env } from '../config/env.js';
import jwt from 'jsonwebtoken';
function config() {
    const secret = env.jwtSecret;
    if (!secret || Buffer.byteLength(secret) < 32) throw new Error('JWT_SECRET must contain at least 32 bytes');
    return { secret, issuer: env.jwtIssuer, audience: env.jwtAudience };
}
export function createAccessToken(user) {
    const { secret, issuer, audience } = config();
    return jwt.sign({ role: user.role }, secret, { algorithm: 'HS256', subject: String(user.id), issuer, audience, expiresIn: env.jwtExpiresIn });
}
export function verifyAccessToken(token) {
    const { secret, issuer, audience } = config();
    const payload = jwt.verify(token, secret, { algorithms: ['HS256'], issuer, audience });
    if (!payload || typeof payload !== 'object' || !Number.isSafeInteger(Number(payload.sub)) || Number(payload.sub) <= 0 || !Number.isFinite(payload.exp)) throw new Error('Invalid token claims');
    return payload;
}
