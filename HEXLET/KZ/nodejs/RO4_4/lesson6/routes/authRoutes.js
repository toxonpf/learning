import { Router } from 'express';
import { register, login, getCurrentUser } from '../controllers/authController.js';
import { validateRegister, validateLogin } from '../middleware/validateAuth.js';
import { requireAuth } from '../middleware/authMiddleware.js';
const router = Router();
router.post('/register', validateRegister, register);
router.post('/login', validateLogin, login);
router.get('/me', requireAuth, getCurrentUser);
export default router;
