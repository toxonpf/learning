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
    return prisma.product.findMany({ where, orderBy: { id: "asc" }, include: { category: { select: { id: true, name: true } } } });
}
export function findProductById(id) { return prisma.product.findUnique({ where: { id }, include: { category: { select: { id: true, name: true } } } }); }
function productData(input) {
    return Object.fromEntries(['name', 'price', 'categoryId', 'inStock'].filter(key => key in input).map(key => [key, input[key]]));
}
export function addProduct(data) { return prisma.product.create({ data: productData(data) }); }
export async function updateProductById(id, changes) {
    try { return await prisma.product.update({ where: { id }, data: productData(changes) }); }
    catch (error) { if (error.code === 'P2025') return null; throw error; }
}
export async function deleteProductById(id) {
    try { return await prisma.product.delete({ where: { id } }); }
    catch (error) { if (error.code === 'P2025') return null; throw error; }
}
