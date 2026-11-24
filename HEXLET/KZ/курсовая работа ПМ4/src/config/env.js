import 'dotenv/config';
import { z } from 'zod';

const schema = z.object({
  DATABASE_URL: z.string().min(1),
  JWT_SECRET: z.string().min(32),
  PORT: z.coerce.number().int().min(1).max(65535).default(3000),
  HOST: z.string().min(1).default('127.0.0.1'),
  APP_TIME_ZONE: z.string().default('Asia/Almaty'),
  GOOGLE_CALENDAR_CLIENT_ID: z.string().optional(),
  GOOGLE_CALENDAR_CLIENT_SECRET: z.string().optional(),
  GOOGLE_CALENDAR_REDIRECT_URI: z.string().optional(),
});

export function getConfig(env = process.env) {
  const result = schema.safeParse(env);
  if (!result.success) {
    const fields = result.error.issues.map(({ path }) => path.join('.'));
    throw new Error(`Проверьте переменные окружения: ${fields.join(', ')}`);
  }
  const config = result.data;
  new Intl.DateTimeFormat('en', { timeZone: config.APP_TIME_ZONE });
  return config;
}
