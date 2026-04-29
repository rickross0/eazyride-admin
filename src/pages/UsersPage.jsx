import React, { useState, useEffect } from 'react';
import client from '../api/client';

const ROLES = ['RIDER', 'DRIVER', 'STORE_OWNER', 'RENTAL_COMPANY', 'ADMIN', 'SUPER_ADMIN'];
const ROLE_COLORS = {
  RIDER: '#007AFF', DRIVER: '#FF9500', STORE_OWNER: '#0A8E4E', RENTAL_COMPANY: '#5AC8FA',
  ADMIN: '#AF52DE', SUPER_ADMIN: '#FF3B30',
};

export default function UsersPage() {
  const [users, setUsers] = useState([]);
  const [drivers, setDrivers] = useState([]);
  const [tab, setTab] = useState('users');
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);

  // Password reset modal
  const [resetUserId, setResetUserId] = useState(null);
  const [resetUserName, setResetUserName] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [resetLoading, setResetLoading] = useState(false);

  // Role change modal
  const [roleUserId, setRoleUserId] = useState(null);
  const [roleUserName, setRoleUserName] = useState('');
  const [selectedRole, setSelectedRole] = useState('');
  const [roleLoading, setRoleLoading] = useState(false);

  const fetchUsers = async (p = 1) => {
    try {
      const { data } = await client.get(`/admin/users?limit=50&page=${p}`);
      setUsers(data.users || []);
      setTotal(data.total || 0);
      setPage(p);
    } catch (e) { console.error('Fetch users error:', e); }
  };

  const fetchDrivers = async () => {
    try {
      const { data } = await client.get('/admin/drivers?limit=50');
      setDrivers(data.drivers || []);
    } catch (e) { console.error('Fetch drivers error:', e); }
  };

  useEffect(() => {
    (async () => {
      setLoading(true);
      await Promise.all([fetchUsers(1), fetchDrivers()]);
      setLoading(false);
    })();
  }, []);

  const suspendUser = async (id) => {
    try { await client.put(`/admin/users/${id}/suspend`); setUsers(prev => prev.map(u => u.id === id ? { ...u, isActive: false } : u)); } catch (e) { alert('Failed to suspend'); }
  };

  const activateUser = async (id) => {
    try { await client.put(`/admin/users/${id}/activate`); setUsers(prev => prev.map(u => u.id === id ? { ...u, isActive: true } : u)); } catch (e) { alert('Failed to activate'); }
  };

  const approveDriver = async (id) => {
    try { await client.put(`/admin/drivers/${id}/approve`); setDrivers(prev => prev.map(d => d.id === id ? { ...d, isApproved: true } : d)); } catch (e) { alert('Failed to approve'); }
  };

  // ── Password Reset ──
  const openResetPassword = (id, name) => { setResetUserId(id); setResetUserName(name); setNewPassword(''); };

  const handleResetPassword = async () => {
    if (!newPassword || newPassword.length < 6) { alert('Password must be at least 6 characters'); return; }
    setResetLoading(true);
    try {
      await client.put(`/admin/users/${resetUserId}/reset-password`, { newPassword });
      alert('Password updated!');
      setResetUserId(null); setNewPassword('');
    } catch (e) { alert('Failed: ' + (e.response?.data?.error || e.message)); }
    finally { setResetLoading(false); }
  };

  // ── Role Change ──
  const openRoleChange = (id, name, currentRole) => { setRoleUserId(id); setRoleUserName(name); setSelectedRole(currentRole); };

  const handleRoleChange = async () => {
    setRoleLoading(true);
    try {
      const { data } = await client.put(`/admin/users/${roleUserId}/role`, { role: selectedRole });
      setUsers(prev => prev.map(u => u.id === roleUserId ? { ...u, role: selectedRole } : u));
      alert(`Role changed to ${selectedRole}`);
      setRoleUserId(null);
    } catch (e) { alert('Failed: ' + (e.response?.data?.error || e.message)); }
    finally { setRoleLoading(false); }
  };

  // ── Delete User ──
  const deleteUser = async (id, name) => {
    if (!window.confirm(`Delete ${name}? This is permanent and cannot be undone.`)) return;
    try {
      await client.delete(`/admin/users/${id}`);
      setUsers(prev => prev.filter(u => u.id !== id));
      setTotal(prev => prev - 1);
      alert('User deleted');
    } catch (e) { alert('Failed: ' + (e.response?.data?.error || e.message)); }
  };

  const totalPages = Math.ceil(total / 50);

  if (loading) return <p style={{ color: '#AAA', padding: 40 }}>Loading...</p>;

  return (
    <div>
      <h1 style={styles.title}>User Management</h1>

      <div style={styles.tabRow}>
        {['users', 'drivers'].map(t => (
          <button key={t} onClick={() => setTab(t)} style={{ ...styles.tabBtn, ...(tab === t && styles.tabActive) }}>
            {t.charAt(0).toUpperCase() + t.slice(1)} {t === 'users' ? `(${total})` : `(${drivers.length})`}
          </button>
        ))}
      </div>

      <div style={styles.searchRow}>
        <input style={styles.searchInput} placeholder={tab === 'users' ? 'Search by name, phone, email or role...' : 'Search by driver name, phone, plate...'} value={search} onChange={e => setSearch(e.target.value)} />
      </div>

      {tab === 'users' ? (
        <div style={styles.tableWrap}>
          <table style={styles.table}>
            <thead><tr>
              <th style={styles.th}>Name</th>
              <th style={styles.th}>Phone</th>
              <th style={styles.th}>Role</th>
              <th style={styles.th}>Status</th>
              <th style={styles.th}>Actions</th>
            </tr></thead>
            <tbody>
              {users.filter(u => {
                if (!search) return true;
                const q = search.toLowerCase();
                return (u.firstName || '').toLowerCase().includes(q) || (u.lastName || '').toLowerCase().includes(q) || (u.phone || '').toLowerCase().includes(q) || (u.email || '').toLowerCase().includes(q) || (u.role || '').toLowerCase().includes(q);
              }).map(u => (
                <tr key={u.id}>
                  <td style={styles.td}>
                    <div style={{ fontWeight: 600 }}>{u.firstName} {u.lastName}</div>
                    <div style={{ color: '#666', fontSize: 12 }}>{u.email || ''}</div>
                  </td>
                  <td style={styles.td}>{u.phone}</td>
                  <td style={styles.td}>
                    <button style={{ ...styles.roleBadge, background: (ROLE_COLORS[u.role] || '#2A2A2A') + '22', color: ROLE_COLORS[u.role] || '#AAA', border: '1px solid ' + (ROLE_COLORS[u.role] || '#2A2A2A') }} onClick={() => openRoleChange(u.id, u.firstName + ' ' + u.lastName, u.role)}>
                      {u.role}
                    </button>
                  </td>
                  <td style={styles.td}>
                    <span style={{ color: u.isActive ? '#34C759' : '#FF3B30', fontWeight: 600 }}>{u.isActive ? 'Active' : 'Suspended'}</span>
                  </td>
                  <td style={styles.td}>
                    <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                      {u.isActive
                        ? <button style={styles.dangerBtn} onClick={() => suspendUser(u.id)}>Suspend</button>
                        : <button style={styles.successBtn} onClick={() => activateUser(u.id)}>Activate</button>
                      }
                      <button style={styles.resetBtn} onClick={() => openResetPassword(u.id, u.firstName + ' ' + u.lastName)}>🔑 Reset</button>
                      <button style={styles.deleteBtn} onClick={() => deleteUser(u.id, u.firstName + ' ' + u.lastName)}>🗑 Delete</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {totalPages > 1 && (
            <div style={styles.pagination}>
              <button style={styles.pageBtn} disabled={page <= 1} onClick={() => fetchUsers(page - 1)}>← Prev</button>
              <span style={styles.pageInfo}>Page {page} of {totalPages}</span>
              <button style={styles.pageBtn} disabled={page >= totalPages} onClick={() => fetchUsers(page + 1)}>Next →</button>
            </div>
          )}
        </div>
      ) : (
        <div style={styles.tableWrap}>
          <table style={styles.table}>
            <thead><tr>
              <th style={styles.th}>Driver</th>
              <th style={styles.th}>Phone</th>
              <th style={styles.th}>Vehicle</th>
              <th style={styles.th}>Plate</th>
              <th style={styles.th}>Approved</th>
              <th style={styles.th}>Action</th>
            </tr></thead>
            <tbody>
              {drivers.filter(d => {
                if (!search) return true;
                const q = search.toLowerCase();
                return (d.user?.firstName || '').toLowerCase().includes(q) || (d.user?.lastName || '').toLowerCase().includes(q) || (d.user?.phone || '').toLowerCase().includes(q) || (d.plateNumber || '').toLowerCase().includes(q);
              }).map(d => (
                <tr key={d.id}>
                  <td style={styles.td}>{d.user?.firstName} {d.user?.lastName}</td>
                  <td style={styles.td}>{d.user?.phone}</td>
                  <td style={styles.td}>{d.vehicleType}</td>
                  <td style={styles.td}>{d.plateNumber}</td>
                  <td style={styles.td}><span style={{ color: d.isApproved ? '#34C759' : '#FF9500' }}>{d.isApproved ? 'Yes' : 'Pending'}</span></td>
                  <td style={styles.td}>{!d.isApproved && <button style={styles.successBtn} onClick={() => approveDriver(d.id)}>Approve</button>}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Password Reset Modal */}
      {resetUserId && (
        <div style={styles.modalOverlay} onClick={() => setResetUserId(null)}>
          <div style={styles.modalCard} onClick={e => e.stopPropagation()}>
            <h2 style={styles.modalTitle}>🔑 Reset Password</h2>
            <p style={styles.modalDesc}>Set a new password for <strong>{resetUserName}</strong></p>
            <input style={styles.modalInput} type="password" placeholder="New password (min 6 chars)" value={newPassword} onChange={e => setNewPassword(e.target.value)} onKeyDown={e => e.key === 'Enter' && newPassword.length >= 6 && handleResetPassword()} autoFocus />
            <div style={styles.modalActions}>
              <button style={styles.cancelBtn} onClick={() => setResetUserId(null)}>Cancel</button>
              <button style={styles.saveBtn} onClick={handleResetPassword} disabled={resetLoading || newPassword.length < 6}>{resetLoading ? 'Saving...' : 'Reset Password'}</button>
            </div>
          </div>
        </div>
      )}

      {/* Role Change Modal */}
      {roleUserId && (
        <div style={styles.modalOverlay} onClick={() => setRoleUserId(null)}>
          <div style={styles.modalCard} onClick={e => e.stopPropagation()}>
            <h2 style={styles.modalTitle}>👥 Change Role</h2>
            <p style={styles.modalDesc}>Change role for <strong>{roleUserName}</strong></p>
            <div style={styles.roleGrid}>
              {ROLES.map(r => (
                <button key={r} style={{ ...styles.roleOption, ...(selectedRole === r ? styles.roleOptionActive : {}) }} onClick={() => setSelectedRole(r)}>
                  <span style={{ color: ROLE_COLORS[r], fontWeight: 800 }}>{r}</span>
                </button>
              ))}
            </div>
            <div style={styles.modalActions}>
              <button style={styles.cancelBtn} onClick={() => setRoleUserId(null)}>Cancel</button>
              <button style={styles.saveBtn} onClick={handleRoleChange} disabled={roleLoading}>{roleLoading ? 'Saving...' : 'Change Role'}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

const styles = {
  title: { fontSize: 28, fontWeight: 800, color: '#FFF', marginBottom: 24 },
  tabRow: { display: 'flex', gap: 8, marginBottom: 20 },
  tabBtn: { background: '#1A1A1A', color: '#AAA', border: '1px solid #2A2A2A', borderRadius: 20, padding: '8px 24px', cursor: 'pointer', fontWeight: 600 },
  tabActive: { background: '#0A8E4E', color: '#FFF', borderColor: '#0A8E4E' },
  searchRow: { marginBottom: 16 },
  searchInput: { width: '100%', background: '#1A1A1A', border: '1px solid #2A2A2A', borderRadius: 10, padding: '12px 16px', color: '#FFF', fontSize: 14, outline: 'none', boxSizing: 'border-box' },
  tableWrap: { overflowX: 'auto' },
  table: { width: '100%', borderCollapse: 'collapse', background: '#1A1A1A', borderRadius: 14, overflow: 'hidden' },
  th: { textAlign: 'left', padding: '12px 16px', color: '#AAA', fontSize: 12, textTransform: 'uppercase', borderBottom: '1px solid #2A2A2A' },
  td: { padding: '12px 16px', borderBottom: '1px solid #2A2A2A', fontSize: 14, color: '#FFF' },
  roleBadge: { padding: '4px 12px', borderRadius: 6, fontSize: 12, fontWeight: 700, cursor: 'pointer' },
  dangerBtn: { background: '#FF3B30', color: '#FFF', border: 'none', borderRadius: 8, padding: '6px 14px', cursor: 'pointer', fontWeight: 700, fontSize: 13 },
  successBtn: { background: '#0A8E4E', color: '#FFF', border: 'none', borderRadius: 8, padding: '6px 14px', cursor: 'pointer', fontWeight: 700, fontSize: 13 },
  resetBtn: { background: '#FF9500', color: '#000', border: 'none', borderRadius: 8, padding: '6px 14px', cursor: 'pointer', fontWeight: 700, fontSize: 13 },
  deleteBtn: { background: '#2A2A2A', color: '#FF3B30', border: '1px solid #FF3B30', borderRadius: 8, padding: '6px 14px', cursor: 'pointer', fontWeight: 700, fontSize: 13 },
  pagination: { display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 16, marginTop: 16, padding: 16 },
  pageBtn: { background: '#1A1A1A', border: '1px solid #2A2A2A', color: '#FFF', borderRadius: 8, padding: '8px 16px', cursor: 'pointer', fontWeight: 700 },
  pageInfo: { color: '#AAA', fontSize: 14 },
  // Modal
  modalOverlay: { position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 },
  modalCard: { background: '#1A1A1A', borderRadius: 16, padding: 32, width: 420, boxShadow: '0 8px 32px rgba(0,0,0,.5)' },
  modalTitle: { color: '#FFF', fontSize: 20, fontWeight: 800, margin: '0 0 8px' },
  modalDesc: { color: '#AAA', fontSize: 14, marginBottom: 20 },
  modalInput: { width: '100%', boxSizing: 'border-box', background: '#0F0F0F', border: '1px solid #2A2A2A', borderRadius: 10, padding: 14, fontSize: 15, color: '#FFF', outline: 'none', marginBottom: 16 },
  modalActions: { display: 'flex', gap: 12, justifyContent: 'flex-end' },
  cancelBtn: { background: '#2A2A2A', color: '#AAA', border: '1px solid #3A3A3A', borderRadius: 8, padding: '10px 20px', cursor: 'pointer', fontWeight: 700, fontSize: 14 },
  saveBtn: { background: '#0A8E4E', color: '#FFF', border: 'none', borderRadius: 8, padding: '10px 20px', cursor: 'pointer', fontWeight: 700, fontSize: 14 },
  // Role grid
  roleGrid: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 20 },
  roleOption: { background: '#0F0F0F', border: '2px solid #2A2A2A', borderRadius: 10, padding: '14px', cursor: 'pointer', textAlign: 'center', fontSize: 13 },
  roleOptionActive: { border: '2px solid #0A8E4E', background: '#0A8E4E22' },
};
