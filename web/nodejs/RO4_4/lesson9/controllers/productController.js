import * as service from '../services/productService.js';
import { AppError } from '../errors/AppError.js';

export async function getProducts(req, res, next) {
    try { res.json(await service.getAllProducts(req.query)); }
    catch (error) { next(error); }
}
export async function getProductById(req, res, next) {
    try {
        const product = await service.findProductById(req.validated.id);
        if (!product) return next(new AppError('Product not found', 404));
        res.json(product);
    } catch (error) { next(error); }
}
export async function createProduct(req, res, next) {
    try { res.status(201).json(await service.addProduct(req.validated)); }
    catch (error) { next(error); }
}
export async function updateProduct(req, res, next) {
    try {
        const product = await service.updateProductById(req.validated.id, req.validated);
        if (!product) return next(new AppError('Product not found', 404));
        res.json(product);
    } catch (error) { next(error); }
}
export async function deleteProduct(req, res, next) {
    try {
        const product = await service.deleteProductById(req.validated.id);
        if (!product) return next(new AppError('Product not found', 404));
        res.json(product);
    } catch (error) { next(error); }
}
export function productSettings(req, res) {
    res.json({ id: req.validated.id, notify: req.query.notify === 'true', changes: req.validated });
}
