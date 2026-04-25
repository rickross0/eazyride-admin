import React, { useState, useEffect } from 'react';
import client from '../api/client';

export default function SettingsPage() {
  const [settings, setSettings] = useState([]);
  const [emergencyNumber, setEmergencyNumber] = useState('111');
  const [saving, setSaving] = useState(false);
  const [tcContent, setTcContent] = useState('');
  const [savingTc, setSavingTc] = useState(false);
  const [supportContacts, setSupportContacts] = useState({ phone: '', whatsapp: '', email: '' });
  const [savingContacts, setSavingContacts] = useState(false);

  useEffect(() => { fetchSettings(); fetchTc(); fetchContacts(); }, []);

  const fetchSettings = async () => {
    try {
      const { data } = await client.get('/admin/settings');
      const all = data.settings || [];
      setSettings(all);
      const em = all.find(s => s.key === 'emergency_number');
      if (em) setEmergencyNumber(em.value);
    } catch (e) { console.error('Settings fetch error:', e); }
  };

  const fetchTc = async () => {
    try {
      const { data } = await client.get('/legal/terms');
      setTcContent(data.content || '');
    } catch (e) { console.error('T&C fetch error:', e); }
  };

  const fetchContacts = async () => {
    try {
      const { data } = await client.get('/support/contacts');
      setSupportContacts({ phone: data.phone || '', whatsapp: data.whatsapp || '', email: data.email || '' });
    } catch (e) { console.error('Contacts fetch error:', e); }
  };

  const saveEmergencyNumber = async () => {
    setSaving(true);
    try {
      await client.post('/admin/settings', { key: 'emergency_number', value: emergencyNumber, label: 'Emergency Number' });
      alert('Emergency number saved!');
      fetchSettings();
    } catch (e) { alert('Failed to save'); }
    setSaving(false);
  };

  const saveTerms = async () => {
    setSavingTc(true);
    try {
      await client.put('/admin/legal/terms', { content: tcContent });
      alert('Terms & Conditions saved!');
    } catch (e) { alert('Failed to save T&C: ' + (e.response?.data?.error || 'Error')); }
    setSavingTc(false);
  };

  const saveContacts = async () => {
    setSavingContacts(true);
    try {
      await client.put('/admin/support/contacts', supportContacts);
      alert('Support contacts saved!');
    } catch (e) { alert('Failed to save contacts: ' + (e.response?.data?.error || 'Error')); }
    setSavingContacts(false);
  };

  return (
    <div>
      <h1 style={styles.title}>⚙️ Settings</h1>

      <div style={styles.card}>
        <h2 style={styles.cardTitle}>🆘 Emergency Settings</h2>
        <p style={styles.desc}>This number will be called when a rider or driver presses SOS in the app.</p>
        <div style={styles.row}>
          <label style={styles.label}>Police / Emergency Number</label>
          <div style={styles.inputRow}>
            <input style={styles.input} value={emergencyNumber} onChange={(e) => setEmergencyNumber(e.target.value)} placeholder="e.g. 111" />
            <button style={styles.saveBtn} onClick={saveEmergencyNumber} disabled={saving}>{saving ? 'Saving...' : 'Save'}</button>
          </div>
        </div>
      </div>

      <div style={styles.card}>
        <h2 style={styles.cardTitle}>📜 Terms & Conditions</h2>
        <p style={styles.desc}>Edit the Terms & Conditions shown to users during registration and in settings.</p>
        <textarea
          style={styles.textarea}
          value={tcContent}
          onChange={(e) => setTcContent(e.target.value)}
          placeholder="Enter your Terms & Conditions here..."
          rows={12}
        />
        <div style={{ marginTop: 12 }}>
          <button style={styles.saveBtn} onClick={saveTerms} disabled={savingTc}>{savingTc ? 'Saving...' : 'Save Terms & Conditions'}</button>
        </div>
      </div>

      <div style={styles.card}>
        <h2 style={styles.cardTitle}>📞 Support / Contact Care</h2>
        <p style={styles.desc}>These contacts appear in all apps under "Contact Care" in profile/settings.</p>
        <div style={styles.row}>
          <label style={styles.label}>WhatsApp Number (with country code, no +)</label>
          <input style={styles.inputWide} value={supportContacts.whatsapp} onChange={(e) => setSupportContacts({ ...supportContacts, whatsapp: e.target.value })} placeholder="e.g. 2526123456" />
        </div>
        <div style={styles.row}>
          <label style={styles.label}>Phone Number</label>
          <input style={styles.inputWide} value={supportContacts.phone} onChange={(e) => setSupportContacts({ ...supportContacts, phone: e.target.value })} placeholder="e.g. 111" />
        </div>
        <div style={styles.row}>
          <label style={styles.label}>Support Email</label>
          <input style={styles.inputWide} value={supportContacts.email} onChange={(e) => setSupportContacts({ ...supportContacts, email: e.target.value })} placeholder="e.g. support@eazyride.com" />
        </div>
        <div style={{ marginTop: 12 }}>
          <button style={styles.saveBtn} onClick={saveContacts} disabled={savingContacts}>{savingContacts ? 'Saving...' : 'Save Contacts'}</button>
        </div>
      </div>

      <div style={styles.card}>
        <h2 style={styles.cardTitle}>📋 All Settings</h2>
        {settings.length === 0 ? (
          <p style={{ color: '#AAA' }}>No settings configured yet</p>
        ) : (
          <table style={styles.table}>
            <thead><tr><th style={styles.th}>Key</th><th style={styles.th}>Value</th><th style={styles.th}>Label</th></tr></thead>
            <tbody>
              {settings.map((s) => (
                <tr key={s.id}><td style={styles.td}>{s.key}</td><td style={styles.td}>{s.value}</td><td style={styles.td}>{s.label || '—'}</td></tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

const styles = {
  title: { color: '#FFF', fontSize: 24, fontWeight: 800, marginBottom: 20 },
  card: { background: '#1A1A1A', borderRadius: 14, padding: 24, marginBottom: 20, borderTop: '3px solid #0A8E4E' },
  cardTitle: { color: '#FFF', fontSize: 18, fontWeight: 700, marginBottom: 8 },
  desc: { color: '#AAA', fontSize: 14, marginBottom: 16 },
  row: { marginBottom: 12 },
  label: { color: '#DDD', fontSize: 13, fontWeight: 600, display: 'block', marginBottom: 6 },
  inputRow: { display: 'flex', gap: 8, alignItems: 'center' },
  input: { background: '#0F0F0F', border: '1px solid #2A2A2A', borderRadius: 8, padding: '10px 14px', color: '#FFF', fontSize: 16, width: 200 },
  inputWide: { background: '#0F0F0F', border: '1px solid #2A2A2A', borderRadius: 8, padding: '10px 14px', color: '#FFF', fontSize: 16, width: '100%', boxSizing: 'border-box' },
  textarea: { background: '#0F0F0F', border: '1px solid #2A2A2A', borderRadius: 8, padding: '14px', color: '#FFF', fontSize: 14, width: '100%', boxSizing: 'border-box', resize: 'vertical', fontFamily: 'inherit', lineHeight: 1.6 },
  saveBtn: { background: '#0A8E4E', color: '#FFF', border: 'none', borderRadius: 8, padding: '10px 20px', fontWeight: 700, cursor: 'pointer', fontSize: 14 },
  table: { width: '100%', borderCollapse: 'collapse' },
  th: { color: '#AAA', fontSize: 12, fontWeight: 700, textTransform: 'uppercase', textAlign: 'left', padding: '8px 0', borderBottom: '1px solid #2A2A2A' },
  td: { color: '#DDD', fontSize: 14, padding: '10px 0', borderBottom: '1px solid #1A1A1A' },
};
