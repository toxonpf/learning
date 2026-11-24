import assert from 'node:assert/strict';
import { readFile, writeFile, unlink } from 'node:fs/promises';
import { spawn, spawnSync } from 'node:child_process';
import { once } from 'node:events';
import { createServer } from 'node:net';
import { resolve } from 'node:path';
const states = JSON.parse(await readFile('tmp/new-databases.json', 'utf8'));
const node22 = resolve('tmp/node22/node_modules/node/bin/node.exe');
const run = (node, cwd, args, env) => spawnSync(node, args, { cwd, env, encoding: 'utf8', timeout: 120000 });
async function save(project, check, command) {
    const path = resolve(project, 'verification.json'); const evidence = JSON.parse(await readFile(path, 'utf8'));
    evidence.checks.push(check); evidence.commands.push(command); await writeFile(path, JSON.stringify(evidence, null, 2) + '\n');
}
for (const number of [1, 2, 6]) {
    const project = `RO4_5/lesson${number}`; const cwd = resolve(project); const state = states.find(item => item.project === project);
    const env = { ...process.env, DATABASE_URL: state.databaseUrl, JWT_SECRET: state.jwtSecret, NODE_ENV: 'test', CORS_ORIGIN: 'http://localhost:5500', LOG_LEVEL: 'silent' };
    const node = number === 6 ? node22 : process.execPath;
    const file = resolve(project, number === 1 ? 'tests/failure-demo.test.js' : 'tests/unit/failure-demo.test.js');
    const source = number === 1
        ? "import test from 'node:test'; import assert from 'node:assert/strict'; import { calculateOrderTotal } from '../services/orderMath.js'; test('intentional failure',()=>assert.strictEqual(calculateOrderTotal([{price:25000,quantity:1}]),25001));"
        : "import { test, expect } from '@jest/globals'; import { calculateOrderTotal } from '../../services/orderMath.js'; test('intentional failure',()=>expect(calculateOrderTotal([{price:25000,quantity:1}])).toBe(25001));";
    let failure;
    try {
        await writeFile(file, source);
        failure = run(node, cwd, number === 1 ? ['--test', 'tests/failure-demo.test.js'] : ['--experimental-vm-modules', 'scripts/run-jest.js', '--runInBand'], env);
        assert.equal(failure.status, 1, failure.stderr);
        assert.match(failure.stdout + failure.stderr, /25001/); assert.match(failure.stdout + failure.stderr, /25000/);
    } finally { await unlink(file); }
    const success = run(node, cwd, number === 1 ? ['--test', 'tests/orderMath.test.js'] : ['--experimental-vm-modules', 'scripts/run-jest.js', '--runInBand'], env);
    assert.equal(success.status, 0, success.stdout + success.stderr);
    await save(project, `Эксперимент: assertion 25001 вместо 25000 → exit 1; восстановленный suite → exit 0${number === 6 ? ', локально на Node.js 22' : ''}`,
        { command: number === 6 ? 'Локальный CI: failure → success, Node.js 22' : 'Failing assertion → corrected test suite',
            failureExitCode: failure.status, successExitCode: success.status, output: failure.stdout + failure.stderr + '\nRESTORED\n' + success.stdout + success.stderr });
    console.log(`PASS failing/success experiment ${project}`);
}

{
    const project = 'RO4_5/lesson4'; const state = states.find(item => item.project === project);
    const env = { ...process.env, DATABASE_URL: state.databaseUrl, JWT_SECRET: state.jwtSecret, NODE_ENV: 'production', LOG_LEVEL: 'info' };
    const result = run(process.execPath, resolve(project), ['--inspect=127.0.0.1:0', 'scripts/diagnose.js'], env);
    assert.equal(result.status, 0, result.stdout + result.stderr);
    assert.ok(!result.stdout.includes('secret123')); assert.ok(!result.stdout.includes('eyJ.test.token'));
    assert.match(result.stdout, /Redacted/); assert.match(result.stdout, /queryType.*string/);
    await writeFile(resolve(project, 'diagnostics.json'), JSON.stringify({ checkedAt: new Date().toISOString(), output: result.stdout + result.stderr }, null, 2));
    await save(project, 'Node Inspector: breakpoint выявил number → string перед Prisma; HTTP 500 безопасен, исправленный запрос 200; Pino скрывает password/token',
        { command: 'node --inspect=127.0.0.1:0 scripts/diagnose.js', output: result.stdout + result.stderr });
    console.log('PASS Inspector and redaction');
}
async function freePort() {
    const server = createServer(); server.listen(0, '127.0.0.1'); await once(server, 'listening');
    const port = server.address().port; await new Promise(resolve => server.close(resolve)); return port;
}
for (const number of [5, 6]) {
    const project = `RO4_5/lesson${number}`; const state = states.find(item => item.project === project);
    const env = { ...process.env, DATABASE_URL: state.databaseUrl, JWT_SECRET: state.jwtSecret, NODE_ENV: 'production', CORS_ORIGIN: 'http://localhost:5500', LOG_LEVEL: 'info' };
    const missing = run(node22, resolve(project), ['server.js'], { ...env, JWT_SECRET: '' });
    assert.notEqual(missing.status, 0); assert.match(missing.stderr, /Missing required environment variable: JWT_SECRET/);
    for (const signal of ['SIGINT', 'SIGTERM']) {
        const port = await freePort();
        const down = new URL(state.databaseUrl); down.port = '1';
        const child = spawn(node22, ['--input-type=module', '-e', "await import('./server.js'); process.on('message', signal => process.emit(signal));"],
            { cwd: resolve(project), env: { ...env, PORT: String(port), DATABASE_URL: down.href }, stdio: ['ignore', 'pipe', 'pipe', 'ipc'], windowsHide: true });
        let output = ''; child.stdout.on('data', chunk => output += chunk); child.stderr.on('data', chunk => output += chunk);
        const exited = once(child, 'exit');
        try {
            for (let i = 0; i < 80; i++) {
                try { const response = await fetch(`http://127.0.0.1:${port}/health/live`); if (response.status === 200) break; } catch {}
                await new Promise(resolve => setTimeout(resolve, 100));
            }
            const live = await fetch(`http://127.0.0.1:${port}/health/live`); assert.equal(live.status, 200);
            const ready = await fetch(`http://127.0.0.1:${port}/health/ready`); assert.equal(ready.status, 503);
            assert.deepEqual(await ready.json(), { status: 'not_ready' });
            const products = await fetch(`http://127.0.0.1:${port}/api/products`); assert.equal(products.status, 500);
            const error = await products.json(); assert.equal(error.error, 'Internal server error'); assert.ok(error.requestId); assert.equal(error.stack, undefined);
            // Windows does not deliver POSIX signals; trigger each registered Node handler via IPC.
            child.send(signal); child.disconnect();
            const [code] = await Promise.race([exited, new Promise((_, reject) => setTimeout(() => reject(new Error('Shutdown timeout')), 15000).unref())]);
            assert.equal(code, 0, output); assert.match(output, /Shutdown started/); assert.match(output, /Shutdown completed/);
            await save(project, `${signal}: обработчик вызван через process.emit в Windows; server.close и Prisma disconnect завершились без зависания`,
                { command: `Node.js 22 production / DB unavailable / ${signal}`, output });
        } finally { if (child.exitCode === null) child.kill(); }
    }
    await save(project, 'Production на Node.js 22: без JWT_SECRET startup падает; при недоступной DB live=200, ready=503, API=500 без stack',
        { command: 'Fail-fast without JWT_SECRET', output: missing.stderr });
    console.log(`PASS production ${project}`);
}
