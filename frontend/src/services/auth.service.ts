import { apiClient } from './apiClient';
import type { User, AuthResponse } from '../types/models';

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
    apiClient.post('/auth/forgot-password', { email }).then((r) => r.data),
};
