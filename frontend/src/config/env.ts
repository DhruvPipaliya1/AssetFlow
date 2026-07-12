// Centralized env access — never read import.meta.env elsewhere.
export const ENV = {
  apiUrl: import.meta.env.VITE_API_URL ?? 'http://localhost:4000/api',
  wsUrl: import.meta.env.VITE_WS_URL ?? 'http://localhost:4000',
} as const;
