import React, { useEffect, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { useMeasurement } from '../context/MeasurementContext';
import { CONVERSION_TABLE, MeasurementSystem } from '../utils/unitConverter';
import { clearLLMConfig, getLLMConfig, LLMProvider, saveLLMConfig } from '../services/storage';

const MEASUREMENT_OPTIONS: { value: MeasurementSystem; label: string; desc: string }[] = [
  { value: 'imperial', label: 'Imperial', desc: 'cups, tbsp, tsp, oz, lb' },
  { value: 'metric',   label: 'Metric',   desc: 'ml, L, g, kg' },
];

const PROVIDERS: { value: LLMProvider; label: string; hint: string }[] = [
  { value: 'claude', label: 'Claude',  hint: 'console.anthropic.com → API Keys' },
  { value: 'openai', label: 'OpenAI',  hint: 'platform.openai.com → API Keys' },
  { value: 'gemini', label: 'Gemini',  hint: 'aistudio.google.com → Get API Key' },
];

export default function SettingsScreen() {
  const { system, setSystem } = useMeasurement();

  const [provider, setProvider] = useState<LLMProvider>('claude');
  const [apiKey, setApiKey] = useState('');
  const [showKey, setShowKey] = useState(false);
  const [saved, setSaved] = useState(false);
  const [hasConfig, setHasConfig] = useState(false);

  useEffect(() => {
    getLLMConfig().then(cfg => {
      if (cfg) {
        setProvider(cfg.provider);
        setApiKey(cfg.apiKey);
        setHasConfig(true);
      }
    });
  }, []);

  async function handleSave() {
    if (!apiKey.trim()) return;
    await saveLLMConfig({ provider, apiKey: apiKey.trim() });
    setHasConfig(true);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  async function handleClear() {
    await clearLLMConfig();
    setApiKey('');
    setHasConfig(false);
  }

  const selectedProvider = PROVIDERS.find(p => p.value === provider)!;

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>

      {/* ── Measurement ── */}
      <Text style={styles.sectionHead}>Measurement System</Text>
      <View style={styles.optionRow}>
        {MEASUREMENT_OPTIONS.map(opt => (
          <Pressable
            key={opt.value}
            style={[styles.optionCard, system === opt.value && styles.optionCardActive]}
            onPress={() => setSystem(opt.value)}
          >
            <Text style={[styles.optionLabel, system === opt.value && styles.optionLabelActive]}>
              {opt.label}
            </Text>
            <Text style={[styles.optionDesc, system === opt.value && styles.optionDescActive]}>
              {opt.desc}
            </Text>
          </Pressable>
        ))}
      </View>

      {/* ── AI Provider ── */}
      <Text style={styles.sectionHead}>AI Provider (for recipe extraction)</Text>
      <Text style={styles.sectionSub}>
        Used when a site doesn't have structured recipe data. Leave blank to use the built-in Claude key.
      </Text>

      <View style={styles.optionRow}>
        {PROVIDERS.map(p => (
          <Pressable
            key={p.value}
            style={[styles.providerCard, provider === p.value && styles.optionCardActive]}
            onPress={() => setProvider(p.value)}
          >
            <Text style={[styles.optionLabel, provider === p.value && styles.optionLabelActive]}>
              {p.label}
            </Text>
          </Pressable>
        ))}
      </View>

      <Text style={styles.hintText}>Get a key: {selectedProvider.hint}</Text>

      <View style={styles.keyRow}>
        <TextInput
          style={styles.keyInput}
          placeholder="Paste your API key here…"
          placeholderTextColor="#aaa"
          value={apiKey}
          onChangeText={setApiKey}
          secureTextEntry={!showKey}
          autoCapitalize="none"
          autoCorrect={false}
        />
        <Pressable style={styles.eyeBtn} onPress={() => setShowKey(v => !v)}>
          <Text style={styles.eyeText}>{showKey ? '🙈' : '👁️'}</Text>
        </Pressable>
      </View>

      <View style={styles.keyActions}>
        <Pressable
          style={[styles.saveBtn, !apiKey.trim() && styles.saveBtnDisabled]}
          onPress={handleSave}
          disabled={!apiKey.trim()}
        >
          <Text style={styles.saveBtnText}>{saved ? '✓ Saved' : 'Save Key'}</Text>
        </Pressable>
        {hasConfig && (
          <Pressable style={styles.clearBtn} onPress={handleClear}>
            <Text style={styles.clearBtnText}>Remove</Text>
          </Pressable>
        )}
      </View>

      {hasConfig && (
        <View style={styles.activeBox}>
          <Text style={styles.activeText}>
            ✓ Using your {PROVIDERS.find(p => p.value === provider)?.label} key for AI extraction
          </Text>
        </View>
      )}

      {/* ── Conversion table ── */}
      <Text style={[styles.sectionHead, { marginTop: 32 }]}>Conversion Reference</Text>
      <View style={styles.table}>
        <View style={styles.tableHeader}>
          <Text style={[styles.tableCell, styles.tableHeadText, { flex: 1.2 }]}>Imperial</Text>
          <Text style={[styles.tableCell, styles.tableHeadText, { flex: 0.3, textAlign: 'center' }]}>=</Text>
          <Text style={[styles.tableCell, styles.tableHeadText, { flex: 1 }]}>Metric</Text>
        </View>
        {CONVERSION_TABLE.map((row, i) => (
          <View key={i} style={[styles.tableRow, i % 2 === 1 && styles.tableRowAlt]}>
            <Text style={[styles.tableCell, { flex: 1.2 }]}>{row.imperial}</Text>
            <Text style={[styles.tableCell, { flex: 0.3, textAlign: 'center', color: '#bbb' }]}>=</Text>
            <Text style={[styles.tableCell, { flex: 1 }]}>{row.metric}</Text>
          </View>
        ))}
      </View>

    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8f8f6' },
  content: { padding: 20, paddingBottom: 40 },
  sectionHead: { fontSize: 13, fontWeight: '700', color: '#888', textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 8, marginTop: 8 },
  sectionSub: { fontSize: 13, color: '#999', marginBottom: 14, lineHeight: 18 },
  optionRow: { flexDirection: 'row', gap: 12, marginBottom: 16 },
  optionCard: { flex: 1, borderWidth: 1.5, borderColor: '#ddd', borderRadius: 12, padding: 16, backgroundColor: '#fff', alignItems: 'center' },
  providerCard: { flex: 1, borderWidth: 1.5, borderColor: '#ddd', borderRadius: 12, paddingVertical: 12, paddingHorizontal: 8, backgroundColor: '#fff', alignItems: 'center' },
  optionCardActive: { borderColor: '#e8553e', backgroundColor: '#fdf1ef' },
  optionLabel: { fontSize: 15, fontWeight: '700', color: '#444', marginBottom: 4 },
  optionLabelActive: { color: '#e8553e' },
  optionDesc: { fontSize: 12, color: '#aaa', textAlign: 'center' },
  optionDescActive: { color: '#e8553e' },
  hintText: { fontSize: 12, color: '#999', marginBottom: 10 },
  keyRow: { flexDirection: 'row', gap: 8, marginBottom: 12 },
  keyInput: { flex: 1, borderWidth: 1, borderColor: '#ddd', borderRadius: 10, paddingHorizontal: 12, paddingVertical: 10, fontSize: 14, backgroundColor: '#fff', color: '#222' },
  eyeBtn: { justifyContent: 'center', paddingHorizontal: 4 },
  eyeText: { fontSize: 20 },
  keyActions: { flexDirection: 'row', gap: 10, marginBottom: 12 },
  saveBtn: { flex: 1, backgroundColor: '#e8553e', borderRadius: 10, paddingVertical: 12, alignItems: 'center' },
  saveBtnDisabled: { opacity: 0.4 },
  saveBtnText: { color: '#fff', fontWeight: '700', fontSize: 14 },
  clearBtn: { borderWidth: 1, borderColor: '#ddd', borderRadius: 10, paddingVertical: 12, paddingHorizontal: 20, alignItems: 'center' },
  clearBtnText: { color: '#888', fontSize: 14 },
  activeBox: { backgroundColor: '#edfaf3', borderRadius: 10, padding: 12, borderWidth: 1, borderColor: '#a8dfc1', marginBottom: 4 },
  activeText: { color: '#2e7d52', fontSize: 13, fontWeight: '600' },
  table: { borderRadius: 12, overflow: 'hidden', borderWidth: 1, borderColor: '#eee' },
  tableHeader: { flexDirection: 'row', backgroundColor: '#f0f0f0', paddingVertical: 10, paddingHorizontal: 14 },
  tableHeadText: { fontWeight: '700', color: '#555', fontSize: 13 },
  tableRow: { flexDirection: 'row', paddingVertical: 10, paddingHorizontal: 14, backgroundColor: '#fff' },
  tableRowAlt: { backgroundColor: '#fafafa' },
  tableCell: { fontSize: 14, color: '#333' },
});
