import { pool } from '../config/db.js';
export async function getAllOrders() {
    return (await pool.query('SELECT id, user_id AS "userId", status, created_at AS "createdAt" FROM orders ORDER BY id')).rows;
}
export async function getOrderItems(id) {
    return (await pool.query('SELECT p.id, p.name, oi.quantity, oi.price, oi.quantity * oi.price AS "lineTotal" FROM order_items oi JOIN products p ON p.id = oi.product_id WHERE oi.order_id = $1 ORDER BY p.name', [id])).rows;
}
export async function findOrderById(id) {
    return (await pool.query('SELECT id FROM orders WHERE id = $1', [id])).rows[0];
}
