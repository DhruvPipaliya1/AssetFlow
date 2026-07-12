import type { ReactNode } from 'react';
import {
  DashboardOutlined,
  LaptopOutlined,
  SwapOutlined,
  CalendarOutlined,
  ToolOutlined,
  AuditOutlined,
  BarChartOutlined,
  ApartmentOutlined,
  SettingOutlined,
  BellOutlined,
} from '@ant-design/icons';
import { PATHS } from '../routes/paths';
import { Role } from '../types/enums';
import { userCan, PERMISSION, type Permission } from '../types/permissions';
import type { User } from '../types/models';

// Role/permission-aware navigation. This is where the app's "role-wise"
// organization lives — pages themselves stay shared/reusable, and each nav
// entry declares who may see it. Access is enforced again by the router
// (RoleRoute) and, for real, by the backend.
export interface NavItem {
  key: string; // route path
  label: string;
  icon: ReactNode;
  roles?: Role[]; // visible only to these roles
  permission?: Permission; // requires this permission
}

export const NAV_ITEMS: NavItem[] = [
  { key: PATHS.dashboard, label: 'Dashboard', icon: <DashboardOutlined /> },
  { key: PATHS.assets, label: 'Assets', icon: <LaptopOutlined /> },
  { key: PATHS.allocations, label: 'Allocations', icon: <SwapOutlined /> },
  { key: PATHS.bookings, label: 'Bookings', icon: <CalendarOutlined /> },
  { key: PATHS.maintenance, label: 'Maintenance', icon: <ToolOutlined /> },
  { key: PATHS.audits, label: 'Audits', icon: <AuditOutlined />, permission: PERMISSION.AUDIT_PERFORM },
  { key: PATHS.reports, label: 'Reports', icon: <BarChartOutlined />, permission: PERMISSION.ANALYTICS_VIEW_ALL },
  { key: PATHS.organization, label: 'Organization', icon: <ApartmentOutlined />, roles: [Role.ADMIN] },
  { key: PATHS.notifications, label: 'Notifications', icon: <BellOutlined /> },
  { key: PATHS.settings, label: 'Settings', icon: <SettingOutlined /> },
];

/** Filter nav items to those the given user is allowed to see. */
export function navItemsForUser(user: User): NavItem[] {
  return NAV_ITEMS.filter((item) => {
    if (item.roles && !item.roles.includes(user.role)) return false;
    if (item.permission && !userCan(user, item.permission)) return false;
    return true;
  });
}
