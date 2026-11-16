import test from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { mkdtemp, copyFile, writeFile, readFile, access, mkdir, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { spawnSync } from 'node:child_process';
import { saveEvidence } from './helpers.js';

const require = createRequire(import.meta.url);

test('RO4_1 / лабораторная 1: CLI-аргументы и информация о Node', () => {
    for (const [script, args, expected] of [
        ['hello.js', ['Кирилл'], /hello, Кирилл/],
        ['calc.js', ['12', '30'], /42/],
        ['info.js', [], /v\d+\./]
    ]) {
        const result = spawnSync(process.execPath, [resolve('RO4_1/lesson1', script), ...args], { encoding: 'utf8' });
        assert.equal(result.status, 0, result.stderr);
        assert.match(result.stdout, expected);
    }
});

test('RO4_1 / модули: арифметика и чётность', () => {
    const math = require('../RO4_1/lesson2/math.js');
    const validator = require('../RO4_1/lesson2/validator.js');
    assert.equal(math.add(2, 3), 5);
    assert.equal(math.subtract(2, 3), -1);
    for (const number of [-4, 0, 2, 100]) assert.equal(validator.isEven(number), true);
    for (const number of [-3, 1, 7]) assert.equal(validator.isEven(number), false);
    assert.equal(validator.isPositive(-1), false);
    assert.equal(validator.isPositive(1), true);
});

test('RO4_1 / path: имя файла из argv и запуск из другого каталога', () => {
    const result = spawnSync(process.execPath, [resolve('RO4_1/lesson3/index.js'), 'custom.txt'], { cwd: tmpdir(), encoding: 'utf8' });
    assert.equal(result.status, 0, result.stderr);
    assert.ok(result.stdout.includes(join('RO4_1', 'lesson3', 'files', 'custom.txt')));
    assert.ok(!result.stdout.includes('[object Undefined]'));
});

test('RO4_1 / лабораторная 4: синхронные файлы и переименование', async () => {
    const directory = await mkdtemp(join(tmpdir(), 'nodejs-audit-sync-'));
    try {
        await copyFile('RO4_1/lesson4/index.js', join(directory, 'index.cjs'));
        const result = spawnSync(process.execPath, [join(directory, 'index.cjs')], { cwd: tmpdir(), encoding: 'utf8' });
        assert.equal(result.status, 0, result.stderr);
        assert.match(await readFile(join(directory, 'data/inventory_final.txt'), 'utf8'), /Монитор: 10/);
        await assert.rejects(access(join(directory, 'data/inventory.txt')));
    } finally { await rm(directory, { recursive: true, force: true }); }
});

test('RO4_1 / лабораторная 5: async fs, безопасная копия и Promise.all', async () => {
    const directory = await mkdtemp(join(tmpdir(), 'nodejs-audit-fs-'));
    try {
        await copyFile('RO4_1/lesson5/index.js', join(directory, 'index.cjs'));
        const lab = require(join(directory, 'index.cjs'));
        await lab.setup();
        assert.equal(await readFile(join(directory, 'storage/status.txt'), 'utf8'), 'Система готова');
        await lab.addLog('first');
        await lab.addLog('second');
        const log = await readFile(join(directory, 'storage/activity.log'), 'utf8');
        assert.match(log, /\d{4}-\d\d-\d\dT.* first\n/);
        assert.match(log, /second\n/);
        assert.equal(await lab.readUpper(), null);
        await writeFile(join(directory, 'tasks.txt'), 'hello');
        assert.equal(await lab.readUpper(), 'HELLO');
        await writeFile(join(directory, 'source.txt'), 'important source');
        await mkdir(join(directory, 'copy.txt'));
        await assert.rejects(lab.makeCopy());
        assert.equal(await readFile(join(directory, 'source.txt'), 'utf8'), 'important source');
        await rm(join(directory, 'copy.txt'), { recursive: true });
        assert.equal(await lab.makeCopy(), true);
        assert.equal(await readFile(join(directory, 'copy.txt'), 'utf8'), 'important source');
        await assert.rejects(access(join(directory, 'source.txt')));
        assert.deepEqual(await lab.checkFiles(['copy.txt', 'missing.txt']), [
            { file: 'copy.txt', exists: true }, { file: 'missing.txt', exists: false }
        ]);
        await saveEvidence('RO4_1/lesson5', [], ['setup ожидает создание папки и файла', 'Нет tasks.txt → понятное сообщение без падения', 'Журнал содержит дату и сохраняет предыдущие записи', 'Ошибка записи копии сохраняет оригинал; успешная запись предшествует удалению', 'Promise.all различает существующий и отсутствующий файл']);
    } finally { await rm(directory, { recursive: true, force: true }); }
});

test('RO4_1 / лабораторная 6: JSON CRUD и id после удаления', async () => {
    const directory = await mkdtemp(join(tmpdir(), 'nodejs-audit-json-'));
    try {
        await copyFile('RO4_1/lesson6/index.js', join(directory, 'index.cjs'));
        const lab = require(join(directory, 'index.cjs'));
        await lab.createFile();
        assert.deepEqual(await lab.readBooks(), []);
        await lab.writeBooks([{ id: 4, title: 'Old', author: 'Author', year: 1900, isIssued: false }, { id: 9, title: 'New', author: 'Author', year: 2020, isIssued: false }]);
        await lab.addBook('Newest', 'Author', 2026);
        assert.equal((await lab.readBooks())[2].id, 10);
        await lab.issueBook(9);
        assert.equal((await lab.readBooks()).find(book => book.id === 9).isIssued, true);
        await lab.deleteOldBooks(2026);
        assert.deepEqual((await lab.readBooks()).map(book => book.id), [9, 10]);
        await lab.addBook('Another', 'Other', 2026);
        assert.equal((await lab.readBooks())[2].id, 11);
        await saveEvidence('RO4_1/lesson6', [], ['Инициализация books.json пустым массивом', 'Добавление не повторяет id после удаления', 'Выдача меняет isIssued', 'Удаляются только книги старше 50 лет']);
    } finally { await rm(directory, { recursive: true, force: true }); }
});

test('RO4_1 / лабораторная 8: npm start и Nano ID', () => {
    const result = spawnSync(process.execPath, [resolve('RO4_1/lesson8/lab-npm-1/app.js')], { encoding: 'utf8' });
    assert.equal(result.status, 0, result.stderr);
    assert.match(result.stdout, /Сгенерированный ID: [\w-]{21}/);
});

test('RO4_1 / лабораторная 9: порог событий, отсутствующий LIMIT', async () => {
    const events = require('../RO4_1/lesson9/events.js');
    const { checkTransfer } = require('../RO4_1/lesson9/monitor.js');
    const received = [];
    const regular = amount => received.push(['transfer', amount]);
    const fraud = amount => received.push(['fraud-alert', amount]);
    events.on('transfer', regular);
    events.on('fraud-alert', fraud);
    try { checkTransfer(100, 100); checkTransfer(101, 100); }
    finally { events.off('transfer', regular); events.off('fraud-alert', fraud); }
    assert.deepEqual(received, [['transfer', 100], ['fraud-alert', 101]]);
    const result = spawnSync(process.execPath, [resolve('RO4_1/lesson9/index.js')], { env: { ...process.env, LIMIT: '' }, encoding: 'utf8' });
    assert.equal(result.status, 1);
    assert.match(result.stderr, /LIMIT/);
    await saveEvidence('RO4_1/lesson9', [], ['Ровно на лимите → transfer', 'Выше лимита → fraud-alert', 'Отсутствующий/некорректный LIMIT останавливает запуск с понятной ошибкой', '.env читается относительно каталога урока, параметры вынесены в .env.example']);
});
