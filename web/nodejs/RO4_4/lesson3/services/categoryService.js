import { prisma } from '../config/prisma.js';
export function getCategories() { return prisma.category.findMany({ orderBy: { id: 'asc' } }); }
