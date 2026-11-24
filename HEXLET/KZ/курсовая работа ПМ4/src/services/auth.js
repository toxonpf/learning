import jwt from 'jsonwebtoken';
import { HttpError } from '../lib/http.js';
import { hashPassword, verifyPassword } from '../lib/password.js';

export const publicUser = { id: true, name: true, email: true, role: true };

function session(user, secret) {
  const accessToken = jwt.sign({}, secret, {
    algorithm: 'HS256',
    subject: user.id,
    issuer: 'attendance-journal',
    audience: 'attendance-api',
    expiresIn: '4h',
  });
  return { user, accessToken };
}

export async function register(db, secret, { email, name, password }) {
  const passwordHash = await hashPassword(password);
  const user = await db.user.create({ data: { email, name, passwordHash }, select: publicUser });
  return session(user, secret);
}

export async function login(db, secret, { email, password }) {
  const stored = await db.user.findUnique({ where: { email } });
  if (!await verifyPassword(password, stored?.passwordHash)) {
    throw new HttpError(401, 'Неверная почта или пароль');
  }
  const { id, name, role } = stored;
  return session({ id, email, name, role }, secret);
}
