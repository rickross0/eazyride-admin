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

function DetailModal({ log, onClose }) {
  if (!log) return null;
  const color = ACTION_COLORS[log.action] || '#AAA';

  const fields = [
    { label: 'Action', value: log.action, badge: true, color },
    { label: 'Admin', value: `${log.admin?.firstName} ${log.admin?.lastName}` },
    { label: 'Admin Level', value: log.admin?.adminLevel },
    { label: 'Admin Phone', value: log.admin?.phone },
    { label: 'Entity', value: log.entity || '—' },
    { label: 'Entity ID', value: log.entityId || '—', mono: true },
    { label: 'Time', value: new Date(log.createdAt).toLocaleString() },
    { label: 'Time (UTC)', value: new Date(log.createdAt).toISOString() },
  ];

  return (
    <div style={modalStyles.overlay} onClick={onClose}>
      <div style={modalStyles.card} onClick={(e) => e.stopPropagation()}>
        <div style={modalStyles.header}>
          <h2 style={modalStyles.title}>Activity Detail</h2>
          <button style={modalStyles.closeBtn} onClick={onClose}>✕</button>
        </div>
        <div style={modalStyles.body}>
          {fields.map(({ label, value, badge, color: c, mono }) => (
            <div key={label} style={modalStyles.fieldRow}>
              <div style={modalStyles.fieldLabel}>{label}</div>
              <div style={modalStyles.fieldValue}>
                {badge ? (
                  <span style={{ ...styles.actionBadge, background: (c || '#AAA') + '22', color: c || '#AAA' }}>{value}</span>
                ) : (
                  <span style={mono ? modalStyles.mono : {}}>{value || '—'}</span>
                )}
              </div>
            </div>
          ))}
          <div style={modalStyles.detailSection}>
            <div style={modalStyles.fieldLabel}>Details</div>
            <div style={modalStyles.detailContent}>
              {log.details ? (
                <pre style={modalStyles.pre}>{typeof log.details === 'string' ? (() => {
                  try { return JSON.stringify(JSON.parse(log.details), null, 2); } catch { return log.details; }
                })() : JSON.stringify(log.details, null, 2)}</pre>
              ) : <span style={{ color: '#666' }}>No details recorded</span>}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function StaffActivityPage() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expandedRow, setExpandedRow] = useState(null);
  const [modalLog, setModalLog] = useState(null);
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

  const toggleRow = (id) => {
    setExpandedRow(expandedRow === id ? null : id);
  };

  if (loading) return <p style={{ color: '#AAA' }}>Loading activity log...</p>;

  return (
    <div>
      <h1 style={styles.title}>Staff Activity Log</h1>
      <p style={styles.subtitle}>Track all actions performed by admin staff. Click any row for full details.</p>

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
            <th style={{ ...styles.th, width: 40 }}></th>
            <th style={styles.th}>Time</th>
            <th style={styles.th}>Admin</th>
            <th style={styles.th}>Level</th>
            <th style={styles.th}>Action</th>
            <th style={styles.th}>Entity</th>
            <th style={styles.th}>Details</th>
          </tr></thead>
          <tbody>
            {logs.length === 0 ? (
              <tr><td colSpan={7} style={{ ...styles.td, textAlign: 'center', padding: 40, color: '#666' }}>No activity logs found</td></tr>
            ) : logs.map((log) => {
              const color = ACTION_COLORS[log.action] || '#AAA';
              const isExpanded = expandedRow === log.id;
              return (
                <React.Fragment key={log.id}>
                  <tr style={{ cursor: 'pointer', background: isExpanded ? '#1F1F1F' : 'transparent' }} onClick={() => toggleRow(log.id)}>
                    <td style={styles.td}>
                      <span style={{ color: '#666', fontSize: 10, transition: 'transform 0.2s', display: 'inline-block', transform: isExpanded ? 'rotate(90deg)' : 'rotate(0deg)' }}>▶</span>
                    </td>
                    <td style={styles.td}>{new Date(log.createdAt).toLocaleString()}</td>
                    <td style={styles.td}>{log.admin?.firstName} {log.admin?.lastName}</td>
                    <td style={styles.td}><span style={{ ...styles.badge, color: log.admin?.adminLevel === 'SUPER' ? '#FF9500' : log.admin?.adminLevel === 'MANAGER' ? '#007AFF' : '#34C759' }}>{log.admin?.adminLevel || '—'}</span></td>
                    <td style={styles.td}><span style={{ ...styles.actionBadge, background: color + '22', color }}>{log.action}</span></td>
                    <td style={styles.td}>{log.entity || '—'}</td>
                    <td style={{ ...styles.td, maxWidth: 250, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{log.details || '—'}</td>
                  </tr>
                  {isExpanded && (
                    <tr>
                      <td colSpan={7} style={{ padding: 0 }}>
                        <div style={expandedStyles.container}>
                          <div style={expandedStyles.grid}>
                            <div style={expandedStyles.section}>
                              <div style={expandedStyles.sectionTitle}>📋 Event Info</div>
                              <div style={expandedStyles.row}><span style={expandedStyles.label}>Action:</span> <span style={{ ...styles.actionBadge, background: color + '22', color }}>{log.action}</span></div>
                              <div style={expandedStyles.row}><span style={expandedStyles.label}>Entity:</span> <span>{log.entity || '—'}</span></div>
                              {log.entityId && <div style={expandedStyles.row}><span style={expandedStyles.label}>Entity ID:</span> <code style={expandedStyles.code}>{log.entityId}</code></div>}
                              <div style={expandedStyles.row}><span style={expandedStyles.label}>Time:</span> <span>{new Date(log.createdAt).toLocaleString()}</span></div>
                              <div style={expandedStyles.row}><span style={expandedStyles.label}>UTC:</span> <span style={{ color: '#888' }}>{new Date(log.createdAt).toISOString()}</span></div>
                            </div>
                            <div style={expandedStyles.section}>
                              <div style={expandedStyles.sectionTitle}>👤 Admin</div>
                              <div style={expandedStyles.row}><span style={expandedStyles.label}>Name:</span> <span>{log.admin?.firstName} {log.admin?.lastName}</span></div>
                              <div style={expandedStyles.row}><span style={expandedStyles.label}>Level:</span> <span style={{ color: log.admin?.adminLevel === 'SUPER' ? '#FF9500' : log.admin?.adminLevel === 'MANAGER' ? '#007AFF' : '#34C759' }}>{log.admin?.adminLevel}</span></div>
                              <div style={expandedStyles.row}><span style={expandedStyles.label}>Phone:</span> <span>{log.admin?.phone || '—'}</span></div>
                            </div>
                          </div>
                          {log.details && (
                            <div style={{ marginTop: 12 }}>
                              <div style={expandedStyles.sectionTitle}>📝 Full Details</div>
                              <div style={expandedStyles.detailBox}>
                                <pre style={expandedStyles.pre}>{typeof log.details === 'string' ? (() => {
                                  try { return JSON.stringify(JSON.parse(log.details), null, 2); } catch { return log.details; }
                                })() : JSON.stringify(log.details, null, 2)}</pre>
                              </div>
                            </div>
                          )}
                          <div style={{ marginTop: 12, textAlign: 'right' }}>
                            <button style={expandedStyles.fullBtn} onClick={(e) => { e.stopPropagation(); setModalLog(log); }}>📄 View Full Detail</button>
                          </div>
                        </div>
                      </td>
                    </tr>
                  )}
                </React.Fragment>
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

      <DetailModal log={modalLog} onClose={() => setModalLog(null)} />
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

const expandedStyles = {
  container: { background: '#141414', padding: '16px 24px', borderBottom: '1px solid #2A2A2A' },
  grid: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 },
  section: { minWidth: 0 },
  sectionTitle: { color: '#0A8E4E', fontSize: 13, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 8 },
  row: { display: 'flex', gap: 8, padding: '3px 0', fontSize: 13, color: '#DDD', wordBreak: 'break-word' },
  label: { color: '#888', minWidth: 80, flexShrink: 0 },
  code: { background: '#0A0A0A', padding: '2px 8px', borderRadius: 4, fontSize: 12, color: '#0AF', fontFamily: 'monospace', wordBreak: 'break-all' },
  detailBox: { background: '#0A0A0A', border: '1px solid #2A2A2A', borderRadius: 8, padding: 16, maxHeight: 300, overflow: 'auto' },
  pre: { color: '#DDD', fontSize: 13, fontFamily: 'monospace', whiteSpace: 'pre-wrap', wordBreak: 'break-word', margin: 0, lineHeight: 1.6 },
  fullBtn: { background: '#2A2A2A', border: '1px solid #3A3A3A', color: '#0AF', borderRadius: 8, padding: '8px 16px', cursor: 'pointer', fontWeight: 600, fontSize: 13 },
};

const modalStyles = {
  overlay: { position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.75)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999 },
  card: { background: '#1A1A1A', borderRadius: 16, width: '90%', maxWidth: 700, maxHeight: '85vh', overflow: 'auto', boxShadow: '0 20px 60px rgba(0,0,0,0.5)' },
  header: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '20px 24px', borderBottom: '1px solid #2A2A2A' },
  title: { color: '#FFF', fontSize: 20, fontWeight: 800, margin: 0 },
  closeBtn: { background: 'none', border: 'none', color: '#888', fontSize: 20, cursor: 'pointer', padding: 4 },
  body: { padding: '20px 24px' },
  fieldRow: { display: 'flex', padding: '8px 0', borderBottom: '1px solid #1F1F1F' },
  fieldLabel: { color: '#888', fontSize: 13, minWidth: 120, flexShrink: 0 },
  fieldValue: { color: '#FFF', fontSize: 14, wordBreak: 'break-word' },
  mono: { fontFamily: 'monospace', fontSize: 12, background: '#0A0A0A', padding: '2px 6px', borderRadius: 4, color: '#0AF' },
  detailSection: { marginTop: 16, padding: 16, background: '#0F0F0F', borderRadius: 10 },
  detailContent: { marginTop: 8 },
  pre: { color: '#DDD', fontSize: 13, fontFamily: 'monospace', whiteSpace: 'pre-wrap', wordBreak: 'break-word', margin: 0, lineHeight: 1.6 },
};
