import request from 'supertest';
import { describe, expect, test, afterAll } from '@jest/globals';
import { app } from '../../app.js';
import { prisma } from '../../config/prisma.js';
afterAll(async () => prisma.$disconnect());
describe('Health and request context', () => {
    test('liveness exposes no configuration', async () => {
        const response = await request(app).get('/health/live');
        expect(response.status).toBe(200); expect(response.body).toEqual({ status: 'ok' });
        expect(response.headers['x-powered-by']).toBeUndefined();
    });
    test('readiness queries PostgreSQL and returns JSON', async () => {
        const response = await request(app).get('/health/ready');
        expect(response.status).toBe(200); expect(response.body).toEqual({ status: 'ready' });
        expect(response.headers['content-type']).toMatch(/json/);
    });
    test('request ID is returned and generated independently', async () => {
        const a = await request(app).get('/health/live'); const b = await request(app).get('/health/live');
        expect(a.headers['x-request-id']).toMatch(/^[a-f0-9-]{36}$/);
        expect(a.headers['x-request-id']).not.toBe(b.headers['x-request-id']);
        const c = await request(app).get('/health/live').set('X-Request-Id', 'lab-correlation-123');
        expect(c.headers['x-request-id']).toBe('lab-correlation-123');
    });
});
