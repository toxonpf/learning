import { PrismaClient } from '@prisma/client';
import { createApp } from './app.js';
import { getConfig } from './config/env.js';

const config = getConfig();
const db = new PrismaClient({ datasourceUrl: config.DATABASE_URL });

try {
  await db.$connect();
} catch {
  console.error('Не удалось подключиться к PostgreSQL. Проверьте запуск базы и DATABASE_URL.');
  process.exitCode = 1;
  await db.$disconnect();
}

if (!process.exitCode) {
  const app = createApp({ db, config });
  const google = app.locals.googleCalendar;
  let syncing = false;
  const syncTimer = google.enabled ? setInterval(async () => {
    if (syncing) return;
    syncing = true;
    try { await google.refreshLinked(); }
    catch { console.error('Не удалось проверить обновления календаря'); }
    finally { syncing = false; }
  }, 30_000) : null;
  syncTimer?.unref();
  const server = app.listen(config.PORT, config.HOST, () => {
    console.log(`Журнал посещаемости: http://${config.HOST}:${config.PORT}`);
  });
  server.on('error', async (error) => {
    console.error(`Не удалось запустить сервер: ${error.code ?? error.name}`);
    process.exitCode = 1;
    await db.$disconnect();
  });

  function shutdown() {
    clearInterval(syncTimer);
    server.close(() => db.$disconnect());
  }
  process.once('SIGINT', shutdown);
  process.once('SIGTERM', shutdown);
}
