import { Router } from 'express';
const router = Router();
const categories = ['Computers', 'Accessories', 'Monitors'];
router.get('/', (req, res) => res.json(categories));
router.post('/', (req, res) => res.status(201).json({ message: 'POST route: category creation' }));
export default router;
