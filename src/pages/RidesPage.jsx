import React, { useState, useEffect } from 'react';
import client from '../api/client';

const statusColors = {
  COMPLETED: '#34C759', CANCELLED: '#FF3B30', IN_PROGRESS: '#FF9500',
  DRIVER_ASSIGNED: '#007AFF', DRIVER_ARRIVING: '#5856D6', REQUESTED: '#AAA',
};

export default function RidesPage() {
  const [rides, setRides] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  useEffect(() => {
    (async () => {
      try {
        const { data } = await client.get(`/admin/rides?limit=50${statusFilter ? '&status=' + statusFilter : ''}`);
        setRides(data.rides || []);
      } catch (e) {
        console.error('Fetch rides error:', e);
      } finally {
        setLoading(false);
      }
    })();
  }, [statusFilter]);

  const statuses = ['REQUESTED', 'DRIVER_ASSIGNED', 'DRIVER_ARRIVING', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED'];

  return (
    <div>
      <h1 style={styles.title}>Rides</h1>
      <div style={styles.filterRow}>
        <select style={styles.select} value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
          <option value="">All Statuses</option>
          {statuses.map((s) => <option key={s} value={s}>{s.replace(/_/g, ' ')}</option>)}
        </select>
      </div>
      <div style={styles.searchRow}>
        <input style={styles.searchInput} placeholder="Search by rider, driver, status, or ID…" value={search} onChange={(e) => setSearch(e.target.value)} />
      </div>
      {loading ? <p style={{ color: '#AAA' }}>Loading...</p> : (
        <div style={styles.tableWrap}>
          <table style={styles.table}>
            <thead><tr><th style={styles.th}>ID</th><th style={styles.th}>Rider</th><th style={styles.th}>Driver</th><th style={styles.th}>Vehicle</th><th style={styles.th}>Fare</th><th style={styles.th}>Distance</th><th style={styles.th}>Status</th><th style={styles.th}>Date</th></tr></thead>
            <tbody>
              {rides.filter((r) => {
                const q = search.toLowerCase();
                return !q || (r.rider?.firstName || '').toLowerCase().includes(q) || (r.driver?.user?.firstName || '').toLowerCase().includes(q) || (r.status || '').toLowerCase().includes(q) || (r.id || '').toLowerCase().includes(q);
              }).map((r) => (
                <tr key={r.id}>
                  <td style={styles.td} title={r.id}>{r.id?.slice(0, 8)}…</td>
                  <td style={styles.td}>{r.rider?.firstName} {r.rider?.lastName || ''}</td>
                  <td style={styles.td}>{r.driver?.user?.firstName || '—'}</td>
                  <td style={styles.td}><span style={styles.badge}>{r.vehicleType || '—'}</span></td>
                  <td style={styles.td}>${(r.fare || 0).toFixed(2) || '—'}</td>
                  <td style={styles.td}>{(r.distance || 0).toFixed(1) || '—'} km</td>
                  <td style={styles.td}><span style={{ color: statusColors[r.status] || '#AAA', fontWeight: 700 }}>{r.status?.replace(/_/g, ' ')}</span></td>
                  <td style={styles.td}>{new Date(r.createdAt).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' })}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

const styles = {
  title: { fontSize: 28, fontWeight: 800, color: '#FFF', marginBottom: 24 },
  filterRow: { marginBottom: 12 },
  select: { background: '#1A1A1A', border: '1px solid #2A2A2A', borderRadius: 10, padding: '10px 16px', color: '#FFF', fontSize: 14, outline: 'none', minWidth: 180 },
  searchRow: { marginBottom: 16 },
  searchInput: { width: '100%', background: '#1A1A1A', border: '1px solid #2A2A2A', borderRadius: 10, padding: '12px 16px', color: '#FFF', fontSize: 14, outline: 'none', boxSizing: 'border-box' },
  tableWrap: { overflowX: 'auto' },
  table: { width: '100%', borderCollapse: 'collapse', background: '#1A1A1A', borderRadius: 14, overflow: 'hidden' },
  th: { textAlign: 'left', padding: '12px 16px', color: '#AAA', fontSize: 12, textTransform: 'uppercase', borderBottom: '1px solid #2A2A2A' },
  td: { padding: '12px 16px', borderBottom: '1px solid #2A2A2A', fontSize: 14, color: '#FFF' },
  badge: { background: '#2A2A2A', padding: '2px 8px', borderRadius: 6, fontSize: 12, fontWeight: 700 },
};
