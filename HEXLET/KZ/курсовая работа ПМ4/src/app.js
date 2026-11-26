import { fileURLToPath } from 'node:url';
import express from 'express';
import helmet from 'helmet';
import { apiRoutes } from './routes/api.js';
import { handleError, notFound } from './middleware/errors.js';
import { createGoogleCalendar } from './schedule/google-calendar.js';

const publicPath = fileURLToPath(new URL('../public/', import.meta.url));

export function createApp({ db, config, logger = console }) {
  const app = express();
  const googleCalendar = createGoogleCalendar(db, config);
  app.use(helmet({
    contentSecurityPolicy: { directives: {
      upgradeInsecureRequests: null,
      frameSrc: googleCalendar.enabled ? ["'self'", 'https://calendar.google.com'] : ["'self'"],
    } },
  }));
  app.locals.googleCalendar = googleCalendar;
  app.get(googleCalendar.callback, googleCalendar.authorize);
  app.use('/api/google-calendar', express.json({ limit: '2kb' }), googleCalendar.router);
  app.use('/api/schedule/plans', express.json({ limit: '768kb' }));
  app.use('/api', express.json({ limit: '32kb' }), apiRoutes(db, config), notFound);
  app.use(express.static(publicPath));
  app.use(notFound);
  app.use(handleError(logger));
  return app;
}
