import { HttpError } from './http.js';

export async function writeTransaction(db, operation) {
  for (let attempt = 1; attempt <= 3; attempt += 1) {
    try {
      return await db.$transaction(operation, { isolationLevel: 'Serializable' });
    } catch (error) {
      if (error.code !== 'P2034') throw error;
      if (attempt === 3) throw new HttpError(409, 'Данные изменились. Повторите действие');
    }
  }
}
