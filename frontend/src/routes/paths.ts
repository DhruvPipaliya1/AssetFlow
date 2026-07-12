// Single source of truth for route paths. Reference PATHS.* everywhere
// (nav, redirects, links) — never hard-code path strings.
export const PATHS = {
  // public
  login: '/login',
  signup: '/signup',
  forgotPassword: '/forgot-password',
  // protected
  dashboard: '/',
  assets: '/assets',
  allocations: '/allocations',
  bookings: '/bookings',
  maintenance: '/maintenance',
  audits: '/audits',
  reports: '/reports',
  organization: '/organization',
  notifications: '/notifications',
  // errors
  forbidden: '/403',
} as const;
