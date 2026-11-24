-- Выполнить через административное подключение. Пароль только для локальной учебной среды.
CREATE USER shop_user WITH PASSWORD 'college123';
CREATE DATABASE shop_db OWNER shop_user;
