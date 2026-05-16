import React, { createContext, useContext, useState, useEffect } from 'react';
import client from '../api/client';

const AuthContext = createContext(null);

// Map backend adminRole (from adminProfile) to frontend admin level
// Backend AdminRole enum: SUPER_ADMIN, MANAGER, CARE
// Frontend levels: SUPER, MANAGER, CARE
function mapAdminLevel(user) {
  // Priority: adminProfile.adminRole > flat adminLevel > role fallback
  const adminRole = user?.adminProfile?.adminRole || user?.adminLevel;
  if (adminRole === 'SUPER_ADMIN') return 'SUPER';
  if (adminRole === 'MANAGER') return 'MANAGER';
  if (adminRole === 'CARE') return 'CARE';
  // Direct frontend levels
  if (adminRole === 'SUPER' || adminRole === 'MANAGER' || adminRole === 'CARE') return adminRole;
  // Fallback from UserRole
  if (user?.role === 'SUPER_ADMIN') return 'SUPER';
  if (user?.role === 'ADMIN') return 'MANAGER';
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
        parsed.adminLevel = mapAdminLevel(parsed);
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

    const response = await client.post('/auth/login', payload);
    const responseData = response.data?.data || response.data;
    const loggedInUser = responseData.user;
    const accessToken = responseData.accessToken || responseData.token;

    if (!loggedInUser || !['SUPER_ADMIN', 'ADMIN'].includes(loggedInUser.role)) {
      throw new Error('Not an admin account');
    }

    loggedInUser.adminLevel = mapAdminLevel(loggedInUser);
    localStorage.setItem('adminToken', accessToken);
    localStorage.setItem('adminUser', JSON.stringify(loggedInUser));
    setToken(accessToken);
    setUser(loggedInUser);
  };

  const logout = () => {
    localStorage.removeItem('adminToken');
    localStorage.removeItem('adminUser');
    setToken(null);
    setUser(null);
  };

  const masterLogin = async (userId) => {
    const response = await client.post('/admin/master-login', { userId });
    const responseData = response.data?.data || response.data;
    const loggedInUser = responseData.user;
    const accessToken = responseData.accessToken || responseData.token;

    loggedInUser.adminLevel = mapAdminLevel(loggedInUser);
    loggedInUser.masterLogin = true;
    loggedInUser.originalAdminId = responseData.originalAdminId;
    localStorage.setItem('adminToken', accessToken);
    localStorage.setItem('adminUser', JSON.stringify(loggedInUser));
    setToken(accessToken);
    setUser(loggedInUser);
  };

  return (
    <AuthContext.Provider value={{ user, token, isLoading, isAuthenticated: !!token, login, logout, masterLogin }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
