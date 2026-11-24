import { randomUUID } from 'node:crypto';
export function createImageFilename(mime) {
    if (!['image/png', 'image/jpeg'].includes(mime)) throw new Error('Unsupported file type');
    return randomUUID() + (mime === 'image/png' ? '.png' : '.jpg');
}
