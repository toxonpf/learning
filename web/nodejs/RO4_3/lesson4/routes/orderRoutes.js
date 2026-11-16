import { Router } from 'express';
import { getOrders, getItems } from '../controllers/orderController.js';
import { validateId } from '../middleware/validateId.js';
const router = Router();
router.param('id', validateId);
router.get('/', getOrders);
router.get('/:id/items', getItems);
export default router;
