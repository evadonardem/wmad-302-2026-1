/**
 * Recipe API Service - DummyJSON Recipes
 * Docs: https://dummyjson.com/docs/recipes
 *
 * The dataset is small (50 recipes), so the full list is fetched once and cached.
 * Text search uses GET /recipes/search; category / cuisine / difficulty filters,
 * sorting and pagination are applied client-side (DummyJSON cannot combine them).
 */

import axios, { AxiosInstance } from 'axios';
import {
  Category,
  PagedRecipes,
  Recipe,
  RecipeQuery,
  RecipesResponse,
  RecipeSearchParams,
} from '@/types/recipe';
import {
  filterRecipes,
  getCategories,
  getCuisineCounts,
  getCuisines,
  getTagCounts,
  paginate,
  sortRecipes,
} from '@/utils/recipeFilters';

const API_BASE_URL = 'https://dummyjson.com/recipes';

export interface PageOptions {
  skip?: number;
  limit?: number;
}

class RecipeApiService {
  private client: AxiosInstance;
  private allCache: Recipe[] | null = null;
  private byIdCache = new Map<number, Recipe>();

  constructor() {
    this.client = axios.create({
      baseURL: API_BASE_URL,
      timeout: 10000,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  /**
   * Get all recipes with pagination
   * GET /recipes?limit=&skip=
   */
  async getRecipes(params: RecipeSearchParams = {}): Promise<RecipesResponse> {
    const response = await this.client.get<RecipesResponse>('', { params });
    return response.data;
  }

  /**
   * Get single recipe by ID (cached)
   * GET /recipes/{id}
   */
  async getRecipeById(id: number): Promise<Recipe> {
    const cached = this.byIdCache.get(id);
    if (cached) return cached;
    const response = await this.client.get<Recipe>(`/${id}`);
    this.byIdCache.set(id, response.data);
    return response.data;
  }

  /**
   * Search recipes by query
   * GET /recipes/search?q=
   */
  async searchRecipes(query: string, params: RecipeSearchParams = {}): Promise<RecipesResponse> {
    const response = await this.client.get<RecipesResponse>('/search', {
      params: { q: query, ...params },
    });
    return response.data;
  }

  /**
   * Get recipes by tag/meal type
   * GET /recipes/tag/{tag}
   */
  async getRecipesByTag(tag: string, params: RecipeSearchParams = {}): Promise<RecipesResponse> {
    const response = await this.client.get<RecipesResponse>(`/tag/${encodeURIComponent(tag)}`, { params });
    return response.data;
  }

  /** GET /recipes/meal-type/{mealType} */
  async getRecipesByMealType(mealType: string, params: RecipeSearchParams = {}): Promise<RecipesResponse> {
    const response = await this.client.get<RecipesResponse>(
      `/meal-type/${encodeURIComponent(mealType)}`,
      { params }
    );
    return response.data;
  }

  /** Fetch every recipe once (limit=0 means "all" in DummyJSON). */
  async getAllRecipes(force = false): Promise<Recipe[]> {
    if (this.allCache && !force) return this.allCache;
    const data = await this.getRecipes({ limit: 0 });
    this.allCache = data.recipes;
    data.recipes.forEach((r) => this.byIdCache.set(r.id, r));
    return data.recipes;
  }

  /** Search + filter + sort + paginate. */
  async queryRecipes(query: RecipeQuery = {}, page: PageOptions = {}): Promise<PagedRecipes> {
    const { skip = 0, limit = 10 } = page;
    const q = query.q?.trim();
    const base = q ? (await this.searchRecipes(q, { limit: 0 })).recipes : await this.getAllRecipes();
    const filtered = filterRecipes(base, query);
    const sorted = sortRecipes(filtered, query.sort);
    return paginate(sorted, skip, limit);
  }

  /**
   * Get all categories
   * DummyJSON doesn't have a categories endpoint for recipes, so the categories
   * are the meal types present in the data, with counts.
   */
  async getCategories(): Promise<Category[]> {
    return getCategories(await this.getAllRecipes());
  }

  /** Cuisines with recipe counts (built from the same recipe data). */
  async getCuisineCounts(): Promise<Category[]> {
    return getCuisineCounts(await this.getAllRecipes());
  }

  /** Tags with recipe counts (same data as GET /recipes/tags, plus counts). */
  async getTagCounts(): Promise<Category[]> {
    return getTagCounts(await this.getAllRecipes());
  }

  async getCuisines(): Promise<string[]> {
    return getCuisines(await this.getAllRecipes());
  }
}

export const recipeApi = new RecipeApiService();
export { RecipeApiService };