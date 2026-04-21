export interface Recipe {
  id: string;
  title: string;
  sourceUrl: string;
  image?: string;
  description?: string;
  ingredients: string[];
  steps: string[];
  savedAt: number;
}

export type IngredientCategory = 'Produce' | 'Meats' | 'Seafood' | 'Spices' | 'Other';

export const CATEGORY_ORDER: IngredientCategory[] = ['Produce', 'Meats', 'Seafood', 'Spices', 'Other'];

export interface ShoppingItem {
  id: string;
  text: string;
  checked: boolean;
  category: IngredientCategory;
}
