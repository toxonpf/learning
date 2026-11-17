import { prisma } from '../config/prisma.js';
async function main() {
    const laptops = await prisma.category.upsert({ where: { name: 'Ноутбуки' }, update: { slug: 'laptops' }, create: { name: 'Ноутбуки', slug: 'laptops' } });
    const accessories = await prisma.category.upsert({ where: { name: 'Аксессуары' }, update: { slug: 'accessories' }, create: { name: 'Аксессуары', slug: 'accessories' } });
    for (const data of [
        { name: 'Laptop Pro', price: 420000, description: 'Тестовый ноутбук', categoryId: laptops.id, inStock: true },
        { name: 'Wireless Mouse', price: 12000, description: 'Тестовая беспроводная мышь', categoryId: accessories.id, inStock: true }
    ]) {
        const existing = await prisma.product.findFirst({ where: { name: data.name, categoryId: data.categoryId } });
        if (!existing) await prisma.product.create({ data });
    }
    console.log('Seed completed');
}
try { await main(); } catch (error) { console.error(error.message); process.exitCode = 1; }
finally { await prisma.$disconnect(); }
