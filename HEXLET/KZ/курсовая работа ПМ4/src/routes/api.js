import { Router } from 'express';
import { rateLimit } from 'express-rate-limit';
import { attendanceController } from '../controllers/attendance.js';
import { authController } from '../controllers/auth.js';
import { groupController } from '../controllers/groups.js';
import { asDate, localDay } from '../lib/dates.js';
import { requireAuth, requireRole } from '../middleware/auth.js';

export function apiRoutes(db, config) {
  const router = Router();
  const { JWT_SECRET, APP_TIME_ZONE } = config;
  const auth = authController(db, JWT_SECRET, APP_TIME_ZONE);
  const groups = groupController(db);
  const attendance = attendanceController(db);
  const staff = requireRole('admin', 'teacher');
  const admin = requireRole('admin');
  const authLimit = rateLimit({
    windowMs: 15 * 60 * 1000,
    limit: 25,
    standardHeaders: 'draft-8',
    legacyHeaders: false,
    message: { error: { message: 'Слишком много попыток входа или регистрации' } },
  });

  router.use((req, res, next) => {
    res.set('Cache-Control', 'no-store');
    req.today = asDate(localDay(APP_TIME_ZONE));
    next();
  });
  router.post('/auth/register', authLimit, auth.register);
  router.post('/auth/login', authLimit, auth.login);
  router.use(requireAuth(db, JWT_SECRET));
  router.get('/auth/me', auth.me);

  router.get('/groups', groups.list);
  router.post('/groups', admin, groups.create);
  router.patch('/groups/:id', admin, groups.update);
  router.get('/groups/:id/journal', groups.journal);
  router.get('/groups/:id/members', admin, groups.members);
  router.post('/groups/:id/members', admin, groups.addMember);
  router.patch('/groups/:id/members/:memberId', admin, groups.updateMember);
  router.get('/users', admin, groups.users);
  router.patch('/users/:id/role', admin, groups.updateRole);

  router.post('/groups/:id/lessons', staff, attendance.createLesson);
  router.get('/lessons/:id', attendance.lesson);
  router.patch('/lessons/:id', staff, attendance.updateLesson);
  router.delete('/lessons/:id', staff, attendance.removeLesson);
  router.post('/lessons/:id/fill', staff, attendance.fill);

  router.get('/attendance', attendance.list);
  router.get('/attendance/:id', attendance.get);
  router.post('/attendance', staff, attendance.create);
  router.patch('/attendance/:id', staff, attendance.update);
  router.delete('/attendance/:id', staff, attendance.remove);
  router.get('/statuses', attendance.statuses);
  router.post('/statuses', admin, attendance.createStatus);
  router.patch('/statuses/:id', admin, attendance.updateStatus);
  return router;
}
