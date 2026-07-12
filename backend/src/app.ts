import express, { type Express, type Request, type Response } from 'express';
import cors from 'cors';
import swaggerUi from 'swagger-ui-express';
import { SETTINGS } from './lib/settings.js';
import { openapiSpec } from './lib/swagger.js';
import { errorHandler } from './middleware/error.js';
import { authRouter } from './modules/auth/auth.routes.js';
import { departmentsRouter } from './modules/org/departments/departments.routes.js';
import { categoriesRouter } from './modules/org/categories/categories.routes.js';
import { employeesRouter } from './modules/org/employees/employees.routes.js';
import { assetsRouter } from './modules/assets/assets.routes.js';
import { allocationsRouter } from './modules/allocations/allocations.routes.js';
import { transfersRouter } from './modules/allocations/transfers.routes.js';

export function createApp(): Express {
  const app = express();

  app.use(cors({ origin: SETTINGS.clientOrigin }));
  app.use(express.json());

  // Health check — used to confirm the API is up.
  app.get('/health', (_req: Request, res: Response) => {
    res.json({ status: 'ok', service: 'assetflow-backend', ts: new Date().toISOString() });
  });

  // Interactive API docs (Swagger UI) + raw spec.
  app.use('/api/docs', swaggerUi.serve, swaggerUi.setup(openapiSpec, { customSiteTitle: 'AssetFlow API Docs' }));
  app.get('/api/docs.json', (_req: Request, res: Response) => res.json(openapiSpec));

  // ── Domain modules (mount new routers here, ABOVE the error handler) ──
  app.use('/api/auth', authRouter);
  app.use('/api/departments', departmentsRouter);
  app.use('/api/categories', categoriesRouter);
  app.use('/api/employees', employeesRouter);
  app.use('/api/assets', assetsRouter);
  app.use('/api/allocations', allocationsRouter);
  app.use('/api/transfers', transfersRouter);

  // Error handler MUST be last.
  app.use(errorHandler);

  return app;
}
