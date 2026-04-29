import React, { useState, useEffect } from 'react';
import client from '../api/client';

const CATEGORIES = [
  'CAR_RENTAL', 'HANDYMAN', 'WATER_TRUCK', 'ELECTRICIAN', 'PLUMBER',
  'CARPENTER', 'PAINTER', 'CLEANING', 'MOVING', 'TOWING', 'LAUNDRY', 'CATERING', 'OTHER',
];

export default function ProvidersPage() {
  const [providers, setProviders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    (async () => {
      try {
        const { data } = await client.get('/admin/providers');
        setProviders(data.providers || []);
      } catch (e) {
        console.error('Fetch providers error:', e);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const approveProvider = async (id) => {
    try {
      await client.put(`/admin/providers/${id}/approve`);
      setProviders(providers.map((p) => p.id === id ? { ...p, isVerified: true } : p));
    } catch (e) {
      alert('Failed to approve provider');
    }
  };

  const setCommission = async (id, rate) => {
    try {
      await client.put(`/admin/providers/${id}/commission`, { commissionRate: parseFloat(rate) });
      setProviders(providers.map((p) => p.id === id ? { ...p, commissionRate: parseFloat(rate) } : p));
    } catch (e) {
      alert('Failed to set commission');
    }
  };

  const updateCategory = async (id, category) => {
    try {
      await client.put(`/admin/providers/${id}/category`, { providerType: category });
      setProviders(providers.map((p) => p.id === id ? { ...p, category } : p));
    } catch (e) {
      alert('Failed to update category: ' + (e.response?.data?.error || 'Error'));
    }
  };

  return (
    <div>
      <h1 style={styles.title}>Car Rental Providers</h1>
      <div style={styles.searchRow}>
        <input style={styles.searchInput} placeholder="Search by business name, contact, or phone…" value={search} onChange={(e) => setSearch(e.target.value)} />
      </div>
      {loading ? <p style={{ color: '#AAA' }}>Loading...</p> : providers.length === 0 ? (
        <div style={styles.empty}>
          <p style={{ color: '#AAA', textAlign: 'center', marginTop: 40 }}>No providers registered yet.</p>
        </div>
      ) : (
        <div style={styles.tableWrap}>
          <table style={styles.table}>
            <thead><tr>
              <th style={styles.th}>Business Name</th>
              <th style={styles.th}>Contact</th>
              <th style={styles.th}>Phone</th>
              <th style={styles.th}>Category</th>
              <th style={styles.th}>Commission</th>
              <th style={styles.th}>Verified</th>
              <th style={styles.th}>Action</th>
            </tr></thead>
            <tbody>
              {providers.filter((p) => {
                const q = search.toLowerCase();
                return !q || p.businessName?.toLowerCase().includes(q) || p.user?.firstName?.toLowerCase().includes(q) || p.user?.lastName?.toLowerCase().includes(q) || p.user?.phone?.toLowerCase().includes(q);
              }).map((p) => (
                <tr key={p.id}>
                  <td style={styles.td}>{p.businessName || p.user?.firstName}</td>
                  <td style={styles.td}>{p.user?.firstName} {p.user?.lastName}</td>
                  <td style={styles.td}>{p.user?.phone}</td>
                  <td style={styles.td}>
                    <select
                      style={styles.catSelect}
                      value={p.category || p.providerType || 'OTHER'}
                      onChange={(e) => updateCategory(p.id, e.target.value)}
                    >
                      {CATEGORIES.map((cat) => (
                        <option key={cat} value={cat}>{cat.replace(/_/g, ' ')}</option>
                      ))}
                    </select>
                  </td>
                  <td style={styles.td}><input type="number" step="0.5" value={p.commissionRate ?? 15} onChange={(e) => setCommission(p.id, e.target.value)} style={styles.commInput} />%</td>
                  <td style={styles.td}><span style={{ color: p.isVerified ? '#34C759' : '#FF9500' }}>{p.isVerified ? 'Verified' : 'Pending'}</span></td>
                  <td style={styles.td}>{!p.isVerified && <button style={styles.successBtn} onClick={() => approveProvider(p.id)}>Approve</button>}</td>
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
  searchRow: { marginBottom: 16 },
  searchInput: { width: '100%', background: '#1A1A1A', border: '1px solid #2A2A2A', borderRadius: 10, padding: '12px 16px', color: '#FFF', fontSize: 14, outline: 'none', boxSizing: 'border-box' },
  tableWrap: { overflowX: 'auto' },
  table: { width: '100%', borderCollapse: 'collapse', background: '#1A1A1A', borderRadius: 14, overflow: 'hidden' },
  th: { textAlign: 'left', padding: '12px 16px', color: '#AAA', fontSize: 12, textTransform: 'uppercase', borderBottom: '1px solid #2A2A2A' },
  td: { padding: '12px 16px', borderBottom: '1px solid #2A2A2A', fontSize: 14, color: '#FFF' },
  successBtn: { background: '#0A8E4E', color: '#FFF', border: 'none', borderRadius: 8, padding: '6px 14px', cursor: 'pointer', fontWeight: 700, fontSize: 13 },
  commInput: { width: 60, background: '#0F0F0F', border: '1px solid #2A2A2A', borderRadius: 6, padding: '4px 8px', color: '#FFF', fontSize: 14, textAlign: 'center' },
  catSelect: { background: '#0F0F0F', border: '1px solid #2A2A2A', borderRadius: 6, padding: '4px 8px', color: '#FFF', fontSize: 13, cursor: 'pointer' },
  empty: { background: '#1A1A1A', borderRadius: 14, padding: 40, textAlign: 'center' },
};
