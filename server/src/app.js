import path from 'node:path';
import { fileURLToPath } from 'node:url';
import cookieParser from 'cookie-parser';
import cors from 'cors';
import express from 'express';
import helmet from 'helmet';
import authRoutes from './routes/auth.js';
import conversationRoutes from './routes/conversations.js';
import { apiRateLimit } from './middleware/rateLimit.js';
import { isAllowedOrigin, requireTrustedOrigin } from './middleware/security.js';
import { errorHandler } from './utils/errors.js';
import { env, isProduction } from './config.js';
import './db/index.js';

const app = express();
const rootDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');

app.disable('x-powered-by');
app.use(helmet({ frameguard: false, contentSecurityPolicy: false }));
app.use(cors({
  origin(origin, callback) {
    if (isAllowedOrigin(origin)) return callback(null, true);
    return callback(new Error('Origin is not allowed.'));
  },
  credentials: true,
}));
app.use(express.json({ limit: '32kb' }));
app.use(cookieParser());
app.use(requireTrustedOrigin);

app.get('/healthz', (req, res) => res.json({ status: 'ok' }));
app.use('/api', apiRateLimit);
app.use('/api/auth', authRoutes);
app.use('/api/conversations', conversationRoutes);

if (isProduction) {
  const clientDist = path.join(rootDir, 'client/dist');
  app.use(express.static(clientDist, { index: 'index.html' }));
  app.use((req, res, next) => {
    if (req.path.startsWith('/api/') || req.path === '/healthz') return next();
    res.sendFile(path.join(clientDist, 'index.html'));
  });
}

app.use((req, res) => res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Route not found.' } }));
app.use(errorHandler);

export default app;
