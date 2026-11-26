import jwt from 'jsonwebtoken';
import { HttpError } from '../lib/http.js';
import { publicUser } from '../services/auth.js';
import { uuid } from '../lib/validation.js';

export function requireAuth(db, secret) {
  return async (req, res, next) => {
    const token = /^Bearer (\S+)$/i.exec(req.get('Authorization') ?? '')?.[1];
    if (!token) throw new HttpError(401, 'Войдите в аккаунт');
    let id;
    try {
      const payload = jwt.verify(token, secret, {
        algorithms: ['HS256'],
        issuer: 'attendance-journal',
        audience: 'attendance-api',
      });
      id = payload.sub;
    } catch {
      throw new HttpError(401, 'Срок сеанса истёк или токен недействителен');
    }
    if (!uuid.safeParse(id).success) throw new HttpError(401, 'Токен недействителен');
    const user = await db.user.findUnique({ where: { id, deletedAt: null }, select: publicUser });
    if (!user) throw new HttpError(401, 'Аккаунт не найден');
    req.user = user;
    next();
  };
}

export function requireRole(...roles) {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) throw new HttpError(403, 'Недостаточно прав');
    next();
  };
}
