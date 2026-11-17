import multer from 'multer';
import { mkdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { createImageFilename } from '../utils/fileNames.js';
export const productImageDir = fileURLToPath(new URL('../storage/product-images/', import.meta.url));
mkdirSync(productImageDir, { recursive: true });
export const uploadProductImage = multer({
    storage: multer.diskStorage({
        destination: (req, file, cb) => cb(null, productImageDir),
        filename: (req, file, cb) => cb(null, createImageFilename(file.mimetype))
    }),
    fileFilter(req, file, cb) {
        if (!['image/jpeg', 'image/png'].includes(file.mimetype)) {
            const error = new Error('Unsupported file type'); error.status = 400; return cb(error);
        }
        cb(null, true);
    },
    limits: { fileSize: 5 * 1024 * 1024, files: 1, fields: 5, parts: 6 }
});
