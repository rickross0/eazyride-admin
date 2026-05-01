import React, { useState, useEffect } from 'react';
import client from '../api/client';

const CHART_COLORS = ['#0A8E4E', '#007AFF', '#FF9500', '#5856D6', '#FF3B30', '#AF52DE', '#00C7BE', '#FFD60A', '#FF6B6B', '#64D2FF'];

export default function ServiceStatsPage() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const { data } = await client.get('/admin/services/stats');
        setStats(data);
      } catch (e) {
        console.error('Fetch stats error:', e);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  if (loading) return <p style={{ color: '#AAA', padding: 40 }}>Loading...</p>;
  if (!stats) return <p style={{ color: '#FF3B30', padding: 40 }}>Failed to load stats</p>;

  const kpis = [
    { label: 'Total Users', value: stats.totalUsers ?? 0, trend: stats.usersTrend, color: '#0A8E4E', icon: '👥' },
    { label: 'Active Providers', value: stats.activeProviders ?? 0, trend: stats.providersTrend, color: '#007AFF', icon: '🔧' },
    { label: 'Total Revenue', value: `$${(stats.totalRevenue ?? 0).toLocaleString()}`, trend: stats.revenueTrend, color: '#FF9500', icon: '💰' },
    { label: 'Completed Requests', value: stats.completedRequests ?? 0, trend: stats.requestsTrend, color: '#34C759', icon: '✅' },
  ];

  const categories = stats.categoryBreakdown || [];
  const maxCategoryCount = Math.max(1, ...categories.map(c => c.count || 0));
  const alerts = stats.alerts || [];
  const recentActivity = stats.recentActivity || [];

  return (
    <div>
      <h1 style={styles.title}>Service Analytics</h1>

      {/* KPI Cards */}
      <div style={styles.kpiGrid}>
        {kpis.map(kpi => {
          const trendUp = kpi.trend > 0;
          const trendDown = kpi.trend < 0;
          return (
            <div key={kpi.label} style={{ ...styles.kpiCard, borderTopColor: kpi.color }}>
              <div style={styles.kpiIcon}>{kpi.icon}</div>
              <div style={{ ...styles.kpiValue, color: kpi.color }}>{kpi.value}</div>
              <div style={styles.kpiLabel}>{kpi.label}</div>
              {kpi.trend !== undefined && kpi.trend !== null && (
                <div style={{ ...styles.trend, color: trendUp ? '#34C759' : trendDown ? '#FF3B30' : '#AAA' }}>
                  {trendUp ? '↑' : trendDown ? '↓' : '→'} {Math.abs(kpi.trend)}%
                </div>
              )}
            </div>
          );
        })}
      </div>

      <div style={styles.twoCol}>
        {/* Category Breakdown */}
        <div style={styles.card}>
          <h3 style={styles.cardTitle}>📊 Category Breakdown</h3>
          {categories.length === 0 ? (
            <p style={{ color: '#AAA', fontSize: 14 }}>No category data available</p>
          ) : categories.map((cat, i) => (
            <div key={cat.id || i} style={styles.barRow}>
              <div style={styles.barLabelWrap}>
                <span style={{ marginRight: 8 }}>{cat.emoji || '📦'}</span>
                <span style={styles.barLabel}>{cat.name}</span>
                <span style={styles.barCount}>{cat.count}</span>
              </div>
              <div style={styles.barTrack}>
                <div style={{ ...styles.barFill, width: `${((cat.count || 0) / maxCategoryCount) * 100}%`, background: CHART_COLORS[i % CHART_COLORS.length] }} />
              </div>
            </div>
          ))}
        </div>

        {/* Alerts */}
        <div style={styles.card}>
          <h3 style={styles.cardTitle}>⚠️ Alerts</h3>
          {alerts.length === 0 ? (
            <p style={{ color: '#AAA', fontSize: 14 }}>No active alerts</p>
          ) : alerts.map((alert, i) => (
            <div key={i} style={{ ...styles.alertItem, borderLeftColor: alert.severity === 'critical' ? '#FF3B30' : alert.severity === 'warning' ? '#FF9500' : '#007AFF' }}>
              <div style={styles.alertMessage}>{alert.message}</div>
              <div style={styles.alertTime}>{alert.time || alert.createdAt || ''}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Recent Activity */}
      <div style={{ ...styles.card, marginTop: 16 }}>
        <h3 style={styles.cardTitle}>🕐 Recent Activity</h3>
        {recentActivity.length === 0 ? (
          <p style={{ color: '#AAA', fontSize: 14 }}>No recent activity</p>
        ) : (
          <div style={styles.activityList}>
            {recentActivity.map((item, i) => (
              <div key={i} style={styles.activityItem}>
                <div style={styles.activityIcon}>{item.icon || '📌'}</div>
                <div style={styles.activityContent}>
                  <div style={styles.activityText}>{item.description || item.message}</div>
                  <div style={styles.activityMeta}>{item.user ? `${item.user}` : ''} {item.timestamp || item.createdAt || ''}</div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

const styles = {
  title: { fontSize: 28, fontWeight: 800, color: '#FFF', marginBottom: 24 },
  // KPI
  kpiGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16, marginBottom: 24 },
  kpiCard: { background: '#1A1A1A', borderRadius: 14, padding: 24, borderTop: '4px solid' },
  kpiIcon: { fontSize: 28, marginBottom: 8 },
  kpiValue: { fontSize: 32, fontWeight: 800, marginBottom: 4 },
  kpiLabel: { color: '#AAA', fontSize: 13, textTransform: 'uppercase', letterSpacing: 1 },
  trend: { fontSize: 13, fontWeight: 700, marginTop: 6 },
  // Layout
  twoCol: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 },
  card: { background: '#1A1A1A', borderRadius: 14, padding: 24 },
  cardTitle: { fontSize: 18, fontWeight: 700, color: '#FFF', marginBottom: 16 },
  // Category bars
  barRow: { marginBottom: 14 },
  barLabelWrap: { display: 'flex', alignItems: 'center', marginBottom: 6 },
  barLabel: { color: '#FFF', fontSize: 14, fontWeight: 600, flex: 1 },
  barCount: { color: '#AAA', fontSize: 13, marginLeft: 8 },
  barTrack: { background: '#0F0F0F', borderRadius: 6, height: 8, overflow: 'hidden' },
  barFill: { height: '100%', borderRadius: 6, transition: 'width .3s ease', minWidth: 4 },
  // Alerts
  alertItem: { padding: '12px 16px', background: '#0F0F0F', borderRadius: 10, marginBottom: 8, borderLeft: '4px solid' },
  alertMessage: { color: '#FFF', fontSize: 14, fontWeight: 600 },
  alertTime: { color: '#666', fontSize: 12, marginTop: 4 },
  // Activity
  activityList: { display: 'flex', flexDirection: 'column', gap: 0 },
  activityItem: { display: 'flex', gap: 14, padding: '12px 0', borderBottom: '1px solid #2A2A2A' },
  activityIcon: { fontSize: 20, flexShrink: 0, width: 32, textAlign: 'center' },
  activityContent: { flex: 1 },
  activityText: { color: '#FFF', fontSize: 14 },
  activityMeta: { color: '#666', fontSize: 12, marginTop: 4 },
};
