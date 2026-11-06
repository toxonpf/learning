import { pool } from '../config/db.js';
export async function getAllProducts(query = {}) {
    const result = await pool.query(`SELECT p.id, p.name, p.price, p.category, p.in_stock AS "inStock" FROM products p
        WHERE ($1::text IS NULL OR p.category = $1)
        AND ($2::boolean IS NULL OR p.in_stock = $2)
        AND ($3::integer IS NULL OR p.price >= $3)
        AND ($4::integer IS NULL OR p.price <= $4) ORDER BY p.id`,
        [query.category ?? null, query.inStock ?? null, query.minPrice ?? null, query.maxPrice ?? null]);
    return result.rows;
}
export async function findProductById(id) {
    const result = await pool.query(`SELECT p.id, p.name, p.price, p.category, p.in_stock AS "inStock" FROM products p WHERE p.id = $1`, [id]);
    return result.rows[0];
}
