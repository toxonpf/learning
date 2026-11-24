import { unlink } from 'node:fs/promises';
import { join } from 'node:path';
import { prisma } from '../config/prisma.js';
import { productImageDir } from '../middleware/uploadMiddleware.js';
import { detectImageType } from './imageValidationService.js';
import { AppError } from '../errors/AppError.js';
// В путь допускается только созданное сервером UUID-имя из metadata.
export function imagePath(name) {
    if (!/^[0-9a-f-]{36}\.(png|jpg)$/.test(name || '')) throw new AppError('Image not found', 404);
    return join(productImageDir, name);
}
export async function removeFile(name) {
    if (!name) return;
    try { await unlink(imagePath(name)); } catch (error) { if (error.code !== 'ENOENT') throw error; }
}
export async function saveProductImage(id, file) {
    let committed = false;
    try {
        const mime = await detectImageType(file.path);
        if (!mime || mime !== file.mimetype) throw new AppError('Invalid image content', 400);
        // Row lock serializes replacement/deletion of the same product image.
        const result = await prisma.$transaction(async tx => {
            const rows = await tx.$queryRaw`SELECT id FROM products WHERE id = ${id} FOR UPDATE`;
            if (!rows.length) throw new AppError('Product not found', 404);
            const previous = await tx.product.findUnique({ where: { id } });
            const product = await tx.product.update({ where: { id }, data: {
                imageName: file.filename, imageMime: mime, imageSize: file.size } });
            return { previous, product };
        });
        committed = true;
        await removeFile(result.previous.imageName);
        return result.product;
    } finally {
        if (!committed) await removeFile(file.filename);
    }
}
export async function deleteProductImage(id) {
    const previous = await prisma.$transaction(async tx => {
        await tx.$queryRaw`SELECT id FROM products WHERE id = ${id} FOR UPDATE`;
        const product = await tx.product.findUnique({ where: { id } });
        if (!product?.imageName) throw new AppError('Image not found', 404);
        await tx.product.update({ where: { id }, data: { imageName: null, imageMime: null, imageSize: null } });
        return product;
    });
    await removeFile(previous.imageName);
}
