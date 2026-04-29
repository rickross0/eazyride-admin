import React, { useState, useEffect } from 'react';
import client from '../api/client';

export default function SosPage() {
  const [alerts, setAlerts] = useState([]);
  const [filter, setFilter] = useState('ALL');
  const [loading, setLoading] = useState(true);

  useEffect(() => { fetchAlerts(); }, [filter]);

  const fetchAlerts = async () => {
    setLoading(true);
    try {
      const status = filter === 'ALL' ? '' : `?status=${filter}`;
      const { data } = await client.get(`/admin/sos${status}`);
      setAlerts(data.alerts || []);
    } catch (e) { console.error('SOS fetch error:', e); }
    setLoading(false);
  };

  const resolve = async (id) => {
    try {
      await client.put(`/admin/sos/${id}/resolve`);
      fetchAlerts();
    } catch (e) { alert('Failed to resolve'); }
  };

  const formatTime = (iso) => {
    try { return new Date(iso).toLocaleString(); } catch { return iso; }
  };

  return (
    <div>
      <h1 style={styles.title}>🆘 SOS Alerts</h1>
      <div style={styles.filterRow}>
        {['ALL', 'ACTIVE', 'RESOLVED'].map((f) => (
          <button key={f} onClick={() => setFilter(f)} style={{ ...styles.filterBtn, ...(filter === f && styles.filterActive) }}>
            {f === 'ALL' ? 'All' : f}
          </button>
        ))}
      </div>

      {loading ? <p style={{ color: '#AAA' }}>Loading...</p> : alerts.length === 0 ? (
        <div style={styles.empty}>
          <p style={{ fontSize: 48 }}>🛡️</p>
          <p style={{ color: '#AAA', textAlign: 'center' }}>No SOS alerts. All clear!</p>
        </div>
      ) : (
        <div style={styles.alertList}>
          {alerts.map((a) => (
            <div key={a.id} style={{ ...styles.alertCard, borderLeftColor: a.status === 'ACTIVE' ? '#FF3B30' : '#34C759' }}>
              <div style={styles.alertHeader}>
                <div>
                  <span style={styles.alertName}>{a.user?.firstName} {a.user?.lastName}</span>
                  <span style={styles.alertPhone}>📞 {a.user?.phone}</span>
                </div>
                <div style={styles.alertMeta}>
                  <span style={{ ...styles.statusBadge, backgroundColor: a.status === 'ACTIVE' ? '#FF3B30' : '#34C759' }}>{a.status}</span>
                  <span style={styles.alertTime}>{formatTime(a.createdAt)}</span>
                </div>
              </div>

              <div style={styles.alertBody}>
                <div style={styles.alertRow}>
                  <span style={styles.alertLabel}>📍 Location</span>
                  <span style={styles.alertValue}>
                    {a.address || 'Unknown'}
                    {a.latitude && a.longitude && (
                      <a href={`https://maps.google.com/?q=${a.latitude},${a.longitude}`} target="_blank" style={{ color: '#0A8E4E', marginLeft: 8, fontSize: 12 }}>
                        Open Map ↗
                      </a>
                    )}
                  </span>
                </div>
                {a.rideId && (
                  <div style={styles.alertRow}>
                    <span style={styles.alertLabel}>🛺 Ride ID</span>
                    <span style={styles.alertValue}>{a.rideId.slice(0, 8)}...</span>
                  </div>
                )}
                {a.driverInfo && (
                  <div style={styles.alertRow}>
                    <span style={styles.alertLabel}>🚗 Driver</span>
                    <span style={styles.alertValue}>{a.driverInfo.name} • 📞 {a.driverInfo.phone} • {a.driverInfo.plate} ({a.driverInfo.vehicle})</span>
                  </div>
                )}
                {a.message && (
                  <div style={styles.alertRow}>
                    <span style={styles.alertLabel}>💬 Message</span>
                    <span style={styles.alertValue}>{a.message}</span>
                  </div>
                )}
                {a.resolvedAt && (
                  <div style={styles.alertRow}>
                    <span style={styles.alertLabel}>✅ Resolved</span>
                    <span style={styles.alertValue}>{formatTime(a.resolvedAt)}</span>
                  </div>
                )}
              </div>

              {a.status === 'ACTIVE' && (
                <div style={styles.alertActions}>
                  <button style={styles.resolveBtn} onClick={() => resolve(a.id)}>✓ Mark Resolved</button>
                  <a href={`tel:${a.user?.phone}`} style={styles.callBtn}>📞 Call Rider</a>
                  {a.driverInfo?.phone && <a href={`tel:${a.driverInfo.phone}`} style={styles.callBtn}>📞 Call Driver</a>}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

const styles = {
  title: { color: '#FFF', fontSize: 24, fontWeight: 800, marginBottom: 20 },
  filterRow: { display: 'flex', gap: 8, marginBottom: 20 },
  filterBtn: { padding: '8px 16px', borderRadius: 8, border: '1px solid #2A2A2A', background: '#1A1A1A', color: '#AAA', fontWeight: 600, cursor: 'pointer' },
  filterActive: { background: '#FF3B30', color: '#FFF', borderColor: '#FF3B30' },
  empty: { textAlign: 'center', marginTop: 60 },
  alertList: { display: 'flex', flexDirection: 'column', gap: 12 },
  alertCard: { background: '#1A1A1A', borderRadius: 12, padding: 16, borderLeft: '4px solid' },
  alertHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  alertName: { color: '#FFF', fontSize: 16, fontWeight: 700, marginRight: 12 },
  alertPhone: { color: '#AAA', fontSize: 13 },
  alertMeta: { display: 'flex', alignItems: 'center', gap: 8 },
  statusBadge: { color: '#FFF', fontSize: 11, fontWeight: 700, borderRadius: 8, padding: '4px 10px' },
  alertTime: { color: '#666', fontSize: 12 },
  alertBody: { marginBottom: 12 },
  alertRow: { display: 'flex', gap: 8, marginBottom: 6 },
  alertLabel: { color: '#666', fontSize: 12, fontWeight: 700, minWidth: 90 },
  alertValue: { color: '#DDD', fontSize: 13 },
  alertActions: { display: 'flex', gap: 8, borderTop: '1px solid #2A2A2A', paddingTop: 12 },
  resolveBtn: { background: '#34C759', color: '#FFF', border: 'none', borderRadius: 8, padding: '8px 16px', fontWeight: 700, cursor: 'pointer', fontSize: 13 },
  callBtn: { background: '#007AFF', color: '#FFF', border: 'none', borderRadius: 8, padding: '8px 16px', fontWeight: 700, cursor: 'pointer', fontSize: 13, textDecoration: 'none' },
};
