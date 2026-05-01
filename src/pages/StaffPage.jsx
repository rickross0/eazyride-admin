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
      { key: 'users.suspend', label: 'Suspend / Activate Users (not Admins)' },
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

const BUILT_IN_LEVELS = {
  SUPER: { bg: '#3A2800', color: '#FF9500', label: 'Super Admin', level: 3 },
  MANAGER: { bg: '#002A5C', color: '#007AFF', label: 'Manager', level: 2 },
  CARE: { bg: '#003A12', color: '#34C759', label: 'Care Agent', level: 1 },
};

const LEVEL_DEFAULTS = {
  SUPER: ALL_PERM_KEYS,
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
  const [tab, setTab] = useState('staff'); // 'staff' | 'roles'
  const [customRoles, setCustomRoles] = useState([]);
  const [showAddRole, setShowAddRole] = useState(false);
  const [newRole, setNewRole] = useState({ key: '', label: '', level: 1, description: '', color: '#888' });

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

  const fetchCustomRoles = async () => {
    try {
      const { data } = await client.get('/admin/custom-roles');
      setCustomRoles(data.roles || []);
    } catch (e) {
      console.error('Fetch custom roles error:', e);
    }
  };

  useEffect(() => { fetchStaff(); fetchCustomRoles(); }, []);

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
      setStaff(staff.map((s) => s.id === id ? { ...s, adminLevel } : s));
    } catch (err) {
      alert('Failed to update role: ' + (err.response?.data?.error || err.message));
    } finally {
      setSaving(null);
    }
  };

  const handleDeactivate = async (id) => {
    if (!confirm('Deactivate this staff member?')) return;
    try {
      await client.put(`/admin/users/${id}/deactivate`);
      fetchStaff();
    } catch (err) {
      alert('Failed to deactivate: ' + (err.response?.data?.error || err.message));
    }
  };

  const handleActivate = async (id) => {
    try {
      await client.put(`/admin/users/${id}/activate`);
      fetchStaff();
    } catch (err) {
      alert('Failed to activate: ' + (err.response?.data?.error || err.message));
    }
  };

  const handleMasterLogin = async (id) => {
    if (!confirm('Login as this user? You will see the app as they see it.')) return;
    try {
      const { data } = await client.post('/admin/master-login', { userId: id });
      localStorage.setItem('masterToken', data.token);
      window.open('/admin', '_blank');
    } catch (err) {
      alert('Master login failed: ' + (err.response?.data?.error || err.message));
    }
  };

  const handleCreateRole = async (e) => {
    e.preventDefault();
    try {
      const { data } = await client.post('/admin/custom-roles', newRole);
      setCustomRoles(data.roles || []);
      setShowAddRole(false);
      setNewRole({ key: '', label: '', level: 1, description: '', color: '#888' });
    } catch (err) {
      alert('Failed to create role: ' + (err.response?.data?.error || err.message));
    }
  };

  const handleDeleteRole = async (key) => {
    if (!confirm(`Delete custom role '${key}'?`)) return;
    try {
      const { data } = await client.delete(`/admin/custom-roles/${key}`);
      setCustomRoles(data.roles || []);
    } catch (err) {
      alert('Failed to delete role: ' + (err.response?.data?.error || err.message));
    }
  };

  const allLevels = { ...BUILT_IN_LEVELS };
  customRoles.forEach((r) => { allLevels[r.key] = { bg: '#2A2A2A', color: r.color, label: r.label, level: r.level }; });

  const filteredStaff = search
    ? staff.filter((s) => `${s.firstName} ${s.lastName} ${s.phone} ${s.email} ${s.adminLevel}`.toLowerCase().includes(search.toLowerCase()))
    : staff;

  if (loading) return <p style={{ color: '#AAA' }}>Loading staff...</p>;

  // ── Roles Tab ──
  if (tab === 'roles') {
    const sortedRoles = Object.entries(allLevels).sort((a, b) => b[1].level - a[1].level);
    return (
      <div>
        <div style={styles.header}>
          <div>
            <button style={styles.backBtn} onClick={() => setTab('staff')}>← Back to Staff</button>
            <h1 style={styles.title}>Admin Roles & Privileges</h1>
            <p style={styles.subtitle}>Manage custom roles. Built-in roles cannot be modified.</p>
          </div>
          <button style={styles.addBtn} onClick={() => setShowAddRole(true)}>+ Create New Role</button>
        </div>

        {showAddRole && (
          <form onSubmit={handleCreateRole} style={styles.formCard}>
            <h3 style={styles.formTitle}>Create Custom Role</h3>
            <div style={styles.formGrid}>
              <input style={styles.input} placeholder="Role Key (e.g. FINANCE)" value={newRole.key} onChange={(e) => setNewRole({ ...newRole, key: e.target.value.toUpperCase().replace(/[^A-Z0-9_]/g, '') })} required />
              <input style={styles.input} placeholder="Display Label (e.g. Finance Officer)" value={newRole.label} onChange={(e) => setNewRole({ ...newRole, label: e.target.value })} required />
              <select style={styles.select} value={newRole.level} onChange={(e) => setNewRole({ ...newRole, level: parseInt(e.target.value) })}>
                <option value={1}>Level 1 (Same as Care Agent)</option>
                <option value={2}>Level 2 (Same as Manager)</option>
                <option value={3}>Level 3 (Same as Super Admin)</option>
              </select>
              <input type="color" style={{ ...styles.input, padding: 4, height: 40 }} value={newRole.color} onChange={(e) => setNewRole({ ...newRole, color: e.target.value })} />
              <input style={styles.input} placeholder="Description (optional)" value={newRole.description} onChange={(e) => setNewRole({ ...newRole, description: e.target.value })} />
            </div>
            <div style={styles.formActions}>
              <button type="submit" style={styles.saveBtn}>Create Role</button>
              <button type="button" style={styles.cancelBtn} onClick={() => setShowAddRole(false)}>Cancel</button>
            </div>
          </form>
        )}

        <div style={styles.tableWrap}>
          <table style={styles.table}>
            <thead><tr>
              <th style={styles.th}>Color</th>
              <th style={styles.th}>Key</th>
              <th style={styles.th}>Label</th>
              <th style={styles.th}>Level</th>
              <th style={styles.th}>Description</th>
              <th style={styles.th}>Staff Using</th>
              <th style={styles.th}>Type</th>
              <th style={styles.th}>Actions</th>
            </tr></thead>
            <tbody>
              {sortedRoles.map(([key, info]) => {
                const isBuiltIn = ['SUPER', 'MANAGER', 'CARE'].includes(key);
                const usersCount = staff.filter(s => s.adminLevel === key).length;
                return (
                  <tr key={key}>
                    <td style={styles.td}><div style={{ width: 20, height: 20, borderRadius: 4, background: info.color }} /></td>
                    <td style={styles.td}><code style={expandedStyles.code}>{key}</code></td>
                    <td style={styles.td}><span style={{ color: info.color, fontWeight: 700 }}>{info.label}</span></td>
                    <td style={styles.td}><span style={{ ...styles.badge, background: info.bg, color: info.color, padding: '4px 12px', borderRadius: 6 }}>Lvl {info.level}</span></td>
                    <td style={styles.td}>{info.description || '—'}</td>
                    <td style={styles.td}>{usersCount}</td>
                    <td style={styles.td}>{isBuiltIn ? <span style={{ color: '#FF9500' }}>🔒 Built-in</span> : <span style={{ color: '#34C759' }}>✨ Custom</span>}</td>
                    <td style={styles.td}>
                      {isBuiltIn ? (
                        <span style={{ color: '#555' }}>Cannot modify</span>
                      ) : (
                        <button style={styles.dangerSmBtn} onClick={() => handleDeleteRole(key)}>Delete</button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        <div style={{ marginTop: 32, padding: 20, background: '#1A1A1A', borderRadius: 14 }}>
          <h3 style={{ color: '#FFF', fontSize: 16, fontWeight: 700, marginBottom: 12 }}>🔒 Permission Rules</h3>
          <ul style={{ color: '#AAA', fontSize: 14, lineHeight: 2, paddingLeft: 20 }}>
            <li><strong style={{ color: '#FF9500' }}>Super Admin (Level 3)</strong> — Full access to everything. Can manage staff, roles, system settings.</li>
            <li><strong style={{ color: '#007AFF' }}>Manager (Level 2)</strong> — Can view/manage users, restaurants, providers, cars, reports. Cannot manage staff or system settings.</li>
            <li><strong style={{ color: '#34C759' }}>Care Agent (Level 1)</strong> — Can view users, approve drivers, view rides/orders. <strong style={{ color: '#FF3B30' }}>Cannot suspend or activate Admin/Super Admin accounts.</strong></li>
            <li><strong style={{ color: '#888' }}>Custom Roles</strong> — Created by Super Admin. Level determines hierarchy (higher = more access). Permissions are assigned per-user via the 🔐 button.</li>
          </ul>
        </div>
      </div>
    );
  }

  // ── Staff Tab (with permissions panel) ──
  if (selectedStaff) {
    const level = allLevels[selectedStaff.adminLevel] || { color: '#888', label: selectedStaff.adminLevel };
    const permCount = ALL_PERM_KEYS.filter((key) => staffPerms[key]).length;
    const totalPerms = ALL_PERM_KEYS.length;

    return (
      <div>
        <div style={styles.header}>
          <div>
            <button style={styles.backBtn} onClick={closePermissions}>← Back to Staff</button>
            <h1 style={styles.title}>Permissions: {selectedStaff.firstName} {selectedStaff.lastName}</h1>
            <p style={styles.subtitle}>
              Role: <span style={{ color: level.color, fontWeight: 700 }}>{level.label || selectedStaff.adminLevel}</span> · {selectedStaff.phone} · {selectedStaff.email}
            </p>
          </div>
        </div>

        <div style={styles.quickRow}>
          <span style={styles.quickLabel}>Apply template:</span>
          <button style={styles.quickBtn} onClick={() => applyLevelDefaults('SUPER')}>Super Admin (all)</button>
          <button style={styles.quickBtn} onClick={() => applyLevelDefaults('MANAGER')}>Manager</button>
          <button style={styles.quickBtn} onClick={() => applyLevelDefaults('CARE')}>Care Agent</button>
          <button style={{ ...styles.quickBtn, color: '#FF3B30' }} onClick={() => { const p = {}; ALL_PERM_KEYS.forEach(k => p[k] = false); setStaffPerms(p); }}>None</button>
        </div>

        {permLoading ? <p style={{ color: '#AAA' }}>Loading permissions...</p> : (
          <div style={styles.permGrid}>
            {PERMISSION_GROUPS.map((group) => (
              <div key={group.group} style={styles.permGroup}>
                <h3 style={styles.permGroupTitle}>{group.group}</h3>
                {group.perms.map((p) => (
                  <div key={p.key} style={styles.permRow} onClick={() => togglePerm(p.key)}>
                    <div style={{ ...styles.toggleIndicator, background: staffPerms[p.key] ? '#0A8E4E' : '#333' }}>
                      {staffPerms[p.key] ? '✓' : '—'}
                    </div>
                    <span style={styles.permLabel}>{p.label}</span>
                  </div>
                ))}
              </div>
            ))}
          </div>
        )}

        <div style={{ display: 'flex', gap: 12, marginTop: 24, alignItems: 'center' }}>
          <button style={styles.savePermBtn} onClick={savePermissions} disabled={permSaving}>
            {permSaving ? 'Saving...' : `💾 Save Permissions (${permCount}/${totalPerms})`}
          </button>
          <button style={{ ...styles.cancelBtn, color: '#FF3B30' }} onClick={revokeAll}>🗑️ Revoke All</button>
        </div>
      </div>
    );
  }

  const totalPerms = ALL_PERM_KEYS.length;

  return (
    <div>
      <div style={styles.header}>
        <div>
          <h1 style={styles.title}>Staff Management</h1>
          <p style={styles.subtitle}>Manage admin staff, care agents, and their role privileges.</p>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button style={styles.addBtn} onClick={() => setTab('roles')}>🔐 Roles & Privileges</button>
          <button style={styles.addBtn} onClick={() => setShowAdd(true)}>+ Add Staff</button>
        </div>
      </div>

      {showAdd && (
        <form onSubmit={handleCreate} style={styles.formCard}>
          <h3 style={styles.formTitle}>Create New Staff Member</h3>
          <div style={styles.formGrid}>
            <input style={styles.input} placeholder="First Name" value={newStaff.firstName} onChange={(e) => setNewStaff({ ...newStaff, firstName: e.target.value })} required />
            <input style={styles.input} placeholder="Last Name" value={newStaff.lastName} onChange={(e) => setNewStaff({ ...newStaff, lastName: e.target.value })} required />
            <input style={styles.input} placeholder="Phone (+252...)" value={newStaff.phone} onChange={(e) => setNewStaff({ ...newStaff, phone: e.target.value })} required />
            <input style={styles.input} placeholder="Email" type="email" value={newStaff.email} onChange={(e) => setNewStaff({ ...newStaff, email: e.target.value })} required />
            <input style={styles.input} placeholder="Password" type="password" value={newStaff.password} onChange={(e) => setNewStaff({ ...newStaff, password: e.target.value })} required />
            <select style={styles.select} value={newStaff.adminLevel} onChange={(e) => setNewStaff({ ...newStaff, adminLevel: e.target.value })}>
              <option value="CARE">Care Agent</option>
              <option value="MANAGER">Manager</option>
              {customRoles.map((r) => <option key={r.key} value={r.key}>{r.label} (Custom)</option>)}
            </select>
          </div>
          <div style={styles.formActions}>
            <button type="submit" style={styles.saveBtn} disabled={saving === 'create'}>{saving === 'create' ? 'Creating...' : 'Create Staff'}</button>
            <button type="button" style={styles.cancelBtn} onClick={() => setShowAdd(false)}>Cancel</button>
          </div>
        </form>
      )}

      <div style={styles.searchRow}>
        <input style={styles.searchInput} placeholder="🔍 Search staff by name, phone, email, or role..." value={search} onChange={(e) => setSearch(e.target.value)} />
      </div>

      <div style={styles.tableWrap}>
        <table style={styles.table}>
          <thead><tr>
            <th style={styles.th}>Name</th>
            <th style={styles.th}>Phone</th>
            <th style={styles.th}>Email</th>
            <th style={styles.th}>Role / Level</th>
            <th style={styles.th}>Status</th>
            <th style={styles.th}>Permissions</th>
            <th style={styles.th}>Created</th>
            <th style={styles.th}>Actions</th>
          </tr></thead>
          <tbody>
            {filteredStaff.map((s) => {
              const level = allLevels[s.adminLevel] || { color: '#888', label: s.adminLevel, bg: '#1A1A1A' };
              const permCount = s.permissions ? s.permissions.filter((p) => p.granted).length : 0;
              return (
                <tr key={s.id}>
                  <td style={styles.td}>{s.firstName} {s.lastName}</td>
                  <td style={styles.td}>{s.phone}</td>
                  <td style={styles.td}>{s.email}</td>
                  <td style={styles.td}>
                    <select
                      style={{ ...styles.roleSelect, borderColor: level.color, color: level.color }}
                      value={s.adminLevel || 'CARE'}
                      onChange={(e) => handleRoleChange(s.id, e.target.value)}
                      disabled={saving === s.id}
                    >
                      <option value="CARE">🟢 Care Agent</option>
                      <option value="MANAGER">🔵 Manager</option>
                      <option value="SUPER">🟠 Super Admin</option>
                      {customRoles.map((r) => <option key={r.key} value={r.key}>✨ {r.label}</option>)}
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
  subtitle: { color: '#AAA', fontSize: 14, marginBottom: 24 },
  addBtn: { background: '#0A8E4E', color: '#FFF', border: 'none', borderRadius: 10, padding: '10px 24px', fontWeight: 700, cursor: 'pointer', fontSize: 14 },
  backBtn: { background: '#2A2A2A', color: '#FFF', border: '1px solid #444', borderRadius: 10, padding: '10px 20px', fontWeight: 700, cursor: 'pointer', fontSize: 14, marginBottom: 8 },
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

const expandedStyles = {
  code: { background: '#0A0A0A', padding: '2px 8px', borderRadius: 4, fontSize: 12, color: '#0AF', fontFamily: 'monospace', wordBreak: 'break-all' },
};
