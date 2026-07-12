import {
  createContext,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import { ConfigProvider, App as AntdApp } from 'antd';
import { buildTheme, type ThemeMode } from '../styles/theme';
import { STORAGE_KEYS } from '../config/constants';

interface ThemeContextValue {
  mode: ThemeMode;
  toggle: () => void;
  setMode: (mode: ThemeMode) => void;
}

const ThemeContext = createContext<ThemeContextValue | undefined>(undefined);

// Owns light/dark mode. Sets <html data-theme> so variables.css overrides
// apply, and derives the antd theme from those SAME CSS variables — so the
// whole app (custom CSS + antd) is themed from one file (styles/variables.css).
export function ThemeProvider({ children }: { children: ReactNode }) {
  const [mode, setMode] = useState<ThemeMode>(
    () => (localStorage.getItem(STORAGE_KEYS.themeMode) as ThemeMode) ?? 'light',
  );

  // Set the attribute synchronously before the theme is read below.
  if (typeof document !== 'undefined') {
    document.documentElement.setAttribute('data-theme', mode);
  }

  const setModeExplicit = (next: ThemeMode) => {
    localStorage.setItem(STORAGE_KEYS.themeMode, next);
    setMode(next);
  };

  const toggle = () => setModeExplicit(mode === 'light' ? 'dark' : 'light');

  const themeConfig = useMemo(() => buildTheme(mode), [mode]);
  const value = useMemo(() => ({ mode, toggle, setMode: setModeExplicit }), [mode]);

  return (
    <ThemeContext.Provider value={value}>
      <ConfigProvider theme={themeConfig}>
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
