import React, { useState, useEffect } from 'react';
import client from '../api/client';

export default function ReportsPage() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const { data } = await client.get('/admin/reports');
        setData(data);
      } catch (e) {
        console.error('Fetch report data error:', e);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const exportPDF = () => {
    const from = data?.from || '';
    const to = data?.to || '';
    const params = new URLSearchParams();
    if (from) params.set('from', from);
    if (to) params.set('to', to);
    window.open('/api/v1/admin/reports/pdf?' + params.toString(), '_blank');
  };

  const exportCSV = () => {
    if (!data) return;
    const rows = [['Date', 'Rides', 'Orders']];
    const rideMap = {};
    const orderMap = {};
    (data.dailyRides || []).forEach((d) => { rideMap[d.date instanceof Date ? d.date.toISOString().slice(0, 10) : String(d.date).slice(0, 10)] = d.count; });
    (data.dailyOrders || []).forEach((d) => { orderMap[d.date instanceof Date ? d.date.toISOString().slice(0, 10) : String(d.date).slice(0, 10)] = d.count; });
    const allDates = [...new Set([...Object.keys(rideMap), ...Object.keys(orderMap)])].sort();
    allDates.forEach((date) => {
      rows.push([date, rideMap[date] || 0, orderMap[date] || 0]);
    });
    const csv = rows.map((r) => r.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'eazyride_report.csv';
    a.click();
    URL.revokeObjectURL(url);
  };

  if (loading) return <p style={{ color: '#AAA' }}>Loading...</p>;
  if (!data) return <p style={{ color: '#FF3B30' }}>Failed to load report data</p>;

  const totalRevenue = (data.rideRevenue || 0) + (data.foodRevenue || 0);
  const maxDaily = Math.max(
    1,
    ...(data.dailyRides || []).map((d) => d.count),
    ...(data.dailyOrders || []).map((d) => d.count),
  );

  const rideMap = {};
  const orderMap = {};
  (data.dailyRides || []).forEach((d) => { rideMap[String(d.date).slice(0, 10)] = d.count; });
  (data.dailyOrders || []).forEach((d) => { orderMap[String(d.date).slice(0, 10)] = d.count; });
  const allDates = [...new Set([...Object.keys(rideMap), ...Object.keys(orderMap)])].sort();

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <h1 style={styles.title}>Reports &amp; Analytics</h1>
        <div style={{ display: 'flex', gap: 8 }}>
        <button onClick={exportCSV} style={styles.exportBtn}>Export CSV</button>
        <button onClick={exportPDF} style={{ ...styles.exportBtn, background: '#FF9500' }}>Export PDF</button>
      </div>
      </div>

      <div style={styles.statsGrid}>
        <div style={styles.statCard}>
          <div style={{ ...styles.statValue, color: '#0A8E4E' }}>${(data.rideRevenue || 0).toFixed(2)}</div>
          <div style={styles.statLabel}>Rides Revenue</div>
        </div>
        <div style={styles.statCard}>
          <div style={{ ...styles.statValue, color: '#FF9500' }}>${(data.foodRevenue || 0).toFixed(2)}</div>
          <div style={styles.statLabel}>Food Revenue</div>
        </div>
        <div style={styles.statCard}>
          <div style={{ ...styles.statValue, color: '#FFF' }}>${totalRevenue.toFixed(2)}</div>
          <div style={styles.statLabel}>Total Revenue</div>
        </div>
      </div>

      <div style={styles.tablesRow}>
        <div style={styles.tableContainer}>
          <h3 style={styles.subTitle}>Rides by Status</h3>
          <table style={styles.table}>
            <thead><tr><th style={styles.th}>Status</th><th style={styles.th}>Count</th></tr></thead>
            <tbody>
              {(data.rideStats || []).length === 0 ? (
                <tr><td colSpan={2} style={{ ...styles.td, textAlign: 'center' }}>No data</td></tr>
              ) : data.rideStats.map((r, i) => (
                <tr key={i}><td style={styles.td}>{r.status}</td><td style={styles.td}>{r.count}</td></tr>
              ))}
            </tbody>
          </table>
        </div>
        <div style={styles.tableContainer}>
          <h3 style={styles.subTitle}>Orders by Status</h3>
          <table style={styles.table}>
            <thead><tr><th style={styles.th}>Status</th><th style={styles.th}>Count</th></tr></thead>
            <tbody>
              {(data.orderStats || []).length === 0 ? (
                <tr><td colSpan={2} style={{ ...styles.td, textAlign: 'center' }}>No data</td></tr>
              ) : data.orderStats.map((o, i) => (
                <tr key={i}><td style={styles.td}>{o.status}</td><td style={styles.td}>{o.count}</td></tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div style={{ marginTop: 32 }}>
        <h3 style={styles.subTitle}>30-Day Activity</h3>
        <div style={styles.chartContainer}>
          {allDates.length === 0 ? (
            <p style={{ color: '#AAA' }}>No activity in the last 30 days</p>
          ) : (
            allDates.map((date) => (
              <div key={date} style={styles.barGroup}>
                <div style={styles.barRow}>
                  <div style={{ ...styles.bar, height: ((rideMap[date] || 0) / maxDaily) * 100, background: '#0A8E4E' }} />
                  <div style={{ ...styles.bar, height: ((orderMap[date] || 0) / maxDaily) * 100, background: '#FF9500' }} />
                </div>
                <div style={styles.barLabel}>{date.slice(5)}</div>
              </div>
            ))
          )}
        </div>
        <div style={styles.legend}>
          <span style={styles.legendItem}><span style={{ ...styles.legendDot, background: '#0A8E4E' }} /> Rides</span>
          <span style={styles.legendItem}><span style={{ ...styles.legendDot, background: '#FF9500' }} /> Orders</span>
        </div>
      </div>
    </div>
  );
}

const styles = {
  title: { fontSize: 28, fontWeight: 800, color: '#FFF', margin: 0 },
  exportBtn: { background: '#0A8E4E', color: '#FFF', border: 'none', borderRadius: 8, padding: '10px 20px', cursor: 'pointer', fontWeight: 700, fontSize: 13 },
  statsGrid: { display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12, marginBottom: 24 },
  statCard: { background: '#1A1A1A', borderRadius: 14, padding: 20 },
  statValue: { fontSize: 28, fontWeight: 800, marginBottom: 4 },
  statLabel: { color: '#AAA', fontSize: 12, textTransform: 'uppercase' },
  tablesRow: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 8 },
  tableContainer: { background: '#1A1A1A', borderRadius: 14, padding: 20 },
  subTitle: { fontSize: 16, fontWeight: 700, color: '#FFF', marginBottom: 12 },
  table: { width: '100%', borderCollapse: 'collapse' },
  th: { textAlign: 'left', padding: '10px 12px', color: '#AAA', fontSize: 12, textTransform: 'uppercase', borderBottom: '1px solid #2A2A2A' },
  td: { padding: '10px 12px', borderBottom: '1px solid #2A2A2A', fontSize: 14, color: '#FFF' },
  chartContainer: { display: 'flex', gap: 4, alignItems: 'flex-end', height: 180, background: '#1A1A1A', borderRadius: 14, padding: '16px 12px 8px', overflowX: 'auto' },
  barGroup: { display: 'flex', flexDirection: 'column', alignItems: 'center', flex: '1 0 20px', minWidth: 20 },
  barRow: { display: 'flex', gap: 2, alignItems: 'flex-end', height: 140 },
  bar: { width: 8, minHeight: 2, borderRadius: 3, transition: 'height .2s' },
  barLabel: { color: '#666', fontSize: 9, marginTop: 4, textAlign: 'center' },
  legend: { display: 'flex', gap: 20, marginTop: 12, justifyContent: 'center' },
  legendItem: { color: '#AAA', fontSize: 12, display: 'flex', alignItems: 'center', gap: 6 },
  legendDot: { width: 10, height: 10, borderRadius: 3, display: 'inline-block' },
};
