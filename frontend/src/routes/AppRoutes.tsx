import { Routes, Route } from 'react-router-dom';
import { AuthLayout } from '../layouts/AuthLayout/AuthLayout';
import { MainLayout } from '../layouts/MainLayout/MainLayout';
import { ProtectedRoute } from './ProtectedRoute';
import { RoleRoute } from './RoleRoute';
import { PATHS } from './paths';
import { Role } from '../types/enums';
import { PERMISSION } from '../types/permissions';

// pages
import LoginPage from '../pages/auth/LoginPage';
import SignupPage from '../pages/auth/SignupPage';
import ForgotPasswordPage from '../pages/auth/ForgotPasswordPage';
import DashboardPage from '../pages/dashboard/DashboardPage';
import AssetsPage from '../pages/assets/AssetsPage';
import AllocationsPage from '../pages/allocations/AllocationsPage';
import BookingsPage from '../pages/bookings/BookingsPage';
import MaintenancePage from '../pages/maintenance/MaintenancePage';
import AuditsPage from '../pages/audits/AuditsPage';
import ReportsPage from '../pages/reports/ReportsPage';
import OrganizationPage from '../pages/organization/OrganizationPage';
import SettingsPage from '../pages/settings/SettingsPage';
import NotificationsPage from '../pages/notifications/NotificationsPage';
import ForbiddenPage from '../pages/errors/ForbiddenPage';
import NotFoundPage from '../pages/errors/NotFoundPage';

export function AppRoutes() {
  return (
    <Routes>
      {/* Public (auth) */}
      <Route element={<AuthLayout />}>
        <Route path={PATHS.login} element={<LoginPage />} />
        <Route path={PATHS.signup} element={<SignupPage />} />
        <Route path={PATHS.forgotPassword} element={<ForgotPasswordPage />} />
      </Route>

      {/* Protected (requires session) */}
      <Route element={<ProtectedRoute />}>
        <Route element={<MainLayout />}>
          {/* everyone signed-in */}
          <Route path={PATHS.dashboard} element={<DashboardPage />} />
          <Route path={PATHS.assets} element={<AssetsPage />} />
          <Route path={PATHS.allocations} element={<AllocationsPage />} />
          <Route path={PATHS.bookings} element={<BookingsPage />} />
          <Route path={PATHS.maintenance} element={<MaintenancePage />} />
          <Route path={PATHS.notifications} element={<NotificationsPage />} />
          <Route path={PATHS.settings} element={<SettingsPage />} />

          {/* permission-gated */}
          <Route element={<RoleRoute permission={PERMISSION.AUDIT_PERFORM} />}>
            <Route path={PATHS.audits} element={<AuditsPage />} />
          </Route>
          <Route element={<RoleRoute permission={PERMISSION.ANALYTICS_VIEW_ALL} />}>
            <Route path={PATHS.reports} element={<ReportsPage />} />
          </Route>

          {/* admin only */}
          <Route element={<RoleRoute roles={[Role.ADMIN]} />}>
            <Route path={PATHS.organization} element={<OrganizationPage />} />
          </Route>

          <Route path={PATHS.forbidden} element={<ForbiddenPage />} />
        </Route>
      </Route>

      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  );
}
