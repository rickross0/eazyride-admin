import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TextInput, TouchableOpacity, Alert } from 'react-native';
import client from '../api/client';

export default function PaymentSettingsPage() {
  const [evcConfig, setEvcConfig] = useState({ merchantId: '', apiKey: '', secretKey: '', mode: 'test' });
  const [zaadConfig, setZaadConfig] = useState({ merchantId: '', apiKey: '', secretKey: '', mode: 'test' });
  const [saving, setSaving] = useState(false);

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

  const saveEvc = async () => {
    setSaving(true);
    try {
      await client.post('/admin/settings', { key: 'evc_config', value: JSON.stringify(evcConfig), description: 'EVC Plus Configuration' });
      Alert.alert('Success', 'EVC settings saved!');
    } catch (e) { Alert.alert('Error', 'Failed to save'); }
    setSaving(false);
  };

  const saveZaad = async () => {
    setSaving(true);
    try {
      await client.post('/admin/settings', { key: 'zaad_config', value: JSON.stringify(zaadConfig), description: 'Zaad Payment Configuration' });
      Alert.alert('Success', 'Zaad settings saved!');
    } catch (e) { Alert.alert('Error', 'Failed to save'); }
    setSaving(false);
  };

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>💳 Payment Configuration</Text>

      {/* EVC Plus Settings */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>EVC Plus</Text>
        <View style={styles.field}>
          <Text style={styles.label}>Merchant ID</Text>
          <TextInput style={styles.input} value={evcConfig.merchantId} onChangeText={v => setEvcConfig({ ...evcConfig, merchantId: v })} placeholder="Enter Merchant ID" />
        </View>
        <View style={styles.field}>
          <Text style={styles.label}>API Key</Text>
          <TextInput style={styles.input} value={evcConfig.apiKey} onChangeText={v => setEvcConfig({ ...evcConfig, apiKey: v })} placeholder="Enter API Key" secureTextEntry />
        </View>
        <View style={styles.field}>
          <Text style={styles.label}>Secret Key</Text>
          <TextInput style={styles.input} value={evcConfig.secretKey} onChangeText={v => setEvcConfig({ ...evcConfig, secretKey: v })} placeholder="Enter Secret Key" secureTextEntry />
        </View>
        <View style={styles.field}>
          <Text style={styles.label}>Mode</Text>
          <View style={styles.toggleRow}>
            <TouchableOpacity style={[styles.toggle, evcConfig.mode === 'test' && styles.toggleActive]} onPress={() => setEvcConfig({ ...evcConfig, mode: 'test' })}><Text style={styles.toggleText}>Test</Text></TouchableOpacity>
            <TouchableOpacity style={[styles.toggle, evcConfig.mode === 'live' && styles.toggleActive]} onPress={() => setEvcConfig({ ...evcConfig, mode: 'live' })}><Text style={styles.toggleText}>Live</Text></TouchableOpacity>
          </View>
        </View>
        <TouchableOpacity style={styles.saveBtn} onPress={saveEvc} disabled={saving}><Text style={styles.saveBtnText}>{saving ? 'Saving...' : 'Save EVC Settings'}</Text></TouchableOpacity>
      </View>

      {/* Zaad Settings */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>WaafiPay (Zaad)</Text>
        <View style={styles.field}>
          <Text style={styles.label}>Merchant ID</Text>
          <TextInput style={styles.input} value={zaadConfig.merchantId} onChangeText={v => setZaadConfig({ ...zaadConfig, merchantId: v })} placeholder="Enter Merchant ID" />
        </View>
        <View style={styles.field}>
          <Text style={styles.label}>API Key</Text>
          <TextInput style={styles.input} value={zaadConfig.apiKey} onChangeText={v => setZaadConfig({ ...zaadConfig, apiKey: v })} placeholder="Enter API Key" secureTextEntry />
        </View>
        <View style={styles.field}>
          <Text style={styles.label}>Secret Key</Text>
          <TextInput style={styles.input} value={zaadConfig.secretKey} onChangeText={v => setZaadConfig({ ...zaadConfig, secretKey: v })} placeholder="Enter Secret Key" secureTextEntry />
        </View>
        <View style={styles.field}>
          <Text style={styles.label}>Mode</Text>
          <View style={styles.toggleRow}>
            <TouchableOpacity style={[styles.toggle, zaadConfig.mode === 'test' && styles.toggleActive]} onPress={() => setZaadConfig({ ...zaadConfig, mode: 'test' })}><Text style={styles.toggleText}>Test</Text></TouchableOpacity>
            <TouchableOpacity style={[styles.toggle, zaadConfig.mode === 'live' && styles.toggleActive]} onPress={() => setZaadConfig({ ...zaadConfig, mode: 'live' })}><Text style={styles.toggleText}>Live</Text></TouchableOpacity>
          </View>
        </View>
        <TouchableOpacity style={styles.saveBtn} onPress={saveZaad} disabled={saving}><Text style={styles.saveBtnText}>{saving ? 'Saving...' : 'Save Zaad Settings'}</Text></TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0F0F0F', padding: 16 },
  title: { fontSize: 28, fontWeight: '800', color: '#FFF', marginBottom: 24 },
  section: { backgroundColor: '#1A1A1A', borderRadius: 16, padding: 20, marginBottom: 20 },
  sectionTitle: { fontSize: 18, fontWeight: '700', color: '#FFD700', marginBottom: 16 },
  field: { marginBottom: 16 },
  label: { fontSize: 12, color: '#888', marginBottom: 6, fontWeight: '600' },
  input: { backgroundColor: '#0F0F0F', borderRadius: 10, padding: 14, color: '#FFF', fontSize: 14, borderWidth: 1, borderColor: '#2A2A2A' },
  toggleRow: { flexDirection: 'row', gap: 12 },
  toggle: { flex: 1, padding: 12, borderRadius: 10, backgroundColor: '#0F0F0F', alignItems: 'center', borderWidth: 1, borderColor: '#2A2A2A' },
  toggleActive: { backgroundColor: '#FFD700', borderColor: '#FFD700' },
  toggleText: { fontWeight: '700', color: '#888' },
  saveBtn: { backgroundColor: '#FFD700', borderRadius: 10, padding: 16, alignItems: 'center', marginTop: 8 },
  saveBtnText: { color: '#000', fontWeight: '700', fontSize: 14 },
});
