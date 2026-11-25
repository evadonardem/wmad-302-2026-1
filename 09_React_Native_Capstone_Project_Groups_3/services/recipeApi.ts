/**
 * Recipe API Service - DummyJSON Recipes
 * Docs: https://dummyjson.com/docs/recipes
 */

import axios, { AxiosInstance } from 'axios';
import { Recipe, RecipesResponse, RecipeSearchParams } from '@/types/recipe';

const API_BASE_URL = 'https://dummyjson.com/recipes';

export interface CategoryCount {
  name: string;
  count: number;
}

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

  /**
   * Get all recipes with pagination
   */
  async getRecipes(params: RecipeSearchParams = {}): Promise<RecipesResponse> {
    const response = await this.client.get<RecipesResponse>('/', { params });
    return response.data;
  }

  /**
   * Get single recipe by ID
   */
  async getRecipeById(id: number): Promise<Recipe> {
    const response = await this.client.get<Recipe>(`/${id}`);
    return response.data;
  }

  /**
   * Search recipes by query
   */
  async searchRecipes(query: string, params: RecipeSearchParams = {}): Promise<RecipesResponse> {
    const response = await this.client.get<RecipesResponse>('/search', {
      params: { q: query, ...params },
    });
    return response.data;
  }

  /**
   * Get recipes by category (DummyJSON calls these "meal types":
   * Breakfast, Lunch, Dinner, Snack, Dessert, ...)
   * GET /recipes/meal-type/{type}
   */
  async getRecipesByCategory(category: string, params: RecipeSearchParams = {}): Promise<RecipesResponse> {
    const response = await this.client.get<RecipesResponse>(
      `/meal-type/${encodeURIComponent(category.toLowerCase())}`,
      { params }
    );
    return response.data;
  }

  /**
   * Get recipes by tag/meal type
   */
  async getRecipesByTag(tag: string, params: RecipeSearchParams = {}): Promise<RecipesResponse> {
    const response = await this.client.get<RecipesResponse>(`/tag/${encodeURIComponent(tag)}`, {
      params,
    });
    return response.data;
  }

  /**
   * Get all categories with how many recipes each has.
   * DummyJSON has no categories endpoint, so this loads every recipe's
   * meal types in one request (limit=0, only the mealType field) and counts them.
   */
  async getCategories(): Promise<CategoryCount[]> {
    const data = await this.getRecipes({ limit: 0, select: 'mealType' });
    const counts = new Map<string, number>();
    data.recipes.forEach((recipe) => {
      recipe.mealType.forEach((type) => counts.set(type, (counts.get(type) ?? 0) + 1));
    });
    return Array.from(counts, ([name, count]) => ({ name, count })).sort(
      (a, b) => b.count - a.count
    );
  }

  /**
   * Get all meal type names (same list as getCategories, without counts)
   */
  async getMealTypes(): Promise<string[]> {
    const categories = await this.getCategories();
    return categories.map((category) => category.name);
  }
}

export const recipeApi = new RecipeApiService();
export { RecipeApiService };