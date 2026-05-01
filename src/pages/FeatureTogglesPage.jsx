import React, { useState, useEffect } from 'react';
import client from '../api/client';

export default function FeatureTogglesPage() {
  const [toggles, setToggles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(null);
  const [newFeature, setNewFeature] = useState('');
  const [newDescription, setNewDescription] = useState('');

  useEffect(() => {
    (async () => {
      try {
        const { data } = await client.get('/admin/features');
        setToggles(data.toggles || []);
      } catch (e) {
        console.error('Fetch features error:', e);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const toggleFeature = async (feature, isEnabled) => {
    setSaving(feature);
    try {
      const { data } = await client.post('/admin/features', { feature, isEnabled: !isEnabled });
      setToggles(toggles.map((t) => t.feature === feature ? { ...t, isEnabled: !isEnabled } : t));
    } catch (e) {
      alert('Failed to toggle feature: ' + (e.response?.data?.error || e.message));
    } finally {
      setSaving(null);
    }
  };

  const addFeature = async (e) => {
    e.preventDefault();
    if (!newFeature.trim()) return;
    setSaving(newFeature);
    try {
      await client.post('/admin/features', { feature: newFeature.trim(), isEnabled: false, description: newDescription.trim() });
      const { data } = await client.get('/admin/features');
      setToggles(data.toggles || []);
      setNewFeature('');
      setNewDescription('');
    } catch (e) {
      alert('Failed to add feature: ' + (e.response?.data?.error || e.message));
    } finally {
      setSaving(null);
    }
  };

  if (loading) return <p style={{ color: '#AAA' }}>Loading features...</p>;

  return (
    <div>
      <h1 style={styles.title}>Feature Toggles</h1>
      <p style={styles.subtitle}>Enable or disable platform features. Changes take effect immediately.</p>

      <form onSubmit={addFeature} style={styles.formCard}>
        <h3 style={styles.formTitle}>Add New Feature</h3>
        <div style={styles.formRow}>
          <input style={styles.input} placeholder="Feature key (e.g. car_rental)" value={newFeature} onChange={(e) => setNewFeature(e.target.value)} required />
          <input style={styles.input} placeholder="Description (optional)" value={newDescription} onChange={(e) => setNewDescription(e.target.value)} />
          <button style={styles.addBtn} type="submit" disabled={saving === newFeature}>Add Feature</button>
        </div>
      </form>

      <div style={styles.grid}>
        {toggles.length === 0 ? (
          <div style={styles.empty}>
            <p style={{ color: '#AAA', textAlign: 'center' }}>No feature toggles configured yet.</p>
          </div>
        ) : toggles.map((t) => (
          <div key={t.feature} style={styles.card}>
            <div style={styles.cardHeader}>
              <div>
                <div style={styles.featureName}>{t.feature.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())}</div>
                {t.description && <div style={styles.featureDesc}>{t.description}</div>}
              </div>
              <button
                style={{ ...styles.toggleBtn, ...(t.isEnabled ? styles.toggleOn : styles.toggleOff) }}
                onClick={() => toggleFeature(t.feature, t.isEnabled)}
                disabled={saving === t.feature}
              >
                {saving === t.feature ? '...' : t.isEnabled ? 'ON' : 'OFF'}
              </button>
            </div>
            <div style={styles.cardMeta}>
              Last updated: {t.updatedAt ? new Date(t.updatedAt).toLocaleString() : '—'}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

const styles = {
  title: { fontSize: 28, fontWeight: 800, color: '#FFF', marginBottom: 4 },
  subtitle: { color: '#AAA', fontSize: 14, marginBottom: 24 },
  formCard: { background: '#1A1A1A', borderRadius: 14, padding: 24, marginBottom: 24 },
  formTitle: { color: '#FFF', fontSize: 16, fontWeight: 700, margin: '0 0 12px' },
  formRow: { display: 'flex', gap: 12, alignItems: 'center' },
  input: { flex: 1, background: '#0F0F0F', border: '1px solid #2A2A2A', borderRadius: 8, padding: '10px 14px', fontSize: 14, color: '#FFF', outline: 'none' },
  addBtn: { background: '#0A8E4E', color: '#FFF', border: 'none', borderRadius: 8, padding: '10px 20px', fontWeight: 700, cursor: 'pointer', fontSize: 14 },
  grid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 12 },
  card: { background: '#1A1A1A', borderRadius: 14, padding: 20 },
  cardHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
  featureName: { color: '#FFF', fontSize: 16, fontWeight: 700 },
  featureDesc: { color: '#AAA', fontSize: 13, marginTop: 4 },
  toggleBtn: { border: 'none', borderRadius: 8, padding: '8px 20px', fontWeight: 800, fontSize: 13, cursor: 'pointer', letterSpacing: 1 },
  toggleOn: { background: '#0A8E4E', color: '#FFF' },
  toggleOff: { background: '#2A2A2A', color: '#AAA' },
  cardMeta: { color: '#666', fontSize: 12, marginTop: 12 },
  empty: { background: '#1A1A1A', borderRadius: 14, padding: 40, gridColumn: '1 / -1' },
};
