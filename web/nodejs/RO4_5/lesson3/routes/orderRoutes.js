import { Router } from 'express';
import { requireAuth, requireRole } from '../middleware/authMiddleware.js';
import { validateId } from '../middleware/validateId.js';
import { validateOrder } from '../middleware/validateOrder.js';
import * as service from '../services/orderService.js';
import { createOrderValidation } from '../validators/orderValidators.js';
import { validateRequest } from '../middleware/validationMiddleware.js';
const router = Router();
router.use(requireAuth);
router.get('/my', async (req, res) => res.json(await service.findOrdersByUser(req.user.id)));
router.get('/my/:id', validateId, async (req, res) => {
    const order = await service.findOwnOrder(Number(req.params.id), req.user.id);
    if (!order) return res.status(404).json({ error: 'Order not found' });
    res.json(order);
});
router.post('/', createOrderValidation, validateRequest, async (req, res) => {
    res.status(201).json(await service.createOrder(req.user.id, req.validated.items));
});
router.get('/', requireRole('admin'), async (req, res) => res.json(await service.getAllOrders()));
router.get('/:id', requireRole('admin'), validateId, async (req, res) => {
    const order = await service.getOrderDetails(Number(req.params.id));
    if (!order) return res.status(404).json({ error: 'Order not found' });
    res.json(order);
});
export default router;
