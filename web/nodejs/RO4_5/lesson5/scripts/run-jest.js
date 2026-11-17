import { createRequire } from 'node:module';
import { pathToFileURL } from 'node:url';
const require = createRequire(import.meta.url);
await import(pathToFileURL(require.resolve('jest/bin/jest')).href);
