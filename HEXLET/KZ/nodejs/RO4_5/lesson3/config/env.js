import dotenv from 'dotenv';
import { fileURLToPath } from 'node:url';
if (process.env.NODE_ENV !== 'test') dotenv.config({ path: fileURLToPath(new URL('../.env', import.meta.url)), quiet: true });
