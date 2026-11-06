import express from 'express';
import { pathToFileURL, fileURLToPath } from 'node:url';
import productRoutes from './routes/productRoutes.js';
import categoryRoutes from './routes/categoryRoutes.js';
import orderRoutes from './routes/orderRoutes.js';
import { notFound } from './middleware/notFound.js';
import { errorHandler } from './middleware/errorHandler.js';
import logger from './middleware/logger.js';
import requestTime from './middleware/requestTime.js';
const app = express();
app.use(logger);
app.use(requestTime);
app.use(express.json());
app.get('/', (req, res) => res.send('Internet Shop API'));
app.get('/about', (req, res) => res.send('Учебный REST API магазина компьютерной техники'));
app.get('/api', (req, res) => res.json({ name: 'Internet Shop API', version: '1.0', resources: ['/api/products', '/api/categories', '/api/orders'] }));
app.get('/api/status', (req, res) => res.json({ status: 'ok', message: 'Server is running', requestTime: req.requestTime }));
app.get('/api/shop', (req, res) => res.json({ name: 'Kirill Tech Store', description: 'Учебный интернет-магазин', currency: 'KZT' }));
app.use('/api/products', productRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/orders', orderRoutes);
app.use(notFound);
app.use(errorHandler);
export default app;

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
    const PORT = Number(process.env.PORT || 3000);
    app.listen(PORT, () => console.log(`Server: http://localhost:${PORT}`));
}
