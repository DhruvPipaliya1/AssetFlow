import { Prisma } from '@prisma/client';
import { employeesRepo } from './employees.repo.js';
import type {
  ListEmployeesQuery,
  UpdateEmployeeInput,
  ChangeRoleInput,
} from './employees.schema.js';
import { forbidden, notFound } from '../../../lib/errors.js';
import { parsePagination, paginated } from '../../../lib/search.js';
import { emit } from '../../../lib/events.js';

export const employeesService = {
  async list(query: ListEmployeesQuery) {
    const { skip, take, page } = parsePagination(query);
    const where: Prisma.UserWhereInput = {};
    if (query.role) where.role = query.role;
    if (query.status) where.status = query.status;
    if (query.departmentId) where.departmentId = query.departmentId;
    if (query.q) {
      where.OR = [
        { name: { contains: query.q, mode: 'insensitive' } },
        { email: { contains: query.q, mode: 'insensitive' } },
      ];
    }
    const [items, total] = await employeesRepo.list(where, skip, take);
    return paginated(items, total, { skip, take, page });
  },

  async get(id: string) {
    const user = await employeesRepo.findById(id);
    if (!user) throw notFound('Employee not found');
    return user;
  },

  async update(id: string, input: UpdateEmployeeInput, actorUserId: string) {
    await this.get(id);
    const user = await employeesRepo.update(id, {
      name: input.name,
      departmentId: input.departmentId,
      status: input.status,
    });
    emit({ type: 'EmployeeUpdated', actorUserId, entityType: 'User', entityId: id });
    return user;
  },

  // Golden Invariant #1: the ONE place a role is assigned.
  async changeRole(id: string, input: ChangeRoleInput, actorUserId: string) {
    if (id === actorUserId) throw forbidden("You can't change your own role");
    const target = await this.get(id);
    const user = await employeesRepo.update(id, { role: input.role });
    emit({
      type: 'RolePromoted',
      actorUserId,
      targetUserId: id,
      entityType: 'User',
      entityId: id,
      message: `Your role is now ${input.role.replace(/_/g, ' ')}`,
      meta: { from: target.role, to: input.role },
    });
    return user;
  },
};
