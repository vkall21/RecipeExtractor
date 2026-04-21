import Anthropic from '@anthropic-ai/sdk';
import { IngredientCategory } from '../types';

const isWeb = typeof document !== 'undefined';
const client = new Anthropic({
  apiKey: process.env.EXPO_PUBLIC_ANTHROPIC_API_KEY,
  ...(isWeb && { dangerouslyAllowBrowser: true }),
});

const VALID: IngredientCategory[] = ['Produce', 'Meats', 'Seafood', 'Spices', 'Other'];

export async function categorizeIngredients(
  ingredients: string[]
): Promise<Map<string, IngredientCategory>> {
  if (ingredients.length === 0) return new Map();

  const prompt = `Categorize each ingredient into exactly one of: Produce, Meats, Seafood, Spices, Other.

Rules:
- Produce: fruits, vegetables, herbs (fresh)
- Meats: beef, pork, chicken, turkey, lamb, deli meats, bacon
- Seafood: fish, shrimp, crab, lobster, clams, scallops
- Spices: dried spices, dried herbs, seasoning blends, salt, pepper
- Other: dairy, grains, oils, sauces, canned goods, nuts, anything else

Return ONLY a JSON object mapping each ingredient exactly as given to its category. No explanation.

Ingredients:
${ingredients.map((ing, i) => `${i + 1}. ${ing}`).join('\n')}`;

  const message = await client.messages.create({
    model: 'claude-haiku-4-5-20251001',
    max_tokens: 1024,
    messages: [{ role: 'user', content: prompt }],
  });

  const text = message.content[0].type === 'text' ? message.content[0].text : '{}';
  const jsonMatch = text.match(/\{[\s\S]*\}/);
  if (!jsonMatch) return fallbackCategorize(ingredients);

  try {
    const parsed: Record<string, string> = JSON.parse(jsonMatch[0]);
    const result = new Map<string, IngredientCategory>();
    for (const ing of ingredients) {
      const cat = parsed[ing] as IngredientCategory;
      result.set(ing, VALID.includes(cat) ? cat : 'Other');
    }
    return result;
  } catch {
    return fallbackCategorize(ingredients);
  }
}

function fallbackCategorize(ingredients: string[]): Map<string, IngredientCategory> {
  const map = new Map<string, IngredientCategory>();
  ingredients.forEach(ing => map.set(ing, 'Other'));
  return map;
}
