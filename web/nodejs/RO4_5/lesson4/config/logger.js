import pino from 'pino';
export const logger = pino({
    level: process.env.LOG_LEVEL || 'info',
    redact: ['password', 'passwordHash', 'accessToken', 'refreshToken',
        '*.password', '*.passwordHash', '*.accessToken', '*.refreshToken', 'req.headers.authorization'],
    ...(process.env.NODE_ENV === 'development' ? { transport: { target: 'pino-pretty', options: { colorize: true } } } : {})
});
