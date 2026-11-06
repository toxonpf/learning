CREATE TABLE users (
    id INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(150) NOT NULL UNIQUE
);
CREATE TABLE user_profiles (
    user_id INTEGER PRIMARY KEY REFERENCES users(id) ON DELETE RESTRICT ON UPDATE CASCADE,
    phone VARCHAR(30),
    address VARCHAR(250)
);
CREATE TABLE orders (
    id INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE RESTRICT ON UPDATE CASCADE,
    status VARCHAR(30) NOT NULL DEFAULT 'new',
    created_at TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE order_items (
    order_id INTEGER NOT NULL REFERENCES orders(id) ON DELETE RESTRICT ON UPDATE CASCADE,
    product_id INTEGER NOT NULL REFERENCES products(id) ON DELETE RESTRICT ON UPDATE CASCADE,
    quantity INTEGER NOT NULL CHECK (quantity > 0),
    price INTEGER NOT NULL CHECK (price > 0),
    PRIMARY KEY (order_id, product_id)
);
INSERT INTO users (name, email) VALUES ('Anna', 'anna@example.com'), ('Ivan', 'ivan@example.com'), ('Maria', 'maria@example.com');
INSERT INTO user_profiles (user_id, phone, address) SELECT id, '+7 700 000 00 00', 'Алматы' FROM users;
INSERT INTO orders (user_id, status) SELECT id, 'new' FROM users WHERE email IN ('anna@example.com', 'ivan@example.com');
INSERT INTO order_items (order_id, product_id, quantity, price)
SELECT o.id, p.id, CASE WHEN p.name = 'Mouse' THEN 2 ELSE 1 END, p.price
FROM orders o JOIN products p ON p.name IN ('Keyboard', 'Mouse') WHERE o.user_id = (SELECT id FROM users WHERE email = 'anna@example.com');
INSERT INTO order_items (order_id, product_id, quantity, price)
SELECT o.id, p.id, 1, p.price FROM orders o JOIN products p ON p.name = 'Keyboard'
WHERE o.user_id = (SELECT id FROM users WHERE email = 'ivan@example.com');
