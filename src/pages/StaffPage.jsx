import React, { useState, useEffect } from 'react';
import client from '../api/client';

const PERMISSION_GROUPS = [
  {
    group: 'Dashboard',
    perms: [{ key: 'dashboard.view', label: 'View Dashboard' }],
  },
  {
    group: 'Users',
    perms: [
      { key: 'users.view', label: 'View Users & Drivers' },
      { key: 'users.suspend', label: 'Suspend / Activate Users' },
      { key: 'drivers.approve', label: 'Approve Drivers' },
    ],
  },
  {
    group: 'Rides & Orders',
    perms: [
      { key: 'rides.view', label: 'View Rides' },
      { key: 'orders.view', label: 'View Orders' },
    ],
  },
  {
    group: 'Services',
    perms: [
      { key: 'restaurants.manage', label: 'Manage Restaurants' },
      { key: 'providers.manage', label: 'Manage Providers' },
      { key: 'cars.manage', label: 'Manage Cars' },
      { key: 'provider.earnings', label: 'View Provider Earnings' },
    ],
  },
  {
    group: 'Reports',
    perms: [{ key: 'reports.view', label: 'View Reports' }],
  },
  {
    group: 'Finance',
    perms: [
      { key: 'pricing.edit', label: 'Edit Pricing' },
      { key: 'surge.manage', label: 'Manage Surge Zones' },
      { key: 'payouts.manage', label: 'Manage Payouts' },
      { key: 'commissions.manage', label: 'Manage Commissions' },
    ],
  },
  {
    group: 'System',
    perms: [
      { key: 'features.manage', label: 'Manage Feature Toggles' },
      { key: 'staff.manage', label: 'Manage Staff & Roles' },
      { key: 'activity.view', label: 'View Activity Log' },
      { key: 'master.login', label: 'Master Login as Users' },
      { key: 'settings.manage', label: 'Manage API Settings' },
      { key: 'settings.waafi_test', label: 'Test WaafiPay' },
    ],
  },
];

const ALL_PERM_KEYS = PERMISSION_GROUPS.flatMap((g) => g.perms.map((p) => p.key));

const LEVEL_COLORS = {
  SUPER: { bg: '#3A2800', color: '#FF9500', label: 'Super Admin' },
  MANAGER: { bg: '#002A5C', color: '#007AFF', label: 'Manager' },
  CARE: { bg: '#003A12', color: '#34C759', label: 'Care Agent' },
};

// Default permissions per level
const LEVEL_DEFAULTS = {
  SUPER: ALL_PERM_KEYS, // gets everything
  MANAGER: ['dashboard.view', 'users.view', 'users.suspend', 'drivers.approve', 'rides.view', 'orders.view', 'restaurants.manage', 'providers.manage', 'cars.manage', 'provider.earnings', 'reports.view'],
  CARE: ['dashboard.view', 'users.view', 'drivers.approve', 'rides.view', 'orders.view'],
};

export default function StaffPage() {
  const [staff, setStaff] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showAdd, setShowAdd] = useState(false);
  const [saving, setSaving] = useState(null);
  const [newStaff, setNewStaff] = useState({ phone: '', email: '', password: '', firstName: '', lastName: '', adminLevel: 'CARE' });
  const [selectedStaff, setSelectedStaff] = useState(null);
  const [staffPerms, setStaffPerms] = useState({});
  const [permLoading, setPermLoading] = useState(false);
  const [permSaving, setPermSaving] = useState(false);

  const fetchStaff = async () => {
    try {
      const { data } = await client.get('/admin/staff/permissions?limit=100');
      setStaff(data.staff || []);
    } catch (e) {
      console.error('Fetch staff error:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchStaff(); }, []);

  const openPermissions = async (s) => {
    setSelectedStaff(s);
    setPermLoading(true);
    try {
      const { data } = await client.get(`/admin/staff/${s.id}/permissions`);
      const permMap = {};
      (data.permissions || []).forEach((p) => { permMap[p.permission] = p.granted; });
      setStaffPerms(permMap);
    } catch (e) {
      console.error('Fetch perms error:', e);
    } finally {
      setPermLoading(false);
    }
  };

  const closePermissions = () => { setSelectedStaff(null); setStaffPerms({}); };

  const togglePerm = (key) => {
    setStaffPerms((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const applyLevelDefaults = (level) => {
    const defaults = LEVEL_DEFAULTS[level] || [];
    const newPerms = {};
    ALL_PERM_KEYS.forEach((key) => { newPerms[key] = defaults.includes(key); });
    setStaffPerms(newPerms);
  };

  const savePermissions = async () => {
    if (!selectedStaff) return;
    setPermSaving(true);
    try {
      const permissions = ALL_PERM_KEYS.map((key) => ({ permission: key, granted: !!staffPerms[key] }));
      await client.put(`/admin/staff/${selectedStaff.id}/permissions`, { permissions });
      alert('Permissions saved!');
      fetchStaff();
    } catch (err) {
      alert('Failed to save permissions: ' + (err.response?.data?.error || err.message));
    } finally {
      setPermSaving(false);
    }
  };

  const revokeAll = async () => {
    if (!selectedStaff) return;
    if (!confirm('Revoke ALL permissions for this staff member?')) return;
    try {
      await client.delete(`/admin/staff/${selectedStaff.id}/permissions`);
      const newPerms = {};
      ALL_PERM_KEYS.forEach((key) => { newPerms[key] = false; });
      setStaffPerms(newPerms);
      fetchStaff();
    } catch (err) {
      alert('Failed to revoke: ' + (err.response?.data?.error || err.message));
    }
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    setSaving('create');
    try {
      await client.post('/admin/staff', newStaff);
      setShowAdd(false);
      setNewStaff({ phone: '', email: '', password: '', firstName: '', lastName: '', adminLevel: 'CARE' });
      fetchStaff();
    } catch (err) {
      alert('Failed to create staff: ' + (err.response?.data?.error || err.message));
    } finally {
      setSaving(null);
    }
  };

  const handleRoleChange = async (id, adminLevel) => {
    setSaving(id);
    try {
      await client.put(`/admin/staff/${id}/role`, { adminLevel });
      setStaff(staff.map((s) => s.id === id ? { ...s, adminLevel, role: adminLevel === 'SUPER' ? 'SUPER_ADMIN' : 'ADMIN' } : s));
    } catch (err) {
      alert('Failed to update role: ' + (err.response?.data?.error || err.message));
    } finally {
      setSaving(null);
    }
  };

  const handleDeactivate = async (id) => {
    if (!confirm('Deactivate this staff member?')) return;
    try {
      await client.delete(`/admin/staff/${id}`);
      setStaff(staff.map((s) => s.id === id ? { ...s, isActive: false } : s));
    } catch (err) {
      alert('Failed to deactivate: ' + (err.response?.data?.error || err.message));
    }
  };

  const handleActivate = async (id) => {
    try {
      await client.put(`/admin/users/${id}/activate`);
      setStaff(staff.map((s) => s.id === id ? { ...s, isActive: true } : s));
    } catch (err) {
      alert('Failed to activate: ' + (err.response?.data?.error || err.message));
    }
  };

  const handleMasterLogin = async (id) => {
    if (!confirm('Login as this user? You will have a 1-hour session.')) return;
    try {
      const { data } = await client.post('/admin/master-login', { userId: id });
      localStorage.setItem('adminToken', data.token);
      localStorage.setItem('adminUser', JSON.stringify({ ...data.user, adminLevel: data.user.adminLevel || 'SUPER', masterLogin: true, originalAdminId: data.user.originalAdminId }));
      window.location.href = '/';
    } catch (err) {
      alert('Master login failed: ' + (err.response?.data?.error || err.message));
    }
  };

  const filtered = staff.filter((s) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (s.firstName || '').toLowerCase().includes(q) || (s.lastName || '').toLowerCase().includes(q) || (s.phone || '').toLowerCase().includes(q) || (s.email || '').toLowerCase().includes(q);
  });

  // Count granted permissions for display
  const getPermCount = (s) => {
    const perms = s.permissions || [];
    return perms.filter((p) => p.granted).length;
  };

  if (loading) return <p style={{ color: '#AAA' }}>Loading staff...</p>;

  // ── Permissions Modal ──
  if (selectedStaff) {
    const level = LEVEL_COLORS[selectedStaff.adminLevel] || LEVEL_COLORS.CARE;
    return (
      <div>
        <div style={styles.header}>
          <div>
            <h1 style={styles.title}>Permissions: {selectedStaff.firstName} {selectedStaff.lastName}</h1>
            <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginTop: 4 }}>
              <span style={{ ...styles.badge, background: level.bg, color: level.color, border: `1px solid ${level.color}` }}>{level.label}</span>
              <span style={{ color: '#888', fontSize: 13 }}>{selectedStaff.phone}</span>
            </div>
          </div>
          <button style={styles.backBtn} onClick={closePermissions}>← Back to Staff</button>
        </div>

        <div style={styles.quickRow}>
          <span style={styles.quickLabel}>Quick-set defaults:</span>
          <button style={styles.quickBtn} onClick={() => applyLevelDefaults('SUPER')}>Super Admin (all)</button>
          <button style={styles.quickBtn} onClick={() => applyLevelDefaults('MANAGER')}>Manager defaults</button>
          <button style={styles.quickBtn} onClick={() => applyLevelDefaults('CARE')}>Care Agent defaults</button>
          <button style={{ ...styles.quickBtn, background: '#2A2A2A', color: '#FF3B30' }} onClick={revokeAll}>Revoke All</button>
        </div>

        {permLoading ? <p style={{ color: '#AAA' }}>Loading permissions...</p> : (
          <div style={styles.permGrid}>
            {PERMISSION_GROUPS.map((group) => (
              <div key={group.group} style={styles.permGroup}>
                <h3 style={styles.permGroupTitle}>{group.group}</h3>
                {group.perms.map((perm) => {
                  const isGranted = staffPerms[perm.key] === true;
                  return (
                    <div key={perm.key} style={styles.permRow} onClick={() => togglePerm(perm.key)}>
                      <div style={{ ...styles.toggleIndicator, background: isGranted ? '#0A8E4E' : '#3A3A3A' }}>
                        {isGranted ? '✓' : ''}
                      </div>
                      <span style={{ ...styles.permLabel, color: isGranted ? '#FFF' : '#666' }}>{perm.label}</span>
                    </div>
                  );
                })}
              </div>
            ))}
          </div>
        )}

        <div style={{ display: 'flex', gap: 12, marginTop: 24 }}>
          <button style={styles.savePermBtn} disabled={permSaving} onClick={savePermissions}>
            {permSaving ? 'Saving...' : 'Save Permissions'}
          </button>
          <button style={styles.cancelBtn} onClick={closePermissions}>Cancel</button>
        </div>
      </div>
    );
  }

  // ── Staff List ──
  return (
    <div>
      <div style={styles.header}>
        <h1 style={styles.title}>Staff & Permissions</h1>
        <button style={styles.addBtn} onClick={() => setShowAdd(!showAdd)}>+ Add Staff</button>
      </div>

      {showAdd && (
        <form onSubmit={handleCreate} style={styles.formCard}>
          <h3 style={styles.formTitle}>New Staff Member</h3>
          <div style={styles.formGrid}>
            <input style={styles.input} placeholder="First Name *" value={newStaff.firstName} onChange={(e) => setNewStaff({ ...newStaff, firstName: e.target.value })} required />
            <input style={styles.input} placeholder="Last Name *" value={newStaff.lastName} onChange={(e) => setNewStaff({ ...newStaff, lastName: e.target.value })} required />
            <input style={styles.input} placeholder="Phone *" value={newStaff.phone} onChange={(e) => setNewStaff({ ...newStaff, phone: e.target.value })} required />
            <input style={styles.input} placeholder="Email" type="email" value={newStaff.email} onChange={(e) => setNewStaff({ ...newStaff, email: e.target.value })} />
            <input style={styles.input} placeholder="Password *" type="password" value={newStaff.password} onChange={(e) => setNewStaff({ ...newStaff, password: e.target.value })} required />
            <select style={styles.select} value={newStaff.adminLevel} onChange={(e) => setNewStaff({ ...newStaff, adminLevel: e.target.value })}>
              <option value="CARE">Care Agent</option>
              <option value="MANAGER">Manager</option>
              <option value="SUPER">Super Admin</option>
            </select>
          </div>
          <div style={styles.formActions}>
            <button type="submit" style={styles.saveBtn} disabled={saving === 'create'}>{saving === 'create' ? 'Creating...' : 'Create Staff'}</button>
            <button type="button" style={styles.cancelBtn} onClick={() => setShowAdd(false)}>Cancel</button>
          </div>
        </form>
      )}

      <div style={styles.searchRow}>
        <input style={styles.searchInput} placeholder="Search staff by name, phone, email..." value={search} onChange={(e) => setSearch(e.target.value)} />
      </div>

      <div style={styles.tableWrap}>
        <table style={styles.table}>
          <thead><tr>
            <th style={styles.th}>Name</th>
            <th style={styles.th}>Phone</th>
            <th style={styles.th}>Role</th>
            <th style={styles.th}>Status</th>
            <th style={styles.th}>Permissions</th>
            <th style={styles.th}>Created</th>
            <th style={styles.th}>Actions</th>
          </tr></thead>
          <tbody>
            {filtered.map((s) => {
              const level = LEVEL_COLORS[s.adminLevel] || LEVEL_COLORS.CARE;
              const permCount = getPermCount(s);
              const totalPerms = ALL_PERM_KEYS.length;
              return (
                <tr key={s.id}>
                  <td style={styles.td}>
                    <div>{s.firstName} {s.lastName}</div>
                    <div style={{ fontSize: 12, color: '#888' }}>{s.email || '—'}</div>
                  </td>
                  <td style={styles.td}>{s.phone}</td>
                  <td style={styles.td}>
                    <select
                      style={{ ...styles.roleSelect, borderColor: level.color, color: level.color }}
                      value={s.adminLevel || 'CARE'}
                      onChange={(e) => handleRoleChange(s.id, e.target.value)}
                      disabled={saving === s.id}
                    >
                      <option value="CARE">Care Agent</option>
                      <option value="MANAGER">Manager</option>
                      <option value="SUPER">Super Admin</option>
                    </select>
                  </td>
                  <td style={styles.td}><span style={{ color: s.isActive ? '#34C759' : '#FF3B30' }}>{s.isActive ? 'Active' : 'Inactive'}</span></td>
                  <td style={styles.td}>
                    <button style={styles.permBtn} onClick={() => openPermissions(s)}>
                      🔐 {permCount}/{totalPerms}
                    </button>
                  </td>
                  <td style={styles.td}>{new Date(s.createdAt).toLocaleDateString()}</td>
                  <td style={styles.td}>
                    <div style={styles.actionGroup}>
                      {s.isActive ? (
                        <button style={styles.dangerSmBtn} onClick={() => handleDeactivate(s.id)}>Deactivate</button>
                      ) : (
                        <button style={styles.successSmBtn} onClick={() => handleActivate(s.id)}>Activate</button>
                      )}
                      <button style={styles.masterBtn} onClick={() => handleMasterLogin(s.id)} title="Login as this user">🔐 Login As</button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

const styles = {
  header: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24 },
  title: { fontSize: 28, fontWeight: 800, color: '#FFF', margin: 0 },
  addBtn: { background: '#0A8E4E', color: '#FFF', border: 'none', borderRadius: 10, padding: '10px 24px', fontWeight: 700, cursor: 'pointer', fontSize: 14 },
  backBtn: { background: '#2A2A2A', color: '#FFF', border: '1px solid #444', borderRadius: 10, padding: '10px 20px', fontWeight: 700, cursor: 'pointer', fontSize: 14 },
  formCard: { background: '#1A1A1A', borderRadius: 14, padding: 24, marginBottom: 24 },
  formTitle: { color: '#FFF', fontSize: 16, fontWeight: 700, margin: '0 0 16px' },
  formGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 12, marginBottom: 16 },
  input: { background: '#0F0F0F', border: '1px solid #2A2A2A', borderRadius: 8, padding: '10px 14px', fontSize: 14, color: '#FFF', outline: 'none' },
  select: { background: '#0F0F0F', border: '1px solid #2A2A2A', borderRadius: 8, padding: '10px 14px', fontSize: 14, color: '#FFF', outline: 'none' },
  formActions: { display: 'flex', gap: 12 },
  saveBtn: { background: '#0A8E4E', color: '#FFF', border: 'none', borderRadius: 8, padding: '10px 24px', fontWeight: 700, cursor: 'pointer', fontSize: 14 },
  cancelBtn: { background: '#2A2A2A', color: '#AAA', border: 'none', borderRadius: 8, padding: '10px 24px', fontWeight: 700, cursor: 'pointer', fontSize: 14 },
  searchRow: { marginBottom: 16 },
  searchInput: { width: '100%', background: '#1A1A1A', border: '1px solid #2A2A2A', borderRadius: 10, padding: '12px 16px', color: '#FFF', fontSize: 14, outline: 'none', boxSizing: 'border-box' },
  tableWrap: { overflowX: 'auto' },
  table: { width: '100%', borderCollapse: 'collapse', background: '#1A1A1A', borderRadius: 14, overflow: 'hidden' },
  th: { textAlign: 'left', padding: '12px 16px', color: '#AAA', fontSize: 12, textTransform: 'uppercase', borderBottom: '1px solid #2A2A2A' },
  td: { padding: '12px 16px', borderBottom: '1px solid #2A2A2A', fontSize: 14, color: '#FFF' },
  roleSelect: { background: '#0F0F0F', border: '2px solid', borderRadius: 6, padding: '4px 8px', fontSize: 12, fontWeight: 700, cursor: 'pointer' },
  badge: { padding: '4px 12px', borderRadius: 6, fontWeight: 700, fontSize: 12, display: 'inline-block' },
  permBtn: { background: '#2A2A2A', color: '#FF9500', border: '1px solid #FF9500', borderRadius: 6, padding: '4px 12px', cursor: 'pointer', fontWeight: 700, fontSize: 12 },
  actionGroup: { display: 'flex', gap: 6, flexWrap: 'wrap' },
  dangerSmBtn: { background: '#FF3B30', color: '#FFF', border: 'none', borderRadius: 6, padding: '4px 10px', cursor: 'pointer', fontWeight: 700, fontSize: 12 },
  successSmBtn: { background: '#0A8E4E', color: '#FFF', border: 'none', borderRadius: 6, padding: '4px 10px', cursor: 'pointer', fontWeight: 700, fontSize: 12 },
  masterBtn: { background: '#FF9500', color: '#000', border: 'none', borderRadius: 6, padding: '4px 10px', cursor: 'pointer', fontWeight: 700, fontSize: 12 },
  // Permission panel
  quickRow: { display: 'flex', gap: 8, alignItems: 'center', marginBottom: 24, flexWrap: 'wrap' },
  quickLabel: { color: '#AAA', fontSize: 13, fontWeight: 600 },
  quickBtn: { background: '#1A1A1A', border: '1px solid #2A2A2A', color: '#FFF', borderRadius: 8, padding: '6px 14px', cursor: 'pointer', fontWeight: 600, fontSize: 13 },
  permGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 16 },
  permGroup: { background: '#1A1A1A', borderRadius: 14, padding: 20 },
  permGroupTitle: { color: '#FFF', fontSize: 16, fontWeight: 700, margin: '0 0 12px', paddingBottom: 10, borderBottom: '1px solid #2A2A2A' },
  permRow: { display: 'flex', alignItems: 'center', gap: 10, padding: '8px 0', cursor: 'pointer', borderRadius: 6 },
  toggleIndicator: { width: 24, height: 24, borderRadius: 6, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, fontWeight: 700, color: '#FFF', flexShrink: 0 },
  permLabel: { fontSize: 14 },
  savePermBtn: { background: '#0A8E4E', color: '#FFF', border: 'none', borderRadius: 8, padding: '12px 32px', fontWeight: 700, cursor: 'pointer', fontSize: 15 },
};
