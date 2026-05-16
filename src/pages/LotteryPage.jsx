import React, { useState, useEffect } from 'react';
import client from '../api/client';

const TABS = ['Giveaways', 'Entries', 'Winners'];

export default function LotteryPage() {
  const [activeTab, setActiveTab] = useState('Giveaways');
  const [lotteries, setLotteries] = useState([]);
  const [entries, setEntries] = useState([]);
  const [winners, setWinners] = useState([]);
  const [loading, setLoading] = useState(true);
  const [drawLoading, setDrawLoading] = useState(false);
  const [msg, setMsg] = useState('');
  const [form, setForm] = useState({
    title: '',
    description: '',
    prizePool: '',
    prizeDescription: '',
    entryLimit: '',
    startDate: '',
    endDate: '',
    drawDate: '',
  });

  useEffect(() => {
    fetchLotteries();
  }, []);

  useEffect(() => {
    if (activeTab === 'Entries') fetchEntries();
    if (activeTab === 'Winners') fetchWinners();
  }, [activeTab]);

  const fetchLotteries = async () => {
    setLoading(true);
    try {
      const { data } = await client.get('/lottery');
      setLotteries(data?.data || []);
    } catch (e) {
      setMsg('Failed to load giveaways');
    } finally {
      setLoading(false);
    }
  };

  const fetchEntries = async () => {
    setLoading(true);
    try {
      const { data } = await client.get('/lottery/admin/stats');
      // We'll fetch from a general endpoint or use lotteries with entries
      const lotts = await client.get('/lottery?limit=100');
      const allEntries = [];
      for (const l of (lotts.data?.data || [])) {
        const detail = await client.get(`/lottery/${l.id}`);
        allEntries.push(...(detail.data?.data?.entries || []));
      }
      setEntries(allEntries);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const fetchWinners = async () => {
    setLoading(true);
    try {
      const { data } = await client.get('/admin/lottery/winners');
      setWinners(data?.data || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const createLottery = async () => {
    try {
      await client.post('/lottery', form);
      setMsg('Giveaway created successfully');
      setForm({ title: '', description: '', prizePool: '', prizeDescription: '', entryLimit: '', startDate: '', endDate: '', drawDate: '' });
      fetchLotteries();
    } catch (e) {
      setMsg('Failed: ' + (e.response?.data?.error || e.message));
    }
  };

  const runDraw = async (id) => {
    setDrawLoading(true);
    try {
      const { data } = await client.post(`/lottery/${id}/draw`);
      setMsg(`🎉 Draw complete! Winner: ${data?.data?.winner?.firstName || 'N/A'}, Prize: $${data?.data?.prizePool || 0}`);
      fetchLotteries();
    } catch (e) {
      setMsg('Draw failed: ' + (e.response?.data?.error || e.message));
    } finally {
      setDrawLoading(false);
    }
  };

  const deleteLottery = async (id) => {
    if (!window.confirm('Delete this giveaway?')) return;
    try {
      await client.delete(`/lottery/${id}`);
      fetchLotteries();
    } catch (e) {
      setMsg('Failed: ' + (e.response?.data?.error || e.message));
    }
  };

  return (
    <div>
      <h1 style={styles.title}>🎁 Driver Giveaways</h1>
      {msg && <div style={styles.msgBox} onClick={() => setMsg('')}>{msg}</div>}

      <div style={styles.tabs}>
        {TABS.map((t) => (
          <button key={t} style={{ ...styles.tab, ...(activeTab === t ? styles.tabActive : {}) }} onClick={() => { setActiveTab(t); setMsg(''); }}>
            {t}
          </button>
        ))}
      </div>

      {activeTab === 'Giveaways' && (
        <div>
          <div style={styles.panel}>
            <h3 style={styles.subtitle}>Create New Giveaway</h3>
            <div style={styles.grid}>
              <input style={styles.input} placeholder="Title" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
              <input style={styles.input} placeholder="Prize Pool ($)" type="number" value={form.prizePool} onChange={(e) => setForm({ ...form, prizePool: e.target.value })} />
              <input style={styles.input} placeholder="Entry Limit (optional)" type="number" value={form.entryLimit} onChange={(e) => setForm({ ...form, entryLimit: e.target.value })} />
              <input style={styles.input} placeholder="Start Date" type="datetime-local" value={form.startDate} onChange={(e) => setForm({ ...form, startDate: e.target.value })} />
              <input style={styles.input} placeholder="End Date" type="datetime-local" value={form.endDate} onChange={(e) => setForm({ ...form, endDate: e.target.value })} />
              <input style={styles.input} placeholder="Draw Date" type="datetime-local" value={form.drawDate} onChange={(e) => setForm({ ...form, drawDate: e.target.value })} />
            </div>
            <input style={{ ...styles.input, width: '100%', marginTop: 12 }} placeholder="Description" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
            <input style={{ ...styles.input, width: '100%', marginTop: 12 }} placeholder="Prize Description" value={form.prizeDescription} onChange={(e) => setForm({ ...form, prizeDescription: e.target.value })} />
            <button style={{ ...styles.saveBtn, marginTop: 16 }} onClick={createLottery}>Create Giveaway</button>
          </div>

          {loading ? <p style={{ color: '#AAA', padding: 40 }}>Loading...</p> : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginTop: 16 }}>
              {lotteries.map((l) => (
                <div key={l.id} style={styles.giveawayCard}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                      <Text style={{ color: '#FFF', fontWeight: 700, fontSize: 16 }}>{l.title}</Text>
                      <Text style={{ color: '#AAA', fontSize: 13 }}>Status: <span style={{ color: l.status === 'ACTIVE' ? '#34C759' : l.status === 'COMPLETED' ? '#FF9500' : '#AAA' }}>{l.status}</span> | Entries: {l.entryCount || 0}{l.entryLimit ? ` / ${l.entryLimit}` : ''}</Text>
                      <Text style={{ color: '#FFD700', fontSize: 14, fontWeight: 700 }}>Prize: ${(l.prizePool || 0).toFixed(2)}</Text>
                    </div>
                    <div style={{ display: 'flex', gap: 8 }}>
                      {l.status === 'ACTIVE' && (
                        <button style={styles.drawBtn} disabled={drawLoading} onClick={() => runDraw(l.id)}>{drawLoading ? 'Drawing...' : '🎉 Draw'}</button>
                      )}
                      <button style={styles.deleteBtn} onClick={() => deleteLottery(l.id)}>Delete</button>
                    </div>
                  </div>
                </div>
              ))}
              {lotteries.length === 0 && <Text style={styles.empty}>No giveaways yet.</Text>}
            </div>
          )}
        </div>
      )}

      {activeTab === 'Entries' && (
        <div style={styles.panel}>
          {loading ? <p style={{ color: '#AAA' }}>Loading...</p> : (
            <div style={styles.tableWrap}>
              <table style={styles.table}>
                <thead><tr><th style={styles.th}>Entry #</th><th style={styles.th}>Driver</th><th style={styles.th}>Giveaway</th><th style={styles.th}>Date</th></tr></thead>
                <tbody>{entries.map((e) => (
                  <tr key={e.id}>
                    <td style={styles.td}>#{e.entryNumber}</td>
                    <td style={styles.td}>{e.user?.firstName} {e.user?.lastName}</td>
                    <td style={styles.td}>{e.lottery?.title || 'N/A'}</td>
                    <td style={styles.td}>{new Date(e.enteredAt).toLocaleDateString()}</td>
                  </tr>
                ))}</tbody>
              </table>
              {entries.length === 0 && <Text style={styles.empty}>No entries yet.</Text>}
            </div>
          )}
        </div>
      )}

      {activeTab === 'Winners' && (
        <div style={styles.panel}>
          {loading ? <p style={{ color: '#AAA' }}>Loading...</p> : (
            <div style={styles.tableWrap}>
              <table style={styles.table}>
                <thead><tr><th style={styles.th}>Driver</th><th style={styles.th}>Giveaway</th><th style={styles.th}>Prize</th><th style={styles.th}>Date</th></tr></thead>
                <tbody>{winners.map((w) => (
                  <tr key={w.id}>
                    <td style={styles.td}>{w.user?.firstName} {w.user?.lastName} ({w.user?.phone})</td>
                    <td style={styles.td}>{w.lottery?.title || 'N/A'}</td>
                    <td style={styles.td}>${w.lottery?.prizePool?.toFixed(2) || '0.00'}</td>
                    <td style={styles.td}>{new Date(w.createdAt).toLocaleDateString()}</td>
                  </tr>
                ))}</tbody>
              </table>
              {winners.length === 0 && <Text style={styles.empty}>No winners yet.</Text>}
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
  tabActive: { background: '#FFD700', color: '#FFF', borderColor: '#FFD700' },
  panel: { background: '#1A1A1A', borderRadius: 14, padding: 24, border: '1px solid #2A2A2A', marginBottom: 16 },
  grid: { display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12 },
  input: { background: '#0F0F0F', border: '1px solid #2A2A2A', borderRadius: 8, padding: '8px 12px', color: '#FFF', fontSize: 14, outline: 'none', width: '100%' },
  saveBtn: { background: '#FFD700', color: '#FFF', border: 'none', borderRadius: 8, padding: '10px 20px', cursor: 'pointer', fontWeight: 700, fontSize: 14 },
  drawBtn: { background: '#FF6B35', color: '#FFF', border: 'none', borderRadius: 8, padding: '6px 14px', cursor: 'pointer', fontWeight: 700, fontSize: 13 },
  deleteBtn: { background: '#FF3B30', color: '#FFF', border: 'none', borderRadius: 8, padding: '6px 14px', cursor: 'pointer', fontWeight: 700, fontSize: 13 },
  giveawayCard: { background: '#0F0F0F', borderRadius: 12, padding: 16, border: '1px solid #2A2A2A' },
  msgBox: { background: '#2A1A00', border: '1px solid #FF9500', color: '#FF9500', padding: '10px 16px', borderRadius: 8, marginBottom: 16, fontSize: 13, cursor: 'pointer' },
  subtitle: { color: '#FFF', fontSize: 16, fontWeight: 700, marginBottom: 12 },
  tableWrap: { overflowX: 'auto' },
  table: { width: '100%', borderCollapse: 'collapse', background: '#0F0F0F', borderRadius: 10, overflow: 'hidden' },
  th: { textAlign: 'left', padding: '10px 12px', color: '#AAA', fontSize: 11, textTransform: 'uppercase', borderBottom: '1px solid #2A2A2A' },
  td: { padding: '10px 12px', borderBottom: '1px solid #2A2A2A', fontSize: 13, color: '#FFF' },
  empty: { color: '#AAA', textAlign: 'center', padding: 40 },
};
