import React, { useState, useEffect } from 'react';
import client from '../api/client';

const rideStatusColors = {
  COMPLETED: '#34C759', CANCELLED: '#FF3B30', IN_PROGRESS: '#FF9500',
  DRIVER_ASSIGNED: '#007AFF', DRIVER_ARRIVING: '#5856D6', REQUESTED: '#AAA',
};

const orderStatusColors = {
  DELIVERED: '#34C759', CANCELLED: '#FF3B30', PENDING: '#FF9500',
  CONFIRMED: '#007AFF', PREPARING: '#5856D6', OUT_FOR_DELIVERY: '#FF9500',
};

export default function OrdersPage() {
  const [tab, setTab] = useState('rides');
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        const endpoint = tab === 'rides'
          ? `/admin/rides?limit=50${statusFilter ? '&status=' + statusFilter : ''}`
          : `/admin/orders?limit=50${statusFilter ? '&status=' + statusFilter : ''}`;
        const { data: res } = await client.get(endpoint);
        setData(tab === 'rides' ? res.rides || [] : res.orders || []);
      } catch (e) {
        console.error('Fetch error:', e);
      } finally {
        setLoading(false);
      }
    })();
  }, [tab, statusFilter]);

  const formatDate = (iso) => iso ? new Date(iso).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' }) : '—';

  const rideStatuses = ['REQUESTED', 'DRIVER_ASSIGNED', 'DRIVER_ARRIVING', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED'];
  const orderStatuses = ['PENDING', 'CONFIRMED', 'PREPARING', 'OUT_FOR_DELIVERY', 'DELIVERED', 'CANCELLED'];
  const statuses = tab === 'rides' ? rideStatuses : orderStatuses;

  return (
    <div>
      <h1 style={styles.title}>Rides & Orders</h1>
      <div style={styles.tabRow}>
        {['rides', 'food-orders'].map((t) => (
          <button key={t} onClick={() => { setTab(t); setStatusFilter(''); setLoading(true); }} style={{ ...styles.tabBtn, ...(tab === t && styles.tabActive) }}>
            {t === 'rides' ? '🛣️ Rides' : '🍔 Food Orders'}
          </button>
        ))}
      </div>
      <div style={styles.filterRow}>
        <select style={styles.select} value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
          <option value="">All Statuses</option>
          {statuses.map((s) => <option key={s} value={s}>{s.replace(/_/g, ' ')}</option>)}
        </select>
      </div>
      <div style={styles.searchRow}>
        <input
          style={styles.searchInput}
          placeholder={tab === 'rides' ? 'Search by rider, driver or status...' : 'Search by restaurant, status or items...'}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {loading ? <p style={{ color: '#AAA' }}>Loading...</p> : (
        <div style={styles.tableWrap}>
          {tab === 'rides' ? (
            <table style={styles.table}>
              <thead><tr><th style={styles.th}>ID</th><th style={styles.th}>Rider</th><th style={styles.th}>Driver</th><th style={styles.th}>Fare</th><th style={styles.th}>Distance</th><th style={styles.th}>Status</th><th style={styles.th}>Date</th></tr></thead>
              <tbody>
                {data.filter((r) => {
                  if (!search) return true;
                  const q = search.toLowerCase();
                  return (r.rider?.firstName || '').toLowerCase().includes(q) || (r.driver?.user?.firstName || '').toLowerCase().includes(q) || (r.status || '').toLowerCase().includes(q) || (r.id || '').toLowerCase().includes(q);
                }).map((r) => (
                  <tr key={r.id}>
                    <td style={styles.td} title={r.id}>{r.id?.slice(0, 8)}…</td>
                    <td style={styles.td}>{r.rider?.firstName} {r.rider?.lastName || ''}</td>
                    <td style={styles.td}>{r.driver?.user?.firstName || '—'}</td>
                    <td style={styles.td}>${(r.fare || 0).toFixed(2) || '—'}</td>
                    <td style={styles.td}>{(r.distance || 0).toFixed(1) || '—'} km</td>
                    <td style={styles.td}><span style={{ color: rideStatusColors[r.status] || '#AAA', fontWeight: 700 }}>{r.status?.replace(/_/g, ' ')}</span></td>
                    <td style={styles.td}>{formatDate(r.createdAt)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <table style={styles.table}>
              <thead><tr><th style={styles.th}>ID</th><th style={styles.th}>Restaurant</th><th style={styles.th}>Items</th><th style={styles.th}>Total</th><th style={styles.th}>Status</th><th style={styles.th}>Date</th></tr></thead>
              <tbody>
                {data.filter((o) => {
                  if (!search) return true;
                  const q = search.toLowerCase();
                  return (o.restaurant?.name || '').toLowerCase().includes(q) || (o.status || '').toLowerCase().includes(q) || (o.items || []).some((i) => (i.name || '').toLowerCase().includes(q));
                }).map((o) => (
                  <tr key={o.id}>
                    <td style={styles.td} title={o.id}>{o.id?.slice(0, 8)}…</td>
                    <td style={styles.td}>{o.restaurant?.name || '—'}</td>
                    <td style={styles.td}>{o.items?.length || 0} items</td>
                    <td style={styles.td}>${(o.totalAmount || 0).toFixed(2) || '—'}</td>
                    <td style={styles.td}><span style={{ color: orderStatusColors[o.status] || '#AAA', fontWeight: 700 }}>{o.status?.replace(/_/g, ' ')}</span></td>
                    <td style={styles.td}>{formatDate(o.createdAt)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}
    </div>
  );
}

const styles = {
  title: { fontSize: 28, fontWeight: 800, color: '#FFF', marginBottom: 24 },
  tabRow: { display: 'flex', gap: 8, marginBottom: 16 },
  tabBtn: { background: '#1A1A1A', color: '#AAA', border: '1px solid #2A2A2A', borderRadius: 20, padding: '8px 24px', cursor: 'pointer', fontWeight: 600, fontSize: 14 },
  tabActive: { background: '#0A8E4E', color: '#FFF', borderColor: '#0A8E4E' },
  filterRow: { marginBottom: 12 },
  select: { background: '#1A1A1A', border: '1px solid #2A2A2A', borderRadius: 10, padding: '10px 16px', color: '#FFF', fontSize: 14, outline: 'none', minWidth: 180 },
  searchRow: { marginBottom: 16 },
  searchInput: { width: '100%', background: '#1A1A1A', border: '1px solid #2A2A2A', borderRadius: 10, padding: '12px 16px', color: '#FFF', fontSize: 14, outline: 'none', boxSizing: 'border-box' },
  tableWrap: { overflowX: 'auto' },
  table: { width: '100%', borderCollapse: 'collapse', background: '#1A1A1A', borderRadius: 14, overflow: 'hidden' },
  th: { textAlign: 'left', padding: '12px 16px', color: '#AAA', fontSize: 12, textTransform: 'uppercase', borderBottom: '1px solid #2A2A2A' },
  td: { padding: '12px 16px', borderBottom: '1px solid #2A2A2A', fontSize: 14, color: '#FFF' },
};
