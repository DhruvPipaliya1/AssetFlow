import {
  createContext,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import { ConfigProvider, App as AntdApp } from 'antd';
import { lightTheme, darkTheme, type ThemeMode } from '../styles/theme';
import { STORAGE_KEYS } from '../config/constants';

interface ThemeContextValue {
  mode: ThemeMode;
  toggle: () => void;
}

const ThemeContext = createContext<ThemeContextValue | undefined>(undefined);

// Owns the light/dark mode AND wraps antd's ConfigProvider + App so themed
// components and message/notification context are available everywhere.
export function ThemeProvider({ children }: { children: ReactNode }) {
  const [mode, setMode] = useState<ThemeMode>(
    () => (localStorage.getItem(STORAGE_KEYS.themeMode) as ThemeMode) ?? 'light',
  );

  const toggle = () =>
    setMode((prev) => {
      const next = prev === 'light' ? 'dark' : 'light';
      localStorage.setItem(STORAGE_KEYS.themeMode, next);
      return next;
    });

  const value = useMemo(() => ({ mode, toggle }), [mode]);

  return (
    <ThemeContext.Provider value={value}>
      <ConfigProvider theme={mode === 'dark' ? darkTheme : lightTheme}>
        <AntdApp>{children}</AntdApp>
      </ConfigProvider>
    </ThemeContext.Provider>
  );
}

// eslint-disable-next-line react-refresh/only-export-components
export function useThemeMode() {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error('useThemeMode must be used within a ThemeProvider');
  return ctx;
}
