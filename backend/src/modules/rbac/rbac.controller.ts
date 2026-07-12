import type { Role } from '@prisma/client';
import { asyncHandler } from '../../lib/asyncHandler.js';
import { unauthorized } from '../../lib/errors.js';
import { rbacService } from './rbac.service.js';

export const rbacController = {
  matrix: asyncHandler(async (_req, res) => {
    res.json(rbacService.matrix());
  }),

  setRole: asyncHandler(async (req, res) => {
    if (!req.user) throw unauthorized();
    const role = req.params.role as Role; // validated to a non-admin role by roleParam
    res.json(await rbacService.setRole(role, req.body.permissions, req.user.id));
  }),
};
