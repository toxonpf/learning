import assert from 'node:assert/strict';
import { once } from 'node:events';
import { writeFile } from 'node:fs/promises';

export async function withServer(app, callback) {
    const server = app.listen(0, '127.0.0.1');
    await once(server, 'listening');
    const address = `http://127.0.0.1:${server.address().port}`;
    const evidence = [];
    async function request(method, path, expected, body, headers = {}) {
        const response = await fetch(address + path, {
            method,
            headers: { ...(body === undefined ? {} : { 'Content-Type': 'application/json' }), ...headers },
            ...(body === undefined ? {} : { body: JSON.stringify(body) })
        });
        const text = await response.text();
        let data;
        try { data = JSON.parse(text); } catch { data = text; }
        // JWT и пользовательские секреты не записываются в отчёт.
        const safe = JSON.parse(JSON.stringify(data, (key, value) =>
            ['accessToken', 'password', 'passwordHash'].includes(key) ? '[скрыто]' : value));
        evidence.push({ method, path, status: response.status, response: safe });
        assert.equal(response.status, expected, `${method} ${path}: ${text}`);
        return data;
    }
    try { await callback(request, address, evidence); }
    finally { await new Promise(resolve => server.close(resolve)); }
    return evidence;
}

export async function saveEvidence(project, evidence, checks = []) {
    if (process.env.SAVE_LAB_EVIDENCE !== '1') return;
    await writeFile(`${project}/verification.json`, JSON.stringify({
        checkedAt: new Date().toISOString(), runtime: process.version,
        checks, requests: evidence
    }, null, 2) + '\n');
}
