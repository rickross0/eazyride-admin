import React, { useState, useEffect } from 'react';
import client from '../api/client';

export default function DriversMapPage() {
  const [drivers, setDrivers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedDriver, setSelectedDriver] = useState(null);

  useEffect(() => {
    fetchDrivers();
    const interval = setInterval(fetchDrivers, 15000); // Refresh every 15s
    return () => clearInterval(interval);
  }, []);

  const fetchDrivers = async () => {
    try {
      const { data } = await client.get('/admin/online-drivers');
      setDrivers(data.drivers || []);
    } catch (e) {
      console.error('Fetch drivers error:', e);
    } finally {
      setLoading(false);
    }
  };

  const onlineDrivers = drivers.filter(d => d.isOnline);
  const offlineDrivers = drivers.filter(d => !d.isOnline);

  if (loading) return <div style={{ color: '#AAA', padding: 40 }}>Loading drivers...</div>;

  return (
    <div>
      <h1 style={styles.title}>Active Drivers</h1>

      <div style={styles.statsRow}>
        <div style={styles.statCard}>
          <div style={{ ...styles.statValue, color: '#34C759' }}>{onlineDrivers.length}</div>
          <div style={styles.statLabel}>Online Now</div>
        </div>
        <div style={styles.statCard}>
          <div style={{ ...styles.statValue, color: '#666' }}>{offlineDrivers.length}</div>
          <div style={styles.statLabel}>Offline</div>
        </div>
        <div style={styles.statCard}>
          <div style={{ ...styles.statValue, color: '#0A8E4E' }}>{drivers.length}</div>
          <div style={styles.statLabel}>Total Drivers</div>
        </div>
      </div>

      <div style={styles.section}>
        <h2 style={styles.sectionTitle}>Online Drivers ({onlineDrivers.length})</h2>
        {onlineDrivers.length === 0 ? (
          <div style={styles.empty}>No drivers currently online</div>
        ) : (
          <div style={styles.tableWrap}>
            <table style={styles.table}>
              <thead>
                <tr>
                  <th style={styles.th}>Driver</th>
                  <th style={styles.th}>Phone</th>
                  <th style={styles.th}>Vehicle</th>
                  <th style={styles.th}>Plate</th>
                  <th style={styles.th}>Rating</th>
                  <th style={styles.th}>Rides</th>
                  <th style={styles.th}>Location</th>
                  <th style={styles.th}>Can Deliver</th>
                </tr>
              </thead>
              <tbody>
                {onlineDrivers.map((d) => (
                  <tr key={d.id} style={selectedDriver?.id === d.id ? styles.selectedRow : {}} onClick={() => setSelectedDriver(d)}>
                    <td style={styles.td}>
                      <span style={styles.onlineDot}>🟢</span>
                      {d.user?.firstName} {d.user?.lastName}
                    </td>
                    <td style={styles.td}>{d.user?.phone}</td>
                    <td style={styles.td}>{d.vehicleType}</td>
                    <td style={styles.td}>{d.plateNumber}</td>
                    <td style={styles.td}>{(d.avgRating || 0).toFixed(1) || '—'}</td>
                    <td style={styles.td}>{d.totalRides}</td>
                    <td style={styles.td}>
                      {d.user?.latitude && d.user?.longitude
                        ? `${d.user.latitude?.toFixed(4) || "—"}, ${d.user.longitude?.toFixed(4) || "—"}`
                        : '—'}
                    </td>
                    <td style={styles.td}>{d.canDeliver ? '✅' : '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {selectedDriver && (
        <div style={styles.detailCard}>
          <h3 style={styles.detailTitle}>Driver Details</h3>
          <div style={styles.detailGrid}>
            <div><span style={styles.detailLabel}>ID:</span> {selectedDriver.id?.slice(0, 8)}</div>
            <div><span style={styles.detailLabel}>Name:</span> {selectedDriver.user?.firstName} {selectedDriver.user?.lastName}</div>
            <div><span style={styles.detailLabel}>Phone:</span> {selectedDriver.user?.phone}</div>
            <div><span style={styles.detailLabel}>Vehicle:</span> {selectedDriver.vehicleType}</div>
            <div><span style={styles.detailLabel}>Plate:</span> {selectedDriver.plateNumber}</div>
            <div><span style={styles.detailLabel}>Rating:</span> {selectedDriver.avgRating?.toFixed(1) || '—'}</div>
            <div><span style={styles.detailLabel}>Total Rides:</span> {selectedDriver.totalRides}</div>
            <div><span style={styles.detailLabel}>Earnings:</span> ${selectedDriver.totalEarnings?.toFixed(2) || '0.00'}</div>
            <div><span style={styles.detailLabel}>Can Deliver:</span> {selectedDriver.canDeliver ? 'Yes' : 'No'}</div>
            <div><span style={styles.detailLabel}>Approved:</span> {selectedDriver.isApproved ? '✅' : '❌'}</div>
          </div>
        </div>
      )}

      <div style={{ ...styles.section, marginTop: 24 }}>
        <h2 style={styles.sectionTitle}>Offline Drivers ({offlineDrivers.length})</h2>
        {offlineDrivers.length === 0 ? (
          <div style={styles.empty}>No offline drivers</div>
        ) : (
          <div style={styles.tableWrap}>
            <table style={styles.table}>
              <thead>
                <tr>
                  <th style={styles.th}>Driver</th>
                  <th style={styles.th}>Phone</th>
                  <th style={styles.th}>Vehicle</th>
                  <th style={styles.th}>Plate</th>
                  <th style={styles.th}>Approved</th>
                </tr>
              </thead>
              <tbody>
                {offlineDrivers.map((d) => (
                  <tr key={d.id}>
                    <td style={styles.td}>{d.user?.firstName} {d.user?.lastName}</td>
                    <td style={styles.td}>{d.user?.phone}</td>
                    <td style={styles.td}>{d.vehicleType}</td>
                    <td style={styles.td}>{d.plateNumber}</td>
                    <td style={styles.td}>{d.isApproved ? '✅' : '❌'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

const styles = {
  title: { fontSize: 28, fontWeight: 800, color: '#FFF', marginBottom: 24 },
  statsRow: { display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16, marginBottom: 32 },
  statCard: { background: '#1A1A1A', borderRadius: 14, padding: 24, borderTop: '4px solid #2A2A2A' },
  statValue: { fontSize: 36, fontWeight: 800, marginBottom: 4 },
  statLabel: { color: '#AAA', fontSize: 14 },
  section: { background: '#1A1A1A', borderRadius: 14, padding: 24 },
  sectionTitle: { fontSize: 18, fontWeight: 700, color: '#FFF', marginBottom: 16 },
  tableWrap: { overflowX: 'auto' },
  table: { width: '100%', borderCollapse: 'collapse' },
  th: { textAlign: 'left', padding: '12px 16px', color: '#AAA', fontSize: 12, textTransform: 'uppercase', borderBottom: '1px solid #2A2A2A' },
  td: { padding: '12px 16px', borderBottom: '1px solid #2A2A2A', fontSize: 14, color: '#FFF' },
  onlineDot: { marginRight: 6 },
  empty: { color: '#666', textAlign: 'center', padding: 32 },
  selectedRow: { background: '#0A8E4E22' },
  detailCard: { background: '#1A1A1A', borderRadius: 14, padding: 24, marginTop: 24 },
  detailTitle: { fontSize: 16, fontWeight: 700, color: '#0A8E4E', marginBottom: 12 },
  detailGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 12 },
  detailLabel: { color: '#AAA', fontSize: 12, fontWeight: 600 },
};
