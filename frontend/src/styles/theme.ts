import { theme as antdTheme, type ThemeConfig } from 'antd';

export type ThemeMode = 'light' | 'dark';

// Read a CSS custom property from :root so antd is driven by the SAME
// variables.css single source of truth. Change a color there -> antd + all
// custom CSS update together.
export function cssVar(name: string, fallback = ''): string {
  if (typeof window === 'undefined') return fallback;
  return getComputedStyle(document.documentElement).getPropertyValue(name).trim() || fallback;
}

// Build the antd theme config for the given mode. Call AFTER the html
// data-theme attribute is set so dark values are read correctly.
export function buildTheme(mode: ThemeMode): ThemeConfig {
  const primary = cssVar('--af-primary', '#714b67');

  return {
    algorithm: mode === 'dark' ? antdTheme.darkAlgorithm : antdTheme.defaultAlgorithm,
    token: {
      colorPrimary: primary,
      colorInfo: cssVar('--af-info', '#3b82f6'),
      colorSuccess: cssVar('--af-success', '#22c55e'),
      colorWarning: cssVar('--af-warning', '#f59e0b'),
      colorError: cssVar('--af-danger', '#ef4444'),
      colorBgLayout: cssVar('--af-bg'),
      colorBgContainer: cssVar('--af-surface'),
      colorBorder: cssVar('--af-border'),
      colorBorderSecondary: cssVar('--af-border'),
      colorText: cssVar('--af-text-primary'),
      colorTextSecondary: cssVar('--af-text-secondary'),
      borderRadius: 12,
      borderRadiusLG: 16,
      fontFamily:
        "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
      boxShadowSecondary: cssVar('--af-shadow-md', '0 4px 12px rgba(17,24,39,0.08)'),
    },
    components: {
      Layout: {
        headerBg: cssVar('--af-surface'),
        siderBg: cssVar('--af-sidebar'),
        bodyBg: cssVar('--af-bg'),
        headerPadding: 0,
      },
      Menu: {
        // light menus (used elsewhere)
        itemSelectedBg: cssVar('--af-primary-light'),
        itemSelectedColor: primary,
        itemHoverBg: cssVar('--af-hover-bg'),
        itemBorderRadius: 10,
        // dark (aubergine) sidebar menu — Odoo look
        darkItemBg: cssVar('--af-sidebar'),
        darkSubMenuItemBg: cssVar('--af-sidebar'),
        darkItemColor: cssVar('--af-sidebar-text'),
        darkItemHoverColor: cssVar('--af-sidebar-text-active'),
        darkItemHoverBg: cssVar('--af-sidebar-hover-bg'),
        darkItemSelectedBg: cssVar('--af-sidebar-active-bg'),
        darkItemSelectedColor: cssVar('--af-sidebar-text-active'),
      },
      Card: {
        borderRadiusLG: 16,
      },
      Button: {
        borderRadius: 10,
        primaryShadow: 'none',
      },
      Table: {
        headerBg: cssVar('--af-bg'),
        rowHoverBg: cssVar('--af-hover-bg'),
        borderColor: cssVar('--af-border'),
      },
    },
  };
}
