BEGIN;
CREATE TABLE categories (
    id INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    name VARCHAR(100) NOT NULL UNIQUE
);
INSERT INTO categories (name) SELECT DISTINCT category FROM products ORDER BY category;
ALTER TABLE products ADD COLUMN category_id INTEGER;
UPDATE products AS p SET category_id = c.id FROM categories AS c WHERE p.category = c.name;
DO $$ BEGIN
    IF EXISTS (SELECT 1 FROM products WHERE category_id IS NULL) THEN
        RAISE EXCEPTION 'Unmapped category: migration cancelled';
    END IF;
END $$;
ALTER TABLE products ALTER COLUMN category_id SET NOT NULL;
ALTER TABLE products ADD CONSTRAINT products_category_id_fkey FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE products DROP COLUMN category;
COMMIT;
