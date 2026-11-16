import assert from 'node:assert/strict';
import { once } from 'node:events';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { chromium } from 'playwright';
import dotenv from 'dotenv';

const browser = await chromium.launch({ executablePath: process.env.CHROMIUM_PATH || '/usr/bin/chromium', headless: true });
try {
    const project = 'RO4_2/lesson9';
    const { default: app } = await import(`../${project}/app.js`);
    const server = app.listen(0, '127.0.0.1');
    await once(server, 'listening');
    const page = await browser.newPage({ viewport: { width: 1200, height: 950 }, locale: 'ru-RU' });
    const errors = [];
    page.on('pageerror', error => errors.push(error.message));
    try {
        await page.goto(`http://127.0.0.1:${server.address().port}`);
        await page.locator('article').nth(4).waitFor();
        assert.equal(await page.locator('article').count(), 5);
        await page.locator('#name').fill('SSD 2TB');
        await page.locator('#price').fill('65000');
        await page.locator('#category').fill('Components');
        await page.getByRole('button', { name: 'Добавить', exact: true }).click();
        await page.getByRole('heading', { name: 'SSD 2TB', exact: true }).waitFor();
        assert.equal(await page.locator('article').count(), 6);
        const card = page.locator('article').filter({ has: page.getByRole('heading', { name: 'SSD 2TB', exact: true }) });
        page.once('dialog', dialog => dialog.accept('42000'));
        await card.getByRole('button', { name: 'Изменить цену' }).click();
        await card.getByText('Цена: 42000 ₸', { exact: true }).waitFor();
        await mkdir(`${project}/screenshots`, { recursive: true });
        await page.screenshot({ path: `${project}/screenshots/browser.png`, fullPage: true });
        page.once('dialog', dialog => dialog.accept('-500'));
        await card.getByRole('button', { name: 'Изменить цену' }).click();
        await page.locator('#message.error').waitFor();
        assert.ok((await card.textContent()).includes('42000'));
        page.once('dialog', dialog => dialog.accept());
        await card.getByRole('button', { name: 'Удалить', exact: true }).click();
        await card.waitFor({ state: 'detached' });
        assert.equal(await page.locator('article').count(), 5);
        await page.locator('#name').fill('Invalid SSD');
        await page.locator('#price').fill('-100');
        await page.locator('#category').fill('Components');
        await page.getByRole('button', { name: 'Добавить', exact: true }).click();
        await page.locator('#message.error').waitFor();
        assert.equal(await page.locator('article').count(), 5);
        assert.deepEqual(errors, []);
        const evidence = JSON.parse(await readFile(`${project}/verification.json`, 'utf8'));
        evidence.checks.push('Chromium: форма POST, кнопки PATCH/DELETE, ошибки отрицательной цены, обновление DOM, отсутствие pageerror');
        await writeFile(`${project}/verification.json`, JSON.stringify(evidence, null, 2) + '\n');
        console.log('RO4_2/lesson9: browser CRUD passed');
    } finally { await page.close(); await new Promise(resolve => server.close(resolve)); }

    for (let number = 1; number <= 3; number++) {
        const project = `RO4_4/lesson${number}`;
        dotenv.config({ path: `${project}/.env`, override: true, quiet: true });
        const { default: app } = await import(`../${project}/app.js`);
        const { prisma } = await import(`../${project}/config/prisma.js`);
        const server = app.listen(0, '127.0.0.1');
        await once(server, 'listening');
        const page = await browser.newPage({ viewport: { width: 1200, height: 750 }, locale: 'ru-RU' });
        try {
            await page.goto(`http://127.0.0.1:${server.address().port}/login.html`);
            await page.locator('[name=email]').fill('kirill@example.com');
            await page.locator('[name=password]').fill('wrong-password');
            await page.getByRole('button', { name: 'Войти', exact: true }).click();
            await page.getByText('Ошибка: Invalid email or password', { exact: true }).waitFor();
            await page.locator('[name=password]').fill('ExamplePassword123!');
            await page.getByRole('button', { name: 'Войти', exact: true }).click();
            await page.getByText('Здравствуйте, Кирилл!', { exact: true }).waitFor();
            assert.equal(await page.locator('[name=password]').inputValue(), '');
            await mkdir(`${project}/screenshots`, { recursive: true });
            await page.screenshot({ path: `${project}/screenshots/browser.png`, fullPage: true });
            const evidence = JSON.parse(await readFile(`${project}/verification.json`, 'utf8'));
            evidence.checks.push('Chromium: login через fetch, сообщение при неверном пароле, имя после входа, очистка поля пароля');
            await writeFile(`${project}/verification.json`, JSON.stringify(evidence, null, 2) + '\n');
            console.log(`${project}: browser login passed`);
        } finally { await page.close(); await new Promise(resolve => server.close(resolve)); await prisma.$disconnect(); }
    }
} finally { await browser.close(); }
