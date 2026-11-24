import { AppError } from '../errors/AppError.js';
import { Router } from 'express';

import { validateId } from '../middleware/validateId.js';
import checkApiKey from '../middleware/checkApiKey.js';
let products = [
    {
        "id": 1,
        "name": "Keyboard",
        "price": 15000,
        "category": "Accessories",
        "inStock": true
    },
    {
        "id": 2,
        "name": "Mouse",
        "price": 8000,
        "category": "Accessories",
        "inStock": true
    },
    {
        "id": 3,
        "name": "Monitor",
        "price": 85000,
        "category": "Monitors",
        "inStock": false
    },
    {
        "id": 4,
        "name": "Laptop",
        "price": 420000,
        "category": "Computers",
        "inStock": true
    },
    {
        "id": 5,
        "name": "Webcam",
        "price": 22000,
        "category": "Accessories",
        "inStock": false
    }
];
let nextId = 6;

function getAllProducts(query = {}) {
    return products.filter(product =>
        (query.category === undefined || product.category === query.category) &&
        (query.inStock === undefined || product.inStock === (query.inStock === 'true')) &&
        (query.minPrice === undefined || product.price >= Number(query.minPrice)) &&
        (query.maxPrice === undefined || product.price <= Number(query.maxPrice))
    );
}
function findProductById(id) {
    return products.find(product => product.id === id);
}
function addProduct(data) {
    const product = { ...data, id: nextId++ };
    products.push(product);
    return product;
}
function updateProductById(id, changes) {
    const product = findProductById(id);
    if (!product) return null;
    Object.assign(product, changes);
    return product;
}
function deleteProductById(id) {
    const index = products.findIndex(product => product.id === id);
    if (index === -1) return null;
    return products.splice(index, 1)[0];
}





async function getProducts(req, res, next) {
    try { res.json(await getAllProducts(req.query)); }
    catch (error) { next(error); }
}
async function getProductById(req, res, next) {
    try {
        const product = await findProductById(Number(req.params.id));
        if (!product) return next(new AppError('Product not found', 404));
        res.json(product);
    } catch (error) { next(error); }
}
async function createProduct(req, res, next) {
    try { res.status(201).json(await addProduct(req.body)); }
    catch (error) { next(error); }
}
async function updateProduct(req, res, next) {
    try {
        const product = await updateProductById(Number(req.params.id), req.body);
        if (!product) return next(new AppError('Product not found', 404));
        res.json(product);
    } catch (error) { next(error); }
}
async function deleteProduct(req, res, next) {
    try {
        const product = await deleteProductById(Number(req.params.id));
        if (!product) return next(new AppError('Product not found', 404));
        res.json(product);
    } catch (error) { next(error); }
}
function productSettings(req, res) {
    res.json({ id: Number(req.params.id), notify: req.query.notify === 'true', changes: req.body });
}

const router = Router();
router.param('id', validateId);
router.use((req, res, next) => { console.log('Product Router:', req.method, req.originalUrl); next(); });
router.get('/', getProducts);
router.get('/:id', getProductById);
router.post('/', checkApiKey, createProduct);
router.patch('/:id', updateProduct);
router.delete('/:id', deleteProduct);
router.patch('/:id/settings', productSettings);
export default router;
