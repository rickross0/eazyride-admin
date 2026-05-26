import React, { useState, useEffect } from 'react';
import client from '../api/client';

export default function PaymentSettingsPage() {
  const [evcConfig, setEvcConfig] = useState({ merchantId: '', apiKey: '', secretKey: '', mode: 'test' });
  const [zaadConfig, setZaadConfig] = useState({ merchantId: '', apiKey: '', secretKey: '', mode: 'test' });
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });

  useEffect(() => { fetchPaymentSettings(); }, []);

  const fetchPaymentSettings = async () => {
    try {
      const { data } = await client.get('/admin/settings');
      const settings = data.settings || [];
      const evc = settings.find(s => s.key === 'evc_config');
      const zaad = settings.find(s => s.key === 'zaad_config');
      if (evc?.value) setEvcConfig(JSON.parse(evc.value));
      if (zaad?.value) setZaadConfig(JSON.parse(zaad.value));
    } catch (e) { console.error('Fetch error:', e); }
  };

  const showMessage = (type, text) => {
    setMessage({ type, text });
    setTimeout(() => setMessage({ type: '', text: '' }), 3000);
  };

  const saveEvc = async () => {
    setSaving(true);
    try {
      await client.post('/admin/settings', { key: 'evc_config', value: JSON.stringify(evcConfig), description: 'EVC Plus Configuration' });
      showMessage('success', 'EVC settings saved!');
    } catch (e) { showMessage('error', 'Failed to save'); }
    setSaving(false);
  };

  const saveZaad = async () => {
    setSaving(true);
    try {
      await client.post('/admin/settings', { key: 'zaad_config', value: JSON.stringify(zaadConfig), description: 'Zaad Payment Configuration' });
      showMessage('success', 'Zaad settings saved!');
    } catch (e) { showMessage('error', 'Failed to save'); }
    setSaving(false);
  };

  return (
    <div style={styles.container}>
      <h1 style={styles.title}>💳 Payment Configuration</h1>
      
      {message.text && (
        <div style={{ ...styles.message, backgroundColor: message.type === 'success' ? '#34C759' : '#FF3B30' }}>
          {message.text}
        </div>
      )}

      {/* EVC Plus Settings */}
      <div style={styles.section}>
        <h2 style={styles.sectionTitle}>EVC Plus</h2>
        <div style={styles.field}>
          <label style={styles.label}>Merchant ID</label>
          <input style={styles.input} value={evcConfig.merchantId} onChange={e => setEvcConfig({ ...evcConfig, merchantId: e.target.value })} placeholder="Enter Merchant ID" />
        </div>
        <div style={styles.field}>
          <label style={styles.label}>API Key</label>
          <input style={styles.input} type="password" value={evcConfig.apiKey} onChange={e => setEvcConfig({ ...evcConfig, apiKey: e.target.value })} placeholder="Enter API Key" />
        </div>
        <div style={styles.field}>
          <label style={styles.label}>Secret Key</label>
          <input style={styles.input} type="password" value={evcConfig.secretKey} onChange={e => setEvcConfig({ ...evcConfig, secretKey: e.target.value })} placeholder="Enter Secret Key" />
        </div>
        <div style={styles.field}>
          <label style={styles.label}>Mode</label>
          <div style={styles.toggleRow}>
            <button style={[styles.toggle, evcConfig.mode === 'test' && styles.toggleActive]} onClick={() => setEvcConfig({ ...evcConfig, mode: 'test' })}>Test</button>
            <button style={[styles.toggle, evcConfig.mode === 'live' && styles.toggleActive]} onClick={() => setEvcConfig({ ...evcConfig, mode: 'live' })}>Live</button>
          </div>
        </div>
        <button style={styles.saveBtn} onClick={saveEvc} disabled={saving}>{saving ? 'Saving...' : 'Save EVC Settings'}</button>
      </div>

      {/* Zaad Settings */}
      <div style={styles.section}>
        <h2 style={styles.sectionTitle}>WaafiPay (Zaad)</h2>
        <div style={styles.field}>
          <label style={styles.label}>Merchant ID</label>
          <input style={styles.input} value={zaadConfig.merchantId} onChange={e => setZaadConfig({ ...zaadConfig, merchantId: e.target.value })} placeholder="Enter Merchant ID" />
        </div>
        <div style={styles.field}>
          <label style={styles.label}>API Key</label>
          <input style={styles.input} type="password" value={zaadConfig.apiKey} onChange={e => setZaadConfig({ ...zaadConfig, apiKey: e.target.value })} placeholder="Enter API Key" />
        </div>
        <div style={styles.field}>
          <label style={styles.label}>Secret Key</label>
          <input style={styles.input} type="password" value={zaadConfig.secretKey} onChange={e => setZaadConfig({ ...zaadConfig, secretKey: e.target.value })} placeholder="Enter Secret Key" />
        </div>
        <div style={styles.field}>
          <label style={styles.label}>Mode</label>
          <div style={styles.toggleRow}>
            <button style={[styles.toggle, zaadConfig.mode === 'test' && styles.toggleActive]} onClick={() => setZaadConfig({ ...zaadConfig, mode: 'test' })}>Test</button>
            <button style={[styles.toggle, zaadConfig.mode === 'live' && styles.toggleActive]} onClick={() => setZaadConfig({ ...zaadConfig, mode: 'live' })}>Live</button>
          </div>
        </div>
        <button style={styles.saveBtn} onClick={saveZaad} disabled={saving}>{saving ? 'Saving...' : 'Save Zaad Settings'}</button>
      </div>
    </div>
  );
}

const styles = {
  container: { padding: '16px', backgroundColor: '#0F0F0F', minHeight: '100vh' },
  title: { fontSize: '28px', fontWeight: '800', color: '#FFF', marginBottom: '24px' },
  message: { padding: '12px 16px', borderRadius: '8px', color: '#FFF', marginBottom: '16px', fontWeight: '600' },
  section: { backgroundColor: '#1A1A1A', borderRadius: '16px', padding: '20px', marginBottom: '20px' },
  sectionTitle: { fontSize: '18px', fontWeight: '700', color: '#FFD700', marginBottom: '16px', marginTop: 0 },
  field: { marginBottom: '16px' },
  label: { fontSize: '12px', color: '#888', marginBottom: '6px', fontWeight: '600', display: 'block' },
  input: { backgroundColor: '#0F0F0F', borderRadius: '10px', padding: '14px', color: '#FFF', fontSize: '14px', borderWidth: '1px', borderColor: '#2A2A2A', width: '100%', boxSizing: 'border-box' },
  toggleRow: { display: 'flex', gap: '12px' },
  toggle: { flex: 1, padding: '12px', borderRadius: '10px', backgroundColor: '#0F0F0F', alignItems: 'center', borderWidth: '1px', borderColor: '#2A2A2A', color: '#888', cursor: 'pointer', fontWeight: '700' },
  toggleActive: { backgroundColor: '#FFD700', borderColor: '#FFD700', color: '#000' },
  saveBtn: { backgroundColor: '#FFD700', borderRadius: '10px', padding: '16px', alignItems: 'center', marginTop: '8px', border: 'none', color: '#000', fontWeight: '700', fontSize: '14px', cursor: 'pointer', width: '100%' },
};
