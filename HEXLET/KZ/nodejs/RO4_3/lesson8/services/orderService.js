import { prisma } from '../config/prisma.js';
import { AppError } from '../errors/AppError.js';
const relations = {
    user: { select: { id: true, name: true, email: true } },
    items: { include: { product: { select: { id: true, name: true } } } }
};
export function findOrderById(id) {
    return prisma.order.findUnique({ where: { id }, include: relations });
}
export async function getOrderDetails(id) {
    const order = await findOrderById(id);
    if (!order) return null;
    return { ...order, total: order.items.reduce((sum, item) => sum + item.price * item.quantity, 0) };
}
export function findOrdersByProduct(productId) {
    return prisma.order.findMany({ where: { items: { some: { productId } } }, include: relations, orderBy: { id: 'asc' } });
}
export function getAllOrders() {
    return prisma.order.findMany({ include: relations, orderBy: { id: 'asc' } });
}
export async function createOrder(userId, items) {
    return prisma.$transaction(async tx => {
        const user = await tx.user.findUnique({ where: { id: userId } });
        if (!user) throw new AppError('User not found', 404);
        const order = await tx.order.create({ data: { userId, status: 'new' } });
        for (const item of items) {
            const product = await tx.product.findUnique({ where: { id: item.productId } });
            if (!product || !product.inStock) throw new AppError(`Product ${item.productId} is unavailable`, 409);
            await tx.orderItem.create({ data: { orderId: order.id, productId: product.id, quantity: item.quantity, price: product.price } });
        }
        const result = await tx.order.findUnique({ where: { id: order.id }, include: relations });
        return { ...result, total: result.items.reduce((sum, item) => sum + item.price * item.quantity, 0) };
    });
}
