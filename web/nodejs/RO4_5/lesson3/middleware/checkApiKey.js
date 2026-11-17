export default function checkApiKey(req, res, next) {
    if (req.get('x-api-key') !== 'college-demo') return res.status(403).json({ message: 'Access denied' });
    next();
}
