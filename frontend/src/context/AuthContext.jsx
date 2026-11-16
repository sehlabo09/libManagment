import { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { apiRequest } from '../api/client';

const AuthContext = createContext(null);

// The token is only a key to the API; all real data lives in PostgreSQL.
const STORAGE_KEY = 'lms_token';

export function AuthProvider({ children }) {
  const [token, setToken] = useState(() => localStorage.getItem(STORAGE_KEY));
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(Boolean(localStorage.getItem(STORAGE_KEY)));

  // Whenever we have a token, confirm it is still valid and load the user.
  useEffect(() => {
    if (!token) {
      setUser(null);
      setLoading(false);
      return undefined;
    }

    let cancelled = false;
    setLoading(true);

    (async () => {
      try {
        const data = await apiRequest('/auth/me', { token });
        if (!cancelled) setUser(data.user);
      } catch {
        if (!cancelled) {
          localStorage.removeItem(STORAGE_KEY);
          setToken(null);
          setUser(null);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [token]);

  const storeSession = useCallback((data) => {
    localStorage.setItem(STORAGE_KEY, data.token);
    setToken(data.token);
    setUser(data.user);
    return data.user;
  }, []);

  const login = useCallback(
    async (email, password) => {
      const data = await apiRequest('/auth/login', {
        method: 'POST',
        body: { email, password },
      });
      return storeSession(data);
    },
    [storeSession]
  );

  const register = useCallback(
    async (payload) => {
      const data = await apiRequest('/auth/register', { method: 'POST', body: payload });
      return storeSession(data);
    },
    [storeSession]
  );

  const logout = useCallback(() => {
    localStorage.removeItem(STORAGE_KEY);
    setToken(null);
    setUser(null);
  }, []);

  const refreshUser = useCallback(async () => {
    if (!token) return null;
    const data = await apiRequest('/auth/me', { token });
    setUser(data.user);
    return data.user;
  }, [token]);

  const value = {
    token,
    user,
    loading,
    isAdmin: user?.role === 'ADMIN',
    login,
    register,
    logout,
    setUser,
    refreshUser,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used inside an AuthProvider');
  }
  return context;
}
