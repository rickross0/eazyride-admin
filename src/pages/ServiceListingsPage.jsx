import React, { useState, useEffect } from 'react';
import client from '../api/client';

const STATUS_COLORS = {
  ACTIVE: '#34C759', PENDING: '#FF9500', REJECTED: '#FF3B30', INACTIVE: '#AAA', SUSPENDED: '#FF3B30',
};

export default function ServiceListingsPage() {
  const [listings, setListings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  const fetchListings = async () => {
    try {
      const params = new URLSearchParams();
      if (categoryFilter) params.set('category', categoryFilter);
      if (statusFilter) params.set('status', statusFilter);
      const { data } = await client.get(`/admin/services/listings?${params.toString()}`);
      setListings(data.listings || []);
    } catch (e) {
      console.error('Fetch listings error:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchListings(); }, [categoryFilter, statusFilter]);

  const approveListing = async (id) => {
    try {
      await client.put(`/admin/services/listings/${id}/approve`);
      setListings(prev => prev.map(l => l.id === id ? { ...l, isActive: true, isVerified: true, status: 'ACTIVE' } : l));
    } catch (e) {
      alert('Failed to approve: ' + (e.response?.data?.error || e.message));
    }
  };

  const rejectListing = async (id) => {
    const reason = prompt('Reason for rejection (optional):');
    try {
      await client.put(`/admin/services/listings/${id}/reject`, { reason });
      setListings(prev => prev.map(l => l.id === id ? { ...l, status: 'REJECTED', isActive: false } : l));
    } catch (e) {
      alert('Failed to reject: ' + (e.response?.data?.error || e.message));
    }
  };

  const toggleActive = async (listing) => {
    try {
      await client.put(`/admin/services/listings/${listing.id}`, { isActive: !listing.isActive });
      setListings(prev => prev.map(l => l.id === listing.id ? { ...l, isActive: !l.isActive } : l));
    } catch (e) {
      alert('Failed to toggle');
    }
  };

  const filtered = listings.filter(l => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (l.title || '').toLowerCase().includes(q) || (l.provider?.businessName || l.provider?.name || '').toLowerCase().includes(q) || (l.category?.name || '').toLowerCase().includes(q);
  });

  const categories = [...new Set(listings.map(l => l.category?.name).filter(Boolean))];

  if (loading) return <p style={{ color: '#AAA', padding: 40 }}>Loading...</p>;

  return (
    <div>
      <h1 style={styles.title}>Service Listings</h1>

      <div style={styles.filterRow}>
        <select style={styles.select} value={categoryFilter} onChange={e => setCategoryFilter(e.target.value)}>
          <option value="">All Categories</option>
          {categories.map(c => <option key={c} value={c}>{c}</option>)}
        </select>
        <select style={styles.select} value={statusFilter} onChange={e => setStatusFilter(e.target.value)}>
          <option value="">All Statuses</option>
          <option value="ACTIVE">Active</option>
          <option value="PENDING">Pending</option>
          <option value="REJECTED">Rejected</option>
          <option value="SUSPENDED">Suspended</option>
        </select>
      </div>

      <div style={styles.searchRow}>
        <input style={styles.searchInput} placeholder="Search by title, provider, or category..." value={search} onChange={e => setSearch(e.target.value)} />
      </div>

      <div style={styles.tableWrap}>
        <table style={styles.table}>
          <thead><tr>
            <th style={styles.th}>Title</th>
            <th style={styles.th}>Provider</th>
            <th style={styles.th}>Category</th>
            <th style={styles.th}>Rating</th>
            <th style={styles.th}>Price</th>
            <th style={styles.th}>Status</th>
            <th style={styles.th}>Verified</th>
            <th style={styles.th}>Actions</th>
          </tr></thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr><td colSpan={8} style={{ ...styles.td, textAlign: 'center', color: '#AAA' }}>No listings found</td></tr>
            ) : filtered.map(l => (
              <tr key={l.id}>
                <td style={styles.td}>{l.title || '—'}</td>
                <td style={styles.td}>{l.provider?.businessName || l.provider?.name || '—'}</td>
                <td style={styles.td}>
                  <span style={styles.catBadge}>{l.category?.emoji || ''} {l.category?.name || '—'}</span>
                </td>
                <td style={styles.td}>⭐ {(l.rating || 0).toFixed(1)}</td>
                <td style={styles.td}>${l.price || l.minPrice || 0}{l.maxPrice && l.maxPrice !== l.minPrice ? ` – $${l.maxPrice}` : ''}</td>
                <td style={styles.td}>
                  <span style={{ ...styles.statusBadge, color: STATUS_COLORS[l.status] || '#AAA' }}>{(l.status || 'PENDING').replace(/_/g, ' ')}</span>
                </td>
                <td style={styles.td}>
                  <span style={{ color: l.isVerified ? '#34C759' : '#FF9500', fontWeight: 700 }}>{l.isVerified ? '✓' : '—'}</span>
                </td>
                <td style={styles.td}>
                  <div style={styles.actionGroup}>
                    {l.status === 'PENDING' && (
                      <>
                        <button style={styles.approveBtn} onClick={() => approveListing(l.id)}>Approve</button>
                        <button style={styles.rejectBtn} onClick={() => rejectListing(l.id)}>Reject</button>
                      </>
                    )}
                    <button style={{ ...styles.toggleBtn, ...(l.isActive ? styles.toggleOn : {}) }} onClick={() => toggleActive(l)}>
                      {l.isActive ? 'Active' : 'Inactive'}
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

const styles = {
  title: { fontSize: 28, fontWeight: 800, color: '#FFF', marginBottom: 24 },
  filterRow: { display: 'flex', gap: 12, marginBottom: 12 },
  select: { background: '#1A1A1A', border: '1px solid #2A2A2A', borderRadius: 10, padding: '10px 16px', color: '#FFF', fontSize: 14, outline: 'none', minWidth: 160 },
  searchRow: { marginBottom: 16 },
  searchInput: { width: '100%', background: '#1A1A1A', border: '1px solid #2A2A2A', borderRadius: 10, padding: '12px 16px', color: '#FFF', fontSize: 14, outline: 'none', boxSizing: 'border-box' },
  tableWrap: { overflowX: 'auto' },
  table: { width: '100%', borderCollapse: 'collapse', background: '#1A1A1A', borderRadius: 14, overflow: 'hidden' },
  th: { textAlign: 'left', padding: '12px 16px', color: '#AAA', fontSize: 12, textTransform: 'uppercase', borderBottom: '1px solid #2A2A2A' },
  td: { padding: '12px 16px', borderBottom: '1px solid #2A2A2A', fontSize: 14, color: '#FFF' },
  catBadge: { background: '#0F0F0F', padding: '3px 10px', borderRadius: 6, fontSize: 13 },
  statusBadge: { fontWeight: 700, fontSize: 13 },
  actionGroup: { display: 'flex', gap: 6, flexWrap: 'wrap' },
  approveBtn: { background: '#0A8E4E', color: '#FFF', border: 'none', borderRadius: 8, padding: '5px 12px', cursor: 'pointer', fontWeight: 700, fontSize: 12 },
  rejectBtn: { background: '#FF3B30', color: '#FFF', border: 'none', borderRadius: 8, padding: '5px 12px', cursor: 'pointer', fontWeight: 700, fontSize: 12 },
  toggleBtn: { background: '#2A2A2A', color: '#AAA', border: '1px solid #3A3A3A', borderRadius: 8, padding: '5px 12px', cursor: 'pointer', fontWeight: 700, fontSize: 12 },
  toggleOn: { background: '#0A8E4E22', color: '#34C759', borderColor: '#34C759' },
};
