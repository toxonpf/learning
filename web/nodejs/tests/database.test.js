import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile, writeFile, readdir } from 'node:fs/promises';
import { spawnSync } from 'node:child_process';
import { randomBytes } from 'node:crypto';
import { delimiter, resolve } from 'node:path';
import { Pool } from 'pg';
import { withServer, saveEvidence } from './helpers.js';

// Создаются только новые БД с префиксом nodejs_lab_. Существующие БД не очищаются.
const adminUrl = process.env.TEST_DATABASE_URL;
const admin = adminUrl ? new Pool({ connectionString: adminUrl }) : null;

function cli(project, args) {
    const result = spawnSync(process.execPath, ['../../node_modules/prisma/build/index.js', ...args], {
        cwd: project, env: { ...process.env, PATH: [resolve(project, 'node_modules/.bin'), resolve('node_modules/.bin'), process.env.PATH].join(delimiter) }, encoding: 'utf8'
    });
    assert.equal(result.status, 0, `${project}: prisma ${args.join(' ')}\n${result.stdout}\n${result.stderr}`);
    return `${result.stdout}\n${result.stderr}`;
}

async function prepare(project, group, number) {
    const database = `nodejs_lab_${group.toLowerCase()}_${number}_${Date.now()}`;
    await admin.query(`CREATE DATABASE "${database}"`);
    const url = new URL(adminUrl);
    url.pathname = `/${database}`;
    process.env.DATABASE_URL = url.href;
    process.env.JWT_SECRET = randomBytes(32).toString('hex');
    process.env.JWT_ISSUER = 'express-shop';
    process.env.JWT_AUDIENCE = 'express-shop-api';
    process.env.JWT_EXPIRES_IN = '15m';
    if (process.env.SAVE_LAB_EVIDENCE === '1') {
        await writeFile(`${project}/.env`, `PORT=3000\nDATABASE_URL="${url.href}"\nJWT_SECRET=${process.env.JWT_SECRET}\nJWT_EXPIRES_IN=15m\nJWT_ISSUER=express-shop\nJWT_AUDIENCE=express-shop-api\n`);
    }
    const pool = new Pool({ connectionString: url.href });
    const prismaStage = group === 'RO4_4' || number >= 5;
    if (prismaStage) {
        cli(project, ['generate']);
        // Воспроизводим исходную существующую схему, затем baselining без удаления данных.
        for (const filename of ['01_products.sql', '02_categories.sql', '03_relations.sql']) {
            await pool.query(await readFile(`${project}/sql/${filename}`, 'utf8'));
        }
        const introspection = cli(project, ['db', 'pull', '--print']).split('\n').map(line => line.trimEnd()).join('\n').trimEnd() + '\n';
        if (process.env.SAVE_LAB_EVIDENCE === '1') await writeFile(`${project}/prisma/introspection.txt`, introspection);
        cli(project, ['migrate', 'resolve', '--applied', '20261104000100_baseline']);
        cli(project, ['migrate', 'deploy']);
        cli(project, ['migrate', 'status']);
        cli(project, ['migrate', 'diff', '--from-config-datasource', '--to-schema', 'prisma/schema.prisma', '--exit-code']);
    } else {
        // 00_create_database.sql предназначен администратору и не выполняется
        // внутри уже созданной изолированной тестовой базы.
        const files = (await readdir(`${project}/sql`)).filter(name => /^0[1-3]_/.test(name)).sort();
        for (const filename of files) await pool.query(await readFile(`${project}/sql/${filename}`, 'utf8'));
    }
    return pool;
}

for (const group of ['RO4_3', 'RO4_4']) {
    for (let number = 1; number <= (group === 'RO4_3' ? 9 : 3); number++) {
        test(`${group} / лабораторная ${number}: PostgreSQL и HTTP`, { skip: !adminUrl }, async () => {
            const project = `${group}/lesson${number}`;
            const pool = await prepare(project, group, number);
            let prisma;
            let appPool;
            const checks = ['Реальный PostgreSQL', 'HTTP endpoints'];
            try {
                const prismaStage = group === 'RO4_4' || number >= 5;
                if (prismaStage) ({ prisma } = await import(`../${project}/config/prisma.js`));
                ({ pool: appPool } = await import(`../${project}/config/db.js`));
                const { default: app } = await import(`../${project}/app.js`);
                const normalized = group === 'RO4_4' || number >= 3;
                const category = normalized ? { categoryId: (await pool.query("SELECT id FROM categories WHERE name = 'Accessories'")).rows[0].id } : { category: 'Accessories' };
                const data = { name: 'Test SSD', price: 65000, ...category, inStock: true };
                const headers = { 'x-api-key': 'college-demo' };
                const evidence = await withServer(app, async (request, address, extra) => {
                    const list = await request('GET', '/api/products', 200);
                    assert.equal(list.length, 5);
                    assert.equal((await request('GET', '/api/products/1', 200)).name, 'Keyboard');
                    await request('GET', '/api/products/999999', 404);
                    await request('GET', '/api/products/abc', 400);
                    const filtered = await request('GET', '/api/products?category=Accessories&inStock=true&minPrice=10000&maxPrice=50000', 200);
                    assert.deepEqual(filtered.map(item => item.name), ['Keyboard']);
                    await request('GET', '/api/products?minPrice=abc', 400);
                    await request('GET', '/api/products?inStock=maybe', 400);
                    await request('GET', '/api/products?minPrice=500&maxPrice=100', 400);
                    if (group === 'RO4_3' && number === 1) return;
                    await request('POST', '/api/products', 403, data);
                    await request('POST', '/api/products', 400, { ...data, price: -1 }, headers);
                    const created = await request('POST', '/api/products', 201, data, headers);
                    assert.ok((await pool.query('SELECT id FROM products WHERE id=$1', [created.id])).rowCount);
                    const updated = await request('PATCH', `/api/products/${created.id}`, 200, { price: 42000, inStock: false });
                    assert.equal(updated.price, 42000);
                    assert.equal(updated.inStock, false);
                    assert.equal(updated.name, data.name);
                    assert.equal((await pool.query('SELECT price FROM products WHERE id=$1', [created.id])).rows[0].price, 42000);
                    await request('DELETE', `/api/products/${created.id}`, 200);
                    await request('GET', `/api/products/${created.id}`, 404);
                    assert.equal((await pool.query('SELECT id FROM products WHERE id=$1', [created.id])).rowCount, 0);
                    checks.push('CRUD сохраняется в PostgreSQL');
                    if (normalized) {
                        assert.equal((await pool.query("SELECT count(*)::int AS n FROM products WHERE category_id IS NULL")).rows[0].n, 0);
                        await assert.rejects(pool.query("INSERT INTO categories(name) VALUES ('Accessories')"), error => error.code === '23505');
                        await request('POST', '/api/products', 409, { ...data, categoryId: 999999 }, headers);
                        checks.push('UNIQUE и FOREIGN KEY; категории перенесены без потери товаров');
                    }
                    if (group === 'RO4_4' || number >= 4) {
                        if (group === 'RO4_3' && number <= 6) {
                            assert.ok((await request('GET', '/api/orders/1/items', 200)).length);
                            await request('GET', '/api/orders/999999/items', 404);
                            await request('GET', '/api/orders/abc/items', 400);
                        }
                        await assert.rejects(pool.query('UPDATE order_items SET quantity=0 WHERE order_id=1'), error => error.code === '23514');
                        await assert.rejects(pool.query('INSERT INTO user_profiles(user_id) VALUES (999999)'), error => error.code === '23503');
                        await assert.rejects(pool.query('INSERT INTO order_items(order_id,product_id,quantity,price) SELECT order_id,product_id,1,price FROM order_items LIMIT 1'), error => error.code === '23505');
                        checks.push('Связи 1:1, 1:N, M:N; CHECK(quantity > 0); составной ключ');
                    }
                    if (group === 'RO4_4' || number >= 7) {
                        const order = await request('GET', '/api/orders/1', 200);
                        assert.equal(order.total, 31000);
                        assert.ok(order.user.email);
                        assert.ok(order.items[0].product.name);
                        assert.ok((await request('GET', '/api/orders?productId=1', 200)).length >= 2);
                        await request('GET', '/api/orders/999999', 404);
                        checks.push('include/select, relation filter some, историческая сумма заказа');
                    }
                    if (group === 'RO4_4' || number >= 8) {
                        const described = await request('POST', '/api/products', 201, { ...data, description: 'Учебный SSD' }, headers);
                        assert.equal(described.description, 'Учебный SSD');
                        await request('DELETE', `/api/products/${described.id}`, 200);
                        cli(project, ['db', 'seed']);
                        const before = (await pool.query('SELECT (SELECT count(*) FROM categories)::int AS categories, (SELECT count(*) FROM products)::int AS products')).rows[0];
                        cli(project, ['db', 'seed']);
                        const after = (await pool.query('SELECT (SELECT count(*) FROM categories)::int AS categories, (SELECT count(*) FROM products)::int AS products')).rows[0];
                        assert.deepEqual(after, before);
                        assert.equal((await pool.query("SELECT slug FROM categories WHERE name='Ноутбуки'")).rows[0].slug, 'laptops');
                        checks.push('Миграции description/slug применены; повторный seed без дублей');
                    }
                    if (group === 'RO4_4' || number === 9) {
                        const before = (await pool.query('SELECT (SELECT count(*) FROM orders)::int AS orders, (SELECT count(*) FROM order_items)::int AS items')).rows[0];
                        const order = await request('POST', '/api/orders', 201, { userId: 1, items: [{ productId: 1, quantity: 2, price: 1 }, { productId: 2, quantity: 1 }] });
                        assert.equal(order.total, 38000);
                        assert.equal(order.items.find(item => item.productId === 1).price, 15000);
                        const committed = (await pool.query('SELECT (SELECT count(*) FROM orders)::int AS orders, (SELECT count(*) FROM order_items)::int AS items')).rows[0];
                        assert.equal(committed.orders, before.orders + 1);
                        assert.equal(committed.items, before.items + 2);
                        await request('POST', '/api/orders', 409, { userId: 1, items: [{ productId: 1, quantity: 1 }, { productId: 999999, quantity: 1 }] });
                        const rolledBack = (await pool.query('SELECT (SELECT count(*) FROM orders)::int AS orders, (SELECT count(*) FROM order_items)::int AS items')).rows[0];
                        assert.deepEqual(rolledBack, committed);
                        await request('POST', '/api/orders', 400, { userId: 1, items: [] });
                        await request('POST', '/api/orders', 400, { userId: 1, items: [{ productId: 1, quantity: 0 }] });
                        await request('POST', '/api/orders', 400, { userId: 1, items: [{ productId: 1, quantity: 1 }, { productId: 1, quantity: 2 }] });
                        await request('POST', '/api/orders', 404, { userId: 999999, items: [{ productId: 1, quantity: 1 }] });
                        checks.push('Атомарный заказ COMMIT/ROLLBACK; цена из БД; валидация позиций');
                    }
                    if (group === 'RO4_4') {
                        const user = { name: 'Кирилл', email: 'kirill@example.com', password: 'ExamplePassword123!' };
                        const registered = await request('POST', '/api/auth/register', 201, user);
                        assert.ok(!JSON.stringify(registered).includes('password'));
                        await request('POST', '/api/auth/register', 409, user);
                        await request('POST', '/api/auth/register', 400, { ...user, name: ' ' });
                        await request('POST', '/api/auth/register', 400, { ...user, email: 'invalid' });
                        await request('POST', '/api/auth/register', 400, { ...user, role: 'admin' });
                        const login = await request('POST', '/api/auth/login', 200, { email: user.email, password: user.password });
                        assert.equal(login.user.name, user.name);
                        assert.equal(login.user.role, 'user');
                        const bad = await request('POST', '/api/auth/login', 401, { email: user.email, password: 'wrong-password' });
                        const missing = await request('POST', '/api/auth/login', 401, { email: 'unknown@example.com', password: user.password });
                        assert.deepEqual(bad, missing);
                        const stored = (await pool.query('SELECT password_hash FROM users WHERE email=$1', [user.email])).rows[0].password_hash;
                        assert.match(stored, /^\$argon2id\$/);
                        assert.notEqual(stored, user.password);
                        const { hashPassword, verifyPassword } = await import(`../${project}/services/passwordService.js`);
                        const second = await hashPassword(user.password);
                        assert.notEqual(stored, second);
                        assert.equal(await verifyPassword(stored, user.password), true);
                        assert.equal(await verifyPassword(stored, 'wrong-password'), false);
                        if (number === 2) {
                            const other = { ...user, email: 'same-password@example.com' };
                            await request('POST', '/api/auth/register', 201, other);
                            const hash = (await pool.query('SELECT password_hash FROM users WHERE email=$1', [other.email])).rows[0].password_hash;
                            assert.notEqual(hash, stored);
                            await request('POST', '/api/auth/login', 200, { email: other.email, password: other.password });
                            checks.push('Два зарегистрированных аккаунта с одним паролем имеют разные хеши; оба проходят login');
                        }
                        await request('GET', '/login.html', 200);
                        checks.push('Регистрация/login; одинаковая ошибка для неверных credentials', 'Argon2id, разные salt, пароль и хеш отсутствуют в ответах');
                        if (number === 3) {
                            const token = login.accessToken;
                            assert.ok(token);
                            const payload = JSON.parse(Buffer.from(token.split('.')[1], 'base64url').toString());
                            assert.equal(payload.sub, String(registered.user.id));
                            assert.ok(payload.exp > payload.iat);
                            assert.ok(!JSON.stringify(payload).includes('password'));
                            await request('GET', '/api/auth/me', 401);
                            await request('GET', '/api/auth/me', 401, undefined, { Authorization: `Token ${token}` });
                            await request('GET', '/api/auth/me', 200, undefined, { Authorization: `Bearer ${token}` });
                            await request('GET', '/api/auth/me', 401, undefined, { Authorization: `Bearer ${token.slice(0, -3)}xyz` });
                            await request('GET', '/api/orders/my', 401);
                            await request('GET', '/api/orders/my', 200, undefined, { Authorization: `Bearer ${token}` });
                            const { createAccessToken } = await import(`../${project}/services/tokenService.js`);
                            process.env.JWT_EXPIRES_IN = '-1s';
                            const expired = createAccessToken(registered.user);
                            process.env.JWT_EXPIRES_IN = '15m';
                            await request('GET', '/api/auth/me', 401, undefined, { Authorization: `Bearer ${expired}` });
                            checks.push('JWT: подпись, sub/iat/exp, issuer/audience, Bearer; изменённый и просроченный token → 401');
                        }
                    }
                    await request('GET', '/api/unknown', 404);
                });
                await saveEvidence(project, evidence, checks);
            } finally {
                if (prisma) await prisma.$disconnect();
                if (appPool) await appPool.end();
                await pool.end();
            }
        });
    }
}
test('RO4_3 / миграции: развёртывание пустой учебной БД и повторный seed', { skip: !adminUrl }, async () => {
    const project = 'RO4_3/lesson8';
    const previous = process.env.DATABASE_URL;
    const database = `nodejs_lab_restore_${Date.now()}`;
    await admin.query(`CREATE DATABASE "${database}"`);
    const url = new URL(adminUrl);
    url.pathname = `/${database}`;
    process.env.DATABASE_URL = url.href;
    const pool = new Pool({ connectionString: url.href });
    try {
        cli(project, ['migrate', 'deploy']);
        cli(project, ['db', 'seed']);
        cli(project, ['db', 'seed']);
        cli(project, ['migrate', 'status']);
        assert.equal((await pool.query('SELECT COUNT(*)::int AS n FROM products')).rows[0].n, 2);
        assert.deepEqual((await pool.query('SELECT slug FROM categories ORDER BY slug')).rows.map(row => row.slug), ['accessories', 'laptops']);
    } finally { process.env.DATABASE_URL = previous; await pool.end(); }
});

test.after(async () => { if (admin) await admin.end(); });
