import { departmentsRepo } from './departments.repo.js';
import type {
  CreateDepartmentInput,
  UpdateDepartmentInput,
  ListDepartmentsQuery,
} from './departments.schema.js';
import { badRequest, notFound } from '../../../lib/errors.js';
import { emit } from '../../../lib/events.js';

export const departmentsService = {
  list: (query: ListDepartmentsQuery) =>
    departmentsRepo.list(query.status ? { status: query.status } : {}),

  async get(id: string) {
    const dept = await departmentsRepo.findById(id);
    if (!dept) throw notFound('Department not found');
    return dept;
  },

  async create(input: CreateDepartmentInput, actorUserId: string) {
    const dept = await departmentsRepo.create({
      name: input.name,
      headUserId: input.headUserId,
      parentDepartmentId: input.parentDepartmentId,
      status: input.status ?? 'ACTIVE',
    });
    emit({ type: 'DepartmentCreated', actorUserId, entityType: 'Department', entityId: dept.id, meta: { name: dept.name } });
    return dept;
  },

  async update(id: string, input: UpdateDepartmentInput, actorUserId: string) {
    if (input.parentDepartmentId && input.parentDepartmentId === id) {
      throw badRequest('A department cannot be its own parent');
    }
    await this.get(id); // 404 if missing
    const dept = await departmentsRepo.update(id, input);
    emit({ type: 'DepartmentUpdated', actorUserId, entityType: 'Department', entityId: id });
    return dept;
  },

  async deactivate(id: string, actorUserId: string) {
    await this.get(id);
    const dept = await departmentsRepo.update(id, { status: 'INACTIVE' });
    emit({ type: 'DepartmentDeactivated', actorUserId, entityType: 'Department', entityId: id });
    return dept;
  },
};
