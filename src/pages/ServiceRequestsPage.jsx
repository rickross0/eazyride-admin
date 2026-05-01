import React, { useState, useEffect } from 'react';
import client from '../api/client';

const STATUS_COLORS = {
  PENDING: '#FF9500', ACCEPTED: '#007AFF', IN_PROGRESS: '#5856D6',
  COMPLETED: '#34C759', CANCELLED: '#FF3B30', DISPUTED: '#AF52DE',
};

const STATUS_LIST = ['PENDING', 'ACCEPTED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED', 'DISPUTED'];

export default function ServiceRequestsPage() {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);

  const fetchRequests = async (p = 1) => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      params.set('limit', '50');
      params.set('page', String(p));
      if (statusFilter) params.set('status', statusFilter);
      if (dateFrom) params.set('from', dateFrom);
      if (dateTo) params.set('to', dateTo);
      const { data } = await client.get(`/admin/services/requests?${params.toString()}`);
      setRequests(data.requests || []);
      setTotal(data.total || 0);
      setPage(p);
    } catch (e) {
      console.error('Fetch requests error:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchRequests(1); }, [statusFilter, dateFrom, dateTo]);

  const updateStatus = async (id, status) => {
    try {
      await client.put(`/admin/services/requests/${id}/status`, { status });
      setRequests(prev => prev.map(r => r.id === id ? { ...r, status } : r));
    } catch (e) {
      alert('Failed: ' + (e.response?.data?.error || e.message));
    }
  };

  const formatDate = (iso) => iso ? new Date(iso).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: '2-digit', hour: '2-digit', minute: '2-digit' }) : '—';

  const filtered = requests.filter(r => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (r.id || '').toLowerCase().includes(q) || (r.rider?.firstName || '').toLowerCase().includes(q) || (r.provider?.businessName || r.provider?.name || '').toLowerCase().includes(q) || (r.service?.title || r.serviceName || '').toLowerCase().includes(q);
  });

  const totalPages = Math.ceil(total / 50);

  if (loading && requests.length === 0) return <p style={{ color: '#AAA', padding: 40 }}>Loading...</p>;

  return (
    <div>
      <h1 style={styles.title}>Service Requests</h1>

      <div style={styles.filterRow}>
        <select style={styles.select} value={statusFilter} onChange={e => setStatusFilter(e.target.value)}>
          <option value="">All Statuses</option>
          {STATUS_LIST.map(s => <option key={s} value={s}>{s.replace(/_/g, ' ')}</option>)}
        </select>
        <div style={styles.dateGroup}>
          <label style={styles.dateLabel}>From</label>
          <input type="date" style={styles.dateInput} value={dateFrom} onChange={e => setDateFrom(e.target.value)} />
        </div>
        <div style={styles.dateGroup}>
          <label style={styles.dateLabel}>To</label>
          <input type="date" style={styles.dateInput} value={dateTo} onChange={e => setDateTo(e.target.value)} />
        </div>
      </div>

      <div style={styles.searchRow}>
        <input style={styles.searchInput} placeholder="Search by request ID, rider, provider, or service..." value={search} onChange={e => setSearch(e.target.value)} />
      </div>

      <div style={styles.tableWrap}>
        <table style={styles.table}>
          <thead><tr>
            <th style={styles.th}>ID</th>
            <th style={styles.th}>Rider</th>
            <th style={styles.th}>Provider</th>
            <th style={styles.th}>Service</th>
            <th style={styles.th}>Price</th>
            <th style={styles.th}>Status</th>
            <th style={styles.th}>Date</th>
            <th style={styles.th}>Actions</th>
          </tr></thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr><td colSpan={8} style={{ ...styles.td, textAlign: 'center', color: '#AAA' }}>No requests found</td></tr>
            ) : filtered.map(r => (
              <tr key={r.id}>
                <td style={styles.td} title={r.id}>{r.id?.slice(0, 8)}…</td>
                <td style={styles.td}>{r.rider?.firstName} {r.rider?.lastName || ''}</td>
                <td style={styles.td}>{r.provider?.businessName || r.provider?.name || '—'}</td>
                <td style={styles.td}>{r.service?.title || r.serviceName || '—'}</td>
                <td style={styles.td}>${(r.price || r.totalAmount || 0).toFixed(2)}</td>
                <td style={styles.td}>
                  <span style={{ ...styles.statusBadge, color: STATUS_COLORS[r.status] || '#AAA', background: (STATUS_COLORS[r.status] || '#AAA') + '22' }}>
                    {(r.status || 'PENDING').replace(/_/g, ' ')}
                  </span>
                </td>
                <td style={styles.td}>{formatDate(r.createdAt)}</td>
                <td style={styles.td}>
                  {r.status === 'PENDING' && (
                    <div style={styles.actionGroup}>
                      <button style={styles.acceptBtn} onClick={() => updateStatus(r.id, 'ACCEPTED')}>Accept</button>
                      <button style={styles.cancelBtn} onClick={() => updateStatus(r.id, 'CANCELLED')}>Cancel</button>
                    </div>
                  )}
                  {r.status === 'ACCEPTED' && (
                    <button style={styles.progressBtn} onClick={() => updateStatus(r.id, 'IN_PROGRESS')}>Start</button>
                  )}
                  {r.status === 'IN_PROGRESS' && (
                    <button style={styles.completeBtn} onClick={() => updateStatus(r.id, 'COMPLETED')}>Complete</button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {totalPages > 1 && (
        <div style={styles.pagination}>
          <button style={styles.pageBtn} disabled={page <= 1} onClick={() => fetchRequests(page - 1)}>← Prev</button>
          <span style={styles.pageInfo}>Page {page} of {totalPages}</span>
          <button style={styles.pageBtn} disabled={page >= totalPages} onClick={() => fetchRequests(page + 1)}>Next →</button>
        </div>
      )}
    </div>
  );
}

const styles = {
  title: { fontSize: 28, fontWeight: 800, color: '#FFF', marginBottom: 24 },
  filterRow: { display: 'flex', gap: 12, marginBottom: 12, flexWrap: 'wrap', alignItems: 'flex-end' },
  select: { background: '#1A1A1A', border: '1px solid #2A2A2A', borderRadius: 10, padding: '10px 16px', color: '#FFF', fontSize: 14, outline: 'none', minWidth: 160 },
  dateGroup: { display: 'flex', flexDirection: 'column', gap: 4 },
  dateLabel: { color: '#AAA', fontSize: 11, textTransform: 'uppercase', fontWeight: 600 },
  dateInput: { background: '#1A1A1A', border: '1px solid #2A2A2A', borderRadius: 10, padding: '10px 14px', color: '#FFF', fontSize: 14, outline: 'none' },
  searchRow: { marginBottom: 16 },
  searchInput: { width: '100%', background: '#1A1A1A', border: '1px solid #2A2A2A', borderRadius: 10, padding: '12px 16px', color: '#FFF', fontSize: 14, outline: 'none', boxSizing: 'border-box' },
  tableWrap: { overflowX: 'auto' },
  table: { width: '100%', borderCollapse: 'collapse', background: '#1A1A1A', borderRadius: 14, overflow: 'hidden' },
  th: { textAlign: 'left', padding: '12px 16px', color: '#AAA', fontSize: 12, textTransform: 'uppercase', borderBottom: '1px solid #2A2A2A' },
  td: { padding: '12px 16px', borderBottom: '1px solid #2A2A2A', fontSize: 14, color: '#FFF' },
  statusBadge: { padding: '3px 10px', borderRadius: 6, fontSize: 12, fontWeight: 700, textTransform: 'capitalize' },
  actionGroup: { display: 'flex', gap: 6 },
  acceptBtn: { background: '#0A8E4E', color: '#FFF', border: 'none', borderRadius: 8, padding: '5px 12px', cursor: 'pointer', fontWeight: 700, fontSize: 12 },
  cancelBtn: { background: '#FF3B30', color: '#FFF', border: 'none', borderRadius: 8, padding: '5px 12px', cursor: 'pointer', fontWeight: 700, fontSize: 12 },
  progressBtn: { background: '#5856D6', color: '#FFF', border: 'none', borderRadius: 8, padding: '5px 12px', cursor: 'pointer', fontWeight: 700, fontSize: 12 },
  completeBtn: { background: '#007AFF', color: '#FFF', border: 'none', borderRadius: 8, padding: '5px 12px', cursor: 'pointer', fontWeight: 700, fontSize: 12 },
  pagination: { display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 16, marginTop: 16, padding: 16 },
  pageBtn: { background: '#1A1A1A', border: '1px solid #2A2A2A', color: '#FFF', borderRadius: 8, padding: '8px 16px', cursor: 'pointer', fontWeight: 700 },
  pageInfo: { color: '#AAA', fontSize: 14 },
};
