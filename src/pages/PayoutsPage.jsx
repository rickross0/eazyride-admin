import React, { useState, useEffect } from 'react';
import client from '../api/client';

const statusColors = { PENDING: '#FF9500', PROCESSING: '#007AFF', COMPLETED: '#34C759', FAILED: '#FF3B30' };

const approvalLabels = { CARE: 'Staff', MANAGER: 'Manager', SUPER: 'Super Admin' };

function getApprovalTier(amount) {
  if (amount <= 200) return { level: 'CARE', label: 'Staff', color: '#34C759' };
  if (amount <= 1000) return { level: 'MANAGER', label: 'Manager', color: '#FF9500' };
  if (amount <= 1500) return { level: 'SUPER', label: 'Super Admin', color: '#FF3B30' };
  return { level: 'SUPER', label: 'Super Admin', color: '#FF3B30' };
}

export default function PayoutsPage() {
  const [payouts, setPayouts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [search, setSearch] = useState('');

  useEffect(() => {
    (async () => {
      try {
        const { data } = await client.get('/admin/payouts');
        setPayouts(data.payouts || []);
      } catch (e) {
        console.error('Fetch payouts error:', e);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const refresh = async () => {
    try {
      const { data } = await client.get('/admin/payouts');
      setPayouts(data.payouts || []);
    } catch (e) { console.error('Refresh error:', e); }
  };

  const markCompleted = async (id) => {
    try {
      await client.put(`/admin/payouts/${id}/complete`);
      await refresh();
    } catch (e) {
      const msg = e.response?.data?.error || 'Failed to approve payout';
      alert(msg);
    }
  };

  const rejectPayout = async (id) => {
    const reason = prompt('Reason for rejection (optional):');
    try {
      await client.put(`/admin/payouts/${id}/reject`, { reason: reason || '' });
      await refresh();
    } catch (e) {
      const msg = e.response?.data?.error || 'Failed to reject payout';
      alert(msg);
    }
  };

  const parseNotes = (notes) => {
    try { return JSON.parse(notes); } catch { return { method: notes || 'WALLET' }; }
  };

  const filtered = filter === 'all' ? payouts : payouts.filter((p) => p.status === filter);
  const summary = {
    total: payouts.reduce((s, p) => s + (p.amount || 0), 0),
    pending: payouts.filter((p) => p.status === 'PENDING').reduce((s, p) => s + (p.amount || 0), 0),
    completed: payouts.filter((p) => p.status === 'COMPLETED').reduce((s, p) => s + (p.amount || 0), 0),
    failed: payouts.filter((p) => p.status === 'FAILED').reduce((s, p) => s + (p.amount || 0), 0),
  };

  return (
    <div>
      <h1 style={styles.title}>Payouts & Withdrawals</h1>

      <div style={styles.statsGrid}>
        <div style={styles.statCard}><div style={{ ...styles.statValue, color: '#FFF' }}>${summary.total.toFixed(2)}</div><div style={styles.statLabel}>Total</div></div>
        <div style={styles.statCard}><div style={{ ...styles.statValue, color: '#FF9500' }}>${summary.pending.toFixed(2)}</div><div style={styles.statLabel}>Pending</div></div>
        <div style={styles.statCard}><div style={{ ...styles.statValue, color: '#34C759' }}>${summary.completed.toFixed(2)}</div><div style={styles.statLabel}>Completed</div></div>
        <div style={styles.statCard}><div style={{ ...styles.statValue, color: '#FF3B30' }}>${summary.failed.toFixed(2)}</div><div style={styles.statLabel}>Rejected</div></div>
      </div>

      <div style={styles.tierInfo}>
        <div style={styles.tierTitle}>Approval Tiers</div>
        <div style={styles.tierRow}>
          <span style={styles.tierItem}>≤$200: <strong>Staff</strong></span>
          <span style={styles.tierItem}>$200–$1000: <strong>Manager</strong></span>
          <span style={styles.tierItem}>$1000–$1500: <strong>Super Admin</strong></span>
          <span style={styles.tierItem}>&gt;$1500: <strong>Super Admin</strong></span>
        </div>
      </div>

      <div style={styles.tabRow}>
        {['all', 'PENDING', 'COMPLETED', 'FAILED'].map((f) => (
          <button key={f} onClick={() => setFilter(f)} style={{ ...styles.tabBtn, ...(filter === f && styles.tabActive) }}>
            {f === 'all' ? 'All' : f} {f !== 'all' && `(${payouts.filter((p) => p.status === f).length})`}
          </button>
        ))}
      </div>
      <div style={styles.searchRow}>
        <input
          style={styles.searchInput}
          placeholder="Search by driver, method, status..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {loading ? <p style={{ color: '#AAA' }}>Loading...</p> : (
        <div style={styles.tableWrap}>
          <table style={styles.table}>
            <thead><tr>
              <th style={styles.th}>User</th>
              <th style={styles.th}>Amount</th>
              <th style={styles.th}>Method</th>
              <th style={styles.th}>Approval</th>
              <th style={styles.th}>Status</th>
              <th style={styles.th}>Date</th>
              <th style={styles.th}>Actions</th>
            </tr></thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr><td colSpan={7} style={{ ...styles.td, textAlign: 'center' }}>No payouts found</td></tr>
              ) : filtered.filter((p) => {
                if (!search) return true;
                const q = search.toLowerCase();
                const user = p.user || {};
                return (user.firstName || '').toLowerCase().includes(q) || (user.lastName || '').toLowerCase().includes(q) || (user.phone || '').includes(q) || (p.status || '').toLowerCase().includes(q);
              }).map((p) => {
                const notes = parseNotes(p.notes);
                const tier = getApprovalTier(p.amount);
                return (
                  <tr key={p.id}>
                    <td style={styles.td}>{p.user ? `${p.user.firstName} ${p.user.lastName}` : '—'}<br/><span style={{ color: '#888', fontSize: 11 }}>{p.user?.phone || ''}</span></td>
                    <td style={{ ...styles.td, fontWeight: 700 }}>${(p.amount || 0).toFixed(2)}</td>
                    <td style={styles.td}>{notes.method === 'EVC' ? '📱 EVC' : notes.method === 'BANK' ? '🏦 Bank' : '💳 Wallet'}</td>
                    <td style={styles.td}>
                      <span style={{ background: tier.color + '22', color: tier.color, padding: '2px 8px', borderRadius: 12, fontSize: 12, fontWeight: 700 }}>
                        {tier.label}
                      </span>
                    </td>
                    <td style={styles.td}><span style={{ color: statusColors[p.status] || '#AAA', fontWeight: 700 }}>{p.status}</span></td>
                    <td style={styles.td}>{p.createdAt ? new Date(p.createdAt).toLocaleDateString() : '—'}</td>
                    <td style={styles.td}>
                      {p.status === 'PENDING' && (
                        <div style={{ display: 'flex', gap: 6 }}>
                          <button style={styles.approveBtn} onClick={() => markCompleted(p.id)}>✓ Approve</button>
                          <button style={styles.rejectBtn} onClick={() => rejectPayout(p.id)}>✗ Reject</button>
                        </div>
                      )}
                      {p.status === 'COMPLETED' && <span style={{ color: '#34C759', fontSize: 12 }}>Approved by {p.processedBy ? 'admin' : 'system'}</span>}
                      {p.status === 'FAILED' && <span style={{ color: '#FF3B30', fontSize: 12 }}>Rejected</span>}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

const styles = {
  title: { fontSize: 28, fontWeight: 800, color: '#FFF', marginBottom: 24 },
  statsGrid: { display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, marginBottom: 16 },
  statCard: { background: '#1A1A1A', borderRadius: 14, padding: 20 },
  statValue: { fontSize: 28, fontWeight: 800, marginBottom: 4 },
  statLabel: { color: '#AAA', fontSize: 12, textTransform: 'uppercase' },
  tierInfo: { background: '#1A1A1A', borderRadius: 14, padding: 16, marginBottom: 16 },
  tierTitle: { color: '#FFF', fontSize: 14, fontWeight: 700, marginBottom: 8 },
  tierRow: { display: 'flex', gap: 16, flexWrap: 'wrap' },
  tierItem: { color: '#AAA', fontSize: 13 },
  tabRow: { display: 'flex', gap: 8, marginBottom: 20 },
  tabBtn: { background: '#1A1A1A', color: '#AAA', border: '1px solid #2A2A2A', borderRadius: 20, padding: '6px 18px', cursor: 'pointer', fontWeight: 600, fontSize: 13 },
  tabActive: { background: '#0A8E4E', color: '#FFF', borderColor: '#0A8E4E' },
  tableWrap: { overflowX: 'auto' },
  table: { width: '100%', borderCollapse: 'collapse', background: '#1A1A1A', borderRadius: 14, overflow: 'hidden' },
  th: { textAlign: 'left', padding: '12px 16px', color: '#AAA', fontSize: 12, textTransform: 'uppercase', borderBottom: '1px solid #2A2A2A' },
  td: { padding: '12px 16px', borderBottom: '1px solid #2A2A2A', fontSize: 14, color: '#FFF' },
  approveBtn: { background: '#0A8E4E', color: '#FFF', border: 'none', borderRadius: 6, padding: '4px 12px', cursor: 'pointer', fontWeight: 700, fontSize: 12 },
  rejectBtn: { background: '#FF3B30', color: '#FFF', border: 'none', borderRadius: 6, padding: '4px 12px', cursor: 'pointer', fontWeight: 700, fontSize: 12 },
  searchRow: { marginBottom: 16 },
  searchInput: { width: '100%', background: '#1A1A1A', border: '1px solid #2A2A2A', borderRadius: 10, padding: '12px 16px', color: '#FFF', fontSize: 14, outline: 'none', boxSizing: 'border-box' },
};
