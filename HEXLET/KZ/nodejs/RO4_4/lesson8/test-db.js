import { pool } from './config/db.js';
try { console.log('PostgreSQL connected:', (await pool.query('SELECT NOW() AS current_time')).rows[0]); }
catch (error) { console.error(error.message); process.exitCode = 1; }
finally { await pool.end(); }
