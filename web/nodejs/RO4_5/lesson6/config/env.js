import dotenv from 'dotenv';
import { fileURLToPath } from 'node:url';
if (process.env.NODE_ENV !== 'test') dotenv.config({ path: fileURLToPath(new URL('../.env', import.meta.url)), quiet: true });
export function readEnv(input = process.env) {
    const required = name => {
        if (!input[name]?.trim()) throw new Error(`Missing required environment variable: ${name}`);
        return input[name];
    };
    const nodeEnv = input.NODE_ENV || 'development';
    if (!['development', 'test', 'production'].includes(nodeEnv)) throw new Error('Invalid NODE_ENV');
    const port = Number(input.PORT || 3000);
    if (!Number.isInteger(port) || port < 1 || port > 65535) throw new Error('PORT must be an integer from 1 to 65535');
    const databaseUrl = required('DATABASE_URL');
    let database;
    try { database = new URL(databaseUrl); } catch { throw new Error('Invalid DATABASE_URL'); }
    if (!['postgres:', 'postgresql:'].includes(database.protocol)) throw new Error('Invalid DATABASE_URL');
    const jwtSecret = required('JWT_SECRET');
    if (Buffer.byteLength(jwtSecret) < 32 || jwtSecret.includes('CHANGE_ME')) throw new Error('JWT_SECRET must contain at least 32 bytes');
    const corsOrigin = required('CORS_ORIGIN');
    let origin;
    try { origin = new URL(corsOrigin); } catch { throw new Error('CORS_ORIGIN must be an HTTP origin'); }
    if (!['http:', 'https:'].includes(origin.protocol) || origin.origin !== corsOrigin) throw new Error('CORS_ORIGIN must be an HTTP origin');
    const logLevel = input.LOG_LEVEL || 'info';
    if (!['fatal', 'error', 'warn', 'info', 'debug', 'trace', 'silent'].includes(logLevel)) throw new Error('Invalid LOG_LEVEL');
    const trustProxyHops = Number(input.TRUST_PROXY_HOPS || 0);
    if (![0, 1].includes(trustProxyHops)) throw new Error('TRUST_PROXY_HOPS must be 0 or 1');
    return { nodeEnv, port, databaseUrl, jwtSecret, corsOrigin, logLevel, trustProxyHops,
        jwtIssuer: input.JWT_ISSUER || 'express-shop', jwtAudience: input.JWT_AUDIENCE || 'express-shop-api',
        jwtExpiresIn: input.JWT_EXPIRES_IN || '15m' };
}
export const env = readEnv();
