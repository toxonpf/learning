export class HttpError extends Error {
  constructor(status, message, details) {
    super(message);
    this.status = status;
    this.details = details;
  }
}

export function read(schema, value) {
  const result = schema.safeParse(value);
  if (!result.success) {
    const details = result.error.issues.map(({ path, message }) => ({
      field: path.join('.'),
      message,
    }));
    throw new HttpError(400, 'Проверьте поля запроса', details);
  }
  return result.data;
}

export function send(res, data, status = 200) {
  res.status(status).json({ data });
}
