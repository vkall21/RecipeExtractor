import React from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useMeasurement } from '../context/MeasurementContext';
import { CONVERSION_TABLE, MeasurementSystem } from '../utils/unitConverter';

const OPTIONS: { value: MeasurementSystem; label: string; desc: string }[] = [
  { value: 'imperial', label: 'Imperial', desc: 'cups, tbsp, tsp, oz, lb' },
  { value: 'metric',   label: 'Metric',   desc: 'ml, L, g, kg' },
];

export default function SettingsScreen() {
  const { system, setSystem } = useMeasurement();

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.sectionHead}>Measurement System</Text>
      <View style={styles.optionRow}>
        {OPTIONS.map(opt => (
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

      <Text style={styles.sectionHead}>Conversion Reference</Text>
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
  sectionHead: { fontSize: 13, fontWeight: '700', color: '#888', textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 12, marginTop: 8 },
  optionRow: { flexDirection: 'row', gap: 12, marginBottom: 32 },
  optionCard: { flex: 1, borderWidth: 1.5, borderColor: '#ddd', borderRadius: 12, padding: 16, backgroundColor: '#fff', alignItems: 'center' },
  optionCardActive: { borderColor: '#e8553e', backgroundColor: '#fdf1ef' },
  optionLabel: { fontSize: 17, fontWeight: '700', color: '#444', marginBottom: 4 },
  optionLabelActive: { color: '#e8553e' },
  optionDesc: { fontSize: 12, color: '#aaa', textAlign: 'center' },
  optionDescActive: { color: '#e8553e' },
  table: { borderRadius: 12, overflow: 'hidden', borderWidth: 1, borderColor: '#eee' },
  tableHeader: { flexDirection: 'row', backgroundColor: '#f0f0f0', paddingVertical: 10, paddingHorizontal: 14 },
  tableHeadText: { fontWeight: '700', color: '#555', fontSize: 13 },
  tableRow: { flexDirection: 'row', paddingVertical: 10, paddingHorizontal: 14, backgroundColor: '#fff' },
  tableRowAlt: { backgroundColor: '#fafafa' },
  tableCell: { fontSize: 14, color: '#333' },
});
