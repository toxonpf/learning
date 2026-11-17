import { app } from './app.js';
import { logger } from './config/logger.js';
const port = Number(process.env.PORT || 3000);
logger.info({ port, nodeEnv: process.env.NODE_ENV, databaseConfigured: Boolean(process.env.DATABASE_URL) }, 'Application starting');
app.listen(port, () => logger.info({ port }, 'Server started'));
