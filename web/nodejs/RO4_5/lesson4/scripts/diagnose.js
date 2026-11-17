import { Session } from 'node:inspector';
import { once } from 'node:events';
import assert from 'node:assert/strict';
import express from 'express';
import { prisma } from '../config/prisma.js';
import { logger } from '../config/logger.js';
import { requestContext } from '../middleware/requestContext.js';
import { requestLogger } from '../middleware/requestLogger.js';
import { errorHandler } from '../middleware/errorHandler.js';

const session = new Session(); session.connect();
const post = (method, params = {}) => new Promise((resolve, reject) => session.post(method, params, (error, value) => error ? reject(error) : resolve(value)));
await post('Debugger.enable');
const observations = [];
session.on('Debugger.paused', ({ params }) => {
    const frame = params.callFrames[0];
    session.post('Debugger.evaluateOnCallFrame', { callFrameId: frame.callFrameId,
        expression: 'JSON.stringify({id, queryId, inputType: typeof id, queryType: typeof queryId})' }, (error, value) => {
        if (!error) observations.push({ functionName: frame.functionName, line: frame.location.lineNumber + 1, values: JSON.parse(value.result.value) });
        session.post('Debugger.resume');
    });
});
// This diagnostic exercise is separate from the corrected production Service.
async function faultyLookup(id) {
    const queryId = String(id);
    debugger;
    return prisma.product.findUnique({ where: { id: queryId } });
}
const app = express(); app.use(requestContext); app.use(requestLogger);
app.get('/fault/:id', async (req, res) => res.json(await faultyLookup(Number(req.params.id))));
app.get('/fixed/:id', async (req, res) => res.json(await prisma.product.findUnique({ where: { id: Number(req.params.id) } })));
app.use(errorHandler);
const server = app.listen(0, '127.0.0.1'); await once(server, 'listening');
const address = `http://127.0.0.1:${server.address().port}`;
try {
    const faulty = await fetch(address + '/fault/1'); const body = await faulty.json();
    assert.equal(faulty.status, 500); assert.equal(body.error, 'Internal server error'); assert.ok(body.requestId); assert.ok(!('stack' in body));
    assert.equal(observations[0].values.inputType, 'number'); assert.equal(observations[0].values.queryType, 'string');
    const fixed = await fetch(address + '/fixed/1'); assert.equal(fixed.status, 200);
    logger.info({ password: 'secret123', accessToken: 'eyJ.test.token', passwordHash: 'secret-hash' }, 'Redaction demo');
    console.log(JSON.stringify({ inspector: observations, faulty: { status: faulty.status, body }, fixed: fixed.status }));
} finally { session.disconnect(); await new Promise(resolve => server.close(resolve)); await prisma.$disconnect(); }
