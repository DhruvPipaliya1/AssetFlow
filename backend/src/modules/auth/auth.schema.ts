import { z } from 'zod';

// NOTE: no `role` field. Extra keys (e.g. an injected role) are stripped by
// zod's default object parsing — Golden Invariant #1, defense layer 1.
export const signupSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  email: z.string().email('Valid email required'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
});

export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

export const forgotPasswordSchema = z.object({
  email: z.string().email(),
});

// Consume a reset token (issued by forgot-password) and set a new password.
export const resetPasswordSchema = z.object({
  token: z.string().min(1, 'Reset token is required'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
});

// A hosted image URL or an inline image data URL (uploaded in the browser).
const avatarSchema = z
  .string()
  .refine((v) => /^https?:\/\//.test(v) || /^data:image\//.test(v), 'Must be an image URL or upload');

// Self-service profile edit (own account only).
export const updateProfileSchema = z.object({
  name: z.string().min(1, 'Name is required').optional(),
  avatarUrl: avatarSchema.nullable().optional(), // null clears the avatar
});

export const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, 'Current password is required'),
  newPassword: z.string().min(8, 'New password must be at least 8 characters'),
});

export const updatePreferencesSchema = z.object({
  preferences: z.object({
    theme: z.enum(['light', 'dark']).optional(),
    landingPath: z.string().optional(),
  }),
});

export type SignupInput = z.infer<typeof signupSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
export type ResetPasswordInput = z.infer<typeof resetPasswordSchema>;
export type UpdateProfileInput = z.infer<typeof updateProfileSchema>;
export type ChangePasswordInput = z.infer<typeof changePasswordSchema>;
export type UpdatePreferencesInput = z.infer<typeof updatePreferencesSchema>;
