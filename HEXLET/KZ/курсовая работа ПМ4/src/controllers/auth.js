import { z } from 'zod';
import { read, send } from '../lib/http.js';
import { email, password, text } from '../lib/validation.js';
import * as auth from '../services/auth.js';

const registration = z.strictObject({ name: text(120), email, password });
const credentials = z.strictObject({ email, password: z.string().min(1).max(128) });

export function authController(db, secret, timeZone) {
  return {
    register: async (req, res) => send(res, await auth.register(db, secret, read(registration, req.body)), 201),
    login: async (req, res) => send(res, await auth.login(db, secret, read(credentials, req.body))),
    me: (req, res) => send(res, { user: req.user, timeZone }),
  };
}
