import { prisma } from '../../lib/prisma.js';

export const authRepo = {
  findByEmail: (email: string) => prisma.user.findUnique({ where: { email } }),

  findById: (id: string) => prisma.user.findUnique({ where: { id } }),

  // role is forced to EMPLOYEE here — the ONLY way accounts are created.
  createEmployee: (data: { name: string; email: string; passwordHash: string }) =>
    prisma.user.create({ data: { ...data, role: 'EMPLOYEE' } }),

  updatePassword: (id: string, passwordHash: string) =>
    prisma.user.update({ where: { id }, data: { passwordHash } }),

  updateProfile: (id: string, data: { name?: string; avatarUrl?: string | null }) =>
    prisma.user.update({ where: { id }, data }),

  updatePreferences: (id: string, preferences: unknown) =>
    prisma.user.update({ where: { id }, data: { preferences: preferences as object } }),
};
