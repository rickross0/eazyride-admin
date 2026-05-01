import React, { useState, useEffect } from 'react';
import client from '../api/client';

export default function CarsPage() {
  const [cars, setCars] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    (async () => {
      try {
        const { data } = await client.get('/admin/cars?limit=50');
        setCars(data.cars || []);
      } catch (e) {
        console.error('Fetch cars error:', e);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const toggleVerified = async (id, isVerified) => {
    try {
      await client.put(`/admin/cars/${id}/verify`);
      setCars(cars.map((c) => c.id === id ? { ...c, isVerified: !isVerified } : c));
    } catch (e) {
      alert('Failed to update car');
    }
  };

  return (
    <div>
      <h1 style={styles.title}>Car Rental Fleet</h1>
      <div style={styles.searchRow}>
        <input
          style={styles.searchInput}
          placeholder="Search by brand, model or plate number..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>
      {loading ? <p style={{ color: '#AAA' }}>Loading...</p> : cars.length === 0 ? (
        <div style={styles.empty}><p style={{ color: '#AAA', textAlign: 'center', marginTop: 40 }}>No cars listed yet.</p></div>
      ) : (
        <div style={styles.tableWrap}>
          <table style={styles.table}>
            <thead><tr><th style={styles.th}>Car</th><th style={styles.th}>Plate</th><th style={styles.th}>$/Day</th><th style={styles.th}>Deposit</th><th style={styles.th}>Verified</th><th style={styles.th}>Available</th><th style={styles.th}>Action</th></tr></thead>
            <tbody>
              {cars.filter((c) => {
                if (!search) return true;
                const q = search.toLowerCase();
                return (c.brand || '').toLowerCase().includes(q) || (c.model || '').toLowerCase().includes(q) || (c.plateNumber || '').toLowerCase().includes(q);
              }).map((c) => (
                <tr key={c.id}>
                  <td style={styles.td}>{c.brand} {c.model} ({c.year})</td>
                  <td style={styles.td}>{c.plateNumber}</td>
                  <td style={styles.td}>${(c.pricePerDay || 0).toFixed(2)}</td>
                  <td style={styles.td}>${(c.depositAmount || 0).toFixed(2)}</td>
                  <td style={styles.td}><span style={{ color: c.isVerified ? '#34C759' : '#FF9500' }}>{c.isVerified ? 'Yes' : 'No'}</span></td>
                  <td style={styles.td}><span style={{ color: c.isAvailable ? '#34C759' : '#FF3B30' }}>{c.isAvailable ? 'Yes' : 'No'}</span></td>
                  <td style={styles.td}>{!c.isVerified && <button style={styles.approveBtn} onClick={() => toggleVerified(c.id, c.isVerified)}>Verify</button>}</td>
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
  empty: { background: '#1A1A1A', borderRadius: 14, padding: 40 },
  tableWrap: { overflowX: 'auto' },
  table: { width: '100%', borderCollapse: 'collapse', background: '#1A1A1A', borderRadius: 14, overflow: 'hidden' },
  th: { textAlign: 'left', padding: '12px 16px', color: '#AAA', fontSize: 12, textTransform: 'uppercase', borderBottom: '1px solid #2A2A2A' },
  td: { padding: '12px 16px', borderBottom: '1px solid #2A2A2A', fontSize: 14, color: '#FFF' },
  approveBtn: { background: '#0A8E4E', color: '#FFF', border: 'none', borderRadius: 6, padding: '4px 12px', cursor: 'pointer', fontWeight: 700, fontSize: 12 },
  searchRow: { marginBottom: 16 },
  searchInput: { width: '100%', background: '#1A1A1A', border: '1px solid #2A2A2A', borderRadius: 10, padding: '12px 16px', color: '#FFF', fontSize: 14, outline: 'none', boxSizing: 'border-box' },
};
