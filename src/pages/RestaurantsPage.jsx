import React, { useState, useEffect } from 'react';
import client from '../api/client';

export default function RestaurantsPage() {
  const [tab, setTab] = useState('restaurants');
  const [restaurants, setRestaurants] = useState([]);
  const [menuItems, setMenuItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showRestaurantForm, setShowRestaurantForm] = useState(false);
  const [showMenuItemForm, setShowMenuItemForm] = useState(false);
  const [editingRestaurant, setEditingRestaurant] = useState(null);
  const [editingMenuItem, setEditingMenuItem] = useState(null);

  const [restaurantForm, setRestaurantForm] = useState({
    name: '', description: '', cuisine: '', address: '', phone: '', image: '',
  });
  const [restaurantPhoto, setRestaurantPhoto] = useState(null);
  const [menuItemPhoto, setMenuItemPhoto] = useState(null);
  const [search, setSearch] = useState('');
  const [menuItemForm, setMenuItemForm] = useState({
    restaurantId: '', name: '', description: '', price: '', category: '', image: '', preparationTime: '', isPopular: false,
  });

  const fetchData = async () => {
    try {
      const [rRes, mRes] = await Promise.all([
        client.get('/restaurants?limit=100'),
        client.get('/menu?limit=200'),
      ]);
      setRestaurants(rRes.data.restaurants || []);
      setMenuItems(mRes.data.items || []);
    } catch (e) {
      console.error('Fetch error:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  // Restaurant CRUD
  const handleRestaurantSubmit = async (e) => {
    e.preventDefault();
    try {
      const formData = new FormData();
      Object.entries(restaurantForm).forEach(([key, val]) => {
        if (val !== '' || key === 'image') formData.append(key, val);
      });
      if (restaurantPhoto) formData.append('photo', restaurantPhoto);

      if (editingRestaurant) {
        await client.put(`/restaurants/${editingRestaurant.id}`, formData, { headers: { 'Content-Type': 'multipart/form-data' } });
      } else {
        await client.post('/restaurants', formData, { headers: { 'Content-Type': 'multipart/form-data' } });
      }
      setShowRestaurantForm(false);
      setEditingRestaurant(null);
      setRestaurantForm({ name: '', description: '', cuisine: '', address: '', phone: '', image: '' });
      fetchData();
    } catch (e) {
      alert('Failed to save restaurant: ' + (e.response?.data?.error || e.message));
    }
  };

  const handleEditRestaurant = (r) => {
    setEditingRestaurant(r);
    setRestaurantForm({
      name: r.name, description: r.description || '', cuisine: r.cuisine, address: r.address, phone: r.phone || '', image: r.image || '',
    });
    setShowRestaurantForm(true);
  };

  const handleDeleteRestaurant = async (id) => {
    if (!window.confirm('Deactivate this restaurant?')) return;
    try {
      await client.delete(`/restaurants/${id}`);
      fetchData();
    } catch (e) {
      alert('Failed to delete restaurant');
    }
  };

  const cancelRestaurantForm = () => {
    setShowRestaurantForm(false);
    setEditingRestaurant(null);
    setRestaurantForm({ name: '', description: '', cuisine: '', address: '', phone: '', image: '' });
    setRestaurantPhoto(null);
  };

  // Menu Item CRUD
  const handleMenuItemSubmit = async (e) => {
    e.preventDefault();
    try {
      const formData = new FormData();
      formData.append('restaurantId', menuItemForm.restaurantId);
      formData.append('name', menuItemForm.name);
      formData.append('price', menuItemForm.price);
      formData.append('category', menuItemForm.category);
      if (menuItemForm.description) formData.append('description', menuItemForm.description);
      if (menuItemForm.image) formData.append('image', menuItemForm.image);
      if (menuItemForm.preparationTime) formData.append('preparationTime', menuItemForm.preparationTime);
      if (menuItemForm.isPopular) formData.append('isPopular', 'true');
      if (menuItemPhoto) formData.append('photo', menuItemPhoto);

      if (editingMenuItem) {
        await client.put(`/menu/${editingMenuItem.id}`, formData, { headers: { 'Content-Type': 'multipart/form-data' } });
      } else {
        await client.post('/menu', formData, { headers: { 'Content-Type': 'multipart/form-data' } });
      }
      setShowMenuItemForm(false);
      setEditingMenuItem(null);
      setMenuItemForm({ restaurantId: '', name: '', description: '', price: '', category: '', image: '', preparationTime: '', isPopular: false });
      fetchData();
    } catch (e) {
      alert('Failed to save menu item: ' + (e.response?.data?.error || e.message));
    }
  };

  const handleEditMenuItem = (m) => {
    setEditingMenuItem(m);
    setMenuItemForm({
      restaurantId: m.restaurantId,
      name: m.name, description: m.description || '', price: m.price.toString(), category: m.category,
      image: m.image || '', preparationTime: m.preparationTime ? m.preparationTime.toString() : '',
      isPopular: m.isPopular,
    });
    setShowMenuItemForm(true);
  };

  const handleDeleteMenuItem = async (id) => {
    if (!window.confirm('Mark this menu item as unavailable?')) return;
    try {
      await client.delete(`/menu/${id}`);
      fetchData();
    } catch (e) {
      alert('Failed to delete menu item');
    }
  };

  const cancelMenuItemForm = () => {
    setShowMenuItemForm(false);
    setEditingMenuItem(null);
    setMenuItemForm({ restaurantId: '', name: '', description: '', price: '', category: '', image: '', preparationTime: '', isPopular: false });
    setMenuItemPhoto(null);
  };

  const restaurantMap = {};
  restaurants.forEach((r) => { restaurantMap[r.id] = r.name; });

  const inputStyle = {
    background: '#0F0F0F', border: '1px solid #2A2A2A', borderRadius: 8, padding: '10px 12px',
    color: '#FFF', fontSize: 14, width: '100%', boxSizing: 'border-box', outline: 'none',
  };

  return (
    <div>
      <h1 style={styles.title}>Restaurant & Menu Management</h1>

      <div style={styles.tabRow}>
        {['restaurants', 'menuItems'].map((t) => (
          <button key={t} onClick={() => setTab(t)} style={{ ...styles.tabBtn, ...(tab === t && styles.tabActive) }}>
            {t === 'restaurants' ? 'Restaurants' : 'Menu Items'}
          </button>
        ))}
      </div>

      {tab === 'restaurants' && (
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <span style={{ color: '#AAA', fontSize: 14 }}>{restaurants.length} restaurants</span>
            <button style={styles.primaryBtn} onClick={() => { setShowRestaurantForm(!showRestaurantForm); setEditingRestaurant(null); setRestaurantForm({ name: '', description: '', cuisine: '', address: '', phone: '', image: '' }); }}>
              {showRestaurantForm ? 'Cancel' : '+ Add Restaurant'}
            </button>
          </div>

          {showRestaurantForm && (
            <div style={styles.card}>
              <h3 style={{ color: '#FFF', marginBottom: 16, fontSize: 16 }}>{editingRestaurant ? 'Edit Restaurant' : 'New Restaurant'}</h3>
              <form onSubmit={handleRestaurantSubmit} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <input style={inputStyle} placeholder="Name *" value={restaurantForm.name} onChange={(e) => setRestaurantForm({ ...restaurantForm, name: e.target.value })} required />
                <input style={inputStyle} placeholder="Cuisine *" value={restaurantForm.cuisine} onChange={(e) => setRestaurantForm({ ...restaurantForm, cuisine: e.target.value })} required />
                <input style={{ ...inputStyle, gridColumn: '1 / -1' }} placeholder="Description" value={restaurantForm.description} onChange={(e) => setRestaurantForm({ ...restaurantForm, description: e.target.value })} />
                <input style={{ ...inputStyle, gridColumn: '1 / -1' }} placeholder="Address *" value={restaurantForm.address} onChange={(e) => setRestaurantForm({ ...restaurantForm, address: e.target.value })} required />
                <input style={inputStyle} placeholder="Phone" value={restaurantForm.phone} onChange={(e) => setRestaurantForm({ ...restaurantForm, phone: e.target.value })} />
                <input style={inputStyle} placeholder="Image URL (or upload below)" value={restaurantForm.image} onChange={(e) => setRestaurantForm({ ...restaurantForm, image: e.target.value })} />
                <label style={{ color: '#AAA', fontSize: 13, display: 'block', marginBottom: 4, marginTop: 4 }}>Or upload photo:</label>
                <input type="file" accept="image/*" style={{ ...inputStyle, padding: '8px 12px' }} onChange={(e) => setRestaurantPhoto(e.target.files[0])} />
                <div style={{ gridColumn: '1 / -1', display: 'flex', gap: 8 }}>
                  <button type="submit" style={styles.primaryBtn}>{editingRestaurant ? 'Update' : 'Create'}</button>
                  <button type="button" style={styles.cancelBtn} onClick={cancelRestaurantForm}>Cancel</button>
                </div>
              </form>
            </div>
          )}

          {loading ? <p style={{ color: '#AAA' }}>Loading...</p> : (
            <div style={styles.tableWrap}>
              <table style={styles.table}>
                <thead>
                  <tr>
                    <th style={styles.th}>Name</th>
                    <th style={styles.th}>Cuisine</th>
                    <th style={styles.th}>Phone</th>
                    <th style={styles.th}>Status</th>
                    <th style={styles.th}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {restaurants.filter((r) => {
                  if (!search) return true;
                  const q = search.toLowerCase();
                  return (r.name || '').toLowerCase().includes(q) || (r.cuisine || '').toLowerCase().includes(q) || (r.address || '').toLowerCase().includes(q) || (r.phone || '').toLowerCase().includes(q);
                }).map((r) => (
                    <tr key={r.id}>
                      <td style={styles.td}>{r.name}</td>
                      <td style={styles.td}><span style={styles.badge}>{r.cuisine}</span></td>
                      <td style={styles.td}>{r.phone || '\u2014'}</td>
                      <td style={styles.td}><span style={{ color: r.isActive ? '#34C759' : '#FF3B30' }}>{r.isActive ? 'Active' : 'Inactive'}</span></td>
                      <td style={styles.td}>
                        <div style={{ display: 'flex', gap: 8 }}>
                          <button style={styles.editBtn} onClick={() => handleEditRestaurant(r)}>Edit</button>
                          <button style={styles.dangerBtn} onClick={() => handleDeleteRestaurant(r.id)}>Delete</button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {tab === 'menuItems' && (
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <span style={{ color: '#AAA', fontSize: 14 }}>{menuItems.length} menu items</span>
            <button style={styles.primaryBtn} onClick={() => { setShowMenuItemForm(!showMenuItemForm); setEditingMenuItem(null); setMenuItemForm({ restaurantId: '', name: '', description: '', price: '', category: '', image: '', preparationTime: '', isPopular: false }); }}>
              {showMenuItemForm ? 'Cancel' : '+ Add Menu Item'}
            </button>
          </div>

          {showMenuItemForm && (
            <div style={styles.card}>
              <h3 style={{ color: '#FFF', marginBottom: 16, fontSize: 16 }}>{editingMenuItem ? 'Edit Menu Item' : 'New Menu Item'}</h3>
              <form onSubmit={handleMenuItemSubmit} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <select style={inputStyle} value={menuItemForm.restaurantId} onChange={(e) => setMenuItemForm({ ...menuItemForm, restaurantId: e.target.value })} required>
                  <option value="">Select Restaurant *</option>
                  {restaurants.map((r) => <option key={r.id} value={r.id}>{r.name}</option>)}
                </select>
                <input style={inputStyle} placeholder="Name *" value={menuItemForm.name} onChange={(e) => setMenuItemForm({ ...menuItemForm, name: e.target.value })} required />
                <input style={{ ...inputStyle, gridColumn: '1 / -1' }} placeholder="Description" value={menuItemForm.description} onChange={(e) => setMenuItemForm({ ...menuItemForm, description: e.target.value })} />
                <input style={inputStyle} placeholder="Price *" type="number" step="0.01" min="0" value={menuItemForm.price} onChange={(e) => setMenuItemForm({ ...menuItemForm, price: e.target.value })} required />
                <input style={inputStyle} placeholder="Category *" value={menuItemForm.category} onChange={(e) => setMenuItemForm({ ...menuItemForm, category: e.target.value })} required />
                <input style={inputStyle} placeholder="Image URL (or upload below)" value={menuItemForm.image} onChange={(e) => setMenuItemForm({ ...menuItemForm, image: e.target.value })} />
                <label style={{ color: '#AAA', fontSize: 13, display: 'block', marginBottom: 4, marginTop: 4 }}>Or upload photo:</label>
                <input type="file" accept="image/*" style={{ ...inputStyle, padding: '8px 12px' }} onChange={(e) => setMenuItemPhoto(e.target.files[0])} />
                <input style={inputStyle} placeholder="Prep Time (min)" type="number" min="0" value={menuItemForm.preparationTime} onChange={(e) => setMenuItemForm({ ...menuItemForm, preparationTime: e.target.value })} />
                <label style={{ color: '#AAA', fontSize: 14, display: 'flex', alignItems: 'center', gap: 8 }}>
                  <input type="checkbox" checked={menuItemForm.isPopular} onChange={(e) => setMenuItemForm({ ...menuItemForm, isPopular: e.target.checked })} />
                  Popular
                </label>
                <div style={{ gridColumn: '1 / -1', display: 'flex', gap: 8 }}>
                  <button type="submit" style={styles.primaryBtn}>{editingMenuItem ? 'Update' : 'Create'}</button>
                  <button type="button" style={styles.cancelBtn} onClick={cancelMenuItemForm}>Cancel</button>
                </div>
              </form>
            </div>
          )}

          {loading ? <p style={{ color: '#AAA' }}>Loading...</p> : (
            <div style={styles.tableWrap}>
              <table style={styles.table}>
                <thead>
                  <tr>
                    <th style={styles.th}>Photo</th>
                    <th style={styles.th}>Name</th>
                    <th style={styles.th}>Restaurant</th>
                    <th style={styles.th}>Price</th>
                    <th style={styles.th}>Category</th>
                    <th style={styles.th}>Available</th>
                    <th style={styles.th}>Popular</th>
                    <th style={styles.th}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {menuItems.filter((m) => {
                    if (!search) return true;
                    const q = search.toLowerCase();
                    return (m.name || '').toLowerCase().includes(q) || (m.category || '').toLowerCase().includes(q) || (restaurantMap[m.restaurantId] || '').toLowerCase().includes(q);
                  }).map((m) => (
                    <tr key={m.id}>
                      <td style={styles.td}>{m.image ? <img src={m.image} alt={m.name} style={{ width: 40, height: 40, borderRadius: 6, objectFit: 'cover' }} /> : '—'}</td>
                      <td style={styles.td}>{m.name}</td>
                      <td style={styles.td}>{restaurantMap[m.restaurantId] || '\u2014'}</td>
                      <td style={styles.td}>${(m.price || 0).toFixed(2)}</td>
                      <td style={styles.td}><span style={styles.badge}>{m.category}</span></td>
                      <td style={styles.td}><span style={{ color: m.isAvailable ? '#34C759' : '#FF3B30' }}>{m.isAvailable ? 'Yes' : 'No'}</span></td>
                      <td style={styles.td}>{m.isPopular ? '\u2B50' : ''}</td>
                      <td style={styles.td}>
                        <div style={{ display: 'flex', gap: 8 }}>
                          <button style={styles.editBtn} onClick={() => handleEditMenuItem(m)}>Edit</button>
                          <button style={styles.dangerBtn} onClick={() => handleDeleteMenuItem(m.id)}>Delete</button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
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
  card: { background: '#1A1A1A', borderRadius: 14, padding: 24, marginBottom: 20 },
  tableWrap: { overflowX: 'auto' },
  table: { width: '100%', borderCollapse: 'collapse', background: '#1A1A1A', borderRadius: 14, overflow: 'hidden' },
  th: { textAlign: 'left', padding: '12px 16px', color: '#AAA', fontSize: 12, textTransform: 'uppercase', borderBottom: '1px solid #2A2A2A' },
  td: { padding: '12px 16px', borderBottom: '1px solid #2A2A2A', fontSize: 14, color: '#FFF' },
  badge: { background: '#2A2A2A', padding: '2px 8px', borderRadius: 6, fontSize: 12, fontWeight: 700 },
  primaryBtn: { background: '#0A8E4E', color: '#FFF', border: 'none', borderRadius: 8, padding: '8px 18px', cursor: 'pointer', fontWeight: 700, fontSize: 13 },
  dangerBtn: { background: '#FF3B30', color: '#FFF', border: 'none', borderRadius: 8, padding: '6px 14px', cursor: 'pointer', fontWeight: 700, fontSize: 13 },
  editBtn: { background: '#2A2A2A', color: '#FFF', border: '1px solid #3A3A3A', borderRadius: 8, padding: '6px 14px', cursor: 'pointer', fontWeight: 700, fontSize: 13 },
  cancelBtn: { background: '#2A2A2A', color: '#AAA', border: '1px solid #3A3A3A', borderRadius: 8, padding: '8px 18px', cursor: 'pointer', fontWeight: 700, fontSize: 13 },
  searchRow: { marginBottom: 16 },
  searchInput: { width: '100%', background: '#1A1A1A', border: '1px solid #2A2A2A', borderRadius: 10, padding: '12px 16px', color: '#FFF', fontSize: 14, outline: 'none', boxSizing: 'border-box' },
};
