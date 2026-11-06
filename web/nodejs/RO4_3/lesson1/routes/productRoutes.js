import { validateProductQuery } from '../middleware/validateProductQuery.js';
import { Router } from 'express';
import { getProducts, getProductById } from '../controllers/productController.js';
import { validateId } from '../middleware/validateId.js';
const router = Router();
router.param('id', validateId);
router.get('/', validateProductQuery, getProducts);
router.get('/:id', getProductById);
export default router;
