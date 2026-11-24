import { prisma } from '../config/prisma.js';
export async function getAllProducts(query = {}) {
    const where = {};
    if (query.category) where.category = { name: query.category };
    if (query.inStock !== undefined) where.inStock = query.inStock === 'true';
    if (query.minPrice !== undefined || query.maxPrice !== undefined) {
        where.price = {};
        if (query.minPrice !== undefined) where.price.gte = Number(query.minPrice);
        if (query.maxPrice !== undefined) where.price.lte = Number(query.maxPrice);
    }
    return prisma.product.findMany({ where, orderBy: { id: "asc" }, include: { category: true } });
}
export function findProductById(id) { return prisma.product.findUnique({ where: { id }, include: { category: true } }); }
export { addProduct, updateProductById, deleteProductById } from './productService.sql.js';
