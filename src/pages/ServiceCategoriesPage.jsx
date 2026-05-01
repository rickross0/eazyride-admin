import React, { useState, useEffect } from 'react';
import client from '../api/client';

const EMPTY_CATEGORY = {
  name: '', description: '', emoji: '', color: '#0A8E4E', slug: '',
  requiresScheduling: false, requiresLocation: false, requiresDeposit: false,
  defaultDeposit: 0, minPrice: 0, maxPrice: 0, displayOrder: 0,
};

export default function ServiceCategoriesPage() {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editId, setEditId] = useState(null);
  const [form, setForm] = useState({ ...EMPTY_CATEGORY });
  const [saving, setSaving] = useState(false);

  const fetchCategories = async () => {
    try {
      const { data } = await client.get('/admin/services/categories');
      setCategories(data.categories || []);
    } catch (e) {
      console.error('Fetch categories error:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchCategories(); }, []);

  const openCreate = () => {
    setEditId(null);
    setForm({ ...EMPTY_CATEGORY });
    setModalOpen(true);
  };

  const openEdit = (cat) => {
    setEditId(cat.id);
    setForm({
      name: cat.name || '', description: cat.description || '', emoji: cat.emoji || '',
      color: cat.color || '#0A8E4E', slug: cat.slug || '',
      requiresScheduling: cat.requiresScheduling || false, requiresLocation: cat.requiresLocation || false,
      requiresDeposit: cat.requiresDeposit || false, defaultDeposit: cat.defaultDeposit || 0,
      minPrice: cat.minPrice || 0, maxPrice: cat.maxPrice || 0, displayOrder: cat.displayOrder || 0,
    });
    setModalOpen(true);
  };

  const handleSave = async () => {
    if (!form.name || !form.slug) { alert('Name and slug are required'); return; }
    setSaving(true);
    try {
      if (editId) {
        await client.put(`/admin/services/categories/${editId}`, form);
      } else {
        await client.post('/admin/services/categories', form);
      }
      setModalOpen(false);
      await fetchCategories();
    } catch (e) {
      alert('Failed: ' + (e.response?.data?.error || e.message));
    } finally {
      setSaving(false);
    }
  };

  const deleteCategory = async (id, name) => {
    if (!window.confirm(`Delete "${name}"? This cannot be undone.`)) return;
    try {
      await client.delete(`/admin/services/categories/${id}`);
      setCategories(prev => prev.filter(c => c.id !== id));
    } catch (e) {
      alert('Failed: ' + (e.response?.data?.error || e.message));
    }
  };

  const toggleActive = async (cat) => {
    try {
      await client.put(`/admin/services/categories/${cat.id}`, { isActive: !cat.isActive });
      setCategories(prev => prev.map(c => c.id === cat.id ? { ...c, isActive: !c.isActive } : c));
    } catch (e) {
      alert('Failed to toggle');
    }
  };

  const filtered = categories.filter(c => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (c.name || '').toLowerCase().includes(q) || (c.slug || '').toLowerCase().includes(q) || (c.emoji || '').includes(search);
  });

  if (loading) return <p style={{ color: '#AAA', padding: 40 }}>Loading...</p>;

  return (
    <div>
      <div style={styles.headerRow}>
        <h1 style={styles.title}>Service Categories</h1>
        <button style={styles.addBtn} onClick={openCreate}>+ Add Category</button>
      </div>

      <div style={styles.searchRow}>
        <input style={styles.searchInput} placeholder="Search by name, slug, or emoji..." value={search} onChange={e => setSearch(e.target.value)} />
      </div>

      <div style={styles.tableWrap}>
        <table style={styles.table}>
          <thead><tr>
            <th style={styles.th}>Emoji</th>
            <th style={styles.th}>Name</th>
            <th style={styles.th}>Slug</th>
            <th style={styles.th}>Color</th>
            <th style={styles.th}>Deposit</th>
            <th style={styles.th}>Price Range</th>
            <th style={styles.th}>Order</th>
            <th style={styles.th}>Active</th>
            <th style={styles.th}>Actions</th>
          </tr></thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr><td colSpan={9} style={{ ...styles.td, textAlign: 'center', color: '#AAA' }}>No categories found</td></tr>
            ) : filtered.map(cat => (
              <tr key={cat.id}>
                <td style={styles.td}><span style={{ fontSize: 22 }}>{cat.emoji || '—'}</span></td>
                <td style={styles.td}>{cat.name}</td>
                <td style={styles.td}><code style={styles.slug}>{cat.slug}</code></td>
                <td style={styles.td}>
                  <span style={{ ...styles.colorDot, background: cat.color || '#0A8E4E' }} />
                  <span style={{ color: '#AAA', fontSize: 12, marginLeft: 6 }}>{cat.color}</span>
                </td>
                <td style={styles.td}>{cat.requiresDeposit ? `$${cat.defaultDeposit || 0}` : '—'}</td>
                <td style={styles.td}>${cat.minPrice || 0} – ${cat.maxPrice || 0}</td>
                <td style={styles.td}>{cat.displayOrder ?? 0}</td>
                <td style={styles.td}>
                  <button style={{ ...styles.toggleBtn, ...(cat.isActive ? styles.toggleOn : {}) }} onClick={() => toggleActive(cat)}>
                    {cat.isActive ? 'Active' : 'Inactive'}
                  </button>
                </td>
                <td style={styles.td}>
                  <button style={styles.editBtn} onClick={() => openEdit(cat)}>Edit</button>
                  <button style={styles.deleteBtn} onClick={() => deleteCategory(cat.id, cat.name)}>Delete</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {modalOpen && (
        <div style={styles.modalOverlay} onClick={() => setModalOpen(false)}>
          <div style={styles.modalCard} onClick={e => e.stopPropagation()}>
            <h2 style={styles.modalTitle}>{editId ? '✏️ Edit Category' : '➕ New Category'}</h2>
            <div style={styles.formGrid}>
              <label style={styles.label}>Name *</label>
              <input style={styles.input} value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="e.g. Gas Delivery" />
              <label style={styles.label}>Slug *</label>
              <input style={styles.input} value={form.slug} onChange={e => setForm({ ...form, slug: e.target.value })} placeholder="e.g. gas-delivery" />
              <label style={styles.label}>Emoji</label>
              <input style={styles.input} value={form.emoji} onChange={e => setForm({ ...form, emoji: e.target.value })} placeholder="⛽" />
              <label style={styles.label}>Color</label>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <input type="color" value={form.color} onChange={e => setForm({ ...form, color: e.target.value })} style={styles.colorPicker} />
                <input style={{ ...styles.input, flex: 1 }} value={form.color} onChange={e => setForm({ ...form, color: e.target.value })} />
              </div>
              <label style={styles.label}>Description</label>
              <textarea style={styles.textarea} value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} placeholder="Short description..." rows={3} />
              <label style={styles.label}>Display Order</label>
              <input type="number" style={styles.input} value={form.displayOrder} onChange={e => setForm({ ...form, displayOrder: parseInt(e.target.value) || 0 })} />
              <label style={styles.label}>Min Price</label>
              <input type="number" style={styles.input} value={form.minPrice} onChange={e => setForm({ ...form, minPrice: parseFloat(e.target.value) || 0 })} />
              <label style={styles.label}>Max Price</label>
              <input type="number" style={styles.input} value={form.maxPrice} onChange={e => setForm({ ...form, maxPrice: parseFloat(e.target.value) || 0 })} />
              <label style={styles.label}>Default Deposit</label>
              <input type="number" style={styles.input} value={form.defaultDeposit} onChange={e => setForm({ ...form, defaultDeposit: parseFloat(e.target.value) || 0 })} />
            </div>
            <div style={styles.checkboxRow}>
              <label style={styles.checkboxLabel}><input type="checkbox" checked={form.requiresScheduling} onChange={e => setForm({ ...form, requiresScheduling: e.target.checked })} /> Requires Scheduling</label>
              <label style={styles.checkboxLabel}><input type="checkbox" checked={form.requiresLocation} onChange={e => setForm({ ...form, requiresLocation: e.target.checked })} /> Requires Location</label>
              <label style={styles.checkboxLabel}><input type="checkbox" checked={form.requiresDeposit} onChange={e => setForm({ ...form, requiresDeposit: e.target.checked })} /> Requires Deposit</label>
            </div>
            <div style={styles.modalActions}>
              <button style={styles.cancelBtn} onClick={() => setModalOpen(false)}>Cancel</button>
              <button style={styles.saveBtn} onClick={handleSave} disabled={saving}>{saving ? 'Saving...' : 'Save'}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

const styles = {
  title: { fontSize: 28, fontWeight: 800, color: '#FFF', marginBottom: 0 },
  headerRow: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 },
  addBtn: { background: '#0A8E4E', color: '#FFF', border: 'none', borderRadius: 10, padding: '10px 24px', cursor: 'pointer', fontWeight: 700, fontSize: 14 },
  searchRow: { marginBottom: 16 },
  searchInput: { width: '100%', background: '#1A1A1A', border: '1px solid #2A2A2A', borderRadius: 10, padding: '12px 16px', color: '#FFF', fontSize: 14, outline: 'none', boxSizing: 'border-box' },
  tableWrap: { overflowX: 'auto' },
  table: { width: '100%', borderCollapse: 'collapse', background: '#1A1A1A', borderRadius: 14, overflow: 'hidden' },
  th: { textAlign: 'left', padding: '12px 16px', color: '#AAA', fontSize: 12, textTransform: 'uppercase', borderBottom: '1px solid #2A2A2A' },
  td: { padding: '12px 16px', borderBottom: '1px solid #2A2A2A', fontSize: 14, color: '#FFF' },
  slug: { background: '#0F0F0F', padding: '2px 8px', borderRadius: 4, fontSize: 13, color: '#5856D6' },
  colorDot: { display: 'inline-block', width: 14, height: 14, borderRadius: 7, verticalAlign: 'middle' },
  toggleBtn: { background: '#2A2A2A', color: '#AAA', border: '1px solid #3A3A3A', borderRadius: 8, padding: '6px 14px', cursor: 'pointer', fontWeight: 700, fontSize: 12 },
  toggleOn: { background: '#0A8E4E22', color: '#34C759', borderColor: '#34C759' },
  editBtn: { background: '#007AFF', color: '#FFF', border: 'none', borderRadius: 8, padding: '6px 14px', cursor: 'pointer', fontWeight: 700, fontSize: 13, marginRight: 6 },
  deleteBtn: { background: '#2A2A2A', color: '#FF3B30', border: '1px solid #FF3B30', borderRadius: 8, padding: '6px 14px', cursor: 'pointer', fontWeight: 700, fontSize: 13 },
  // Modal
  modalOverlay: { position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 },
  modalCard: { background: '#1A1A1A', borderRadius: 16, padding: 32, width: 520, maxHeight: '85vh', overflowY: 'auto', boxShadow: '0 8px 32px rgba(0,0,0,.5)' },
  modalTitle: { color: '#FFF', fontSize: 20, fontWeight: 800, margin: '0 0 20px' },
  formGrid: { display: 'grid', gridTemplateColumns: '140px 1fr', gap: 12, alignItems: 'start' },
  label: { color: '#AAA', fontSize: 13, fontWeight: 600, paddingTop: 10 },
  input: { width: '100%', background: '#0F0F0F', border: '1px solid #2A2A2A', borderRadius: 10, padding: '10px 14px', fontSize: 14, color: '#FFF', outline: 'none', boxSizing: 'border-box' },
  textarea: { width: '100%', background: '#0F0F0F', border: '1px solid #2A2A2A', borderRadius: 10, padding: '10px 14px', fontSize: 14, color: '#FFF', outline: 'none', boxSizing: 'border-box', resize: 'vertical' },
  colorPicker: { width: 40, height: 36, border: '1px solid #2A2A2A', borderRadius: 8, background: '#0F0F0F', cursor: 'pointer', padding: 2 },
  checkboxRow: { display: 'flex', gap: 20, margin: '16px 0', flexWrap: 'wrap' },
  checkboxLabel: { color: '#FFF', fontSize: 13, display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer' },
  modalActions: { display: 'flex', gap: 12, justifyContent: 'flex-end', marginTop: 16 },
  cancelBtn: { background: '#2A2A2A', color: '#AAA', border: '1px solid #3A3A3A', borderRadius: 8, padding: '10px 20px', cursor: 'pointer', fontWeight: 700, fontSize: 14 },
  saveBtn: { background: '#0A8E4E', color: '#FFF', border: 'none', borderRadius: 8, padding: '10px 20px', cursor: 'pointer', fontWeight: 700, fontSize: 14 },
};
