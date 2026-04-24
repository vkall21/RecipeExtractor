import AsyncStorage from '@react-native-async-storage/async-storage';
import { Recipe, ShoppingItem } from '../types';
import { tryMergeIngredient } from '../utils/ingredientMerger';

const RECIPES_KEY = '@recipes';
const SHOPPING_KEY = '@shopping';
const LLM_CONFIG_KEY = '@llm_config';

export type LLMProvider = 'claude' | 'openai' | 'gemini';
export interface LLMConfig { provider: LLMProvider; apiKey: string; }

export async function getLLMConfig(): Promise<LLMConfig | null> {
  const json = await AsyncStorage.getItem(LLM_CONFIG_KEY);
  return json ? JSON.parse(json) : null;
}

export async function saveLLMConfig(config: LLMConfig): Promise<void> {
  await AsyncStorage.setItem(LLM_CONFIG_KEY, JSON.stringify(config));
}

export async function clearLLMConfig(): Promise<void> {
  await AsyncStorage.removeItem(LLM_CONFIG_KEY);
}

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

function consolidate(items: ShoppingItem[]): ShoppingItem[] {
  const result: ShoppingItem[] = [];
  for (const item of items) {
    const texts = result.map(r => r.text);
    const merge = tryMergeIngredient(item.text, texts);
    if (merge) {
      const idx = result.findIndex(r => r.text === merge.matchedText);
      if (idx !== -1) result[idx] = { ...result[idx], text: merge.mergedText };
    } else {
      result.push(item);
    }
  }
  return result;
}

export async function loadShoppingList(): Promise<ShoppingItem[]> {
  const json = await AsyncStorage.getItem(SHOPPING_KEY);
  if (!json) return [];
  const items: ShoppingItem[] = JSON.parse(json);
  const consolidated = consolidate(items);
  // Persist if consolidation changed anything
  if (consolidated.length !== items.length) await saveShoppingList(consolidated);
  return consolidated;
}

export async function saveShoppingList(items: ShoppingItem[]): Promise<void> {
  await AsyncStorage.setItem(SHOPPING_KEY, JSON.stringify(items));
}

export async function addIngredientsToShoppingList(ingredients: string[]): Promise<void> {
  let list = await loadShoppingList();

  for (const text of ingredients) {
    const existingTexts = list.map(i => i.text);
    const merge = tryMergeIngredient(text, existingTexts);

    if (merge) {
      list = list.map(item =>
        item.text === merge.matchedText ? { ...item, text: merge.mergedText } : item
      );
    } else if (!existingTexts.some(t => t.toLowerCase() === text.toLowerCase())) {
      list.push({ id: Date.now().toString() + Math.random(), text, checked: false });
    }
  }

  await saveShoppingList(list);
}
