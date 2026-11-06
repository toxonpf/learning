ALTER TABLE "categories" ADD COLUMN "slug" TEXT;
CREATE UNIQUE INDEX "categories_slug_key" ON "categories"("slug");
