import request from 'supertest';
import { beforeEach, afterAll, describe, expect, test } from '@jest/globals';
import { app } from '../../app.js';
import { prisma } from '../../config/prisma.js';
import argon2 from 'argon2';
import { loginLimiter, apiLimiter } from '../../middleware/rateLimiters.js';

// До первой очистки требуем отдельную БД и test environment.
const database = decodeURIComponent(new URL(process.env.DATABASE_URL).pathname.slice(1));
if (process.env.NODE_ENV !== 'test' || !/^(shop_test|nodejs_lab_new_[a-z0-9_]+)$/.test(database)) {
    throw new Error('Refusing to clean a database without an explicit test name');
}
const input = { name: 'USB Hub', price: 12000, categoryId: 1, inStock: true };
const password = 'TestPassword123!';
let adminToken, userToken;
beforeEach(async () => {
    for (const ip of ['127.0.0.1', '::ffff:127.0.0.1']) {
        loginLimiter.resetKey(ip); apiLimiter.resetKey(ip);
    }
    await prisma.orderItem.deleteMany();
    await prisma.order.deleteMany();
    await prisma.userProfile.deleteMany();
    await prisma.product.deleteMany();
    await prisma.category.deleteMany();
    await prisma.user.deleteMany();
    await prisma.category.create({ data: { id: 1, name: 'Accessories' } });
    const passwordHash = await argon2.hash(password);
    for (const role of ['admin', 'user']) {
        await prisma.user.create({ data: { name: role, email: `${role}@test.local`, passwordHash, role } });
        const response = await request(app).post('/api/auth/login').send({ email: `${role}@test.local`, password });
        // Reset limiter between isolated tests without changing application defaults.
        expect(response.status).toBe(200);
        if (role === 'admin') adminToken = response.body.accessToken;
        else userToken = response.body.accessToken;
    }
});
afterAll(async () => { await prisma.$disconnect(); });
const auth = token => ({ Authorization: `Bearer ${token}` });
describe('Product API with real PostgreSQL', () => {
    test('empty collection and JSON Content-Type', async () => {
        const response = await request(app).get('/api/products');
        expect(response.status).toBe(200); expect(response.body).toEqual([]);
        expect(response.headers['content-type']).toMatch(/json/);
    });
    test('collection contains stored products', async () => {
        await prisma.product.create({ data: input });
        const response = await request(app).get('/api/products');
        expect(response.status).toBe(200); expect(response.body).toHaveLength(1);
    });
    test('GET by numeric id is a regression test for wrong Prisma type', async () => {
        const product = await prisma.product.create({ data: input });
        const response = await request(app).get(`/api/products/${product.id}`);
        expect(response.status).toBe(200); expect(response.body.id).toBe(product.id);
    });
    test('unknown product returns 404', async () => {
        const response = await request(app).get('/api/products/999999');
        expect(response.status).toBe(404); expect(response.body.error).toBe('Product not found');
    });
    test.each(['abc', '0', '-1'])('invalid id %s returns 400', async id => {
        expect((await request(app).get(`/api/products/${id}`)).status).toBe(400);
    });
    test('no token returns 401', async () => {
        expect((await request(app).post('/api/products').send(input)).status).toBe(401);
    });
    test('invalid token returns 401', async () => {
        expect((await request(app).post('/api/products').set(auth('invalid')).send(input)).status).toBe(401);
    });
    test('user returns 403', async () => {
        expect((await request(app).post('/api/products').set(auth(userToken)).send(input)).status).toBe(403);
    });
    test('admin creates and persists a product', async () => {
        const response = await request(app).post('/api/products').set(auth(adminToken)).send(input);
        expect(response.status).toBe(201);
        const stored = await prisma.product.findUnique({ where: { id: response.body.id } });
        expect(stored).toEqual(expect.objectContaining(input));
    });
    test('validation prevents writes', async () => {
        const response = await request(app).post('/api/products').set(auth(adminToken)).send({ ...input, price: 0 });
        expect(response.status).toBe(400); expect(response.body.error).toBe('Validation failed');
        expect(await prisma.product.count()).toBe(0);
    });
    test('admin PATCH persists and keeps other fields', async () => {
        const product = await prisma.product.create({ data: input });
        const response = await request(app).patch(`/api/products/${product.id}`).set(auth(adminToken)).send({ name: 'Updated' });
        expect(response.status).toBe(200); expect(response.body.price).toBe(input.price);
        expect((await prisma.product.findUnique({ where: { id: product.id } })).name).toBe('Updated');
    });
    test('admin DELETE removes the row', async () => {
        const product = await prisma.product.create({ data: input });
        expect((await request(app).delete(`/api/products/${product.id}`).set(auth(adminToken))).status).toBe(200);
        expect(await prisma.product.findUnique({ where: { id: product.id } })).toBeNull();
    });
    test.each(['patch', 'delete'])('%s unknown product returns 404', async method => {
        const req = request(app)[method]('/api/products/999999').set(auth(adminToken));
        const response = await (method === 'patch' ? req.send({ price: 1000 }) : req);
        expect(response.status).toBe(404);
    });
});
