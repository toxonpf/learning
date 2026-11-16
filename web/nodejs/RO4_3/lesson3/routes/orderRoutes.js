import { Router } from 'express';
const router = Router();
const orders = [];
let nextId = 1;
router.get('/', (req, res) => res.json(orders));
router.get('/:id', (req, res) => {
    const order = orders.find(item => item.id === Number(req.params.id));
    if (!order) return res.status(404).json({ message: 'Order not found' });
    res.json(order);
});
router.post('/', (req, res) => {
    const order = { status: 'new', ...req.body, id: nextId++ };
    orders.push(order);
    res.status(201).json(order);
});
router.patch('/:id', (req, res) => {
    const order = orders.find(item => item.id === Number(req.params.id));
    if (!order) return res.status(404).json({ message: 'Order not found' });
    if (typeof req.body?.status === 'string') order.status = req.body.status;
    res.json(order);
});
export default router;
