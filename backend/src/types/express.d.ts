import type { Role } from '@prisma/client';

// Augment Express Request with the authenticated user set by authMiddleware.
declare global {
  namespace Express {
    interface Request {
      user?: { id: string; role: Role; departmentId?: string | null };
    }
  }
}

export {};
