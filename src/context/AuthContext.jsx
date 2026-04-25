import React, { createContext, useContext, useState, useEffect } from 'react';
import client from '../api/client';

const AuthContext = createContext(null);

// Map backend UserRole to frontend admin level hierarchy
// Backend: SUPER_ADMIN, ADMIN  →  Frontend: SUPER, MANAGER, CARE
function mapAdminLevel(role, adminLevel) {
  if (adminLevel) return adminLevel; // already SUPER/MANAGER/CARE
  if (role === 'SUPER_ADMIN') return 'SUPER';
  if (role === 'ADMIN') return 'MANAGER';
  return 'CARE';
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const savedToken = localStorage.getItem('adminToken');
    const savedUser = localStorage.getItem('adminUser');
    if (savedToken && savedUser) {
      try {
        const parsed = JSON.parse(savedUser);
        parsed.adminLevel = mapAdminLevel(parsed.role, parsed.adminLevel);
        setUser(parsed);
        setToken(savedToken);
      } catch {
        localStorage.removeItem('adminToken');
        localStorage.removeItem('adminUser');
      }
    }
    setIsLoading(false);
  }, []);

  const login = async (identifier, password) => {
    const payload = identifier.includes('@')
      ? { email: identifier, password }
      : { phone: identifier, password };

    const { data } = await client.post('/auth/login', payload);
    if (!['SUPER_ADMIN', 'ADMIN'].includes(data.user?.role)) {
      throw new Error('Not an admin account');
    }
    data.user.adminLevel = mapAdminLevel(data.user.role, data.user.adminLevel);
    localStorage.setItem('adminToken', data.token);
    localStorage.setItem('adminUser', JSON.stringify(data.user));
    setToken(data.token);
    setUser(data.user);
  };

  const logout = () => {
    localStorage.removeItem('adminToken');
    localStorage.removeItem('adminUser');
    setToken(null);
    setUser(null);
  };

  const masterLogin = async (userId) => {
    const { data } = await client.post('/admin/master-login', { userId });
    data.user.adminLevel = mapAdminLevel(data.user.role, data.user.adminLevel);
    data.user.masterLogin = true;
    data.user.originalAdminId = data.originalAdminId;
    localStorage.setItem('adminToken', data.token);
    localStorage.setItem('adminUser', JSON.stringify(data.user));
    setToken(data.token);
    setUser(data.user);
  };

  return (
    <AuthContext.Provider value={{ user, token, isLoading, isAuthenticated: !!token, login, logout, masterLogin }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
