CREATE TABLE products (
    id INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    name VARCHAR(150) NOT NULL,
    price INTEGER NOT NULL CHECK (price > 0),
    category VARCHAR(100) NOT NULL,
    in_stock BOOLEAN NOT NULL DEFAULT true
);
INSERT INTO products (name, price, category, in_stock) VALUES
('Keyboard', 15000, 'Accessories', true),
('Mouse', 8000, 'Accessories', true),
('Monitor', 85000, 'Monitors', false),
('Laptop', 420000, 'Computers', true),
('Webcam', 22000, 'Accessories', false);
