import express from 'express';
import { fileURLToPath } from 'node:url';
const app = express();
app.use(express.static(fileURLToPath(new URL('../frontend', import.meta.url))));
const port = Number(process.argv[2] || 5500);
app.listen(port, () => console.log(`Frontend: http://localhost:${port}`));
