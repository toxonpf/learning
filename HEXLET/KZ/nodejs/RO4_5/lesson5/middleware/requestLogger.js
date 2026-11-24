export function requestLogger(req, res, next) {
    const started = performance.now();
    req.log.info({ method: req.method, path: req.path }, 'Request started');
    res.on('finish', () => req.log.info({ method: req.method, path: req.path,
        statusCode: res.statusCode, durationMs: Math.round((performance.now() - started) * 100) / 100 }, 'Request completed'));
    next();
}
