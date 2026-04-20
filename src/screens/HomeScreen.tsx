import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Image,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { deleteRecipe, loadRecipes, saveRecipe } from '../services/storage';
import { extractRecipeFromUrl } from '../services/recipeExtractor';
import { Recipe } from '../types';

export default function HomeScreen({ navigation }: any) {
  const [url, setUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [recipes, setRecipes] = useState<Recipe[]>([]);

  useFocusEffect(
    useCallback(() => {
      loadRecipes().then(setRecipes);
    }, [])
  );

  async function handleExtract() {
    if (!url.trim()) return;
    setLoading(true);
    try {
      const recipe = await extractRecipeFromUrl(url.trim());
      await saveRecipe(recipe);
      setUrl('');
      const updated = await loadRecipes();
      setRecipes(updated);
      navigation.navigate('RecipeDetail', { recipe });
    } catch (e: any) {
      Alert.alert('Error', e.message ?? 'Could not extract recipe.');
    } finally {
      setLoading(false);
    }
  }

  async function handleDelete(id: string) {
    await deleteRecipe(id);
    setRecipes(prev => prev.filter(r => r.id !== id));
  }

  return (
    <View style={styles.container}>
      <View style={styles.inputRow}>
        <TextInput
          style={styles.input}
          placeholder="Paste recipe URL…"
          placeholderTextColor="#999"
          value={url}
          onChangeText={setUrl}
          autoCapitalize="none"
          autoCorrect={false}
          keyboardType="url"
        />
        <Pressable style={[styles.button, loading && styles.buttonDisabled]} onPress={handleExtract} disabled={loading}>
          {loading ? <ActivityIndicator color="#fff" size="small" /> : <Text style={styles.buttonText}>Extract</Text>}
        </Pressable>
      </View>

      <FlatList
        data={recipes}
        keyExtractor={r => r.id}
        contentContainerStyle={styles.list}
        ListEmptyComponent={<Text style={styles.empty}>No saved recipes yet.</Text>}
        renderItem={({ item }) => (
          <Pressable style={styles.card} onPress={() => navigation.navigate('RecipeDetail', { recipe: item })}>
            {item.image ? <Image source={{ uri: item.image }} style={styles.cardImage} /> : null}
            <View style={styles.cardBody}>
              <Text style={styles.cardTitle} numberOfLines={2}>{item.title}</Text>
              <Text style={styles.cardMeta}>{item.ingredients.length} ingredients</Text>
            </View>
            <Pressable onPress={() => handleDelete(item.id)} style={styles.deleteBtn}>
              <Text style={styles.deleteText}>✕</Text>
            </Pressable>
          </Pressable>
        )}
      />

      <Pressable style={styles.shoppingBtn} onPress={() => navigation.navigate('ShoppingList')}>
        <Text style={styles.shoppingBtnText}>🛒  Shopping List</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8f8f6' },
  inputRow: { flexDirection: 'row', padding: 16, gap: 8, backgroundColor: '#fff', borderBottomWidth: 1, borderColor: '#eee' },
  input: { flex: 1, borderWidth: 1, borderColor: '#ddd', borderRadius: 10, paddingHorizontal: 12, paddingVertical: 10, fontSize: 14, backgroundColor: '#fafafa' },
  button: { backgroundColor: '#e8553e', borderRadius: 10, paddingHorizontal: 16, justifyContent: 'center' },
  buttonDisabled: { opacity: 0.6 },
  buttonText: { color: '#fff', fontWeight: '700', fontSize: 14 },
  list: { padding: 16, gap: 12 },
  empty: { textAlign: 'center', color: '#aaa', marginTop: 40, fontSize: 15 },
  card: { flexDirection: 'row', backgroundColor: '#fff', borderRadius: 12, overflow: 'hidden', elevation: 2, shadowColor: '#000', shadowOpacity: 0.07, shadowRadius: 4, shadowOffset: { width: 0, height: 2 } },
  cardImage: { width: 80, height: 80 },
  cardBody: { flex: 1, padding: 12, justifyContent: 'center' },
  cardTitle: { fontSize: 15, fontWeight: '600', color: '#222' },
  cardMeta: { fontSize: 12, color: '#888', marginTop: 4 },
  deleteBtn: { paddingHorizontal: 14, justifyContent: 'center' },
  deleteText: { fontSize: 16, color: '#bbb' },
  shoppingBtn: { margin: 16, backgroundColor: '#fff', borderRadius: 12, padding: 16, alignItems: 'center', borderWidth: 1, borderColor: '#eee' },
  shoppingBtnText: { fontSize: 16, fontWeight: '600', color: '#333' },
});
