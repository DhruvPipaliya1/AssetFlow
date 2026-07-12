import express, { type Express, type Request, type Response } from 'express';
import cors from 'cors';
import { SETTINGS } from './lib/settings.js';
import { errorHandler } from './middleware/error.js';
import { authRouter } from './modules/auth/auth.routes.js';

export function createApp(): Express {
  const app = express();

  app.use(cors({ origin: SETTINGS.clientOrigin }));
  app.use(express.json());

  // Health check — used to confirm the API is up.
  app.get('/health', (_req: Request, res: Response) => {
    res.json({ status: 'ok', service: 'assetflow-backend', ts: new Date().toISOString() });
  });

  // ── Domain modules (mount new routers here, ABOVE the error handler) ──
  app.use('/api/auth', authRouter);

  // Error handler MUST be last.
  app.use(errorHandler);

  return app;
}
