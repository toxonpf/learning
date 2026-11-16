import { Router } from 'express';
import { getCategories } from '../services/categoryService.js';
const router = Router();
router.get('/', async (req, res, next) => { try { res.json(await getCategories()); } catch (error) { next(error); } });
export default router;
