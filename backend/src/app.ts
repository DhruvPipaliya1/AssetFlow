import express, { type Express, type Request, type Response } from 'express';
import cors from 'cors';

export function createApp(): Express {
  const app = express();

  app.use(cors({ origin: process.env.CLIENT_ORIGIN ?? '*' }));
  app.use(express.json());

  // Health check — used to confirm the API is up.
  app.get('/health', (_req: Request, res: Response) => {
    res.json({ status: 'ok', service: 'assetflow-backend', ts: new Date().toISOString() });
  });

  // TODO: mount domain modules here — see backend/CLAUDE.md
  // app.use('/api/auth', authRouter) ...

  return app;
}
