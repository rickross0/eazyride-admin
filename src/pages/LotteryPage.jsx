import React, { useState, useEffect } from 'react';
import client from '../api/client';

export default function LotteryPage() {
  const [lotteries, setLotteries] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => { fetchLotteries(); }, []);

  const fetchLotteries = async () => {
    try {
      const res = await client.get('/lottery');
      const rd = res.data?.data || res.data || {};
      setLotteries(Array.isArray(rd) ? rd : rd.lotteries || []);
    } catch (e) {
      console.error('Fetch lotteries error:', e);
    } finally {
      setLoading(false);
    }
  };

  const createLottery = async () => {
    try {
      await client.post('/lottery', {
        title: 'New Lottery Draw',
        description: 'Weekly prize draw',
        ticketPrice: 0.5,
        maxTickets: 1000,
        prizePool: 100,
        startDate: new Date().toISOString(),
        endDate: new Date(Date.now() + 7 * 86400000).toISOString(),
        drawDate: new Date(Date.now() + 8 * 86400000).toISOString(),
      });
      fetchLotteries();
    } catch (e) {
      alert('Failed to create lottery: ' + (e.response?.data?.message || e.message));
    }
  };

  if (loading) return <p style={{ color: '#AAA', padding: 40 }}>Loading...</p>;

  const statusColors = { UPCOMING: '#007AFF', ACTIVE: '#34C759', COMPLETED: '#8E8E93', CANCELLED: '#FF3B30' };

  return (
    <div>
      <div style={styles.header}>
        <h1 style={styles.title}>🎰 Lottery</h1>
        <button style={styles.createBtn} onClick={createLottery}>+ Create Lottery</button>
      </div>
      {lotteries.length === 0 ? (
        <div style={styles.empty}>No lotteries yet. Create one to get started!</div>
      ) : (
        <div style={styles.grid}>
          {lotteries.map(l => (
            <div key={l.id} style={styles.card}>
              <div style={styles.cardHeader}>
                <span style={styles.cardTitle}>{l.title}</span>
                <span style={{ ...styles.badge, background: statusColors[l.status] || '#666' }}>{l.status}</span>
              </div>
              <div style={styles.cardBody}>
                <div style={styles.stat}><span style={styles.statLabel}>Ticket Price:</span> <span style={styles.statValue}>${l.ticketPrice}</span></div>
                <div style={styles.stat}><span style={styles.statLabel}>Sold:</span> <span style={styles.statValue}>{l.soldTickets}/{l.maxTickets}</span></div>
                <div style={styles.stat}><span style={styles.statLabel}>Prize Pool:</span> <span style={styles.statValue}>${l.prizePool}</span></div>
                <div style={styles.stat}><span style={styles.statLabel}>End Date:</span> <span style={styles.statValue}>{new Date(l.endDate).toLocaleDateString()}</span></div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

const styles = {
  header: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 },
  title: { fontSize: 28, fontWeight: 800, color: '#FFF' },
  createBtn: { background: '#0A8E4E', color: '#FFF', border: 'none', borderRadius: 10, padding: '10px 20px', cursor: 'pointer', fontWeight: 700, fontSize: 14 },
  empty: { color: '#AAA', textAlign: 'center', padding: 40 },
  grid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 16 },
  card: { background: '#1A1A1A', borderRadius: 14, padding: 20, border: '1px solid #2A2A2A' },
  cardHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  cardTitle: { color: '#FFF', fontSize: 18, fontWeight: 700 },
  badge: { padding: '4px 10px', borderRadius: 6, fontSize: 11, fontWeight: 700, color: '#FFF' },
  cardBody: { display: 'flex', flexDirection: 'column', gap: 8 },
  stat: { display: 'flex', justifyContent: 'space-between' },
  statLabel: { color: '#AAA', fontSize: 13 },
  statValue: { color: '#FFF', fontSize: 13, fontWeight: 600 },
};
