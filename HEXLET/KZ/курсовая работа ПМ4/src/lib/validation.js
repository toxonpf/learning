import { z } from 'zod';

export const uuid = z.uuid();
export const email = z.string().trim().toLowerCase().pipe(z.email().max(254));
export const password = z.string().min(10).max(128);
export const text = (max) => z.string().trim().min(1).max(max);
export const startTime = z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/);
export const uuidParams = z.object({ id: uuid });

export function changes(fields) {
  return z.strictObject(fields).partial().refine(
    (value) => Object.keys(value).length > 0,
    'Укажите хотя бы одно поле',
  );
}
