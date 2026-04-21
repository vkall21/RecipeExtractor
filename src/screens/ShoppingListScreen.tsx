import React, { useCallback, useState } from 'react';
import { Alert, Pressable, SectionList, StyleSheet, Text, View } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { loadShoppingList, saveShoppingList } from '../services/storage';
import { CATEGORY_ORDER, IngredientCategory, ShoppingItem } from '../types';

interface Section {
  title: IngredientCategory;
  data: ShoppingItem[];
}

function buildSections(items: ShoppingItem[]): Section[] {
  return CATEGORY_ORDER
    .map(cat => ({ title: cat, data: items.filter(i => i.category === cat) }))
    .filter(s => s.data.length > 0);
}

export default function ShoppingListScreen({ navigation }: any) {
  const [items, setItems] = useState<ShoppingItem[]>([]);

  useFocusEffect(
    useCallback(() => {
      loadShoppingList().then(setItems);
    }, [])
  );

  async function toggle(id: string) {
    const updated = items.map(i => i.id === id ? { ...i, checked: !i.checked } : i);
    setItems(updated);
    await saveShoppingList(updated);
  }

  async function clearChecked() {
    const updated = items.filter(i => !i.checked);
    setItems(updated);
    await saveShoppingList(updated);
  }

  async function clearAll() {
    Alert.alert('Clear all?', 'This will remove all items from your shopping list.', [
      { text: 'Cancel' },
      {
        text: 'Clear', style: 'destructive', onPress: async () => {
          setItems([]);
          await saveShoppingList([]);
        }
      },
    ]);
  }

  const checked = items.filter(i => i.checked).length;
  const sections = buildSections(items);

  return (
    <View style={styles.container}>
      <SectionList
        sections={sections}
        keyExtractor={i => i.id}
        contentContainerStyle={styles.list}
        ListEmptyComponent={<Text style={styles.empty}>Your shopping list is empty.</Text>}
        renderSectionHeader={({ section }) => (
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>{section.title}</Text>
            <Text style={styles.sectionCount}>{section.data.length}</Text>
          </View>
        )}
        renderItem={({ item }) => (
          <Pressable style={styles.item} onPress={() => toggle(item.id)}>
            <View style={[styles.checkbox, item.checked && styles.checkboxChecked]}>
              {item.checked && <Text style={styles.checkmark}>✓</Text>}
            </View>
            <Text style={[styles.itemText, item.checked && styles.itemChecked]}>{item.text}</Text>
          </Pressable>
        )}
        stickySectionHeadersEnabled={false}
      />

      <View style={styles.footer}>
        <Pressable style={styles.footerNavBtn} onPress={() => navigation.navigate('Home')}>
          <Text style={styles.footerNavText}>Recipes</Text>
        </Pressable>
        {checked > 0 && (
          <Pressable style={styles.footerBtn} onPress={clearChecked}>
            <Text style={styles.footerBtnText}>Remove checked ({checked})</Text>
          </Pressable>
        )}
        <Pressable style={[styles.footerBtn, styles.clearAllBtn]} onPress={clearAll}>
          <Text style={[styles.footerBtnText, styles.clearAllText]}>Clear all</Text>
        </Pressable>
      </View>
    </View>
  );
}

const CATEGORY_COLORS: Record<IngredientCategory, string> = {
  Produce: '#4caf50',
  Meats: '#e53935',
  Seafood: '#1e88e5',
  Spices: '#fb8c00',
  Other: '#757575',
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8f8f6' },
  list: { padding: 16, paddingBottom: 8 },
  empty: { textAlign: 'center', color: '#aaa', marginTop: 40, fontSize: 15 },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 16, marginBottom: 6 },
  sectionTitle: { fontSize: 13, fontWeight: '700', color: '#888', textTransform: 'uppercase', letterSpacing: 0.8 },
  sectionCount: { fontSize: 12, color: '#bbb', fontWeight: '600' },
  item: { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: '#fff', borderRadius: 10, padding: 14, marginBottom: 6, elevation: 1, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 3, shadowOffset: { width: 0, height: 1 } },
  checkbox: { width: 22, height: 22, borderRadius: 6, borderWidth: 2, borderColor: '#ccc', alignItems: 'center', justifyContent: 'center' },
  checkboxChecked: { backgroundColor: '#e8553e', borderColor: '#e8553e' },
  checkmark: { color: '#fff', fontSize: 13, fontWeight: '700' },
  itemText: { flex: 1, fontSize: 15, color: '#222' },
  itemChecked: { color: '#aaa', textDecorationLine: 'line-through' },
  footer: { flexDirection: 'row', padding: 12, gap: 8, backgroundColor: '#fff', borderTopWidth: 1, borderColor: '#eee' },
  footerNavBtn: { borderWidth: 1, borderColor: '#e8553e', borderRadius: 10, paddingVertical: 10, paddingHorizontal: 14, justifyContent: 'center' },
  footerNavText: { fontSize: 13, fontWeight: '700', color: '#e8553e' },
  footerBtn: { flex: 1, borderWidth: 1, borderColor: '#ddd', borderRadius: 10, padding: 10, alignItems: 'center', justifyContent: 'center' },
  footerBtnText: { fontSize: 13, fontWeight: '600', color: '#333' },
  clearAllBtn: { borderColor: '#e8553e' },
  clearAllText: { color: '#e8553e' },
});
