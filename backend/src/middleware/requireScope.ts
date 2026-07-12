import type { Request, Response, NextFunction } from 'express';
import { forbidden, notFound, unauthorized } from '../lib/errors.js';

// Result of a scope loader: the resource's owning user and/or department.
export interface ScopeInfo {
  userId?: string | null;
  departmentId?: string | null;
}

// For 🔸 dept/own rules. `loader` fetches the target resource's ownership;
// the caller must own it (userId) or share its department (departmentId).
// Admin bypasses. Use after authMiddleware (+ usually requirePermission).
export const requireScope =
  (loader: (req: Request) => Promise<ScopeInfo | null>) =>
  async (req: Request, _res: Response, next: NextFunction): Promise<void> => {
    if (!req.user) return next(unauthorized());
    if (req.user.role === 'ADMIN') return next(); // admin sees all

    try {
      const scope = await loader(req);
      if (!scope) return next(notFound());
      const ownsResource = !!scope.userId && scope.userId === req.user.id;
      const sharesDept =
        !!scope.departmentId && scope.departmentId === req.user.departmentId;
      if (!ownsResource && !sharesDept) {
        return next(forbidden('Resource is outside your scope'));
      }
      next();
    } catch (err) {
      next(err);
    }
  };
