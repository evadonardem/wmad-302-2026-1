/**
 * Recipe Types - DummyJSON Recipes API
 * Docs: https://dummyjson.com/docs/recipes
 */

export type Difficulty = 'Easy' | 'Medium' | 'Hard';

export interface Recipe {
  id: number;
  name: string;
  ingredients: string[];
  instructions: string[];
  prepTimeMinutes: number;
  cookTimeMinutes: number;
  servings: number;
  difficulty: Difficulty;
  cuisine: string;
  caloriesPerServing: number;
  tags: string[];
  userId: number;
  image: string;
  rating: number;
  reviewCount: number;
  mealType: string[];
}

export interface RecipesResponse {
  recipes: Recipe[];
  total: number;
  skip: number;
  limit: number;
}

export interface RecipeSearchParams {
  q?: string;
  limit?: number;
  skip?: number;
  select?: string;
  sortBy?: string;
  order?: 'asc' | 'desc';
}

export type SortOption = 'relevance' | 'rating' | 'time' | 'calories';

export interface RecipeFilters {
  category?: string | null;
  cuisine?: string | null;
  difficulty?: Difficulty | null;
  tag?: string | null;
}

export interface RecipeQuery extends RecipeFilters {
  q?: string;
  sort?: SortOption;
}

export interface Category {
  name: string;
  count: number;
}

export interface PagedRecipes {
  data: Recipe[];
  total: number;
  hasMore: boolean;
}