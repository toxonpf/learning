import { fileURLToPath } from 'node:url';
import express from 'express';
import helmet from 'helmet';
import { apiRoutes } from './routes/api.js';
import { handleError, notFound } from './middleware/errors.js';

const publicPath = fileURLToPath(new URL('../public/', import.meta.url));

export function createApp({ db, config, logger = console }) {
  const app = express();
  app.use(helmet({
    contentSecurityPolicy: { directives: { upgradeInsecureRequests: null } },
  }));
  app.use('/api/schedule/plans', express.json({ limit: '768kb' }));
  app.use('/api', express.json({ limit: '32kb' }), apiRoutes(db, config), notFound);
  app.use(express.static(publicPath));
  app.use(notFound);
  app.use(handleError(logger));
  return app;
}
