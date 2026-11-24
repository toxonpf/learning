import { prisma } from '../config/prisma.js';
import { AppError } from '../errors/AppError.js';
import { hashPassword, verifyPassword } from './passwordService.js';
const safeUser = { id: true, name: true, email: true, role: true };
export function findUserById(id) { return prisma.user.findUnique({ where: { id }, select: safeUser }); }
export async function registerUser({ name, email, password }) {
    email = email.trim().toLowerCase();
    if (await prisma.user.findUnique({ where: { email } })) throw new AppError('Email already registered', 409);
    const passwordHash = await hashPassword(password);
    try { return await prisma.user.create({ data: { name: name.trim(), email, passwordHash }, select: safeUser }); }
    catch (error) { if (error.code === 'P2002') throw new AppError('Email already registered', 409); throw error; }
}
export async function authenticateUser(email, password) {
    const user = await prisma.user.findUnique({ where: { email: email.trim().toLowerCase() } });
    if (!user || !user.passwordHash.startsWith('$argon2') || !await verifyPassword(user.passwordHash, password)) return null;
    return { id: user.id, name: user.name, email: user.email, role: user.role };
}
