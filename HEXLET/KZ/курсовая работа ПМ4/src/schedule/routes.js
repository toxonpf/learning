import { Router } from 'express';
import { z } from 'zod';
import { isoDay } from '../lib/dates.js';
import { read, send } from '../lib/http.js';
import { uuid, uuidParams } from '../lib/validation.js';
import { requireRole } from '../middleware/auth.js';
import { generationRequest, planUpdate, profileUpdate, publishRequest, startPlan } from './config.js';
import * as schedule from './service.js';

const range = z.strictObject({ from: isoDay, to: isoDay });
const selection = z.strictObject({ id: uuid.optional() });
const people = z.strictObject({ query: z.string().trim().max(120).default(''), groupId: uuid.optional() });
const id = (req) => read(uuidParams, req.params).id;

export function scheduleRoutes(db) {
  const router = Router();
  router.get('/', async (req, res) => send(res, await schedule.getSchedule(db, req.user, read(range, req.query))));
  router.use(requireRole('admin'));
  router.get('/planner', async (req, res) => send(res, await schedule.getPlanner(db, read(selection, req.query).id)));
  router.get('/people', async (req, res) => send(res, await schedule.listPeople(db, read(people, req.query))));
  router.patch('/people/:id', async (req, res) => send(res, await schedule.updateProfile(db, id(req), read(profileUpdate, req.body))));
  router.post('/plans', async (req, res) => send(res, await schedule.createPlan(db, read(startPlan, req.body)), 201));
  router.put('/plans/:id', async (req, res) => send(res, await schedule.savePlan(db, id(req), read(planUpdate, req.body))));
  router.post('/plans/:id/generate', async (req, res) =>
    send(res, await schedule.generatePlan(db, id(req), read(generationRequest, req.body).revision)));
  router.post('/plans/:id/publish', async (req, res) => send(res, await schedule.publishPlan(db, id(req), read(publishRequest, req.body))));
  router.post('/plans/:id/unpublish', async (req, res) =>
    send(res, await schedule.unpublishPlan(db, id(req), read(generationRequest, req.body).revision)));
  return router;
}
