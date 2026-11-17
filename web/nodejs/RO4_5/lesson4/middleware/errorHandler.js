export function errorHandler(error, req, res, next) {
    if (res.headersSent) return next(error);
    let status = error.statusCode || error.status || 500;
    let message = error.message;
    if (error.type === 'entity.parse.failed') { status = 400; message = 'Invalid JSON'; }
    if (error.type === 'entity.too.large') { status = 413; message = 'Request body too large'; }
    if (['23505', 'P2002'].includes(error.code)) { status = 409; message = 'Record already exists'; }
    if (['23503', 'P2003'].includes(error.code)) { status = 409; message = 'Related record missing or still in use'; }
    if (error.code === 'P2025') { status = 404; message = 'Record not found'; }
    if (error.name === 'MulterError') {
        status = error.code === 'LIMIT_FILE_SIZE' ? 413 : 400;
        message = status === 413 ? 'Image is too large' : 'Upload failed';
    }
    if (!Number.isInteger(status) || status < 400 || status > 599) status = 500;
    if (status >= 500) req.log?.error({ err: error, method: req.method, path: req.path }, 'Request failed');
    res.status(status).json({ error: status >= 500 ? 'Internal server error' : message,
        ...(req.requestId ? { requestId: req.requestId } : {}) });
}
