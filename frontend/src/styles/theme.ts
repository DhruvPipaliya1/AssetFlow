import { theme as antdTheme, type ThemeConfig } from 'antd';

// Brand tokens shared by light & dark. Swap colorPrimary to rebrand.
const brandTokens: ThemeConfig['token'] = {
  colorPrimary: '#4f46e5', // indigo
  colorInfo: '#4f46e5',
  borderRadius: 8,
  fontFamily:
    "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
};

export const lightTheme: ThemeConfig = {
  algorithm: antdTheme.defaultAlgorithm,
  token: brandTokens,
  components: {
    Layout: { headerBg: '#ffffff' },
  },
};

export const darkTheme: ThemeConfig = {
  algorithm: antdTheme.darkAlgorithm,
  token: brandTokens,
};

export type ThemeMode = 'light' | 'dark';
