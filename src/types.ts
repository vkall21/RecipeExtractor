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

export interface ShoppingItem {
  id: string;
  text: string;
  checked: boolean;
}
