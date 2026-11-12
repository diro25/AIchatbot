import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { api } from '../api/client';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [status, setStatus] = useState('loading');

  useEffect(() => {
    api.me().then(({ user: nextUser }) => setUser(nextUser)).catch(() => setUser(null)).finally(() => setStatus('ready'));
  }, []);

  const value = useMemo(() => ({
    user,
    status,
    async login(credentials) {
      const result = await api.login(credentials);
      setUser(result.user);
      return result.user;
    },
    async register(credentials) {
      const result = await api.register(credentials);
      setUser(result.user);
      return result.user;
    },
    async logout() {
      await api.logout().catch(() => {});
      setUser(null);
    },
  }), [status, user]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  return useContext(AuthContext);
}
