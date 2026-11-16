SELECT * FROM users u JOIN user_profiles p ON p.user_id = u.id;
SELECT o.id, u.name, p.name AS product, oi.quantity, oi.price,
       oi.quantity * oi.price AS line_total
FROM orders o JOIN users u ON u.id = o.user_id
JOIN order_items oi ON oi.order_id = o.id JOIN products p ON p.id = oi.product_id
ORDER BY o.id, p.id;
SELECT order_id, SUM(quantity * price) AS total FROM order_items GROUP BY order_id;
SELECT o.* FROM orders o JOIN order_items oi ON oi.order_id = o.id WHERE oi.product_id = 1;
