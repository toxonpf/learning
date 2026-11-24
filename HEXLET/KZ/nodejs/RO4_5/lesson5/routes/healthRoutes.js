import { Router } from 'express';
import { prisma } from '../config/prisma.js';
export const healthRoutes = Router();
healthRoutes.get('/live', (req, res) => res.json({ status: 'ok' }));
healthRoutes.get('/ready', async (req, res) => {
    try { await prisma.$queryRaw`SELECT 1`; res.json({ status: 'ready' }); }
    catch (error) { req.log?.warn({ err: error }, 'Readiness check failed'); res.status(503).json({ status: 'not_ready' }); }
});
