import { app } from './app.js';
import { env } from './config/env.js';
import { logger } from './config/logger.js';
import { prisma } from './config/prisma.js';
import { installShutdown } from './config/shutdown.js';
export const server = app.listen(env.port, () => logger.info({ port: env.port, nodeEnv: env.nodeEnv }, 'HTTP server started'));
installShutdown(server, prisma, logger);
server.on('error', error => { logger.error({ err: error }, 'HTTP server failed'); process.exitCode = 1; });
