import express from 'express';
import { pathToFileURL } from 'node:url';
const app = express();
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
const categories = ['Computers', 'Accessories', 'Monitors'];
app.get('/', (req, res) => res.send('Internet Shop API'));
app.get('/about', (req, res) => res.send('Учебный REST API магазина компьютерной техники'));
app.get('/api/status', (req, res) => res.json({ status: 'ok', message: 'Server is running' }));
app.get('/api/shop', (req, res) => res.json({ name: 'Kirill Tech Store', description: 'Учебный интернет-магазин', currency: 'KZT' }));
function getProducts(req, res) { res.json(products); }
app.get('/api/products', getProducts);
app.get('/api/categories', (req, res) => res.json(categories));
app.post('/api/products', (req, res) => res.status(201).json({ message: 'POST route: product creation' }));
app.put('/api/products', (req, res) => res.status(200).json({ message: 'PUT route: full product replacement' }));
app.patch('/api/products', (req, res) => res.status(200).json({ message: 'PATCH route: partial product update' }));
app.delete('/api/products', (req, res) => res.status(200).json({ message: 'DELETE route: product deletion' }));
app.post('/api/categories', (req, res) => res.status(201).json({ message: 'POST route: category creation' }));
app.get('/api/orders', (req, res) => res.json([]));
app.post('/api/orders', (req, res) => res.status(201).json({ message: 'POST route: order creation' }));
app.get('/api', (req, res) => res.json({ name: 'Internet Shop API', version: '1.0', resources: ['/api/products', '/api/categories', '/api/orders'] }));
export default app;
if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
    const PORT = Number(process.env.PORT || 3000);
    app.listen(PORT, () => console.log(`Server: http://localhost:${PORT}`));
}
