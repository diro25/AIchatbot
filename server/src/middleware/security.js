import { env } from '../config.js';
import { AppError } from '../utils/errors.js';

const mutatingMethods = new Set(['POST', 'PUT', 'PATCH', 'DELETE']);

export function isAllowedOrigin(origin) {
  return !origin || env.allowedOrigins.includes(origin) || origin === env.publicOrigin;
}

export function requireTrustedOrigin(req, res, next) {
  if (!mutatingMethods.has(req.method)) return next();
  const origin = req.get('origin');
  if (isAllowedOrigin(origin)) return next();
  next(new AppError(403, 'This request origin is not allowed.', 'ORIGIN_NOT_ALLOWED'));
}
