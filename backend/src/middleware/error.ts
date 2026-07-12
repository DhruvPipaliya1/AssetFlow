import type { Request, Response, NextFunction } from 'express';
import { AppError } from '../lib/errors.js';

// Catch-all — must be registered LAST. Turns errors into a consistent shape.
export function errorHandler(
  err: unknown,
  _req: Request,
  res: Response,
  _next: NextFunction,
): void {
  if (err instanceof AppError) {
    res.status(err.statusCode).json({
      error: { code: err.code, message: err.message, details: err.details },
    });
    return;
  }
  console.error('[unhandled]', err);
  res.status(500).json({
    error: { code: 'INTERNAL', message: 'Internal server error' },
  });
}
