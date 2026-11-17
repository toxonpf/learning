-- Существующие пользователи сохраняются. Их старые пароли неизвестны:
-- временный маркер не является паролем или допустимым Argon2-хешем.
ALTER TABLE "users" ADD COLUMN "password_hash" TEXT;
ALTER TABLE "users" ADD COLUMN "role" TEXT NOT NULL DEFAULT 'user';
UPDATE "users" SET "password_hash" = '!disabled-until-password-reset!' WHERE "password_hash" IS NULL;
ALTER TABLE "users" ALTER COLUMN "password_hash" SET NOT NULL;
