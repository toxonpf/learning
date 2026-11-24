import { HttpError } from '../lib/http.js';

export function notFound() {
  throw new HttpError(404, 'Маршрут не найден');
}

export function handleError(logger) {
  return (error, req, res, next) => {
    if (res.headersSent) return next(error);
    const known = {
      P2002: [409, 'Такая запись уже существует'],
      P2003: [409, 'Запись используется в журнале'],
      P2025: [404, 'Запись не найдена'],
      'entity.parse.failed': [400, 'Тело запроса должно быть корректным JSON'],
      'entity.too.large': [413, 'Тело запроса слишком большое'],
      'encoding.unsupported': [415, 'Кодировка запроса не поддерживается'],
      'charset.unsupported': [415, 'Кодировка запроса не поддерживается'],
    };
    const [status, message] = error instanceof HttpError
      ? [error.status, error.message]
      : known[error.code] ?? known[error.type] ?? [500, 'Внутренняя ошибка сервера'];
    if (status === 500) logger.error({ name: error.name, code: error.code, method: req.method });
    res.status(status).json({ error: { message, ...(error.details && { details: error.details }) } });
  };
}
