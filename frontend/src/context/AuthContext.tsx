import {
  createContext,
  useCallback,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import type { User } from '../types/models';
import { hasPermission, type Permission } from '../types/permissions';
import { authService } from '../services/auth.service';
import { tokenStore } from '../services/apiClient';

export interface AuthContextValue {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  signup: (name: string, email: string, password: string) => Promise<void>;
  logout: () => void;
  can: (perm: Permission) => boolean;
}

// eslint-disable-next-line react-refresh/only-export-components
export const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  // Restore session from a stored token on mount.
  useEffect(() => {
    if (!tokenStore.get()) {
      setLoading(false);
      return;
    }
    authService
      .me()
      .then(setUser)
      .catch(() => tokenStore.clear())
      .finally(() => setLoading(false));
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    const res = await authService.login({ email, password });
    tokenStore.set(res.accessToken);
    setUser(res.user);
  }, []);

  const signup = useCallback(
    async (name: string, email: string, password: string) => {
      await authService.signup({ name, email, password });
      // auto-login after signup
      const res = await authService.login({ email, password });
      tokenStore.set(res.accessToken);
      setUser(res.user);
    },
    [],
  );

  const logout = useCallback(() => {
    tokenStore.clear();
    setUser(null);
  }, []);

  const can = useCallback(
    (perm: Permission) => (user ? hasPermission(user.role, perm) : false),
    [user],
  );

  const value = useMemo(
    () => ({ user, loading, login, signup, logout, can }),
    [user, loading, login, signup, logout, can],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
