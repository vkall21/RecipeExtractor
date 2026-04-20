import React, { useCallback, useState } from 'react';
import { Alert, FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { loadShoppingList, saveShoppingList } from '../services/storage';
import { ShoppingItem } from '../types';

export default function ShoppingListScreen() {
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

  return (
    <View style={styles.container}>
      <FlatList
        data={items}
        keyExtractor={i => i.id}
        contentContainerStyle={styles.list}
        ListEmptyComponent={<Text style={styles.empty}>Your shopping list is empty.</Text>}
        renderItem={({ item }) => (
          <Pressable style={styles.item} onPress={() => toggle(item.id)}>
            <View style={[styles.checkbox, item.checked && styles.checked]}>
              {item.checked && <Text style={styles.checkmark}>✓</Text>}
            </View>
            <Text style={[styles.itemText, item.checked && styles.itemChecked]}>{item.text}</Text>
          </Pressable>
        )}
      />

      {items.length > 0 && (
        <View style={styles.footer}>
          {checked > 0 && (
            <Pressable style={styles.footerBtn} onPress={clearChecked}>
              <Text style={styles.footerBtnText}>Remove checked ({checked})</Text>
            </Pressable>
          )}
          <Pressable style={[styles.footerBtn, styles.clearAllBtn]} onPress={clearAll}>
            <Text style={[styles.footerBtnText, styles.clearAllText]}>Clear all</Text>
          </Pressable>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8f8f6' },
  list: { padding: 16, gap: 8 },
  empty: { textAlign: 'center', color: '#aaa', marginTop: 40, fontSize: 15 },
  item: { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: '#fff', borderRadius: 10, padding: 14, elevation: 1, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 3, shadowOffset: { width: 0, height: 1 } },
  checkbox: { width: 22, height: 22, borderRadius: 6, borderWidth: 2, borderColor: '#ccc', alignItems: 'center', justifyContent: 'center' },
  checked: { backgroundColor: '#e8553e', borderColor: '#e8553e' },
  checkmark: { color: '#fff', fontSize: 13, fontWeight: '700' },
  itemText: { flex: 1, fontSize: 15, color: '#222' },
  itemChecked: { color: '#aaa', textDecorationLine: 'line-through' },
  footer: { flexDirection: 'row', padding: 16, gap: 10, backgroundColor: '#fff', borderTopWidth: 1, borderColor: '#eee' },
  footerBtn: { flex: 1, borderWidth: 1, borderColor: '#ddd', borderRadius: 10, padding: 12, alignItems: 'center' },
  footerBtnText: { fontSize: 14, fontWeight: '600', color: '#333' },
  clearAllBtn: { borderColor: '#e8553e' },
  clearAllText: { color: '#e8553e' },
});
