/**
 * Recipe Types - DummyJSON Recipes API
 * Docs: https://dummyjson.com/docs/recipes
 */

export interface Recipe {
  id: number;
  name: string;
  ingredients: string[];
  instructions: string[];
  prepTimeMinutes: number;
  cookTimeMinutes: number;
  servings: number;
  difficulty: 'Easy' | 'Medium' | 'Hard';
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
  category?: string;
  tag?: string;
  limit?: number;
  skip?: number;
  select?: string;
}

export interface CategoryResponse {
  [key: string]: string[];
}
