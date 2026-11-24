import { randomBytes, scrypt as derive, timingSafeEqual } from 'node:crypto';
import { promisify } from 'node:util';

const scrypt = promisify(derive);
const options = { N: 2 ** 17, r: 8, p: 1, maxmem: 160 * 1024 * 1024 };
const dummyHash = `scrypt:${'0'.repeat(32)}:${'0'.repeat(128)}`;
let queue = Promise.resolve();

function deriveKey(password, salt) {
  const result = queue.then(() => scrypt(password, salt, 64, options));
  queue = result.catch(() => {});
  return result;
}

export async function hashPassword(password) {
  const salt = randomBytes(16).toString('hex');
  const key = await deriveKey(password, salt);
  return `scrypt:${salt}:${key.toString('hex')}`;
}

export async function verifyPassword(password, stored = dummyHash) {
  const [, salt, hexKey] = stored.split(':');
  const expected = Buffer.from(hexKey, 'hex');
  const actual = await deriveKey(password, salt);
  const match = timingSafeEqual(actual, expected);
  return stored !== dummyHash && match;
}
