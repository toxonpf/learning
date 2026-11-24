import { open } from 'node:fs/promises';
export async function detectImageType(path) {
    const file = await open(path, 'r');
    const buffer = Buffer.alloc(8);
    try {
        const { bytesRead } = await file.read(buffer, 0, 8, 0);
        if (bytesRead >= 8 && buffer.equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]))) return 'image/png';
        if (bytesRead >= 3 && buffer[0] === 255 && buffer[1] === 216 && buffer[2] === 255) return 'image/jpeg';
        return null;
    } finally { await file.close(); }
}
