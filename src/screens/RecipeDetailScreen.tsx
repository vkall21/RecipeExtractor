import React, { useState } from 'react';
import {
  Alert,
  Image,
  Pressable,
  ScrollView,
  Share,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { addIngredientsToShoppingList } from '../services/storage';
import { categorizeIngredients } from '../services/categorizer';
import { scaleIngredient } from '../utils/scaleIngredient';
import { Recipe } from '../types';

const MULTIPLIERS: { label: string; value: number }[] = [
  { label: '0.5x', value: 0.5 },
  { label: '1x', value: 1 },
  { label: '2x', value: 2 },
  { label: '3x', value: 3 },
];

export default function RecipeDetailScreen({ route, navigation }: any) {
  const recipe: Recipe = route.params.recipe;
  const [multiplier, setMultiplier] = useState(1);
  const [checked, setChecked] = useState<Set<number>>(new Set());

  const scaledIngredients = recipe.ingredients.map(i => scaleIngredient(i, multiplier));

  function toggleIngredient(index: number) {
    setChecked(prev => {
      const next = new Set(prev);
      next.has(index) ? next.delete(index) : next.add(index);
      return next;
    });
  }

  function selectAll() {
    if (checked.size === recipe.ingredients.length) {
      setChecked(new Set());
    } else {
      setChecked(new Set(recipe.ingredients.map((_, i) => i)));
    }
  }

  async function handleAddToList() {
    const indices = checked.size > 0
      ? Array.from(checked)
      : recipe.ingredients.map((_, i) => i);
    const toAdd = indices.map(i => scaledIngredients[i]);
    try {
      const categoryMap = await categorizeIngredients(toAdd);
      const categorized = toAdd.map(text => ({ text, category: categoryMap.get(text) ?? 'Other' as const }));
      await addIngredientsToShoppingList(categorized);
      setChecked(new Set());
      const label = checked.size > 0 ? `${checked.size} selected` : `all ${toAdd.length}`;
      Alert.alert('Added', `Added ${label} ingredient${toAdd.length !== 1 ? 's' : ''} to your shopping list.`, [
        { text: 'View List', onPress: () => navigation.navigate('ShoppingList') },
        { text: 'OK' },
      ]);
    } catch (e: any) {
      Alert.alert('Error', `Could not add to shopping list: ${e?.message ?? 'Unknown error'}`);
    }
  }

  async function handleShare() {
    const body = [
      recipe.title,
      multiplier !== 1 ? `(${MULTIPLIERS.find(m => m.value === multiplier)?.label} recipe)` : '',

      recipe.sourceUrl ? `Source: ${recipe.sourceUrl}` : '',
      '',
      'INGREDIENTS',
      ...scaledIngredients.map(i => `• ${i}`),
      '',
      'INSTRUCTIONS',
      ...recipe.steps.map((s, idx) => `${idx + 1}. ${s}`),
    ].filter(Boolean).join('\n');
    await Share.share({ title: recipe.title, message: body });
  }

  const allSelected = checked.size === recipe.ingredients.length;

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {recipe.image ? <Image source={{ uri: recipe.image }} style={styles.hero} /> : null}

      <Text style={styles.title}>{recipe.title}</Text>
      {recipe.description ? <Text style={styles.description}>{recipe.description}</Text> : null}

      <View style={styles.actions}>
        <Pressable style={styles.actionBtn} onPress={handleShare}>
          <Text style={styles.actionText}>Share</Text>
        </Pressable>
        <Pressable style={[styles.actionBtn, styles.primaryBtn]} onPress={handleAddToList}>
          <Text style={[styles.actionText, styles.primaryText]}>
            {checked.size > 0 ? `Add ${checked.size} to List` : 'Add All to List'}
          </Text>
        </Pressable>
      </View>
      <Pressable style={styles.shoppingNavBtn} onPress={() => navigation.navigate('ShoppingList')}>
        <Text style={styles.shoppingNavText}>View Shopping List</Text>
      </Pressable>

      {/* Multiplier */}
      <View style={styles.section}>
        <Text style={styles.sectionHead}>Servings</Text>
        <View style={styles.multiplierRow}>
          {MULTIPLIERS.map(m => (
            <Pressable
              key={m.value}
              style={[styles.multiplierBtn, multiplier === m.value && styles.multiplierActive]}
              onPress={() => setMultiplier(m.value)}
            >
              <Text style={[styles.multiplierText, multiplier === m.value && styles.multiplierTextActive]}>
                {m.label}
              </Text>
            </Pressable>
          ))}
        </View>
      </View>

      {/* Ingredients */}
      <View style={styles.section}>
        <View style={styles.sectionHeaderRow}>
          <Text style={styles.sectionHead}>Ingredients</Text>
          <Pressable onPress={selectAll}>
            <Text style={styles.selectAllText}>{allSelected ? 'Deselect all' : 'Select all'}</Text>
          </Pressable>
        </View>
        {scaledIngredients.map((ing, i) => (
          <Pressable key={i} style={styles.ingredientRow} onPress={() => toggleIngredient(i)}>
            <View style={[styles.checkbox, checked.has(i) && styles.checkboxChecked]}>
              {checked.has(i) && <Text style={styles.checkmark}>✓</Text>}
            </View>
            <Text style={[styles.ingredientText, checked.has(i) && styles.ingredientChecked]}>
              {ing}
            </Text>
          </Pressable>
        ))}
      </View>

      {/* Instructions */}
      <View style={styles.section}>
        <Text style={styles.sectionHead}>Instructions</Text>
        {recipe.steps.map((step, i) => (
          <View key={i} style={styles.step}>
            <Text style={styles.stepNum}>{i + 1}</Text>
            <Text style={styles.stepText}>{step}</Text>
          </View>
        ))}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8f8f6' },
  content: { paddingBottom: 40 },
  hero: { width: '100%', height: 220 },
  title: { fontSize: 22, fontWeight: '700', color: '#111', margin: 16, marginBottom: 8 },
  description: { fontSize: 14, color: '#555', marginHorizontal: 16, marginBottom: 8, lineHeight: 21 },
  actions: { flexDirection: 'row', gap: 10, marginHorizontal: 16, marginTop: 12, marginBottom: 8 },
  shoppingNavBtn: { marginHorizontal: 16, marginBottom: 4, padding: 10, alignItems: 'center' },
  shoppingNavText: { fontSize: 13, color: '#e8553e', fontWeight: '600' },
  actionBtn: { flex: 1, borderWidth: 1, borderColor: '#ddd', borderRadius: 10, padding: 12, alignItems: 'center', backgroundColor: '#fff' },
  primaryBtn: { backgroundColor: '#e8553e', borderColor: '#e8553e' },
  actionText: { fontWeight: '600', fontSize: 14, color: '#333' },
  primaryText: { color: '#fff' },
  section: { marginHorizontal: 16, marginTop: 20 },
  sectionHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  sectionHead: { fontSize: 17, fontWeight: '700', color: '#111' },
  selectAllText: { fontSize: 13, color: '#e8553e', fontWeight: '600' },
  multiplierRow: { flexDirection: 'row', gap: 10, marginTop: 8 },
  multiplierBtn: { flex: 1, paddingVertical: 10, borderRadius: 10, borderWidth: 1.5, borderColor: '#ddd', alignItems: 'center', backgroundColor: '#fff' },
  multiplierActive: { borderColor: '#e8553e', backgroundColor: '#fdf1ef' },
  multiplierText: { fontSize: 15, fontWeight: '600', color: '#666' },
  multiplierTextActive: { color: '#e8553e' },
  ingredientRow: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 8, borderBottomWidth: 1, borderColor: '#f0f0f0' },
  checkbox: { width: 22, height: 22, borderRadius: 6, borderWidth: 2, borderColor: '#ccc', alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  checkboxChecked: { backgroundColor: '#e8553e', borderColor: '#e8553e' },
  checkmark: { color: '#fff', fontSize: 13, fontWeight: '700' },
  ingredientText: { flex: 1, fontSize: 14, color: '#333', lineHeight: 20 },
  ingredientChecked: { color: '#aaa' },
  step: { flexDirection: 'row', marginBottom: 14, gap: 12 },
  stepNum: { width: 26, height: 26, borderRadius: 13, backgroundColor: '#e8553e', color: '#fff', textAlign: 'center', lineHeight: 26, fontWeight: '700', fontSize: 13, flexShrink: 0 },
  stepText: { flex: 1, fontSize: 14, color: '#333', lineHeight: 21 },
});
