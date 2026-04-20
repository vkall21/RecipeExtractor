import React from 'react';
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
import { Recipe } from '../types';

export default function RecipeDetailScreen({ route, navigation }: any) {
  const recipe: Recipe = route.params.recipe;

  async function handleShare() {
    const body = [
      recipe.title,
      recipe.sourceUrl ? `Source: ${recipe.sourceUrl}` : '',
      '',
      'INGREDIENTS',
      ...recipe.ingredients.map(i => `• ${i}`),
      '',
      'INSTRUCTIONS',
      ...recipe.steps.map((s, idx) => `${idx + 1}. ${s}`),
    ].filter(l => l !== undefined).join('\n');

    await Share.share({ title: recipe.title, message: body });
  }

  async function handleAddToList() {
    await addIngredientsToShoppingList(recipe.ingredients);
    Alert.alert('Added', `${recipe.ingredients.length} ingredients added to your shopping list.`, [
      { text: 'View List', onPress: () => navigation.navigate('ShoppingList') },
      { text: 'OK' },
    ]);
  }

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
          <Text style={[styles.actionText, styles.primaryText]}>Add to Shopping List</Text>
        </Pressable>
      </View>

      <Text style={styles.sectionHead}>Ingredients</Text>
      {recipe.ingredients.map((ing, i) => (
        <Text key={i} style={styles.ingredient}>• {ing}</Text>
      ))}

      <Text style={styles.sectionHead}>Instructions</Text>
      {recipe.steps.map((step, i) => (
        <View key={i} style={styles.step}>
          <Text style={styles.stepNum}>{i + 1}</Text>
          <Text style={styles.stepText}>{step}</Text>
        </View>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8f8f6' },
  content: { paddingBottom: 40 },
  hero: { width: '100%', height: 220 },
  title: { fontSize: 22, fontWeight: '700', color: '#111', margin: 16, marginBottom: 8 },
  description: { fontSize: 14, color: '#555', marginHorizontal: 16, marginBottom: 8, lineHeight: 21 },
  actions: { flexDirection: 'row', gap: 10, marginHorizontal: 16, marginVertical: 12 },
  actionBtn: { flex: 1, borderWidth: 1, borderColor: '#ddd', borderRadius: 10, padding: 12, alignItems: 'center', backgroundColor: '#fff' },
  primaryBtn: { backgroundColor: '#e8553e', borderColor: '#e8553e' },
  actionText: { fontWeight: '600', fontSize: 14, color: '#333' },
  primaryText: { color: '#fff' },
  sectionHead: { fontSize: 17, fontWeight: '700', color: '#111', marginHorizontal: 16, marginTop: 20, marginBottom: 10 },
  ingredient: { fontSize: 14, color: '#333', marginHorizontal: 16, marginBottom: 5, lineHeight: 20 },
  step: { flexDirection: 'row', marginHorizontal: 16, marginBottom: 14, gap: 12 },
  stepNum: { width: 26, height: 26, borderRadius: 13, backgroundColor: '#e8553e', color: '#fff', textAlign: 'center', lineHeight: 26, fontWeight: '700', fontSize: 13 },
  stepText: { flex: 1, fontSize: 14, color: '#333', lineHeight: 21 },
});
