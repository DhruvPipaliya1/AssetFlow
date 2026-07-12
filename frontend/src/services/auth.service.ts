import { apiClient } from './apiClient';
import type { User, AuthResponse, UserPreferences } from '../types/models';

export interface SignupPayload {
  name: string;
  email: string;
  password: string;
}
export interface LoginPayload {
  email: string;
  password: string;
}

export const authService = {
  signup: (data: SignupPayload) =>
    apiClient.post<{ user: User }>('/auth/signup', data).then((r) => r.data.user),

  login: (data: LoginPayload) =>
    apiClient.post<AuthResponse>('/auth/login', data).then((r) => r.data),

  me: () => apiClient.get<{ user: User }>('/auth/me').then((r) => r.data.user),

  forgotPassword: (email: string) =>
    apiClient
      .post<{ ok: boolean; resetToken?: string }>('/auth/forgot-password', { email })
      .then((r) => r.data),

  resetPassword: (token: string, password: string) =>
    apiClient.post<{ ok: boolean }>('/auth/reset-password', { token, password }).then((r) => r.data),

  updateProfile: (data: { name?: string; avatarUrl?: string | null }) =>
    apiClient.patch<{ user: User }>('/auth/profile', data).then((r) => r.data.user),

  changePassword: (currentPassword: string, newPassword: string) =>
    apiClient
      .post<{ ok: boolean }>('/auth/change-password', { currentPassword, newPassword })
      .then((r) => r.data),

  updatePreferences: (preferences: UserPreferences) =>
    apiClient.patch<{ user: User }>('/auth/preferences', { preferences }).then((r) => r.data.user),
};
