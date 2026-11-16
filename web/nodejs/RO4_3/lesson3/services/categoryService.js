import { pool } from '../config/db.js';
export async function getCategories() { return (await pool.query('SELECT id, name FROM categories ORDER BY id')).rows; }
