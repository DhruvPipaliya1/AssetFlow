import type { Request, Response, NextFunction, RequestHandler } from 'express';

// Wraps an async controller so rejected promises reach the error middleware
// (Express 4 doesn't forward async errors automatically).
export const asyncHandler =
  (fn: (req: Request, res: Response, next: NextFunction) => Promise<unknown>): RequestHandler =>
  (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
