export function installShutdown(server, prisma, logger) {
    let stopping = false;
    async function shutdown(signal) {
        if (stopping) return;
        stopping = true;
        logger.info({ signal }, 'Shutdown started');
        const timer = setTimeout(() => {
            logger.fatal('Graceful shutdown timeout'); server.closeAllConnections(); process.exit(1);
        }, 10000);
        timer.unref();
        try {
            await new Promise((resolve, reject) => server.close(error => error ? reject(error) : resolve()));
            await prisma.$disconnect();
            logger.info('Shutdown completed');
        } catch (error) { logger.error({ err: error }, 'Shutdown failed'); process.exitCode = 1; }
        finally { clearTimeout(timer); }
    }
    process.once('SIGINT', () => void shutdown('SIGINT'));
    process.once('SIGTERM', () => void shutdown('SIGTERM'));
    return shutdown;
}
