/**
 * Recipe API Service - DummyJSON Recipes
 * Docs: https://dummyjson.com/docs/recipes
 */

import axios, { AxiosInstance } from 'axios';
import { Recipe, RecipesResponse, RecipeSearchParams } from '@/types/recipe';

const API_BASE_URL = 'https://dummyjson.com/recipes';

class RecipeApiService {
  private client: AxiosInstance;

  constructor() {
    this.client = axios.create({
      baseURL: API_BASE_URL,
      timeout: 10000,
      headers: {
        'Content-Type': 'application/json',
      },
    });
  }

  async getRecipes(params: RecipeSearchParams = {}): Promise<RecipesResponse> {
    const response = await this.client.get<RecipesResponse>('/', { params });
    return response.data;
  }

  async getRecipeById(id: number): Promise<Recipe> {
    const response = await this.client.get<Recipe>(`/${id}`);
    return response.data;
  }

  async searchRecipes(query: string, params: RecipeSearchParams = {}): Promise<RecipesResponse> {
    const response = await this.client.get<RecipesResponse>('/search', {
      params: { q: query, ...params },
    });
    return response.data;
  }

  async getRecipesByCategory(category: string, params: RecipeSearchParams = {}): Promise<RecipesResponse> {
    const normalized = category.trim();
    const mealTypes = ['breakfast', 'lunch', 'dinner', 'snack', 'appetizer', 'dessert', 'beverage', 'drink'];

    try {
      if (mealTypes.includes(normalized.toLowerCase())) {
        const mealRes = await this.client.get<RecipesResponse>(
          `/meal-type/${encodeURIComponent(normalized.toLowerCase())}`,
          { params }
        );
        if (mealRes.data.recipes.length > 0) {
          return mealRes.data;
        }
      }

      const tagRes = await this.client.get<RecipesResponse>(
        `/tag/${encodeURIComponent(normalized)}`,
        { params }
      );
      if (tagRes.data.recipes.length > 0) {
        return tagRes.data;
      }
    } catch {
      // Fallback to client-side filtering across all recipes
    }

    const allRes = await this.getRecipes({ limit: 50, skip: 0 });
    const term = normalized.toLowerCase();
    const filtered = allRes.recipes.filter(
      (r) =>
        r.name.toLowerCase().includes(term) ||
        r.cuisine.toLowerCase().includes(term) ||
        r.tags.some((t) => t.toLowerCase().includes(term)) ||
        r.mealType.some((m) => m.toLowerCase().includes(term)) ||
        r.ingredients.some((ing) => ing.toLowerCase().includes(term))
    );

    const skip = params.skip ?? 0;
    const limit = params.limit ?? 20;
    return {
      recipes: filtered.slice(skip, skip + limit),
      total: filtered.length,
      skip,
      limit,
    };
  }

  async getRecipesByTag(tag: string, params: RecipeSearchParams = {}): Promise<RecipesResponse> {
    const response = await this.client.get<RecipesResponse>(`/tag/${encodeURIComponent(tag)}`, {
      params,
    });
    return response.data;
  }

  async getRandomRecipes(count: number = 1): Promise<Recipe[]> {
    const response = await this.client.get<{ recipes: Recipe[] }>(`/random/${count}`);
    return response.data.recipes;
  }

  async getCategories(): Promise<string[]> {
    return [
      'Chicken', 'Beef', 'Pasta', 'Seafood', 'Vegetarian', 'Dessert',
      'Breakfast', 'Lunch', 'Dinner', 'Snack', 'Appetizer', 'Salad',
    ];
  }

  async getMealTypes(): Promise<string[]> {
    return [
      'Breakfast', 'Lunch', 'Dinner', 'Snack', 'Appetizer', 'Dessert', 'Drink',
    ];
  }
}

export const recipeApi = new RecipeApiService();
export { RecipeApiService };
