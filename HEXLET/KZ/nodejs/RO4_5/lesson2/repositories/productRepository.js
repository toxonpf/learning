import { prisma } from '../config/prisma.js';
export const productRepository = {
    findById: id => prisma.product.findUnique({ where: { id } }),
    create: data => prisma.product.create({ data }),
    delete: id => prisma.product.delete({ where: { id } })
};
