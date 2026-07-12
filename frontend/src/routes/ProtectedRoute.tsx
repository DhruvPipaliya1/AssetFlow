import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { Loader } from '../components/common';
import { PATHS } from './paths';

// Gate for authenticated pages. Redirects to login if there's no session.
export function ProtectedRoute() {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) return <Loader tip="Loading your workspace…" minHeight="100vh" />;
  if (!user) return <Navigate to={PATHS.login} replace state={{ from: location }} />;

  return <Outlet />;
}
