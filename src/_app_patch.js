const fs = require('fs');
let content = fs.readFileSync('App.jsx', 'utf8');

// Add new imports after SosPage import
content = content.replace(
  "import SosPage from './pages/SosPage';",
  `import SosPage from './pages/SosPage';
import ServiceCategoriesPage from './pages/ServiceCategoriesPage';
import ServiceListingsPage from './pages/ServiceListingsPage';
import ServiceRequestsPage from './pages/ServiceRequestsPage';
import ServiceProvidersPage from './pages/ServiceProvidersPage';
import ServiceStatsPage from './pages/ServiceStatsPage';`
);

// Add nav items to leftNavItems (before settings)
content = content.replace(
  "{ to: '/settings', label: 'Settings', icon: '\\u2699\\uFE0F', minLevel: 'SUPER' },",
  `{ to: '/service-categories', label: 'Service Categories', icon: '🔧', minLevel: 'MANAGER' },
  { to: '/service-listings', label: 'Service Listings', icon: '📋', minLevel: 'MANAGER' },
  { to: '/service-requests', label: 'Service Requests', icon: '📝', minLevel: 'CARE' },
  { to: '/service-stats', label: 'Service Analytics', icon: '📊', minLevel: 'MANAGER' },
  { to: '/settings', label: 'Settings', icon: '\\u2699\\uFE0F', minLevel: 'SUPER' },`
);

// Add to rightNavItems
content = content.replace(
  "{ to: '/provider-earnings', label: 'Earnings', icon: '\\uD83D\\uDCB5', minLevel: 'MANAGER' },",
  `{ to: '/provider-earnings', label: 'Earnings', icon: '\\uD83D\\uDCB5', minLevel: 'MANAGER' },
  { to: '/service-providers', label: 'Service Providers', icon: '\\uD83D\\uDC68\\u200D\\uD83D\\uDCBC', minLevel: 'MANAGER' },`
);

// Add routes before the catch-all route
content = content.replace(
  "<Route path=\"/settings\" element={<PrivateRoute><Layout><SettingsPage /></Layout></PrivateRoute>} />",
  `<Route path="/settings" element={<PrivateRoute><Layout><SettingsPage /></Layout></PrivateRoute>} />
      <Route path="/service-categories" element={<PrivateRoute><Layout><ServiceCategoriesPage /></Layout></PrivateRoute>} />
      <Route path="/service-listings" element={<PrivateRoute><Layout><ServiceListingsPage /></Layout></PrivateRoute>} />
      <Route path="/service-requests" element={<PrivateRoute><Layout><ServiceRequestsPage /></Layout></PrivateRoute>} />
      <Route path="/service-providers" element={<PrivateRoute><Layout><ServiceProvidersPage /></Layout></PrivateRoute>} />
      <Route path="/service-stats" element={<PrivateRoute><Layout><ServiceStatsPage /></Layout></PrivateRoute>} />`
);

fs.writeFileSync('App.jsx', content);
console.log('Patched App.jsx');
