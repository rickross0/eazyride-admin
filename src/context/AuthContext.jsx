import React, { createContext, useContext, useState, useEffect } from 'react';
import client from '../api/client';

const AuthContext = createContext(null);

// Map backend roles to frontend admin levels: SUPER, MANAGER, CARE
function mapAdminLevel(role, adminRole) {
  const level = adminRole || role;
  if (level === 'SUPER_ADMIN') return 'SUPER';
  if (level === 'ADMIN') return 'MANAGER';
  if (level === 'MANAGER') return 'MANAGER';
  if (level === 'CARE') return 'CARE';
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

    const res = await client.post('/auth/login', payload);
    const resData = res.data?.data ? res.data : res;
    const userData = resData.data || resData;
    const userObj = userData.user;
    const accessToken = userData.accessToken || userData.token;

    if (!['SUPER_ADMIN', 'ADMIN'].includes(userObj?.role)) {
      throw new Error('Not an admin account');
    }
    userObj.adminLevel = mapAdminLevel(userObj.role, userObj.adminProfile?.adminRole);
    localStorage.setItem('adminToken', accessToken);
    localStorage.setItem('adminUser', JSON.stringify(userObj));
    setToken(accessToken);
    setUser(userObj);
  };

  const logout = () => {
    localStorage.removeItem('adminToken');
    localStorage.removeItem('adminUser');
    setToken(null);
    setUser(null);
  };

  const masterLogin = async (userId) => {
    const { data } = await client.post('/admin/master-login', { userId });
    const resData = data?.data ? data : data;
    const userData = resData.data || resData;
    const userObj = userData.user;
    const accessToken = userData.accessToken || userData.token;
    userObj.adminLevel = mapAdminLevel(userObj.role, userObj.adminProfile?.adminRole);
    userObj.masterLogin = true;
    userObj.originalAdminId = userData.originalAdminId;
    localStorage.setItem('adminToken', accessToken);
    localStorage.setItem('adminUser', JSON.stringify(userObj));
    setToken(accessToken);
    setUser(userObj);
  };

  return (
    <AuthContext.Provider value={{ user, token, isLoading, isAuthenticated: !!token, login, logout, masterLogin }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
