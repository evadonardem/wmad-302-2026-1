/**
 * Cookbook Types - the user's personal data kept on the device
 * (favorites, shopping list, meal plan, collections, notes, cooking history)
 */

export interface ShoppingItem {
  id: string;
  /** Normalized ingredient name used to merge duplicates, e.g. "olive oil" */
  key: string;
  /** Name shown in the list, e.g. "Olive oil" */
  name: string;
  /** The original ingredient lines, e.g. ["2 tablespoons olive oil", "1/4 cup olive oil"] */
  details: string[];
  /** Recipes this item came from (empty for items typed in by hand) */
  recipeIds: number[];
  checked: boolean;
}

export type DayKey = 'mon' | 'tue' | 'wed' | 'thu' | 'fri' | 'sat' | 'sun';

export type MealPlan = Record<DayKey, number[]>;

export interface Collection {
  id: string;
  name: string;
  recipeIds: number[];
  createdAt: number;
}

export interface RecipeNote {
  /** 0 = not rated, 1-5 stars */
  rating: number;
  text: string;
  updatedAt: number;
}

export interface CookedEntry {
  recipeId: number;
  cookedAt: number;
}

export interface CookbookData {
  favorites: number[];
  shopping: ShoppingItem[];
  mealPlan: MealPlan;
  collections: Collection[];
  /** Keyed by recipe id */
  notes: Record<string, RecipeNote>;
  cooked: CookedEntry[];
  /** Most recent first */
  recent: number[];
}

export interface CookbookState extends CookbookData {
  /** True once the saved data has been loaded from the device */
  hydrated: boolean;
}

export interface NewShoppingLine {
  text: string;
  recipeId?: number;
}

export type CookbookAction =
  | { type: 'HYDRATE'; payload: Partial<CookbookData> }
  | { type: 'TOGGLE_FAVORITE'; recipeId: number }
  | { type: 'CLEAR_FAVORITES' }
  | { type: 'ADD_TO_SHOPPING'; lines: NewShoppingLine[]; ids: string[] }
  | { type: 'TOGGLE_SHOPPING_ITEM'; id: string }
  | { type: 'REMOVE_SHOPPING_ITEM'; id: string }
  | { type: 'CLEAR_CHECKED_SHOPPING' }
  | { type: 'CLEAR_SHOPPING' }
  | { type: 'ADD_TO_PLAN'; day: DayKey; recipeId: number }
  | { type: 'REMOVE_FROM_PLAN'; day: DayKey; recipeId: number }
  | { type: 'CLEAR_PLAN' }
  | { type: 'CREATE_COLLECTION'; id: string; name: string; recipeId?: number; createdAt: number }
  | { type: 'RENAME_COLLECTION'; id: string; name: string }
  | { type: 'DELETE_COLLECTION'; id: string }
  | { type: 'TOGGLE_IN_COLLECTION'; collectionId: string; recipeId: number }
  | { type: 'SAVE_NOTE'; recipeId: number; rating: number; text: string; updatedAt: number }
  | { type: 'MARK_COOKED'; recipeId: number; cookedAt: number }
  | { type: 'ADD_RECENT'; recipeId: number }
  | { type: 'CLEAR_HISTORY' };
