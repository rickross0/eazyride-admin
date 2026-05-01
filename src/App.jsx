import React from 'react';
import { Routes, Route, Navigate, NavLink } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import LoginPage from './pages/LoginPage';
import DashboardPage from './pages/DashboardPage';
import UsersPage from './pages/UsersPage';
import ProvidersPage from './pages/ProvidersPage';
import RidesPage from './pages/RidesPage';
import PricingPage from './pages/PricingPage';
import SurgePage from './pages/SurgePage';
import OrdersPage from './pages/OrdersPage';
import CarsPage from './pages/CarsPage';
import PayoutsPage from './pages/PayoutsPage';
import ProviderEarningsPage from './pages/ProviderEarningsPage';
import ReportsPage from './pages/ReportsPage';
import RestaurantsPage from './pages/RestaurantsPage';
import FeatureTogglesPage from './pages/FeatureTogglesPage';
import StaffPage from './pages/StaffPage';
import StaffActivityPage from './pages/StaffActivityPage';
import SettingsPage from './pages/SettingsPage';
import DriversMapPage from './pages/DriversMapPage';
import DemandHeatmapPage from './pages/DemandHeatmapPage';
import SosPage from './pages/SosPage';
import LotteryPage from './pages/LotteryPage';

const HIERARCHY = { SUPER: 3, MANAGER: 2, CARE: 1 };

const leftNavItems = [
  { to: '/', label: 'Dashboard', icon: '\uD83D\uDCCA', minLevel: 'CARE' },
  { to: '/users', label: 'Users & Drivers', icon: '\uD83D\uDC65', minLevel: 'CARE' },
  { to: '/rides', label: 'Rides', icon: '\uD83D\uDEE3\uFE0F', minLevel: 'CARE' },
  { to: '/staff', label: 'Staff', icon: '\uD83D\uDC68\u200D\uD83D\uDCBB', minLevel: 'SUPER' },
  { to: '/activity', label: 'Activity Log', icon: '\uD83D\uDCDC', minLevel: 'SUPER' },
  { to: '/pricing', label: 'Pricing', icon: '\uD83D\uDCB2', minLevel: 'SUPER' },
  { to: '/surge', label: 'Surge Zones', icon: '\u26A1', minLevel: 'SUPER' },
  { to: '/payouts', label: 'Payouts', icon: '\uD83D\uDCB0', minLevel: 'SUPER' },
  { to: '/reports', label: 'Reports', icon: '\uD83D\uDCC8', minLevel: 'MANAGER' },
  { to: '/features', label: 'Features', icon: '\uD83D\uDD27', minLevel: 'SUPER' },
  { to: '/drivers-map', label: 'Drivers Map', icon: '🗺️', minLevel: 'CARE' },
  { to: '/sos', label: 'SOS Alerts', icon: '🆘', minLevel: 'CARE' },
  { to: '/heatmap', label: 'Heatmap', icon: '🔥', minLevel: 'MANAGER' },
  { to: '/settings', label: 'Settings', icon: '\u2699\uFE0F', minLevel: 'SUPER' },
];

const rightNavItems = [
  { to: '/providers', label: 'Providers', icon: '\uD83D\uDE97', minLevel: 'MANAGER' },
  { to: '/restaurants', label: 'Restaurants', icon: '\uD83C\uDF54', minLevel: 'MANAGER' },
  { to: '/cars', label: 'Cars', icon: '\uD83D\uDE98', minLevel: 'MANAGER' },
  { to: '/orders', label: 'Orders', icon: '\uD83D\uDCE6', minLevel: 'CARE' },
  { to: '/provider-earnings', label: 'Earnings', icon: '\uD83D\uDCB5', minLevel: 'MANAGER' },
];

const levelLabels = {
  SUPER: { name: 'Super Admin', color: '#FF9500', bg: '#3A2800' },
  MANAGER: { name: 'Manager', color: '#007AFF', bg: '#002A5C' },
  CARE: { name: 'Care Agent', color: '#34C759', bg: '#003A12' },
};

function PrivateRoute({ children }) {
  const { isAuthenticated, isLoading } = useAuth();
  if (isLoading) return <div style={{ color: '#AAA', padding: 40 }}>Loading...</div>;
  return isAuthenticated ? children : <Navigate to="/login" />;
}

function Layout({ children }) {
  const { user, logout } = useAuth();
  const adminLevel = user?.adminLevel || 'SUPER';
  const levelInfo = levelLabels[adminLevel] || levelLabels.CARE;
  const userRank = HIERARCHY[adminLevel] || 0;
  const isMasterLogin = user?.masterLogin;

  const leftItems = leftNavItems.filter((item) => HIERARCHY[item.minLevel] <= userRank);
  const rightItems = rightNavItems.filter((item) => HIERARCHY[item.minLevel] <= userRank);

  const handleLogout = () => {
    if (isMasterLogin) {
      // Master login sessions expire in 1h, but allow manual exit
      localStorage.removeItem('adminToken');
      localStorage.removeItem('adminUser');
      window.location.href = '/login';
    } else {
      logout();
    }
  };

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: '#0F0F0F' }}>
      <aside style={leftSidebarStyles}>
        <div style={navStyles.logo}>EazyRide</div>
        {isMasterLogin && (
          <div style={{ margin: '0 20px 12px', padding: '6px 12px', borderRadius: 8, background: '#3A1A00', border: '1px solid #FF9500', textAlign: 'center' }}>
            <span style={{ color: '#FF9500', fontWeight: 700, fontSize: 11 }}>🔐 Master Login</span>
          </div>
        )}
        <div style={{ ...navStyles.levelBadge, background: levelInfo.bg, borderColor: levelInfo.color }}>
          <span style={{ color: levelInfo.color, fontWeight: 700, fontSize: 11, letterSpacing: 1 }}>{levelInfo.name}</span>
        </div>
        <nav style={navStyles.nav}>
          {leftItems.map((n) => (
            <NavLink key={n.to} to={n.to} end={n.to === '/'} style={({ isActive }) => ({ ...navStyles.link, ...(isActive && navStyles.linkActive) })}>
              <span style={{ marginRight: 8 }}>{n.icon}</span>{n.label}
            </NavLink>
          ))}
        </nav>
        <div style={navStyles.footer}>
          <div style={{ color: '#FFF', fontSize: 13, marginBottom: 4 }}>{user?.firstName || 'Admin'}</div>
          <button onClick={handleLogout} style={navStyles.logoutBtn}>{isMasterLogin ? 'Exit Master Login' : 'Sign Out'}</button>
        </div>
      </aside>
      <main style={mainStyles}>{children}</main>
      <aside style={rightSidebarStyles}>
        <div style={rightSidebarStyles.logo}>Haye!</div>
        <div style={rightSidebarStyles.sectionLabel}>Services</div>
        <nav style={navStyles.nav}>
          {rightItems.map((n) => (
            <NavLink key={n.to} to={n.to} style={({ isActive }) => ({ ...navStyles.link, ...(isActive && rightSidebarStyles.linkActive) })}>
              <span style={{ marginRight: 8 }}>{n.icon}</span>{n.label}
            </NavLink>
          ))}
        </nav>
      </aside>
    </div>
  );
}

function AppRoutes() {
  const { isAuthenticated } = useAuth();
  return (
    <Routes>
      <Route path="/login" element={isAuthenticated ? <Navigate to="/" /> : <LoginPage />} />
      <Route path="/" element={<PrivateRoute><Layout><DashboardPage /></Layout></PrivateRoute>} />
      <Route path="/users" element={<PrivateRoute><Layout><UsersPage /></Layout></PrivateRoute>} />
      <Route path="/providers" element={<PrivateRoute><Layout><ProvidersPage /></Layout></PrivateRoute>} />
      <Route path="/rides" element={<PrivateRoute><Layout><RidesPage /></Layout></PrivateRoute>} />
      <Route path="/pricing" element={<PrivateRoute><Layout><PricingPage /></Layout></PrivateRoute>} />
      <Route path="/surge" element={<PrivateRoute><Layout><SurgePage /></Layout></PrivateRoute>} />
      <Route path="/orders" element={<PrivateRoute><Layout><OrdersPage /></Layout></PrivateRoute>} />
      <Route path="/restaurants" element={<PrivateRoute><Layout><RestaurantsPage /></Layout></PrivateRoute>} />
      <Route path="/cars" element={<PrivateRoute><Layout><CarsPage /></Layout></PrivateRoute>} />
      <Route path="/payouts" element={<PrivateRoute><Layout><PayoutsPage /></Layout></PrivateRoute>} />
      <Route path="/provider-earnings" element={<PrivateRoute><Layout><ProviderEarningsPage /></Layout></PrivateRoute>} />
      <Route path="/reports" element={<PrivateRoute><Layout><ReportsPage /></Layout></PrivateRoute>} />
      <Route path="/features" element={<PrivateRoute><Layout><FeatureTogglesPage /></Layout></PrivateRoute>} />
      <Route path="/staff" element={<PrivateRoute><Layout><StaffPage /></Layout></PrivateRoute>} />
      <Route path="/activity" element={<PrivateRoute><Layout><StaffActivityPage /></Layout></PrivateRoute>} />
      <Route path="/drivers-map" element={<PrivateRoute><Layout><DriversMapPage /></Layout></PrivateRoute>} />
      <Route path="/heatmap" element={<PrivateRoute><Layout><DemandHeatmapPage /></Layout></PrivateRoute>} />
      <Route path="/sos" element={<PrivateRoute><Layout><SosPage /></Layout></PrivateRoute>} />
      <Route path="/settings" element={<PrivateRoute><Layout><SettingsPage /></Layout></PrivateRoute>} />
      <Route path="/lottery" element={<PrivateRoute><Layout><LotteryPage /></Layout></PrivateRoute>} />
      <Route path="*" element={<Navigate to="/" />} />
    </Routes>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <AppRoutes />
    </AuthProvider>
  );
}

const navStyles = {
  logo: { color: '#0A8E4E', fontSize: 20, fontWeight: 800, padding: '0 20px 12px' },
  levelBadge: { margin: '0 20px 16px', padding: '6px 12px', borderRadius: 8, border: '1px solid', textAlign: 'center' },
  nav: { flex: 1, display: 'flex', flexDirection: 'column', gap: 4, overflowY: 'auto' },
  link: { display: 'flex', alignItems: 'center', padding: '12px 20px', color: '#AAA', textDecoration: 'none', fontSize: 14, fontWeight: 600, transition: 'background .15s' },
  linkActive: { color: '#FFF', background: '#0A8E4E', borderRadius: 0 },
  footer: { padding: '0 20px', borderTop: '1px solid #2A2A2A', paddingTop: 16 },
  logoutBtn: { background: '#FF3B30', color: '#FFF', border: 'none', borderRadius: 8, padding: '8px 16px', cursor: 'pointer', fontWeight: 700, fontSize: 13, width: '100%' },
};

const leftSidebarStyles = {
  width: 220,
  background: '#1A1A1A',
  borderRight: '1px solid #2A2A2A',
  display: 'flex',
  flexDirection: 'column',
  padding: '20px 0',
  position: 'fixed',
  top: 0,
  left: 0,
  bottom: 0,
  overflowY: 'auto',
};

const rightSidebarStyles = {
  width: 200,
  background: '#111',
  borderLeft: '1px solid #2A2A2A',
  display: 'flex',
  flexDirection: 'column',
  padding: '20px 0',
  position: 'fixed',
  top: 0,
  right: 0,
  bottom: 0,
  overflowY: 'auto',
  logo: { color: '#FF6B35', fontSize: 20, fontWeight: 800, padding: '0 20px 12px' },
  sectionLabel: { color: '#666', fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 1.5, padding: '0 20px', marginBottom: 12 },
  linkActive: { color: '#FFF', background: '#FF6B35', borderRadius: 0 },
};

const mainStyles = {
  flex: 1,
  padding: 32,
  marginLeft: 220,
  marginRight: 200,
  minHeight: '100vh',
  background: '#0F0F0F',
};
