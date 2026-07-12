import type { Request, Response, NextFunction } from 'express';
import { hasPermission, type Permission } from '../lib/permissions.js';
import { forbidden, unauthorized } from '../lib/errors.js';

// Guard a route by PERMISSION (not raw role). Use after authMiddleware.
export const requirePermission =
  (perm: Permission) =>
  (req: Request, _res: Response, next: NextFunction): void => {
    if (!req.user) return next(unauthorized());
    if (!hasPermission(req.user.role, perm)) {
      return next(forbidden(`Missing permission: ${perm}`));
    }
    next();
  };
