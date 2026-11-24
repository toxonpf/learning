import assert from 'node:assert/strict';
import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { once } from 'node:events';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import express from 'express';
import { chromium } from 'playwright';
const states = JSON.parse(await readFile('tmp/new-databases.json', 'utf8'));
const browser = await chromium.launch({ channel: 'chrome', headless: true });
async function listen(app, port) { const server = app.listen(port); await once(server, 'listening'); return server; }
async function close(server) { await new Promise(resolve => server.close(resolve)); }
try {
    for (const number of [5, 6, 7, 8, 9]) {
        const project = `RO4_4/lesson${number}`;
        if (process.env.LAB_FILTER && !project.includes(process.env.LAB_FILTER)) continue;
        const state = states.find(item => item.project === project);
        Object.assign(process.env, { DATABASE_URL: state.databaseUrl, JWT_SECRET: state.jwtSecret, NODE_ENV: 'test', LOG_LEVEL: 'silent', FRONTEND_ORIGIN: 'http://localhost:5500' });
        const { app } = await import(pathToFileURL(resolve(project, 'app.js')));
        const { prisma } = await import(pathToFileURL(resolve(project, 'config/prisma.js')));
        // Each browser run starts with fresh in-memory rate limit state.
        if (number >= 8) {
            const { loginLimiter, apiLimiter } = await import(pathToFileURL(resolve(project, 'middleware/rateLimiters.js')));
            for (const ip of ['127.0.0.1', '::ffff:127.0.0.1', '::/56']) { loginLimiter.resetKey(ip); apiLimiter.resetKey(ip); }
        }
        const api = await listen(app, 3000);
        const staticApp = express(); staticApp.use(express.static(resolve(project, 'frontend')));
        const front = number >= 7 ? await listen(staticApp, 5500) : null;
        const origin = number >= 7 ? 'http://localhost:5500' : 'http://localhost:3000';
        const context = await browser.newContext({ viewport: { width: 1280, height: 900 } });
        const page = await context.newPage();
        const checks = [];
        try {
            await page.goto(origin + '/#/profile');
            await page.waitForURL('**/#/login');
            checks.push('Guest guard перенаправляет profile на login');
            async function login(email, password = 'Example123!') {
                await page.goto(origin + '/#/login');
                await page.locator('#email').fill(email); await page.locator('#password').fill(password);
                await page.locator('#login-button').click();
            }
            await login(state.userEmail, 'WrongPassword!');
            await page.waitForFunction(() => document.querySelector('#login-error')?.textContent.includes('Invalid'));
            await login(state.userEmail);
            await page.waitForURL('**/#/orders');
            await page.waitForFunction(() => document.querySelector('#orders-status')?.textContent.includes('Загружено:'));
            const denied = await page.evaluate(async () => {
                const { apiFetch } = await import('/api.js');
                try { await apiFetch('/products', { method: 'POST', body: { name: 'Denied', price: 1000, categoryId: 1, inStock: true } }); }
                catch (error) { return { status: error.status, auth: (await import('/authState.js')).getAuthState().status }; }
            });
            assert.deepEqual(denied, { status: 403, auth: 'authenticated' });
            checks.push('Login через fetch; собственные заказы; 403 сохраняет auth state');
            await page.goto(origin + '/#/admin');
            await page.waitForFunction(() => document.querySelector('#app')?.textContent.includes('Недостаточно прав'));
            assert.equal(await page.locator('a[href="#/admin"]').count(), 0);
            await page.locator('#logout-button').click();
            await login(state.adminEmail);
            await page.waitForURL('**/#/orders');
            await page.locator('a[href="#/admin"]').click();
            await page.waitForSelector('#product-form');
            checks.push('User не открывает admin UI; admin видит ссылку и форму; logout очищает UI');
            if (number === 9) {
                await page.locator('#image-form input[name=image]').setInputFiles('scripts/fixtures/pixel.png');
                await page.locator('#image-form button').click();
                await page.waitForFunction(() => document.querySelector('#image-status')?.textContent.includes('Изображение загружено'));
                await page.waitForFunction(() => document.querySelector('#image-status img')?.naturalWidth === 16);
                checks.push('FormData upload через браузер; изображение выдано controlled GET');
            }
            if (number === 5) {
                await page.goto(origin + '/#/orders');
                await page.waitForFunction(() => document.querySelector('#orders-status')?.textContent.includes('Загружено:'));
            }
            await mkdir(resolve(project, 'screenshots'), { recursive: true });
            await page.screenshot({ path: resolve(project, 'screenshots/browser.png'), fullPage: true });
            const corsEvidence = {};
            if (number === 7) {
                const noCors = express(); noCors.get('/api/products', (req, res) => res.json([]));
                const missing = await listen(noCors, 3001);
                try {
                    corsEvidence.withoutMiddleware = await page.evaluate(async () => {
                        try { await fetch('http://localhost:3001/api/products'); return 'unexpected success'; }
                        catch (error) { return error.message; }
                    });
                    assert.match(corsEvidence.withoutMiddleware, /fetch/i);
                } finally { await close(missing); }
                corsEvidence.allowed = await page.evaluate(async () => (await fetch('http://localhost:3000/api/products')).status);
                assert.equal(corsEvidence.allowed, 200);
                await page.evaluate(async () => { await fetch('http://localhost:3000/api/demo-cookie', { method: 'POST', credentials: 'include' }); });
                const cookies = await context.cookies('http://localhost:3000');
                assert.ok(cookies.find(cookie => cookie.name === 'demo_session' && cookie.httpOnly));
                assert.ok(!(await page.evaluate(() => document.cookie)).includes('demo_session'));
                const other = await listen(staticApp, 5600);
                try {
                    const deniedPage = await context.newPage(); await deniedPage.goto('http://localhost:5600');
                    corsEvidence.forbidden = await deniedPage.evaluate(async () => {
                        try { await fetch('http://localhost:3000/api/products'); return 'unexpected success'; }
                        catch (error) { return error.message; }
                    });
                    assert.match(corsEvidence.forbidden, /fetch/i); await deniedPage.close();
                } finally { await close(other); }
                checks.push('Chromium: CORS error без middleware; origin 5500 разрешён, 5600 блокируется; HttpOnly cookie скрыта от document.cookie');
            }
            assert.deepEqual(await page.evaluate(() => [localStorage.length, sessionStorage.length]), [0, 0]);
            await page.reload(); await page.waitForURL('**/#/login');
            checks.push('Reload удаляет in-memory JWT; localStorage/sessionStorage пусты');
            if (number === 5 || number === 6) {
                process.env.JWT_EXPIRES_IN = '1s';
                await login(state.userEmail); await page.waitForURL('**/#/orders');
                await new Promise(resolve => setTimeout(resolve, 1600));
                const expired = await page.evaluate(async () => {
                    try { await (await import('/api.js')).apiFetch('/orders/my'); } catch (error) { return error.status; }
                });
                assert.equal(expired, 401); await page.waitForURL('**/#/login');
                process.env.JWT_EXPIRES_IN = '15m';
                checks.push('Реальное истечение JWT: 401 очищает state и открывает login');
            }
            const verificationPath = resolve(project, 'verification.json');
            const evidence = JSON.parse(await readFile(verificationPath, 'utf8'));
            evidence.checks = [...new Set([...evidence.checks, ...checks])]; evidence.browser = { engine: 'Chromium', checks, ...corsEvidence };
            await writeFile(verificationPath, JSON.stringify(evidence, null, 2) + '\n');
            console.log(`PASS browser ${project}`);
        } finally { await context.close(); await close(api); if (front) await close(front); await prisma.$disconnect(); }
    }
} finally { await browser.close(); }
