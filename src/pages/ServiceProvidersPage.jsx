import React, { useState, useEffect } from 'react';
import client from '../api/client';

const BUSINESS_TYPES = ['INDIVIDUAL', 'COMPANY', 'COOPERATIVE', 'AGENCY'];

export default function ServiceProvidersPage() {
  const [providers, setProviders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [docModal, setDocModal] = useState(null);

  const fetchProviders = async () => {
    try {
      const { data } = await client.get('/admin/services/providers');
      setProviders(data.providers || []);
    } catch (e) {
      console.error('Fetch providers error:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchProviders(); }, []);

  const verifyProvider = async (id) => {
    try {
      await client.put(`/admin/services/providers/${id}/verify`);
      setProviders(prev => prev.map(p => p.id === id ? { ...p, isVerified: true } : p));
    } catch (e) {
      alert('Failed to verify: ' + (e.response?.data?.error || e.message));
    }
  };

  const suspendProvider = async (id) => {
    if (!window.confirm('Suspend this provider?')) return;
    try {
      await client.put(`/admin/services/providers/${id}/suspend`);
      setProviders(prev => prev.map(p => p.id === id ? { ...p, isSuspended: true } : p));
    } catch (e) {
      alert('Failed to suspend: ' + (e.response?.data?.error || e.message));
    }
  };

  const reactivateProvider = async (id) => {
    try {
      await client.put(`/admin/services/providers/${id}/reactivate`);
      setProviders(prev => prev.map(p => p.id === id ? { ...p, isSuspended: false } : p));
    } catch (e) {
      alert('Failed to reactivate: ' + (e.response?.data?.error || e.message));
    }
  };

  const filtered = providers.filter(p => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (p.businessName || p.name || '').toLowerCase().includes(q) || (p.businessType || '').toLowerCase().includes(q) || (p.user?.firstName || '').toLowerCase().includes(q) || (p.user?.lastName || '').toLowerCase().includes(q) || (p.user?.phone || '').toLowerCase().includes(q);
  });

  if (loading) return <p style={{ color: '#AAA', padding: 40 }}>Loading...</p>;

  return (
    <div>
      <h1 style={styles.title}>Service Providers</h1>

      <div style={styles.searchRow}>
        <input style={styles.searchInput} placeholder="Search by business name, contact, or phone..." value={search} onChange={e => setSearch(e.target.value)} />
      </div>

      <div style={styles.tableWrap}>
        <table style={styles.table}>
          <thead><tr>
            <th style={styles.th}>Business Name</th>
            <th style={styles.th}>Contact</th>
            <th style={styles.th}>Phone</th>
            <th style={styles.th}>Type</th>
            <th style={styles.th}>Rating</th>
            <th style={styles.th}>Verified</th>
            <th style={styles.th}>Status</th>
            <th style={styles.th}>Actions</th>
          </tr></thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr><td colSpan={8} style={{ ...styles.td, textAlign: 'center', color: '#AAA' }}>No providers found</td></tr>
            ) : filtered.map(p => (
              <tr key={p.id}>
                <td style={styles.td}>{p.businessName || p.name || '—'}</td>
                <td style={styles.td}>{p.user?.firstName} {p.user?.lastName || ''}</td>
                <td style={styles.td}>{p.user?.phone || '—'}</td>
                <td style={styles.td}>
                  <span style={styles.typeBadge}>{(p.businessType || 'INDIVIDUAL').replace(/_/g, ' ')}</span>
                </td>
                <td style={styles.td}>⭐ {(p.rating || p.avgRating || 0).toFixed(1)} <span style={{ color: '#AAA', fontSize: 12 }}>({p.reviewCount || p.totalReviews || 0})</span></td>
                <td style={styles.td}>
                  <span style={{ color: p.isVerified ? '#34C759' : '#FF9500', fontWeight: 700 }}>
                    {p.isVerified ? '✓ Verified' : 'Pending'}
                  </span>
                </td>
                <td style={styles.td}>
                  <span style={{ color: p.isSuspended ? '#FF3B30' : '#34C759', fontWeight: 700 }}>
                    {p.isSuspended ? 'Suspended' : 'Active'}
                  </span>
                </td>
                <td style={styles.td}>
                  <div style={styles.actionGroup}>
                    {!p.isVerified && <button style={styles.verifyBtn} onClick={() => verifyProvider(p.id)}>Verify</button>}
                    {!p.isSuspended ? (
                      <button style={styles.suspendBtn} onClick={() => suspendProvider(p.id)}>Suspend</button>
                    ) : (
                      <button style={styles.reactivateBtn} onClick={() => reactivateProvider(p.id)}>Reactivate</button>
                    )}
                    {(p.certifications?.length > 0 || p.documents?.length > 0) && (
                      <button style={styles.docsBtn} onClick={() => setDocModal(p)}>Docs</button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {docModal && (
        <div style={styles.modalOverlay} onClick={() => setDocModal(null)}>
          <div style={styles.modalCard} onClick={e => e.stopPropagation()}>
            <h2 style={styles.modalTitle}>📄 Documents — {docModal.businessName || docModal.name}</h2>
            <div style={styles.docSection}>
              <h3 style={styles.docSectionTitle}>Certifications</h3>
              {(docModal.certifications || []).length === 0 ? (
                <p style={{ color: '#AAA', fontSize: 14 }}>No certifications on file</p>
              ) : docModal.certifications.map((cert, i) => (
                <div key={i} style={styles.docItem}>
                  <span style={styles.docName}>{cert.name || cert.type || `Certification ${i + 1}`}</span>
                  <span style={{ ...styles.docStatus, color: cert.verified ? '#34C759' : '#FF9500' }}>{cert.verified ? 'Verified' : 'Pending'}</span>
                  {cert.url && <a href={cert.url} target="_blank" rel="noopener noreferrer" style={styles.docLink}>View</a>}
                </div>
              ))}
            </div>
            <div style={styles.docSection}>
              <h3 style={styles.docSectionTitle}>Documents</h3>
              {(docModal.documents || []).length === 0 ? (
                <p style={{ color: '#AAA', fontSize: 14 }}>No documents on file</p>
              ) : docModal.documents.map((doc, i) => (
                <div key={i} style={styles.docItem}>
                  <span style={styles.docName}>{doc.name || doc.type || `Document ${i + 1}`}</span>
                  <span style={{ ...styles.docStatus, color: doc.verified ? '#34C759' : '#FF9500' }}>{doc.verified ? 'Verified' : 'Pending'}</span>
                  {doc.url && <a href={doc.url} target="_blank" rel="noopener noreferrer" style={styles.docLink}>View</a>}
                </div>
              ))}
            </div>
            <div style={styles.modalActions}>
              <button style={styles.closeBtn} onClick={() => setDocModal(null)}>Close</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

const styles = {
  title: { fontSize: 28, fontWeight: 800, color: '#FFF', marginBottom: 24 },
  searchRow: { marginBottom: 16 },
  searchInput: { width: '100%', background: '#1A1A1A', border: '1px solid #2A2A2A', borderRadius: 10, padding: '12px 16px', color: '#FFF', fontSize: 14, outline: 'none', boxSizing: 'border-box' },
  tableWrap: { overflowX: 'auto' },
  table: { width: '100%', borderCollapse: 'collapse', background: '#1A1A1A', borderRadius: 14, overflow: 'hidden' },
  th: { textAlign: 'left', padding: '12px 16px', color: '#AAA', fontSize: 12, textTransform: 'uppercase', borderBottom: '1px solid #2A2A2A' },
  td: { padding: '12px 16px', borderBottom: '1px solid #2A2A2A', fontSize: 14, color: '#FFF' },
  typeBadge: { background: '#5856D622', color: '#5856D6', padding: '3px 10px', borderRadius: 6, fontSize: 12, fontWeight: 700, textTransform: 'capitalize' },
  actionGroup: { display: 'flex', gap: 6, flexWrap: 'wrap' },
  verifyBtn: { background: '#0A8E4E', color: '#FFF', border: 'none', borderRadius: 8, padding: '5px 12px', cursor: 'pointer', fontWeight: 700, fontSize: 12 },
  suspendBtn: { background: '#FF3B30', color: '#FFF', border: 'none', borderRadius: 8, padding: '5px 12px', cursor: 'pointer', fontWeight: 700, fontSize: 12 },
  reactivateBtn: { background: '#007AFF', color: '#FFF', border: 'none', borderRadius: 8, padding: '5px 12px', cursor: 'pointer', fontWeight: 700, fontSize: 12 },
  docsBtn: { background: '#2A2A2A', color: '#5856D6', border: '1px solid #5856D6', borderRadius: 8, padding: '5px 12px', cursor: 'pointer', fontWeight: 700, fontSize: 12 },
  // Modal
  modalOverlay: { position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 },
  modalCard: { background: '#1A1A1A', borderRadius: 16, padding: 32, width: 520, maxHeight: '80vh', overflowY: 'auto', boxShadow: '0 8px 32px rgba(0,0,0,.5)' },
  modalTitle: { color: '#FFF', fontSize: 20, fontWeight: 800, margin: '0 0 20px' },
  docSection: { marginBottom: 20 },
  docSectionTitle: { color: '#AAA', fontSize: 13, textTransform: 'uppercase', fontWeight: 700, marginBottom: 10 },
  docItem: { display: 'flex', alignItems: 'center', gap: 12, padding: '10px 14px', background: '#0F0F0F', borderRadius: 10, marginBottom: 8 },
  docName: { color: '#FFF', fontSize: 14, flex: 1 },
  docStatus: { fontSize: 12, fontWeight: 700 },
  docLink: { color: '#007AFF', fontSize: 13, fontWeight: 600, textDecoration: 'none' },
  modalActions: { display: 'flex', justifyContent: 'flex-end', marginTop: 16 },
  closeBtn: { background: '#2A2A2A', color: '#AAA', border: '1px solid #3A3A3A', borderRadius: 8, padding: '10px 20px', cursor: 'pointer', fontWeight: 700, fontSize: 14 },
};
