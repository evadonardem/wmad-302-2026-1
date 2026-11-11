/**
 * Recipe API Service - DummyJSON Recipes
 * Docs: https://dummyjson.com/docs/recipes
 */

import axios, { AxiosInstance } from 'axios';
import { Recipe, RecipesResponse, RecipeSearchParams } from '@/types/recipe';
import { recipeCacheStorage } from '@/utils/storage';

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

  /**
   * Get all recipes with pagination
   */
  async getRecipes(params: RecipeSearchParams = {}): Promise<RecipesResponse> {
    return this.withCache(
      `recipes:${JSON.stringify(params)}`,
      () => this.client.get<RecipesResponse>('/', { params }).then(({ data }) => data)
    );
  }

  /**
   * Get single recipe by ID
   */
  async getRecipeById(id: number): Promise<Recipe> {
    let recipe: Recipe;
    try {
      ({ data: recipe } = await this.client.get<Recipe>(`/${id}`));
    } catch (error) {
      const cached = await recipeCacheStorage.getRecipe(id);
      if (cached) return { ...cached, isCached: true };
      throw error;
    }
    try {
      await recipeCacheStorage.setRecipes([recipe]);
    } catch (cacheError) {
      console.error('Recipe data loaded but could not be cached for offline use:', cacheError);
    }
    return recipe;
  }

  /**
   * Search recipes by query
   */
  async searchRecipes(query: string, params: RecipeSearchParams = {}): Promise<RecipesResponse> {
    const requestParams = { q: query, ...params };
    return this.withCache(
      `search:${JSON.stringify(requestParams)}`,
      () => this.client.get<RecipesResponse>('/search', { params: requestParams }).then(({ data }) => data)
    );
  }

  private async withCache(
    key: string,
    request: () => Promise<RecipesResponse>
  ): Promise<RecipesResponse> {
    let response: RecipesResponse;
    try {
      response = await request();
    } catch (error) {
      const cached = await recipeCacheStorage.getResponse(key);
      if (cached) return { ...cached, isCached: true };
      throw error;
    }
    try {
      await recipeCacheStorage.setResponse(key, response);
      await recipeCacheStorage.setRecipes(response.recipes);
    } catch (cacheError) {
      console.error('Recipe data loaded but could not be cached for offline use:', cacheError);
    }
    return response;
  }

  /**
   * Filter recipes by cuisine, meal type, or tag.
   */
  async getRecipesByCategory(category: string, params: RecipeSearchParams = {}): Promise<RecipesResponse> {
    const response = await this.getRecipes({ limit: 100 });
    const value = category.toLowerCase();
    const matchingRecipes = response.recipes.filter((recipe) => (
      recipe.cuisine.toLowerCase() === value
      || recipe.mealType.some((meal) => meal.toLowerCase() === value)
      || recipe.tags.some((tag) => tag.toLowerCase() === value)
    ));
    const skip = params.skip ?? 0;
    const limit = params.limit ?? 30;
    return {
      recipes: matchingRecipes.slice(skip, skip + limit),
      total: matchingRecipes.length,
      skip,
      limit,
    };
  }

  /**
   * Get recipes by tag/meal type
   */
  async getRecipesByTag(tag: string, params: RecipeSearchParams = {}): Promise<RecipesResponse> {
    return this.withCache(
      `tag:${tag}:${JSON.stringify(params)}`,
      () => this.client.get<RecipesResponse>(`/tag/${encodeURIComponent(tag)}`, { params }).then(({ data }) => data)
    );
  }

  /**
   * Get random recipe(s)
   */
  async getRandomRecipes(count: number = 1): Promise<Recipe[]> {
    const response = await this.client.get<{ recipes: Recipe[] }>(`/random/${count}`);
    return response.data.recipes;
  }

  /**
   * Get all categories
   */
  async getCategories(): Promise<string[]> {
    const response = await this.getRecipes({ limit: 100, select: 'cuisine' });
    return [...new Set(response.recipes.map((recipe) => recipe.cuisine))].sort();
  }

  /**
   * Get all meal types/tags
   */
  async getMealTypes(): Promise<string[]> {
    return [
      'Breakfast', 'Lunch', 'Dinner', 'Snack', 'Appetizer', 'Dessert', 'Drink',
    ];
  }
}

export const recipeApi = new RecipeApiService();
export { RecipeApiService };