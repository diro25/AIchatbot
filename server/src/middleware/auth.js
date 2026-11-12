import jwt from 'jsonwebtoken';
import { env } from '../config.js';
import { findUserById } from '../db/queries.js';
import { AppError } from '../utils/errors.js';

const cookieOptions = {
  httpOnly: true,
  secure: env.cookieSecure,
  sameSite: env.cookieSecure ? 'none' : 'lax',
  path: '/',
  maxAge: 1000 * 60 * 60 * 24 * 7,
};

export function issueSession(res, userId) {
  const token = jwt.sign({ sub: String(userId) }, env.jwtSecret, { expiresIn: '7d' });
  res.cookie(env.cookieName, token, cookieOptions);
}

export function clearSession(res) {
  res.clearCookie(env.cookieName, cookieOptions);
}

export function requireAuth(req, res, next) {
  const token = req.cookies?.[env.cookieName];
  if (!token) return next(new AppError(401, 'Please log in to continue.', 'UNAUTHENTICATED'));
  try {
    const payload = jwt.verify(token, env.jwtSecret);
    const user = findUserById(Number(payload.sub));
    if (!user) throw new Error('User no longer exists.');
    req.user = user;
    next();
  } catch {
    next(new AppError(401, 'Your session has expired. Please log in again.', 'UNAUTHENTICATED'));
  }
}

export function getCookieOptions() {
  return cookieOptions;
}
