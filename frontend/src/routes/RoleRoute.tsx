import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import type { Role } from '../types/enums';
import type { Permission } from '../types/permissions';
import { PATHS } from './paths';

export interface RoleRouteProps {
  roles?: Role[]; // allowed roles
  permission?: Permission; // OR require this permission
}

// Gate a subtree by role and/or permission. UX enforcement only — the backend
// is the real authority. Sends unauthorized users to the 403 page.
export function RoleRoute({ roles, permission }: RoleRouteProps) {
  const { user, can } = useAuth();
  if (!user) return <Navigate to={PATHS.login} replace />;
  if (roles && !roles.includes(user.role)) return <Navigate to={PATHS.forbidden} replace />;
  if (permission && !can(permission)) return <Navigate to={PATHS.forbidden} replace />;
  return <Outlet />;
}
