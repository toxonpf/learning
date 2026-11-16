import express from 'express';
import { pathToFileURL, fileURLToPath } from 'node:url';
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



import { AppError } from './errors/AppError.js';

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



import { notFound } from './middleware/notFound.js';
import { errorHandler } from './middleware/errorHandler.js';
const app = express();
app.use(express.json());
app.get('/', (req, res) => res.send('Internet Shop API'));
app.get('/about', (req, res) => res.send('Учебный REST API магазина компьютерной техники'));
app.get('/api', (req, res) => res.json({ name: 'Internet Shop API', version: '1.0', resources: ['/api/products', '/api/categories', '/api/orders'] }));
app.get('/api/status', (req, res) => res.json({ status: 'ok', message: 'Server is running', requestTime: req.requestTime }));
app.get('/api/shop', (req, res) => res.json({ name: 'Kirill Tech Store', description: 'Учебный интернет-магазин', currency: 'KZT' }));
app.get('/api/products', getProducts);
app.get('/api/products/:id', getProductById);
app.post('/api/products', createProduct);
app.patch('/api/products/:id', updateProduct);
app.delete('/api/products/:id', deleteProduct);
app.patch('/api/products/:id/settings', productSettings);
app.get('/api/categories', (req, res) => res.json(['Computers', 'Accessories', 'Monitors']));
app.post('/api/categories', (req, res) => res.status(201).json({ message: 'POST route: category creation' }));
app.get('/api/orders', (req, res) => res.json([]));
app.post('/api/orders', (req, res) => res.status(201).json({ message: 'POST route: order creation' }));
app.use(notFound);
app.use(errorHandler);
export default app;

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
    const PORT = Number(process.env.PORT || 3000);
    app.listen(PORT, () => console.log(`Server: http://localhost:${PORT}`));
}
