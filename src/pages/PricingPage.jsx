import React, { useState, useEffect } from 'react';
import client from '../api/client';

const defaultPricing = {
  BAJAJ: { baseFare: 0.50, perKmRate: 0.30, perMinuteRate: 0.05, minimumFare: 1.50 },
  CAR:   { baseFare: 1.00, perKmRate: 0.60, perMinuteRate: 0.10, minimumFare: 3.00 },
};

export default function PricingPage() {
  const [pricing, setPricing] = useState({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(null);

  useEffect(() => {
    (async () => {
      try {
        const { data } = await client.get('/admin/pricing');
        const map = {};
        (data.pricing || []).forEach((p) => {
          map[p.vehicleType] = p;
        });
        setPricing(map);
      } catch (e) {
        console.error('Fetch pricing error:', e);
        setPricing(defaultPricing);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const savePricing = async (vehicleType) => {
    setSaving(vehicleType);
    try {
      await client.post('/admin/commissions', { vehicleType, ...pricing[vehicleType] });
      alert(`${vehicleType} pricing saved`);
    } catch (e) {
      alert('Failed to save: ' + (e.response?.data?.error || e.message));
    } finally {
      setSaving(null);
    }
  };

  const updateField = (vehicleType, field, value) => {
    setPricing({
      ...pricing,
      [vehicleType]: {
        ...pricing[vehicleType],
        [field]: parseFloat(value) || 0,
      },
    });
  };

  if (loading) return <p style={{ color: '#AAA' }}>Loading pricing...</p>;

  const types = Object.keys(defaultPricing);

  return (
    <div>
      <h1 style={styles.title}>Vehicle Pricing</h1>
      <p style={styles.subtitle}>Set base fare, per-KM rate, and minimum fare for each vehicle type.</p>

      <div style={styles.grid}>
        {types.map((vt) => {
          const p = pricing[vt] || defaultPricing[vt];
          return (
            <div key={vt} style={styles.card}>
              <h2 style={styles.cardTitle}>{vt}</h2>
              <div style={styles.field}>
                <label style={styles.label}>Base Fare ($)</label>
                <input style={styles.input} type="number" step="0.01" value={p.baseFare} onChange={(e) => updateField(vt, 'baseFare', e.target.value)} />
              </div>
              <div style={styles.field}>
                <label style={styles.label}>Per KM Rate ($)</label>
                <input style={styles.input} type="number" step="0.01" value={p.perKmRate} onChange={(e) => updateField(vt, 'perKmRate', e.target.value)} />
              </div>
              <div style={styles.field}>
                <label style={styles.label}>Per Minute Rate ($)</label>
                <input style={styles.input} type="number" step="0.01" value={p.perMinuteRate} onChange={(e) => updateField(vt, 'perMinuteRate', e.target.value)} />
              </div>
              <div style={styles.field}>
                <label style={styles.label}>Minimum Fare ($)</label>
                <input style={styles.input} type="number" step="0.01" value={p.minimumFare} onChange={(e) => updateField(vt, 'minimumFare', e.target.value)} />
              </div>
              <button style={styles.saveBtn} onClick={() => savePricing(vt)} disabled={saving === vt}>
                {saving === vt ? 'Saving...' : `Save ${vt}`}
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}

const styles = {
  title: { fontSize: 28, fontWeight: 800, color: '#FFF', marginBottom: 4 },
  subtitle: { color: '#AAA', fontSize: 14, marginBottom: 24 },
  grid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 16 },
  card: { background: '#1A1A1A', borderRadius: 14, padding: 24 },
  cardTitle: { color: '#0A8E4E', fontSize: 18, fontWeight: 800, margin: '0 0 16px' },
  field: { marginBottom: 12 },
  label: { display: 'block', color: '#AAA', fontSize: 12, marginBottom: 4, textTransform: 'uppercase' },
  input: { width: '100%', boxSizing: 'border-box', background: '#0F0F0F', border: '1px solid #2A2A2A', borderRadius: 8, padding: 10, fontSize: 15, color: '#FFF', outline: 'none' },
  saveBtn: { width: '100%', background: '#0A8E4E', color: '#FFF', border: 'none', borderRadius: 8, padding: 12, fontSize: 15, fontWeight: 700, cursor: 'pointer', marginTop: 8 },
};
