import { prisma } from '../config/prisma.js';
import { saveProductImage, deleteProductImage, imagePath } from '../services/productImageService.js';
export async function uploadProductImageController(req, res) {
    if (!req.file) return res.status(400).json({ error: 'Image file is required' });
    const product = await saveProductImage(req.validated.id, req.file);
    res.status(201).json({ id: product.id, imageName: product.imageName, imageMime: product.imageMime, imageSize: product.imageSize });
}
export async function getProductImage(req, res, next) {
    const product = await prisma.product.findUnique({ where: { id: req.validated.id } });
    if (!product?.imageName) return res.status(404).json({ error: 'Image not found' });
    res.type(product.imageMime).set('X-Content-Type-Options', 'nosniff').set('Cross-Origin-Resource-Policy', 'same-site');
    res.sendFile(imagePath(product.imageName), error => {
        if (error?.code === 'ENOENT') return res.status(404).json({ error: 'Image not found' });
        if (error) next(error);
    });
}
export async function deleteImage(req, res) {
    await deleteProductImage(req.validated.id); res.status(204).end();
}
