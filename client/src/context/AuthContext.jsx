import { useEffect, useState } from 'react';
import api from '../lib/api';
import AuthContext from './auth-context';

export function AuthProvider({ children }) {
  const [user,    setUser]    = useState(null);
  const [loading, setLoading] = useState(() => Boolean(localStorage.getItem('token')));

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) return;

    let mounted = true;

    api.get('/auth/me')
      .then(({ data }) => {
        if (mounted) setUser(data);
      })
      .catch(() => localStorage.removeItem('token'))
      .finally(() => {
        if (mounted) setLoading(false);
      });

    return () => {
      mounted = false;
    };
  }, []);

  const login = async (email, password) => {
    const { data } = await api.post('/auth/login', { email, password });
    localStorage.setItem('token', data.token);
    setUser(data.user);
    return data.user;
  };

  const register = async (name, email, password) => {
    const { data } = await api.post('/auth/register', { name, email, password });
    localStorage.setItem('token', data.token);
    setUser(data.user);
    return data.user;
  };

  const logout = () => {
    localStorage.removeItem('token');
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
}
