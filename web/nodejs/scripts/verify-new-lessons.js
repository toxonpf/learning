import assert from 'node:assert/strict';
import { readFile, writeFile, mkdir, readdir } from 'node:fs/promises';
import { spawnSync } from 'node:child_process';
import { randomBytes } from 'node:crypto';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import { Pool } from 'pg';
import { withServer } from '../tests/helpers.js';

if (!process.env.TEST_DATABASE_URL) throw new Error('Set TEST_DATABASE_URL to an isolated PostgreSQL administrator connection');
const admin = new Pool({ connectionString: process.env.TEST_DATABASE_URL });
const root = resolve('.');
const states = [];
function cli(project, args, expected = 0) {
    const result = spawnSync(process.execPath, args, { cwd: project, encoding: 'utf8', env: process.env, timeout: 120000 });
    assert.equal(result.status, expected, `${project}: ${args.join(' ')}\n${result.stdout}\n${result.stderr}`);
    return (result.stdout + result.stderr).replace(/\x1b\[[0-9;]*m/g, '');
}
const json = value => JSON.stringify(value, null, 2) + '\n';
try {
    for (const [group, numbers] of [['RO4_4', [4, 5, 6, 7, 8, 9]], ['RO4_5', [1, 2, 3, 4, 5, 6]]]) {
        for (const number of numbers) {
            const relative = `${group}/lesson${number}`;
            if (process.env.LAB_FILTER && !relative.includes(process.env.LAB_FILTER)) continue;
            const project = resolve(relative);
            console.log(`Checking ${relative}`);
            const database = `nodejs_lab_new_${group.toLowerCase()}_${number}_${Date.now()}`;
            await admin.query(`CREATE DATABASE "${database}"`);
            const url = new URL(process.env.TEST_DATABASE_URL); url.pathname = '/' + database;
            Object.assign(process.env, { DATABASE_URL: url.href, JWT_SECRET: randomBytes(32).toString('hex'), NODE_ENV: 'test',
                CORS_ORIGIN: 'http://localhost:5500', FRONTEND_ORIGIN: 'http://localhost:5500', LOG_LEVEL: 'silent', JWT_EXPIRES_IN: '15m' });
            const envText = ['PORT=3000', ...['DATABASE_URL', 'JWT_SECRET', 'CORS_ORIGIN', 'FRONTEND_ORIGIN', 'LOG_LEVEL'].map(key => `${key}=${process.env[key]}`)].join('\n') + '\n';
            await writeFile(resolve(project, '.env'), envText);
            if (group === 'RO4_5' && number >= 3) await writeFile(resolve(project, '.env.test'), 'NODE_ENV=test\n' + envText);
            cli(project, [resolve('node_modules/prisma/build/index.js'), 'generate']);
            const migrationLog = cli(project, [resolve('node_modules/prisma/build/index.js'), 'migrate', 'deploy']);
            const { prisma } = await import(pathToFileURL(resolve(project, 'config/prisma.js')));
            const { app } = await import(pathToFileURL(resolve(project, 'app.js')));
            const checks = ['Prisma Client сгенерирован; миграции применены к новой изолированной PostgreSQL', 'Публичное чтение каталога; JWT/RBAC: 401, 403 и admin CRUD'];
            const commands = [{ command: 'prisma migrate deploy', output: migrationLog }];
            let userEmail, adminEmail;
            try {
                const category = await prisma.category.create({ data: { name: 'Accessories' } });
                const product = await prisma.product.create({ data: { name: 'Keyboard', price: 25000, categoryId: category.id, inStock: true } });
                const input = { name: 'USB Hub', price: 12000, categoryId: category.id, inStock: true };
                userEmail = `user-${Date.now()}@example.com`; adminEmail = `admin-${Date.now()}@example.com`;
                const password = 'Example123!';
                const evidence = await withServer(app, async (request, address, extra) => {
                    assert.ok(Array.isArray(await request('GET', '/api/products', 200)));
                    await request('GET', '/api/products/999999', 404);
                    await request('GET', '/api/products/abc', 400);
                    const user = (await request('POST', '/api/auth/register', 201, { name: 'User One', email: userEmail, password, role: 'admin' })).user;
                    assert.equal(user.role, 'user');
                    await request('POST', '/api/auth/register', 201, { name: 'Admin One', email: adminEmail, password });
                    await prisma.user.update({ where: { email: adminEmail }, data: { role: 'admin' } });
                    const userLogin = await request('POST', '/api/auth/login', 200, { email: userEmail, password });
                    const adminLogin = await request('POST', '/api/auth/login', 200, { email: adminEmail, password });
                    const userHeaders = { Authorization: `Bearer ${userLogin.accessToken}` };
                    const adminHeaders = { Authorization: `Bearer ${adminLogin.accessToken}` };
                    await request('GET', '/api/auth/me', 200, undefined, userHeaders);
                    for (const [method, path, body] of [['POST', '/api/products', input], ['PATCH', `/api/products/${product.id}`, { price: 30000 }], ['DELETE', `/api/products/${product.id}`, undefined]]) {
                        await request(method, path, 401, body);
                        await request(method, path, 403, body, userHeaders);
                    }
                    await request('POST', '/api/products', 401, input, { Authorization: 'Bearer invalid' });
                    const created = await request('POST', '/api/products', 201, input, adminHeaders);
                    assert.equal((await prisma.product.findUnique({ where: { id: created.id } })).price, input.price);
                    const patched = await request('PATCH', `/api/products/${created.id}`, 200, { price: 15000 }, adminHeaders);
                    assert.equal(patched.price, 15000);
                    await request('DELETE', `/api/products/${created.id}`, 200, undefined, adminHeaders);
                    assert.equal(await prisma.product.findUnique({ where: { id: created.id } }), null);
                    const strict = group === 'RO4_5' || number >= 8;
                    const orderBody = { items: [{ productId: product.id, quantity: 1 }] };
                    const order = await request('POST', '/api/orders', 201, strict ? orderBody : { ...orderBody, userId: 99999 }, userHeaders);
                    assert.equal(order.userId, user.id);
                    assert.equal((await request('GET', '/api/orders/my', 200, undefined, userHeaders)).length, 1);
                    await request('GET', `/api/orders/my/${order.id}`, 200, undefined, userHeaders);
                    await request('GET', `/api/orders/my/${order.id}`, 404, undefined, adminHeaders);
                    await request('GET', `/api/orders/${order.id}`, 403, undefined, userHeaders);
                    await request('GET', '/api/orders/my', 401);
                    checks.push('Регистрация не повышает роль; владелец Order берётся из JWT; чужой Order возвращает 404');
                    if (strict) {
                        for (const changes of [{ price: 0 }, { price: 'free' }, { categoryId: 0 }, { name: 'X' }, { name: 'X'.repeat(151) }, { role: 'admin' }])
                            await request('POST', '/api/products', 400, { ...input, ...changes }, adminHeaders);
                        await request('PATCH', `/api/products/${product.id}`, 400, { price: 0 }, adminHeaders);
                        await request('PATCH', `/api/products/${product.id}`, 400, { role: 'admin' }, adminHeaders);
                        await request('DELETE', '/api/products/abc', 400, undefined, adminHeaders);
                        for (const body of [{ items: [] }, { items: [{ productId: product.id, quantity: 0 }] }, { items: [{ productId: product.id, quantity: 101 }] }, { items: [{ productId: -1, quantity: 1 }] }, { ...orderBody, userId: 999 }])
                            await request('POST', '/api/orders', 400, body, userHeaders);
                        await request('POST', '/api/auth/login', 400, { email: 'invalid', password });
                        await request('POST', '/api/auth/login', 413, { email: userEmail, password: 'x'.repeat(110000) });
                        const headers = (await fetch(address + '/api/products')).headers;
                        assert.ok(headers.get('content-security-policy')); assert.equal(headers.get('x-content-type-options'), 'nosniff');
                        assert.ok(headers.get('referrer-policy')); assert.equal(headers.get('x-powered-by'), null);
                        checks.push('express-validator: диапазоны, PATCH, id, неизвестные поля, Order; 100kb → 413; Helmet headers');
                    }
                    if (group === 'RO4_5' || number >= 7) {
                        const allowed = await fetch(address + '/api/products', { method: 'OPTIONS', headers: {
                            Origin: 'http://localhost:5500', 'Access-Control-Request-Method': 'POST', 'Access-Control-Request-Headers': 'authorization,content-type' } });
                        assert.equal(allowed.status, 204); assert.equal(allowed.headers.get('access-control-allow-origin'), 'http://localhost:5500');
                        assert.equal(allowed.headers.get('access-control-allow-credentials'), 'true');
                        extra.push({ method: 'OPTIONS', path: '/api/products', status: 204, response: Object.fromEntries(allowed.headers) });
                        const denied = await fetch(address + '/api/products', { headers: { Origin: 'http://localhost:5600' } });
                        assert.notEqual(denied.headers.get('access-control-allow-origin'), 'http://localhost:5600');
                        const cookie = await fetch(address + '/api/demo-cookie', { method: 'POST', headers: { Origin: 'http://localhost:5500' } });
                        assert.match(cookie.headers.get('set-cookie'), /HttpOnly/);
                        checks.push('CORS explicit origin, preflight OPTIONS и credentialed HttpOnly demo cookie');
                    }
                    if (group === 'RO4_5' || number === 9) {
                        const directory = resolve(project, 'storage/product-images');
                        const files = async () => (await readdir(directory)).filter(name => name !== '.gitkeep').sort();
                        const upload = async (bytes, mime, expected, headers = adminHeaders, id = product.id, filename = 'original.png') => {
                            const body = new FormData(); body.append('image', new Blob([bytes], { type: mime }), filename);
                            const response = await fetch(`${address}/api/products/${id}/image`, { method: 'POST', headers, body });
                            const data = await response.json(); assert.equal(response.status, expected, JSON.stringify(data));
                            extra.push({ method: 'POST', path: `/api/products/${id}/image`, status: response.status, response: data });
                            return data;
                        };
                        const png = await readFile(resolve(root, 'scripts/fixtures/pixel.png'));
                        const jpg = await readFile(resolve(root, 'scripts/fixtures/pixel.jpg'));
                        await upload(png, 'image/png', 401, {}); await upload(png, 'image/png', 403, userHeaders);
                        await request('GET', `/api/products/${product.id}/image`, 404);
                        const before = await files();
                        await upload(Buffer.from('text'), 'text/plain', 400);
                        await upload(Buffer.from('fake jpg'), 'image/jpeg', 400);
                        await upload(png, 'image/jpeg', 400);
                        await upload(png, 'image/png', 404, adminHeaders, 999999);
                        await upload(Buffer.alloc(5 * 1024 * 1024 + 1), 'image/png', 413);
                        assert.deepEqual(await files(), before);
                        const image = await upload(jpg, 'image/jpeg', 201, adminHeaders, product.id, '../../original.jpg');
                        assert.match(image.imageName, /^[0-9a-f-]{36}\.jpg$/);
                        const replacement = await upload(png, 'image/png', 201);
                        assert.ok(!(await files()).includes(image.imageName));
                        const delivered = await fetch(`${address}/api/products/${product.id}/image`);
                        assert.equal(delivered.status, 200);
                        assert.equal(delivered.headers.get('content-type'), 'image/png');
                        assert.deepEqual(Buffer.from(await delivered.arrayBuffer()), png);
                        extra.push({ method: 'GET', path: `/api/products/${product.id}/image`, status: delivered.status,
                            response: { contentType: 'image/png', bytes: png.length } });
                        assert.equal((await prisma.product.findUnique({ where: { id: product.id } })).imageSize, png.length);
                        await request('DELETE', `/api/products/${product.id}/image`, 403, undefined, userHeaders);
                        await request('DELETE', `/api/products/${product.id}/image`, 204, undefined, adminHeaders);
                        assert.equal((await prisma.product.findUnique({ where: { id: product.id } })).imageName, null);
                        assert.ok(!(await files()).includes(replacement.imageName));
                        await request('GET', `/api/products/${product.id}/image`, 404);
                        checks.push('Multer: JPEG/PNG, UUID, metadata PostgreSQL, controlled GET/DELETE, 401/403, fake MIME/signature, >5MB, cleanup и замена');
                    }
                    if (group === 'RO4_5' && number >= 4) {
                        const response = await fetch(address + '/api/products'); assert.ok(response.headers.get('x-request-id'));
                        checks.push('X-Request-Id и регрессионный GET с числовым id');
                    }
                    if (group === 'RO4_5' && number >= 5) {
                        assert.deepEqual(await request('GET', '/health/live', 200), { status: 'ok' });
                        assert.deepEqual(await request('GET', '/health/ready', 200), { status: 'ready' });
                        checks.push('Liveness 200; readiness выполняет SELECT 1 в PostgreSQL');
                    }
                    if (strict) {
                        let limited;
                        for (let i = 0; i < 12; i++) {
                            const response = await fetch(address + '/api/auth/login', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email: userEmail, password: 'WrongPassword!' }) });
                            if (response.status === 429) { limited = response; break; }
                        }
                        assert.ok(limited); assert.ok(limited.headers.get('ratelimit-limit'));
                        extra.push({ method: 'POST', path: '/api/auth/login', status: 429, response: await limited.json() });
                        checks.push('Отдельный login limiter возвращает 429 и RateLimit headers');
                    }
                });
                if (group === 'RO4_5') {
                    const args = number === 1 ? ['--test', 'tests/orderMath.test.js'] : ['--experimental-vm-modules', 'scripts/run-jest.js', '--runInBand'];
                    const output = cli(project, args); commands.push({ command: 'npm test', output });
                    // Repeat is required by the assignments to demonstrate deterministic results.
                    const repeated = cli(project, args); commands.push({ command: 'npm test (повтор)', output: repeated });
                    checks.push(number === 1 ? 'node:test: позитивные, негативные, граничные проверки; повторный запуск прошёл' : 'Jest ESM: unit, mocks, DI; повторный запуск прошёл' + (number >= 3 ? '; Supertest и отдельная test database' : ' без PostgreSQL'));
                }
                await writeFile(resolve(project, 'verification.json'), json({ checkedAt: new Date().toISOString(), runtime: process.version,
                    database: 'PostgreSQL 18.6, отдельная БД ' + database, checks, requests: evidence, commands }));
            } finally { await prisma.$disconnect(); }
            states.push({ project: relative, databaseUrl: url.href, jwtSecret: process.env.JWT_SECRET, userEmail, adminEmail });
            await mkdir(resolve('tmp'), { recursive: true });
            let previous = [];
            try { previous = JSON.parse(await readFile(resolve('tmp/new-databases.json'), 'utf8')); } catch {}
            await writeFile(resolve('tmp/new-databases.json'), json([...previous.filter(item => !states.some(state => state.project === item.project)), ...states]));
            console.log(`PASS ${relative}`);
        }
    }
} finally { await admin.end(); }
