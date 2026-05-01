import React, { useState, useEffect } from 'react';
import { NavLink } from 'react-router-dom';
import client from '../api/client';

export default function DashboardPage() {
  const [stats, setStats] = useState({ users: 0, drivers: 0, rides: 0, orders: 0, providers: 0, activeDrivers: 0, revenue: 0 });
  const [onlineDrivers, setOnlineDrivers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const [usersRes, driversRes, ridesRes, ordersRes, providersRes, onlineRes] = await Promise.all([
          client.get('/admin/users?limit=1').catch(() => ({ data: { data: { total: 0 } } })),
          client.get('/admin/drivers?limit=1').catch(() => ({ data: { data: { total: 0 } } })),
          client.get('/admin/rides?limit=1').catch(() => ({ data: { data: { total: 0 } } })),
          client.get('/admin/orders?limit=1').catch(() => ({ data: { data: { total: 0 } } })),
          client.get('/admin/providers').catch(() => ({ data: { data: { providers: [] } } })),
          client.get('/admin/online-drivers').catch(() => ({ data: { data: { drivers: [] } } })),
        ]);
        const ud = usersRes.data?.data || usersRes.data || {};
        const dd = driversRes.data?.data || driversRes.data || {};
        const rd = ridesRes.data?.data || ridesRes.data || {};
        const od = ordersRes.data?.data || ordersRes.data || {};
        const pd = providersRes.data?.data || providersRes.data || {};
        const nd = onlineRes.data?.data || onlineRes.data || {};
        setStats({
          users: ud.total || 0,
          drivers: dd.total || 0,
          rides: rd.total || 0,
          orders: od.total || 0,
          providers: (pd.providers || []).length,
          activeDrivers: (nd.drivers || []).length,
        });
        setOnlineDrivers(nd.drivers || []);
      } catch (e) {
        console.error('Dashboard stats error:', e);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const cards = [
    { label: 'Total Users', value: stats.users, color: '#0A8E4E' },
    { label: 'Drivers', value: stats.drivers, color: '#34C759' },
    { label: 'Active Now', value: stats.activeDrivers, color: '#00C7BE' },
    { label: 'Rides', value: stats.rides, color: '#FF9500' },
    { label: 'Orders', value: stats.orders, color: '#007AFF' },
    { label: 'Providers', value: stats.providers, color: '#AF52DE' },
  ];

  return (
    <div>
      <h1 style={styles.title}>Dashboard</h1>
      {loading ? (
        <p style={{ color: '#AAA' }}>Loading...</p>
      ) : (
        <>
          <div style={styles.grid}>
            {cards.map((c) => (
              <div key={c.label} style={{ ...styles.statCard, borderTopColor: c.color }}>
                <div style={styles.statIcon}>{c.icon}</div>
                <div style={{ ...styles.statValue, color: c.color }}>{c.value}</div>
                <div style={styles.statLabel}>{c.label}</div>
              </div>
            ))}
          </div>

          {onlineDrivers.length > 0 && (
            <div style={styles.section}>
              <h2 style={styles.sectionTitle}>🟢 Online Drivers ({onlineDrivers.length})</h2>
              <div style={styles.tableWrap}>
                <table style={styles.table}>
                  <thead><tr>
                    <th style={styles.th}>Name</th>
                    <th style={styles.th}>Phone</th>
                    <th style={styles.th}>Vehicle</th>
                    <th style={styles.th}>Plate</th>
                    <th style={styles.th}>Rating</th>
                  </tr></thead>
                  <tbody>
                    {onlineDrivers.map((d) => (
                      <tr key={d.id}>
                        <td style={styles.td}>{d.user?.firstName} {d.user?.lastName}</td>
                        <td style={styles.td}>{d.user?.phone}</td>
                        <td style={styles.td}>{d.vehicleType}</td>
                        <td style={styles.td}>{d.plateNumber}</td>
                        <td style={styles.td}>{(d.avgRating || 0).toFixed(1) || '—'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          <div style={{ ...styles.section, marginTop: 16 }}>
            <h2 style={styles.sectionTitle}>Quick Links</h2>
            <div style={styles.linkGrid}>
              <NavLink to="/users" style={styles.link}>👥 Users & Drivers</NavLink>
              <NavLink to="/providers" style={styles.link}>🚗 Providers</NavLink>
              <NavLink to="/rides" style={styles.link}>🛣️ Rides</NavLink>
              <NavLink to="/orders" style={styles.link}>📦 Orders</NavLink>
              <NavLink to="/restaurants" style={styles.link}>🍔 Restaurants</NavLink>
              <NavLink to="/reports" style={styles.link}>📈 Reports</NavLink>
              <NavLink to="/lottery" style={styles.link}>🎰 Lottery</NavLink>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

const styles = {
  title: { fontSize: 28, fontWeight: 800, color: '#FFF', marginBottom: 24 },
  grid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 16, marginBottom: 32 },
  statCard: { background: '#1A1A1A', borderRadius: 14, padding: 24, borderTop: '4px solid' },
  statIcon: { fontSize: 28, marginBottom: 8 },
  statValue: { fontSize: 36, fontWeight: 800, marginBottom: 4 },
  statLabel: { color: '#AAA', fontSize: 14 },
  section: { background: '#1A1A1A', borderRadius: 14, padding: 24 },
  sectionTitle: { fontSize: 18, fontWeight: 700, color: '#FFF', marginBottom: 16 },
  tableWrap: { overflowX: 'auto' },
  table: { width: '100%', borderCollapse: 'collapse' },
  th: { textAlign: 'left', padding: '12px 16px', color: '#AAA', fontSize: 12, textTransform: 'uppercase', borderBottom: '1px solid #2A2A2A' },
  td: { padding: '12px 16px', borderBottom: '1px solid #2A2A2A', fontSize: 14, color: '#FFF' },
  linkGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 12 },
  link: { display: 'block', background: '#0F0F0F', border: '1px solid #2A2A2A', borderRadius: 10, padding: 16, color: '#0A8E4E', textDecoration: 'none', fontWeight: 600, textAlign: 'center' },
};
