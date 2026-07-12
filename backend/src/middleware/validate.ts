import type { Request, Response, NextFunction } from 'express';
import type { ZodType } from 'zod';
import { badRequest } from '../lib/errors.js';

type Source = 'body' | 'query' | 'params';

// Zod-validate a request part; replaces it with the parsed (typed) value.
export const validate =
  (schema: ZodType, source: Source = 'body') =>
  (req: Request, _res: Response, next: NextFunction): void => {
    const result = schema.safeParse(req[source]);
    if (!result.success) {
      return next(badRequest('Validation failed', result.error.flatten()));
    }
    // query/params are read-only getters in Express 5-ish; assign safely
    (req as Record<Source, unknown>)[source] = result.data;
    next();
  };
