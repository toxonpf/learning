import { env } from './env.js';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '../generated/prisma/index.js';
export const prisma = new PrismaClient({ adapter: new PrismaPg({ connectionString: env.databaseUrl, connectionTimeoutMillis: 2000 }) });
