import AsyncStorage from '@react-native-async-storage/async-storage';
import { IngredientCategory, Recipe, ShoppingItem } from '../types';

const RECIPES_KEY = '@recipes';
const SHOPPING_KEY = '@shopping';

export async function loadRecipes(): Promise<Recipe[]> {
  const json = await AsyncStorage.getItem(RECIPES_KEY);
  return json ? JSON.parse(json) : [];
}

export async function saveRecipe(recipe: Recipe): Promise<void> {
  const recipes = await loadRecipes();
  const filtered = recipes.filter(r => r.id !== recipe.id);
  await AsyncStorage.setItem(RECIPES_KEY, JSON.stringify([recipe, ...filtered]));
}

export async function deleteRecipe(id: string): Promise<void> {
  const recipes = await loadRecipes();
  await AsyncStorage.setItem(RECIPES_KEY, JSON.stringify(recipes.filter(r => r.id !== id)));
}

export async function loadShoppingList(): Promise<ShoppingItem[]> {
  const json = await AsyncStorage.getItem(SHOPPING_KEY);
  if (!json) return [];
  const items: ShoppingItem[] = JSON.parse(json);
  // Backfill category for items saved before categorization was added
  return items.map(i => ({ ...i, category: i.category ?? 'Other' }));
}

export async function saveShoppingList(items: ShoppingItem[]): Promise<void> {
  await AsyncStorage.setItem(SHOPPING_KEY, JSON.stringify(items));
}

export async function addIngredientsToShoppingList(
  categorized: { text: string; category: IngredientCategory }[]
): Promise<void> {
  const existing = await loadShoppingList();
  const existingTexts = new Set(existing.map(i => i.text.toLowerCase()));
  const newItems: ShoppingItem[] = categorized
    .filter(c => !existingTexts.has(c.text.toLowerCase()))
    .map(c => ({
      id: Date.now().toString() + Math.random(),
      text: c.text,
      checked: false,
      category: c.category,
    }));
  await saveShoppingList([...existing, ...newItems]);
}
