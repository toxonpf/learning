import * as service from '../services/orderService.js';
import { AppError } from '../errors/AppError.js';
export async function getOrderById(req, res, next) {
    try {
        const order = await service.getOrderDetails(Number(req.params.id));
        if (!order) return next(new AppError('Order not found', 404));
        res.json(order);
    } catch (error) { next(error); }
}
export async function getOrders(req, res, next) {
    try {
        if (req.query.productId !== undefined && (!Number.isSafeInteger(Number(req.query.productId)) || Number(req.query.productId) <= 0)) throw new AppError('Invalid productId', 400);
        res.json(req.query.productId ? await service.findOrdersByProduct(Number(req.query.productId)) : await service.getAllOrders());
    } catch (error) { next(error); }
}
export async function createOrderController(req, res, next) {
    try { res.status(201).json(await service.createOrder(req.body.userId, req.body.items)); }
    catch (error) { next(error); }
}
