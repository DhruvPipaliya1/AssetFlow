import axios, { AxiosError } from 'axios';
import { ENV } from '../config/env';
import { STORAGE_KEYS } from '../config/constants';
import type { ApiError } from '../types/models';

// Single access token in localStorage (no refresh flow).
export const tokenStore = {
  get: () => localStorage.getItem(STORAGE_KEYS.token),
  set: (t: string) => localStorage.setItem(STORAGE_KEYS.token, t),
  clear: () => localStorage.removeItem(STORAGE_KEYS.token),
};

export const apiClient = axios.create({ baseURL: ENV.apiUrl });

// Attach bearer token on every request.
apiClient.interceptors.request.use((config) => {
  const token = tokenStore.get();
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// On 401 -> clear + bounce to login (no refresh retry).
apiClient.interceptors.response.use(
  (res) => res,
  (error: AxiosError) => {
    if (error.response?.status === 401) {
      tokenStore.clear();
      if (!window.location.pathname.startsWith('/login')) {
        window.location.assign('/login');
      }
    }
    return Promise.reject(error);
  },
);

/** Extract a human-readable message from an API error. */
export function apiErrorMessage(err: unknown, fallback = 'Something went wrong'): string {
  const axiosErr = err as AxiosError<ApiError>;
  return axiosErr?.response?.data?.error?.message ?? fallback;
}

/** HTTP status of an API error (e.g. 409 for conflicts). */
export function apiErrorStatus(err: unknown): number | undefined {
  return (err as AxiosError)?.response?.status;
}

/** The `details` payload of an API error (e.g. { heldBy, action } on a 409). */
export function apiErrorDetails<T = unknown>(err: unknown): T | undefined {
  return (err as AxiosError<ApiError>)?.response?.data?.error?.details as T | undefined;
}
