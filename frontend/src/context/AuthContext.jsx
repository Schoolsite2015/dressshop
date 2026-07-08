import { createContext, useContext, useState } from 'react';
import api from '../lib/api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    const stored = localStorage.getItem('user');
    return stored ? JSON.parse(stored) : null;
  });
  const [school, setSchool] = useState(() => {
    const stored = localStorage.getItem('school');
    return stored ? JSON.parse(stored) : null;
  });

  async function login(username, password) {
    const res = await api.post('/auth/login', { username, password });
    localStorage.setItem('token', res.data.token);
    localStorage.setItem('user', JSON.stringify(res.data.user));
    localStorage.setItem('school', JSON.stringify(res.data.school));
    setUser(res.data.user);
    setSchool(res.data.school);
    return res.data.user;
  }

  function logout() {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    localStorage.removeItem('school');
    setUser(null);
    setSchool(null);
  }

  return (
    <AuthContext.Provider value={{ user, school, login, logout, isAdmin: user?.role === 'admin' }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
