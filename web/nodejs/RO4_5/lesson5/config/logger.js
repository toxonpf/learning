import pino from 'pino';
import { env } from './env.js';
export const logger = pino({
    level: env.logLevel,
    redact: ['password', 'passwordHash', 'accessToken', 'refreshToken',
        '*.password', '*.passwordHash', '*.accessToken', '*.refreshToken', 'req.headers.authorization'],
    ...(env.nodeEnv === 'development' ? { transport: { target: 'pino-pretty', options: { colorize: true } } } : {})
});
