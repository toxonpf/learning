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
export async function addProduct(data) {
    const result = await pool.query(`INSERT INTO products (name, price, category, in_stock)
        VALUES ($1, $2, $3, $4) RETURNING id`, [data.name, data.price, data.category, data.inStock]);
    return findProductById(result.rows[0].id);
}
export async function updateProductById(id, changes) {
    const result = await pool.query(`UPDATE products SET name = COALESCE($1, name), price = COALESCE($2, price),
        category = COALESCE($3, category), in_stock = COALESCE($4, in_stock) WHERE id = $5 RETURNING id`,
        [changes.name ?? null, changes.price ?? null, changes.category ?? null, changes.inStock ?? null, id]);
    return result.rows[0] ? findProductById(id) : null;
}
export async function deleteProductById(id) {
    const result = await pool.query(`DELETE FROM products WHERE id = $1 RETURNING id, name, price, category, in_stock AS "inStock"`, [id]);
    return result.rows[0];
}
