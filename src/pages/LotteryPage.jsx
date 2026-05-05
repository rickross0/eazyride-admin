import React, { useState, useEffect } from 'react';
import client from '../api/client';

const TABS = ['Settings', 'Tickets', 'Winners', 'Promos'];

export default function LotteryPage() {
  const [activeTab, setActiveTab] = useState('Settings');
  const [config, setConfig] = useState(null);
  const [configLoading, setConfigLoading] = useState(true);
  const [tickets, setTickets] = useState([]);
  const [winners, setWinners] = useState([]);
  const [promos, setPromos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [drawLoading, setDrawLoading] = useState(false);
  const [saveLoading, setSaveLoading] = useState(false);
  const [ticketPage, setTicketPage] = useState(1);
  const [ticketTotal, setTicketTotal] = useState(0);
  const [msg, setMsg] = useState('');
  const [promoForm, setPromoForm] = useState({ code: '', discount: 10, discountType: 'PERCENTAGE', maxUses: 100, expiresAt: '' });
  const [ticketForm, setTicketForm] = useState({ userId: '', drawDate: '' });

  useEffect(() => { fetchConfig(); }, []);
  useEffect(() => {
    if (activeTab === 'Tickets') fetchTickets();
    if (activeTab === 'Winners') fetchWinners();
    if (activeTab === 'Promos') fetchPromos();
  }, [activeTab, ticketPage]);

  const fetchConfig = async () => {
    try {
      const { data } = await client.get('/admin/lottery/config');
      setConfig(data.config || {});
    } catch (e) {
      console.error('Fetch config error:', e);
      setMsg('Failed to load lottery config');
    } finally {
      setConfigLoading(false);
    }
  };

  const saveConfig = async () => {
    setSaveLoading(true);
    try {
      const { data } = await client.post('/admin/lottery/config', {
        enabled: config.enabled,
        commissionPct: config.commissionPct,
        drawFrequency: config.drawFrequency,
        nextDrawDate: config.nextDrawDate,
      });
      setConfig(data.config);
      setMsg('Settings saved successfully');
    } catch (e) {
      console.error('Save config error:', e);
      setMsg('Failed to save: ' + (e.response?.data?.error || e.message));
    } finally {
      setSaveLoading(false);
    }
  };

  const runManualDraw = async () => {
    setDrawLoading(true);
    try {
      const { data } = await client.post('/admin/lottery/draw');
      setMsg(`🎉 Draw complete! Winner: ${data.draw?.ticketNumber || 'N/A'}, Prize: $${data.draw?.prize?.toFixed(2) || 0}`);
      fetchConfig();
      fetchWinners();
    } catch (e) {
      console.error('Manual draw error:', e);
      setMsg('Draw failed: ' + (e.response?.data?.error || e.message));
    } finally {
      setDrawLoading(false);
    }
  };

  const fetchTickets = async () => {
    setLoading(true);
    try {
      const { data } = await client.get(`/admin/lottery/tickets?page=${ticketPage}&limit=50`);
      setTickets(data.tickets || []);
      setTicketTotal(data.total || 0);
    } catch (e) {
      console.error('Fetch tickets error:', e);
    } finally {
      setLoading(false);
    }
  };

  const createTicket = async () => {
    if (!ticketForm.userId) return setMsg('userId required');
    try {
      await client.post('/admin/lottery/tickets', ticketForm);
      setTicketForm({ userId: '', drawDate: '' });
      setMsg('Ticket created');
      fetchTickets();
    } catch (e) {
      setMsg('Failed to create ticket: ' + (e.response?.data?.error || e.message));
    }
  };

  const fetchWinners = async () => {
    setLoading(true);
    try {
      const { data } = await client.get('/admin/lottery/winners');
      setWinners(data.winners || []);
    } catch (e) {
      console.error('Fetch winners error:', e);
    } finally {
      setLoading(false);
    }
  };

  const fetchPromos = async () => {
    setLoading(true);
    try {
      const { data } = await client.get('/promos');
      setPromos(data.codes || []);
    } catch (e) {
      console.error('Fetch promos error:', e);
    } finally {
      setLoading(false);
    }
  };

  const createPromo = async () => {
    try {
      await client.post('/promos', promoForm);
      setPromoForm({ code: '', discount: 10, discountType: 'PERCENTAGE', maxUses: 100, expiresAt: '' });
      setMsg('Promo created');
      fetchPromos();
    } catch (e) {
      setMsg('Failed to create promo: ' + (e.response?.data?.error || e.message));
    }
  };

  const togglePromo = async (id, current) => {
    try {
      await client.put(`/promos/${id}`, { isActive: !current });
      fetchPromos();
    } catch (e) {
      setMsg('Failed to toggle promo: ' + (e.response?.data?.error || e.message));
    }
  };

  const deletePromo = async (id) => {
    if (!window.confirm('Delete this promo code?')) return;
    try {
      await client.delete(`/promos/${id}`);
      fetchPromos();
    } catch (e) {
      setMsg('Failed to delete promo: ' + (e.response?.data?.error || e.message));
    }
  };

  if (configLoading) return <p style={{ color: '#AAA', padding: 40 }}>Loading...</p>;

  return (
    <div>
      <h1 style={styles.title}>🎰 Lottery & Promos</h1>
      {msg && <div style={styles.msgBox} onClick={() => setMsg('')}>{msg}</div>}

      <div style={styles.tabs}>
        {TABS.map((t) => (
          <button key={t} style={{ ...styles.tab, ...(activeTab === t ? styles.tabActive : {}) }} onClick={() => { setActiveTab(t); setMsg(''); }}>
            {t}
          </button>
        ))}
      </div>

      {activeTab === 'Settings' && (
        <div style={styles.panel}>
          <div style={styles.row}>
            <label style={styles.label}>Lottery Enabled</label>
            <input type="checkbox" checked={!!config?.enabled} onChange={(e) => setConfig({ ...config, enabled: e.target.checked })} />
          </div>
          <div style={styles.row}>
            <label style={styles.label}>Commission %</label>
            <input style={styles.input} type="number" step="0.5" value={config?.commissionPct || 0} onChange={(e) => setConfig({ ...config, commissionPct: e.target.value })} />
          </div>
          <div style={styles.row}>
            <label style={styles.label}>Draw Frequency</label>
            <select style={styles.input} value={config?.drawFrequency || 'weekly'} onChange={(e) => setConfig({ ...config, drawFrequency: e.target.value })}>
              <option value="daily">Daily</option>
              <option value="weekly">Weekly</option>
              <option value="biweekly">Bi-weekly</option>
              <option value="monthly">Monthly</option>
            </select>
          </div>
          <div style={styles.row}>
            <label style={styles.label}>Next Draw Date</label>
            <input style={styles.input} type="datetime-local" value={config?.nextDrawDate ? new Date(config.nextDrawDate).toISOString().slice(0, 16) : ''} onChange={(e) => setConfig({ ...config, nextDrawDate: e.target.value })} />
          </div>
          <div style={styles.row}>
            <label style={styles.label}>Current Prize Pool</label>
            <span style={styles.statValue}>${(config?.prizePool || 0).toFixed(2)}</span>
          </div>
          <div style={styles.actions}>
            <button style={styles.saveBtn} onClick={saveConfig} disabled={saveLoading}>{saveLoading ? 'Saving...' : 'Save Settings'}</button>
            <button style={styles.drawBtn} onClick={runManualDraw} disabled={drawLoading}>{drawLoading ? 'Drawing...' : '🔥 Manual Draw Now'}</button>
          </div>
        </div>
      )}

      {activeTab === 'Tickets' && (
        <div style={styles.panel}>
          <h3 style={styles.subtitle}>Create Ticket</h3>
          <div style={styles.row}>
            <input style={styles.input} placeholder="User ID" value={ticketForm.userId} onChange={(e) => setTicketForm({ ...ticketForm, userId: e.target.value })} />
            <input style={styles.input} type="date" value={ticketForm.drawDate} onChange={(e) => setTicketForm({ ...ticketForm, drawDate: e.target.value })} />
            <button style={styles.saveBtn} onClick={createTicket}>Create</button>
          </div>
          {loading ? <p style={{ color: '#AAA' }}>Loading...</p> : (
            <div style={styles.tableWrap}>
              <table style={styles.table}>
                <thead><tr><th style={styles.th}>Ticket</th><th style={styles.th}>User</th><th style={styles.th}>Draw Date</th><th style={styles.th}>Winner</th></tr></thead>
                <tbody>{tickets.map((t) => (
                  <tr key={t.id}><td style={styles.td}>{t.ticketNumber}</td><td style={styles.td}>{t.user?.firstName} {t.user?.lastName} ({t.user?.phone})</td><td style={styles.td}>{new Date(t.drawDate).toLocaleDateString()}</td><td style={styles.td}>{t.isWinner ? 'Yes' : 'No'}</td></tr>
                ))}</tbody>
              </table>
              <div style={styles.pagination}>
                <button style={styles.pageBtn} disabled={ticketPage <= 1} onClick={() => setTicketPage(ticketPage - 1)}>Prev</button>
                <span style={{ color: '#AAA', fontSize: 13 }}>Page {ticketPage} of {Math.ceil(ticketTotal / 50) || 1}</span>
                <button style={styles.pageBtn} disabled={ticketPage >= Math.ceil(ticketTotal / 50)} onClick={() => setTicketPage(ticketPage + 1)}>Next</button>
              </div>
            </div>
          )}
        </div>
      )}

      {activeTab === 'Winners' && (
        <div style={styles.panel}>
          {loading ? <p style={{ color: '#AAA' }}>Loading...</p> : winners.length === 0 ? (
            <div style={styles.empty}>No winners yet.</div>
          ) : (
            <div style={styles.tableWrap}>
              <table style={styles.table}>
                <thead><tr><th style={styles.th}>Ticket</th><th style={styles.th}>User</th><th style={styles.th}>Prize</th><th style={styles.th}>Claimed</th><th style={styles.th}>Date</th></tr></thead>
                <tbody>{winners.map((w) => (
                  <tr key={w.id}>
                    <td style={styles.td}>{w.ticket?.ticketNumber}</td>
                    <td style={styles.td}>{w.ticket?.user?.firstName} {w.ticket?.user?.lastName} ({w.ticket?.user?.phone})</td>
                    <td style={styles.td}>${w.prize?.toFixed(2)}</td>
                    <td style={styles.td}>{w.claimed ? 'Yes' : 'No'}</td>
                    <td style={styles.td}>{new Date(w.createdAt).toLocaleDateString()}</td>
                  </tr>
                ))}</tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {activeTab === 'Promos' && (
        <div style={styles.panel}>
          <h3 style={styles.subtitle}>Create Promo Code</h3>
          <div style={styles.row}>
            <input style={styles.input} placeholder="CODE" value={promoForm.code} onChange={(e) => setPromoForm({ ...promoForm, code: e.target.value.toUpperCase() })} />
            <input style={styles.input} type="number" placeholder="Discount" value={promoForm.discount} onChange={(e) => setPromoForm({ ...promoForm, discount: e.target.value })} />
            <select style={styles.input} value={promoForm.discountType} onChange={(e) => setPromoForm({ ...promoForm, discountType: e.target.value })}>
              <option value="PERCENTAGE">%</option>
              <option value="FIXED">$</option>
            </select>
            <input style={styles.input} type="number" placeholder="Max Uses" value={promoForm.maxUses} onChange={(e) => setPromoForm({ ...promoForm, maxUses: e.target.value })} />
            <input style={styles.input} type="date" value={promoForm.expiresAt} onChange={(e) => setPromoForm({ ...promoForm, expiresAt: e.target.value })} />
            <button style={styles.saveBtn} onClick={createPromo}>Create</button>
          </div>
          {loading ? <p style={{ color: '#AAA' }}>Loading...</p> : (
            <div style={styles.tableWrap}>
              <table style={styles.table}>
                <thead><tr><th style={styles.th}>Code</th><th style={styles.th}>Discount</th><th style={styles.th}>Used</th><th style={styles.th}>Max</th><th style={styles.th}>Active</th><th style={styles.th}>Expires</th><th style={styles.th}>Action</th></tr></thead>
                <tbody>{promos.map((p) => (
                  <tr key={p.id}>
                    <td style={styles.td}>{p.code}</td>
                    <td style={styles.td}>{p.discountType === 'PERCENTAGE' ? `${p.discount}%` : `$${p.discount}`}</td>
                    <td style={styles.td}>{p.usedCount}</td>
                    <td style={styles.td}>{p.maxUses}</td>
                    <td style={styles.td}><span style={{ color: p.isActive ? '#34C759' : '#FF3B30' }}>{p.isActive ? 'Yes' : 'No'}</span></td>
                    <td style={styles.td}>{p.expiresAt ? new Date(p.expiresAt).toLocaleDateString() : 'Never'}</td>
                    <td style={styles.td}>
                      <button style={styles.toggleBtn} onClick={() => togglePromo(p.id, p.isActive)}>{p.isActive ? 'Disable' : 'Enable'}</button>
                      <button style={styles.deleteBtn} onClick={() => deletePromo(p.id)}>Delete</button>
                    </td>
                  </tr>
                ))}</tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

const styles = {
  title: { fontSize: 28, fontWeight: 800, color: '#FFF', marginBottom: 20 },
  tabs: { display: 'flex', gap: 8, marginBottom: 20 },
  tab: { background: '#1A1A1A', color: '#AAA', border: '1px solid #2A2A2A', borderRadius: 8, padding: '8px 16px', cursor: 'pointer', fontWeight: 600, fontSize: 14 },
  tabActive: { background: '#0A8E4E', color: '#FFF', borderColor: '#0A8E4E' },
  panel: { background: '#1A1A1A', borderRadius: 14, padding: 24, border: '1px solid #2A2A2A' },
  row: { display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16, flexWrap: 'wrap' },
  label: { color: '#AAA', fontSize: 14, minWidth: 140, fontWeight: 600 },
  input: { background: '#0F0F0F', border: '1px solid #2A2A2A', borderRadius: 8, padding: '8px 12px', color: '#FFF', fontSize: 14, outline: 'none', minWidth: 120 },
  statValue: { color: '#FFF', fontSize: 16, fontWeight: 700 },
  actions: { display: 'flex', gap: 12, marginTop: 20 },
  saveBtn: { background: '#0A8E4E', color: '#FFF', border: 'none', borderRadius: 8, padding: '8px 16px', cursor: 'pointer', fontWeight: 700, fontSize: 13 },
  drawBtn: { background: '#FF6B35', color: '#FFF', border: 'none', borderRadius: 8, padding: '8px 16px', cursor: 'pointer', fontWeight: 700, fontSize: 13 },
  msgBox: { background: '#2A1A00', border: '1px solid #FF9500', color: '#FF9500', padding: '10px 16px', borderRadius: 8, marginBottom: 16, fontSize: 13, cursor: 'pointer' },
  subtitle: { color: '#FFF', fontSize: 16, fontWeight: 700, marginBottom: 12 },
  tableWrap: { overflowX: 'auto' },
  table: { width: '100%', borderCollapse: 'collapse', background: '#0F0F0F', borderRadius: 10, overflow: 'hidden' },
  th: { textAlign: 'left', padding: '10px 12px', color: '#AAA', fontSize: 11, textTransform: 'uppercase', borderBottom: '1px solid #2A2A2A' },
  td: { padding: '10px 12px', borderBottom: '1px solid #2A2A2A', fontSize: 13, color: '#FFF' },
  pagination: { display: 'flex', alignItems: 'center', gap: 12, marginTop: 12 },
  pageBtn: { background: '#1A1A1A', color: '#FFF', border: '1px solid #2A2A2A', borderRadius: 6, padding: '4px 10px', cursor: 'pointer', fontSize: 12 },
  toggleBtn: { background: '#007AFF', color: '#FFF', border: 'none', borderRadius: 6, padding: '4px 10px', cursor: 'pointer', fontSize: 12, marginRight: 4 },
  deleteBtn: { background: '#FF3B30', color: '#FFF', border: 'none', borderRadius: 6, padding: '4px 10px', cursor: 'pointer', fontSize: 12 },
  empty: { color: '#AAA', textAlign: 'center', padding: 40 },
};
