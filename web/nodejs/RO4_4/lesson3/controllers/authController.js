import { registerUser, authenticateUser, findUserById } from '../services/authService.js';
import { createAccessToken } from '../services/tokenService.js';
export async function register(req, res, next) {
    try { res.status(201).json({ user: await registerUser(req.body) }); }
    catch (error) { next(error); }
}
export async function login(req, res, next) {
    try {
        const user = await authenticateUser(req.body.email, req.body.password);
        if (!user) return res.status(401).json({ error: 'Invalid email or password' });
        res.json({ user , accessToken: createAccessToken(user) });
    } catch (error) { next(error); }
}
export async function getCurrentUser(req, res, next) {
    try {
        const user = await findUserById(req.user.id);
        if (!user) return res.status(401).json({ error: 'User not found' });
        res.json({ user });
    } catch (error) { next(error); }
}
