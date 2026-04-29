import React, { useState, useEffect } from 'react';
import client from '../api/client';

export default function ProviderEarningsPage() {
  const [providers, setProviders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    (async () => {
      try {
        const { data } = await client.get('/admin/provider-earnings');
        setProviders(data.providers || []);
      } catch (e) {
        console.error('Fetch provider earnings error:', e);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const totalProviders = providers.length;
  const totalRevenue = providers.reduce((s, p) => s + (p.totalRevenue || 0), 0);
  const totalDeposits = providers.reduce((s, p) => s + (p.totalDeposits || 0), 0);

  return (
    <div>
      <h1 style={styles.title}>Provider Earnings</h1>

      <div style={styles.statsGrid}>
        <div style={styles.statCard}>
          <div style={{ ...styles.statValue, color: '#0A8E4E' }}>{totalProviders}</div>
          <div style={styles.statLabel}>Total Providers</div>
        </div>
        <div style={styles.statCard}>
          <div style={{ ...styles.statValue, color: '#FFF' }}>${totalRevenue.toFixed(2)}</div>
          <div style={styles.statLabel}>Total Revenue</div>
        </div>
        <div style={styles.statCard}>
          <div style={{ ...styles.statValue, color: '#FF9500' }}>${totalDeposits.toFixed(2)}</div>
          <div style={styles.statLabel}>Total Deposits</div>
        </div>
      </div>
      <div style={styles.searchRow}>
        <input
          style={styles.searchInput}
          placeholder="Search by business name, contact or phone..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {loading ? (
        <p style={{ color: '#AAA' }}>Loading...</p>
      ) : (
        <div style={styles.tableWrap}>
          <table style={styles.table}>
            <thead>
              <tr>
                <th style={styles.th}>Business Name</th>
                <th style={styles.th}>Contact</th>
                <th style={styles.th}>Reservations</th>
                <th style={styles.th}>Revenue</th>
                <th style={styles.th}>Deposits Held</th>
                <th style={styles.th}>Commission %</th>
                <th style={styles.th}>Commission Earned</th>
              </tr>
            </thead>
            <tbody>
              {providers.length === 0 ? (
                <tr><td colSpan={7} style={{ ...styles.td, textAlign: 'center' }}>No providers found</td></tr>
              ) : providers.filter((p) => {
                if (!search) return true;
                const q = search.toLowerCase();
                return (p.businessName || '').toLowerCase().includes(q) || (p.user?.firstName || '').toLowerCase().includes(q) || (p.user?.lastName || '').toLowerCase().includes(q) || (p.user?.phone || '').toLowerCase().includes(q);
              }).map((p) => (
                <tr key={p.id}>
                  <td style={styles.td}>{p.businessName}</td>
                  <td style={styles.td}>{p.user?.firstName} {p.user?.lastName} <span style={{ color: '#AAA', fontSize: 12 }}>({p.user?.phone})</span></td>
                  <td style={styles.td}>{(p.totalReservations || 0)}</td>
                  <td style={styles.td}>${(p.totalRevenue || 0).toFixed(2)}</td>
                  <td style={styles.td}>${(p.totalDeposits || 0).toFixed(2)}</td>
                  <td style={styles.td}>{p.commissionRate ?? 0}%</td>
                  <td style={{ ...styles.td, color: '#0A8E4E', fontWeight: 700 }}>
                    ${((p.totalRevenue || 0) * ((p.commissionRate || 0) / 100)).toFixed(2)}
                  </td>
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
  statsGrid: { display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12, marginBottom: 24 },
  statCard: { background: '#1A1A1A', borderRadius: 14, padding: 20 },
  statValue: { fontSize: 28, fontWeight: 800, marginBottom: 4 },
  statLabel: { color: '#AAA', fontSize: 12, textTransform: 'uppercase' },
  tableWrap: { overflowX: 'auto' },
  table: { width: '100%', borderCollapse: 'collapse', background: '#1A1A1A', borderRadius: 14, overflow: 'hidden' },
  th: { textAlign: 'left', padding: '12px 16px', color: '#AAA', fontSize: 12, textTransform: 'uppercase', borderBottom: '1px solid #2A2A2A' },
  td: { padding: '12px 16px', borderBottom: '1px solid #2A2A2A', fontSize: 14, color: '#FFF' },
  searchRow: { marginBottom: 16 },
  searchInput: { width: '100%', background: '#1A1A1A', border: '1px solid #2A2A2A', borderRadius: 10, padding: '12px 16px', color: '#FFF', fontSize: 14, outline: 'none', boxSizing: 'border-box' },
};
