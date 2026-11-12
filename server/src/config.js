import path from 'node:path';
import dotenv from 'dotenv';
import { fileURLToPath } from 'node:url';

const rootDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
dotenv.config({ path: path.join(rootDir, 'server/.env') });
dotenv.config({ path: path.join(rootDir, '.env') });

const asBoolean = (value, fallback = false) => {
  if (value === undefined) return fallback;
  return value.toLowerCase() === 'true';
};

export const env = {
  nodeEnv: process.env.NODE_ENV || 'development',
  port: Number(process.env.PORT || (process.env.NODE_ENV === 'production' ? 3000 : 3001)),
  dbPath: path.resolve(rootDir, process.env.DB_PATH || 'server/data/chatbot.db'),
  jwtSecret: process.env.JWT_SECRET || 'development-only-change-me',
  anthropicApiKey: process.env.ANTHROPIC_API_KEY || '',
  anthropicModel: process.env.ANTHROPIC_MODEL || '',
  allowedOrigins: (process.env.ALLOWED_ORIGINS || 'http://localhost:3000').split(',').map((item) => item.trim()).filter(Boolean),
  publicOrigin: process.env.PUBLIC_ORIGIN || '',
  cookieSecure: asBoolean(process.env.COOKIE_SECURE, false),
  cookieName: process.env.COOKIE_NAME || 'signal_room_session',
  maxHistoryMessages: Number(process.env.MAX_HISTORY_MESSAGES || 40),
  maxHistoryCharacters: Number(process.env.MAX_HISTORY_CHARACTERS || 120000),
};

export const isProduction = env.nodeEnv === 'production';

if (!Number.isInteger(env.port) || env.port < 1024 || env.port > 65535) {
  throw new Error('PORT must be an integer between 1024 and 65535.');
}
if (!Number.isInteger(env.maxHistoryMessages) || env.maxHistoryMessages < 1 || env.maxHistoryMessages > 200) {
  throw new Error('MAX_HISTORY_MESSAGES must be an integer between 1 and 200.');
}
if (!Number.isInteger(env.maxHistoryCharacters) || env.maxHistoryCharacters < 1000 || env.maxHistoryCharacters > 1000000) {
  throw new Error('MAX_HISTORY_CHARACTERS must be an integer between 1000 and 1000000.');
}
if (isProduction && (env.jwtSecret === 'development-only-change-me' || env.jwtSecret.length < 32)) {
  throw new Error('JWT_SECRET must be at least 32 characters and explicitly configured in production.');
}
if (isProduction && !env.cookieSecure) {
  throw new Error('COOKIE_SECURE=true is required in production for HTTPS cookie sessions.');
}
