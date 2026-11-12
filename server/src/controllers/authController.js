import bcrypt from 'bcrypt';
import { createUser, findUserByEmail, findUserById, publicUser } from '../db/queries.js';
import { clearSession, issueSession } from '../middleware/auth.js';
import { AppError } from '../utils/errors.js';

export async function register(req, res, next) {
  try {
    const { email, password } = req.body;
    if (findUserByEmail(email)) throw new AppError(409, 'An account with that email already exists.', 'EMAIL_IN_USE');
    const passwordHash = await bcrypt.hash(password, 12);
    const user = createUser({ email, passwordHash });
    issueSession(res, user.id);
    res.status(201).json({ user: publicUser(user) });
  } catch (error) {
    if (error.code === 'SQLITE_CONSTRAINT_UNIQUE') return next(new AppError(409, 'An account with that email already exists.', 'EMAIL_IN_USE'));
    next(error);
  }
}

export async function login(req, res, next) {
  try {
    const { email, password } = req.body;
    const user = findUserByEmail(email);
    const valid = user ? await bcrypt.compare(password, user.password_hash) : false;
    if (!valid) throw new AppError(401, 'Email or password is incorrect.', 'INVALID_CREDENTIALS');
    issueSession(res, user.id);
    res.json({ user: publicUser(user) });
  } catch (error) {
    next(error);
  }
}

export function logout(req, res) {
  clearSession(res);
  res.status(204).end();
}

export function me(req, res) {
  res.json({ user: publicUser(findUserById(req.user.id)) });
}
