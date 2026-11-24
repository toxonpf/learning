-- Все изменения учебного примера отменяются в конце.
BEGIN;
SELECT id, name, price FROM products WHERE price > 10000 AND in_stock = true ORDER BY price ASC;
UPDATE products SET price = 20000 WHERE id = (SELECT MAX(id) FROM products) RETURNING *;
DELETE FROM products WHERE id = (SELECT MAX(id) FROM products WHERE name = 'Webcam') RETURNING *;
ROLLBACK;
