import test from 'node:test';
import assert from 'node:assert/strict';
import { withServer, saveEvidence } from './helpers.js';

for (let number = 1; number <= 9; number++) {
    test(`RO4_2 / лабораторная ${number}`, async () => {
        const project = `RO4_2/lesson${number}`;
        const { default: app } = await import(`../${project}/app.js`);
        const evidence = await withServer(app, async request => {
            if (number < 9) assert.equal(await request('GET', '/', 200), 'Internet Shop API');
            else assert.match(await request('GET', '/', 200), /product-form/);
            await request('GET', '/about', 200);
            assert.equal((await request('GET', '/api/status', 200)).status, 'ok');
            assert.equal((await request('GET', '/api/shop', 200)).currency, 'KZT');
            const initial = await request('GET', '/api/products', 200);
            assert.equal(initial.length, 5);
            assert.ok((await request('GET', '/api/categories', 200)).length >= 3);
            if (number === 1) return;
            await request('GET', '/api', 200);
            await request('GET', '/api/orders', 200);
            if (number === 2) {
                for (const method of ['POST', 'PUT', 'PATCH', 'DELETE']) {
                    const result = await request(method, '/api/products', method === 'POST' ? 201 : 200);
                    assert.ok(result.message.startsWith(method));
                }
                await request('POST', '/api/categories', 201);
                await request('POST', '/api/orders', 201);
                await request('DELETE', '/api/orders', 404);
                return;
            }
            await request('GET', '/api/products/3', 200);
            await request('GET', '/api/products/999', 404);
            const filtered = await request('GET', '/api/products?category=Accessories&inStock=true&minPrice=10000&maxPrice=50000', 200);
            assert.deepEqual(filtered.map(item => item.name), ['Keyboard']);
            const absent = await request('GET', '/api/products?inStock=false', 200);
            assert.ok(absent.every(item => !item.inStock));
            const headers = number >= 5 ? { 'x-api-key': 'college-demo' } : {};
            const data = { name: 'SSD 2TB', price: 65000, category: 'Components', inStock: true };
            if (number >= 5) {
                await request('POST', '/api/products', 403, data);
                await request('POST', '/api/products', 403, data, { 'x-api-key': 'wrong-key' });
            }
            if (number >= 8) {
                await request('GET', '/api/products?minPrice=abc', 400);
                await request('GET', '/api/products?inStock=maybe', 400);
                await request('GET', '/api/products?minPrice=500&maxPrice=100', 400);
                const result = await request('POST', '/api/products', 400, { ...data, price: -100 }, headers);
                assert.ok(result.errors.length);
                await request('PATCH', '/api/products/1', 400, {});
                await request('PATCH', '/api/products/1', 400, { id: 42 });
            }
            if (number === 8) {
                const { default: router } = await import(`../${project}/routes/productRoutes.js`);
                const before = router.stack.length;
                router.get('/test/error', (req, res, next) => next(new Error('Private database details')));
                try {
                    assert.deepEqual(await request('GET', '/api/products/test/error', 500), { message: 'Internal server error' });
                } finally { router.stack.splice(before); }
            }
            const created = await request('POST', '/api/products', 201, data, headers);
            assert.equal(created.name, data.name);
            await request('GET', `/api/products/${created.id}`, 200);
            const updated = await request('PATCH', `/api/products/${created.id}`, 200, { price: 42000, inStock: false });
            assert.equal(updated.price, 42000);
            assert.equal(updated.name, data.name);
            if (number >= 8) {
                await request('PATCH', `/api/products/${created.id}`, 400, { price: -500 });
                assert.equal((await request('GET', `/api/products/${created.id}`, 200)).price, 42000);
            }
            assert.deepEqual(await request('PATCH', '/api/products/4/settings?notify=true', 200, { price: 399000 }), { id: 4, notify: true, changes: { price: 399000 } });
            await request('DELETE', `/api/products/${created.id}`, 200);
            await request('GET', `/api/products/${created.id}`, 404);
            await request('PATCH', `/api/products/${created.id}`, 404, { price: 42000 });
            await request('DELETE', `/api/products/${created.id}`, 404);
            const replacement = await request('POST', '/api/products', 201, data, headers);
            assert.notEqual(replacement.id, created.id);
            await request('GET', '/api/unknown', 404);
            if (number >= 4) {
                const order = await request('POST', '/api/orders', 201, { status: 'new' });
                await request('GET', `/api/orders/${order.id}`, 200);
                assert.equal((await request('PATCH', `/api/orders/${order.id}`, 200, { status: 'paid' })).status, 'paid');
                await request('GET', '/api/orders/999', 404);
            }
            if (number === 9) {
                await request('GET', '/js/api.js', 200);
                await request('GET', '/js/ui.js', 200);
                await request('GET', '/css/style.css', 200);
            }
        });
        await saveEvidence(project, evidence, ['Обязательные endpoints', 'HTTP-статусы и содержимое ответов', ...(number >= 3 ? ['Полный CRUD-цикл', 'Совместная фильтрация', 'Уникальные id после удаления'] : [])]);
    });
}
