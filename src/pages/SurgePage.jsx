import React, { useState, useEffect } from 'react';
import client from '../api/client';

export default function SurgePage() {
  const [zones, setZones] = useState([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({ name: '', centerLat: '', centerLng: '', radiusKm: 5, multiplier: 1.5, isActive: true });

  useEffect(() => {
    (async () => {
      try {
        const { data } = await client.get('/admin/surge-zones');
        setZones(data.zones || []);
      } catch (e) {
        console.error('Fetch surge zones error:', e);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const createZone = async (e) => {
    e.preventDefault();
    try {
      await client.post('/admin/surge-zones', {
        name: form.name,
        centerLat: parseFloat(form.centerLat),
        centerLng: parseFloat(form.centerLng),
        radiusKm: parseFloat(form.radiusKm),
        multiplier: parseFloat(form.multiplier),
        isActive: form.isActive,
      });
      const { data } = await client.get('/admin/surge-zones');
      setZones(data.zones || []);
      setForm({ name: '', centerLat: '', centerLng: '', radiusKm: 5, multiplier: 1.5, isActive: true });
    } catch (e) {
      alert('Failed to create zone: ' + (e.response?.data?.error || e.message));
    }
  };

  const toggleZone = async (id, isActive) => {
    try {
      await client.put(`/admin/surge-zones/${id}`, { isActive: !isActive });
      setZones(zones.map((z) => z.id === id ? { ...z, isActive: !isActive } : z));
    } catch (e) {
      alert('Failed to toggle zone');
    }
  };

  const deleteZone = async (id) => {
    if (!confirm('Delete this surge zone?')) return;
    try {
      await client.delete(`/admin/surge-zones/${id}`);
      setZones(zones.filter((z) => z.id !== id));
    } catch (e) {
      alert('Failed to delete zone');
    }
  };

  return (
    <div>
      <h1 style={styles.title}>Surge Pricing Control</h1>
      <p style={styles.subtitle}>Create and manage surge zones. When a ride request falls within a zone, the fare is multiplied by the zone's multiplier.</p>

      <form onSubmit={createZone} style={styles.formCard}>
        <h2 style={styles.formTitle}>New Surge Zone</h2>
        <div style={styles.formRow}>
          <div style={styles.field}>
            <label style={styles.label}>Zone Name</label>
            <input style={styles.input} value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="e.g. Mogadishu Downtown" required />
          </div>
          <div style={styles.field}>
            <label style={styles.label}>Center Latitude</label>
            <input style={styles.input} type="number" step="0.0001" value={form.centerLat} onChange={(e) => setForm({ ...form, centerLat: e.target.value })} placeholder="2.0465" required />
          </div>
          <div style={styles.field}>
            <label style={styles.label}>Center Longitude</label>
            <input style={styles.input} type="number" step="0.0001" value={form.centerLng} onChange={(e) => setForm({ ...form, centerLng: e.target.value })} placeholder="45.3418" required />
          </div>
        </div>
        <div style={styles.formRow}>
          <div style={styles.field}>
            <label style={styles.label}>Radius (km)</label>
            <input style={styles.input} type="number" step="0.5" value={form.radiusKm} onChange={(e) => setForm({ ...form, radiusKm: e.target.value })} />
          </div>
          <div style={styles.field}>
            <label style={styles.label}>Multiplier (e.g. 1.5 = 50% surge)</label>
            <input style={styles.input} type="number" step="0.1" value={form.multiplier} onChange={(e) => setForm({ ...form, multiplier: e.target.value })} />
          </div>
          <div style={styles.field}>
            <label style={styles.label}>
              <input type="checkbox" checked={form.isActive} onChange={(e) => setForm({ ...form, isActive: e.target.checked })} style={{ marginRight: 6 }} />
              Active
            </label>
          </div>
        </div>
        <button style={styles.submitBtn} type="submit">Create Zone</button>
      </form>

      {loading ? <p style={{ color: '#AAA' }}>Loading zones...</p> : (
        <div style={styles.tableWrap}>
          <table style={styles.table}>
            <thead><tr><th style={styles.th}>Name</th><th style={styles.th}>Center</th><th style={styles.th}>Radius</th><th style={styles.th}>Multiplier</th><th style={styles.th}>Status</th><th style={styles.th}>Actions</th></tr></thead>
            <tbody>
              {zones.length === 0 ? (
                <tr><td colSpan={6} style={{ ...styles.td, textAlign: 'center' }}>No surge zones configured</td></tr>
              ) : zones.map((z) => (
                <tr key={z.id}>
                  <td style={styles.td}>{z.name}</td>
                  <td style={styles.td}>{(z.centerLat || 0).toFixed(4)}, {(z.centerLng || 0).toFixed(4)}</td>
                  <td style={styles.td}>{z.radiusKm} km</td>
                  <td style={styles.td}><span style={{ color: '#FF9500', fontWeight: 800 }}>{z.multiplier}x</span></td>
                  <td style={styles.td}><span style={{ color: z.isActive ? '#34C759' : '#AAA', cursor: 'pointer' }} onClick={() => toggleZone(z.id, z.isActive)}>{z.isActive ? 'Active' : 'Inactive'}</span></td>
                  <td style={styles.td}><button style={styles.delBtn} onClick={() => deleteZone(z.id)}>Delete</button></td>
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
  title: { fontSize: 28, fontWeight: 800, color: '#FFF', marginBottom: 4 },
  subtitle: { color: '#AAA', fontSize: 14, marginBottom: 24 },
  formCard: { background: '#1A1A1A', borderRadius: 14, padding: 24, marginBottom: 24 },
  formTitle: { color: '#FFF', fontSize: 18, fontWeight: 700, margin: '0 0 16px' },
  formRow: { display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12, marginBottom: 12 },
  field: { display: 'flex', flexDirection: 'column' },
  label: { color: '#AAA', fontSize: 12, marginBottom: 4, textTransform: 'uppercase' },
  input: { background: '#0F0F0F', border: '1px solid #2A2A2A', borderRadius: 8, padding: 10, fontSize: 15, color: '#FFF', outline: 'none' },
  submitBtn: { background: '#0A8E4E', color: '#FFF', border: 'none', borderRadius: 8, padding: 12, fontSize: 15, fontWeight: 700, cursor: 'pointer', marginTop: 8 },
  tableWrap: { overflowX: 'auto' },
  table: { width: '100%', borderCollapse: 'collapse', background: '#1A1A1A', borderRadius: 14, overflow: 'hidden' },
  th: { textAlign: 'left', padding: '12px 16px', color: '#AAA', fontSize: 12, textTransform: 'uppercase', borderBottom: '1px solid #2A2A2A' },
  td: { padding: '12px 16px', borderBottom: '1px solid #2A2A2A', fontSize: 14, color: '#FFF' },
  delBtn: { background: '#FF3B30', color: '#FFF', border: 'none', borderRadius: 6, padding: '4px 12px', cursor: 'pointer', fontWeight: 700, fontSize: 12 },
};
