CREATE TABLE "categories" (
 "id" SERIAL PRIMARY KEY, "name" VARCHAR(100) NOT NULL UNIQUE
);
CREATE TABLE "products" (
 "id" SERIAL PRIMARY KEY, "name" VARCHAR(150) NOT NULL,
 "price" INTEGER NOT NULL CHECK (price > 0), "category_id" INTEGER NOT NULL,
 "in_stock" BOOLEAN NOT NULL DEFAULT true,
 CONSTRAINT "products_category_id_fkey" FOREIGN KEY ("category_id") REFERENCES "categories"("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
CREATE TABLE "users" (
 "id" SERIAL PRIMARY KEY, "name" VARCHAR(100) NOT NULL, "email" VARCHAR(150) NOT NULL UNIQUE
);
CREATE TABLE "user_profiles" (
 "user_id" INTEGER PRIMARY KEY, "phone" VARCHAR(30), "address" VARCHAR(250),
 CONSTRAINT "user_profiles_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
CREATE TABLE "orders" (
 "id" SERIAL PRIMARY KEY, "user_id" INTEGER NOT NULL, "status" VARCHAR(30) NOT NULL DEFAULT 'new',
 "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
 CONSTRAINT "orders_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
CREATE TABLE "order_items" (
 "order_id" INTEGER NOT NULL, "product_id" INTEGER NOT NULL,
 "quantity" INTEGER NOT NULL CHECK (quantity > 0), "price" INTEGER NOT NULL CHECK (price > 0),
 PRIMARY KEY ("order_id", "product_id"),
 CONSTRAINT "order_items_order_id_fkey" FOREIGN KEY ("order_id") REFERENCES "orders"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
 CONSTRAINT "order_items_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "products"("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
