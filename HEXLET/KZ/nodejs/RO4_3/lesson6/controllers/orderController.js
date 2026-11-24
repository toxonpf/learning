import * as service from '../services/orderService.js';
import { AppError } from '../errors/AppError.js';
export async function getOrders(req, res, next) {
    try { res.json(await service.getAllOrders()); }
    catch (error) { next(error); }
}
export async function getItems(req, res, next) {
    try {
        const id = Number(req.params.id);
        if (!await service.findOrderById(id)) return next(new AppError('Order not found', 404));
        res.json(await service.getOrderItems(id));
    } catch (error) { next(error); }
}
