import { Router } from 'express';
import { getOrders, getOrderById, createOrderController } from '../controllers/orderController.js';
import { validateId } from '../middleware/validateId.js';
import { validateOrder } from '../middleware/validateOrder.js';
const router = Router();
router.param('id', validateId);
router.get('/', getOrders);
router.get('/:id', getOrderById);
export default router;
