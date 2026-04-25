import React, { useState, useEffect } from 'react';
import client from '../api/client';

const ACTION_COLORS = {
  CREATE_STAFF: '#34C759',
  UPDATE_STAFF_ROLE: '#007AFF',
  DEACTIVATE_STAFF: '#FF3B30',
  ACTIVATE_USER: '#34C759',
  SUSPEND_USER: '#FF3B30',
  APPROVE_DRIVER: '#34C759',
  MASTER_LOGIN: '#FF9500',
  UPDATE_API_SETTING: '#AF52DE',
  DELETE_API_SETTING: '#FF3B30',
  TEST_WAAFI_PAY: '#FF9500',
};

export default function StaffActivityPage() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({ adminId: '', action: '', entity: '', startDate: '', endDate: '' });
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const fetchLogs = async (p = 1) => {
    try {
      const params = new URLSearchParams({ page: p, limit: 50 });
      if (filters.adminId) params.set('adminId', filters.adminId);
      if (filters.action) params.set('action', filters.action);
      if (filters.entity) params.set('entity', filters.entity);
      if (filters.startDate) params.set('startDate', filters.startDate);
      if (filters.endDate) params.set('endDate', filters.endDate);
      const { data } = await client.get(`/admin/activity-log?${params.toString()}`);
      setLogs(data.logs || []);
      setTotalPages(data.pages || 1);
    } catch (e) {
      console.error('Fetch activity log error:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchLogs(page); }, [page]);

  const handleFilter = (e) => {
    e.preventDefault();
    setPage(1);
    fetchLogs(1);
  };

  if (loading) return <p style={{ color: '#AAA' }}>Loading activity log...</p>;

  return (
    <div>
      <h1 style={styles.title}>Staff Activity Log</h1>
      <p style={styles.subtitle}>Track all actions performed by admin staff.</p>

      <form onSubmit={handleFilter} style={styles.filterCard}>
        <div style={styles.filterGrid}>
          <select style={styles.select} value={filters.action} onChange={(e) => setFilters({ ...filters, action: e.target.value })}>
            <option value="">All Actions</option>
            <option value="CREATE_STAFF">Create Staff</option>
            <option value="UPDATE_STAFF_ROLE">Update Role</option>
            <option value="DEACTIVATE_STAFF">Deactivate Staff</option>
            <option value="SUSPEND_USER">Suspend User</option>
            <option value="ACTIVATE_USER">Activate User</option>
            <option value="APPROVE_DRIVER">Approve Driver</option>
            <option value="MASTER_LOGIN">Master Login</option>
            <option value="UPDATE_API_SETTING">Update API Setting</option>
            <option value="TEST_WAAFI_PAY">Test WaafiPay</option>
          </select>
          <select style={styles.select} value={filters.entity} onChange={(e) => setFilters({ ...filters, entity: e.target.value })}>
            <option value="">All Entities</option>
            <option value="User">User</option>
            <option value="DriverProfile">Driver</option>
            <option value="ApiSetting">API Setting</option>
          </select>
          <input type="date" style={styles.dateInput} value={filters.startDate} onChange={(e) => setFilters({ ...filters, startDate: e.target.value })} placeholder="From" />
          <input type="date" style={styles.dateInput} value={filters.endDate} onChange={(e) => setFilters({ ...filters, endDate: e.target.value })} placeholder="To" />
          <button type="submit" style={styles.filterBtn}>Filter</button>
          <button type="button" style={styles.clearBtn} onClick={() => { setFilters({ adminId: '', action: '', entity: '', startDate: '', endDate: '' }); setPage(1); fetchLogs(1); }}>Clear</button>
        </div>
      </form>

      <div style={styles.tableWrap}>
        <table style={styles.table}>
          <thead><tr>
            <th style={styles.th}>Time</th>
            <th style={styles.th}>Admin</th>
            <th style={styles.th}>Level</th>
            <th style={styles.th}>Action</th>
            <th style={styles.th}>Entity</th>
            <th style={styles.th}>Details</th>
          </tr></thead>
          <tbody>
            {logs.length === 0 ? (
              <tr><td colSpan={6} style={{ ...styles.td, textAlign: 'center', padding: 40, color: '#666' }}>No activity logs found</td></tr>
            ) : logs.map((log) => {
              const color = ACTION_COLORS[log.action] || '#AAA';
              return (
                <tr key={log.id}>
                  <td style={styles.td}>{new Date(log.createdAt).toLocaleString()}</td>
                  <td style={styles.td}>{log.admin?.firstName} {log.admin?.lastName}</td>
                  <td style={styles.td}><span style={{ ...styles.badge, color: log.admin?.adminLevel === 'SUPER' ? '#FF9500' : log.admin?.adminLevel === 'MANAGER' ? '#007AFF' : '#34C759' }}>{log.admin?.adminLevel || '—'}</span></td>
                  <td style={styles.td}><span style={{ ...styles.actionBadge, background: color + '22', color }}>{log.action}</span></td>
                  <td style={styles.td}>{log.entity || '—'}</td>
                  <td style={{ ...styles.td, maxWidth: 300, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{log.details || '—'}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {totalPages > 1 && (
        <div style={styles.pagination}>
          <button style={styles.pageBtn} disabled={page <= 1} onClick={() => setPage(page - 1)}>← Prev</button>
          <span style={styles.pageInfo}>Page {page} of {totalPages}</span>
          <button style={styles.pageBtn} disabled={page >= totalPages} onClick={() => setPage(page + 1)}>Next →</button>
        </div>
      )}
    </div>
  );
}

const styles = {
  title: { fontSize: 28, fontWeight: 800, color: '#FFF', marginBottom: 4 },
  subtitle: { color: '#AAA', fontSize: 14, marginBottom: 24 },
  filterCard: { background: '#1A1A1A', borderRadius: 14, padding: 20, marginBottom: 24 },
  filterGrid: { display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'center' },
  select: { background: '#0F0F0F', border: '1px solid #2A2A2A', borderRadius: 8, padding: '10px 14px', fontSize: 14, color: '#FFF', outline: 'none' },
  dateInput: { background: '#0F0F0F', border: '1px solid #2A2A2A', borderRadius: 8, padding: '10px 14px', fontSize: 14, color: '#FFF', outline: 'none', colorScheme: 'dark' },
  filterBtn: { background: '#0A8E4E', color: '#FFF', border: 'none', borderRadius: 8, padding: '10px 20px', fontWeight: 700, cursor: 'pointer', fontSize: 14 },
  clearBtn: { background: '#2A2A2A', color: '#AAA', border: 'none', borderRadius: 8, padding: '10px 20px', fontWeight: 700, cursor: 'pointer', fontSize: 14 },
  tableWrap: { overflowX: 'auto' },
  table: { width: '100%', borderCollapse: 'collapse', background: '#1A1A1A', borderRadius: 14, overflow: 'hidden' },
  th: { textAlign: 'left', padding: '12px 16px', color: '#AAA', fontSize: 12, textTransform: 'uppercase', borderBottom: '1px solid #2A2A2A' },
  td: { padding: '12px 16px', borderBottom: '1px solid #2A2A2A', fontSize: 14, color: '#FFF' },
  badge: { fontWeight: 700, fontSize: 12 },
  actionBadge: { padding: '3px 10px', borderRadius: 12, fontSize: 11, fontWeight: 700, letterSpacing: 0.5 },
  pagination: { display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 16, marginTop: 24 },
  pageBtn: { background: '#1A1A1A', border: '1px solid #2A2A2A', color: '#FFF', borderRadius: 8, padding: '8px 16px', cursor: 'pointer', fontWeight: 700 },
  pageInfo: { color: '#AAA', fontSize: 14 },
};
