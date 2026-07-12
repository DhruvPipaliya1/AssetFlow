import type { User } from '@prisma/client';
import { authRepo } from './auth.repo.js';
import type { SignupInput, LoginInput } from './auth.schema.js';
import { hashPassword, verifyPassword } from '../../lib/hash.js';
import { signAccessToken } from '../../lib/jwt.js';
import { conflict, unauthorized } from '../../lib/errors.js';
import { logActivity } from '../../middleware/activityLog.js';

export type PublicUser = Omit<User, 'passwordHash'>;

const toPublicUser = (u: User): PublicUser => {
  const { passwordHash: _omit, ...rest } = u;
  return rest;
};

export const authService = {
  async signup(input: SignupInput): Promise<PublicUser> {
    const existing = await authRepo.findByEmail(input.email);
    if (existing) throw conflict('Email already registered');

    const passwordHash = await hashPassword(input.password);
    // Golden Invariant #1: always EMPLOYEE — any role in the body is ignored.
    const user = await authRepo.createEmployee({
      name: input.name,
      email: input.email,
      passwordHash,
    });

    await logActivity({
      actorUserId: user.id,
      action: 'UserSignedUp',
      entityType: 'User',
      entityId: user.id,
    });
    return toPublicUser(user);
  },

  async login(input: LoginInput): Promise<{ accessToken: string; user: PublicUser }> {
    const user = await authRepo.findByEmail(input.email);
    // Same error whether email or password is wrong (no user enumeration).
    if (!user) throw unauthorized('Invalid credentials');
    if (user.status !== 'ACTIVE') throw unauthorized('Account is inactive');

    const ok = await verifyPassword(user.passwordHash, input.password);
    if (!ok) throw unauthorized('Invalid credentials');

    const accessToken = signAccessToken({
      sub: user.id,
      role: user.role,
      departmentId: user.departmentId,
    });
    await logActivity({
      actorUserId: user.id,
      action: 'UserLoggedIn',
      entityType: 'User',
      entityId: user.id,
    });
    return { accessToken, user: toPublicUser(user) };
  },

  async me(userId: string): Promise<PublicUser> {
    const user = await authRepo.findById(userId);
    if (!user) throw unauthorized();
    return toPublicUser(user);
  },

  // Stubbed: always succeeds to avoid revealing which emails exist.
  async forgotPassword(_email: string): Promise<void> {
    return;
  },
};
