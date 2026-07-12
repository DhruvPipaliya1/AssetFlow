import { randomBytes } from 'node:crypto';
import type { User } from '@prisma/client';
import { authRepo } from './auth.repo.js';
import type {
  SignupInput,
  LoginInput,
  ResetPasswordInput,
  UpdateProfileInput,
  ChangePasswordInput,
  UpdatePreferencesInput,
} from './auth.schema.js';
import { hashPassword, verifyPassword } from '../../lib/hash.js';
import { signAccessToken } from '../../lib/jwt.js';
import { badRequest, conflict, unauthorized } from '../../lib/errors.js';
import { effectivePermissions } from '../../lib/rbac.js';
import { logActivity } from '../../middleware/activityLog.js';

export type PublicUser = Omit<User, 'passwordHash'>;
export type MeUser = PublicUser & { permissions: string[] };

const toPublicUser = (u: User): PublicUser => {
  const { passwordHash: _omit, ...rest } = u;
  return rest;
};

// The client shape: public user + their effective permissions (so the UI's
// can() reflects the *live* RBAC matrix, not a static mirror).
const toMeUser = (u: User): MeUser => ({
  ...toPublicUser(u),
  permissions: effectivePermissions(u.role),
});

// In-process password-reset tokens (userId + expiry), keyed by the opaque token.
// A hackathon-scoped store: no email delivery, no DB table — the token is handed
// back to the caller in dev so the reset can be completed. Production would email
// a link and persist tokens. Tokens are single-use and expire after 30 minutes.
const RESET_TTL_MS = 30 * 60_000;
const resetTokens = new Map<string, { userId: string; expiresAt: number }>();

function issueResetToken(userId: string): string {
  const token = randomBytes(24).toString('hex');
  resetTokens.set(token, { userId, expiresAt: Date.now() + RESET_TTL_MS });
  return token;
}

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

  async login(input: LoginInput): Promise<{ accessToken: string; user: MeUser }> {
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
    return { accessToken, user: toMeUser(user) };
  },

  async me(userId: string): Promise<MeUser> {
    const user = await authRepo.findById(userId);
    if (!user) throw unauthorized();
    return toMeUser(user);
  },

  async updateProfile(userId: string, input: UpdateProfileInput): Promise<MeUser> {
    const user = await authRepo.updateProfile(userId, {
      name: input.name,
      avatarUrl: input.avatarUrl,
    });
    await logActivity({ actorUserId: userId, action: 'ProfileUpdated', entityType: 'User', entityId: userId });
    return toMeUser(user);
  },

  async changePassword(userId: string, input: ChangePasswordInput): Promise<void> {
    const user = await authRepo.findById(userId);
    if (!user) throw unauthorized();
    const ok = await verifyPassword(user.passwordHash, input.currentPassword);
    if (!ok) throw badRequest('Current password is incorrect');
    const passwordHash = await hashPassword(input.newPassword);
    await authRepo.updatePassword(userId, passwordHash);
    await logActivity({ actorUserId: userId, action: 'PasswordChanged', entityType: 'User', entityId: userId });
  },

  async updatePreferences(userId: string, input: UpdatePreferencesInput): Promise<MeUser> {
    const user = await authRepo.updatePreferences(userId, input.preferences);
    return toMeUser(user);
  },

  // Always resolves (no user enumeration). If the email maps to a real account we
  // issue a reset token and return it so the flow can be completed without email
  // infrastructure; for unknown emails resetToken is undefined.
  async forgotPassword(email: string): Promise<{ resetToken?: string }> {
    const user = await authRepo.findByEmail(email);
    if (!user || user.status !== 'ACTIVE') return {};
    const resetToken = issueResetToken(user.id);
    await logActivity({
      actorUserId: user.id,
      action: 'PasswordResetRequested',
      entityType: 'User',
      entityId: user.id,
    });
    return { resetToken };
  },

  async resetPassword(input: ResetPasswordInput): Promise<void> {
    const entry = resetTokens.get(input.token);
    if (!entry || entry.expiresAt < Date.now()) {
      resetTokens.delete(input.token);
      throw badRequest('Reset link is invalid or has expired');
    }
    resetTokens.delete(input.token); // single-use
    const passwordHash = await hashPassword(input.password);
    await authRepo.updatePassword(entry.userId, passwordHash);
    await logActivity({
      actorUserId: entry.userId,
      action: 'PasswordReset',
      entityType: 'User',
      entityId: entry.userId,
    });
  },
};
