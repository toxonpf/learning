export function errorHandler(error, req, res, next) {
    if (res.headersSent) return next(error);
    let status = error.statusCode || (error.type === 'entity.parse.failed' ? 400 : 500);
    let message = error.type === 'entity.parse.failed' ? 'Invalid JSON' : error.message;
    if (['23505', 'P2002'].includes(error.code)) { status = 409; message = 'Record already exists'; }
    if (['23503', 'P2003'].includes(error.code)) { status = 409; message = 'Related record missing or still in use'; }
    if (error.code === 'P2025') { status = 404; message = 'Record not found'; }
    if (error.code === '23514') { status = 400; message = 'Constraint violation'; }
    if (status >= 500) console.error(error.message);
    res.status(status).json({ message: status >= 500 ? 'Internal server error' : message,
        ...(error.errors ? { errors: error.errors } : {}) });
}
