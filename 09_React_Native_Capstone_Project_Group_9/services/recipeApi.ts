/**
 * Recipe API Service - DummyJSON Recipes
 * Docs: https://dummyjson.com/docs/recipes
 */

import axios, { AxiosInstance } from 'axios';
import { Recipe, RecipesResponse, RecipeSearchParams } from '@/types/recipe';

const API_BASE_URL = 'https://dummyjson.com/recipes';
const MEAL_DB_BASE_URL = 'https://www.themealdb.com/api/json/v1/1';

interface MealDbRecipe {
  idMeal: string;
  strMeal: string;
  strMealThumb: string;
  strArea?: string | null;
  strCountry?: string | null;
  strInstructions?: string | null;
  strTags?: string | null;
  [key: `strIngredient${number}`]: string | null | undefined;
  [key: `strMeasure${number}`]: string | null | undefined;
}

interface MealDbCountry {
  strArea: string;
  strCountry: string;
}

interface MealDbCountriesResponse {
  meals: MealDbCountry[] | null;
}

interface MealDbRecipesResponse {
  meals: MealDbRecipe[] | null;
}

export interface RecipeCountry {
  country: string;
  area: string;
}

const mealDb = axios.create({
  baseURL: MEAL_DB_BASE_URL,
  timeout: 10000,
});

const featuredAreas = ['Italian', 'Chinese', 'Thai', 'British', 'Spanish'];

function mapMealDbRecipe(meal: MealDbRecipe): Recipe {
  const ingredients = Array.from({ length: 20 }, (_, index) => {
    const number = index + 1;
    const ingredient = meal[`strIngredient${number}`]?.trim();
    const measure = meal[`strMeasure${number}`]?.trim();
    return ingredient ? [measure, ingredient].filter(Boolean).join(' ') : null;
  }).filter((ingredient): ingredient is string => ingredient !== null);

  return {
    id: -Number(meal.idMeal),
    name: meal.strMeal.trim(),
    ingredients,
    instructions: meal.strInstructions
      ? meal.strInstructions.split(/\r?\n/).map((step) => step.trim()).filter(Boolean)
      : [],
    prepTimeMinutes: 0,
    cookTimeMinutes: 0,
    servings: 0,
    difficulty: 'Easy',
    cuisine: meal.strArea ?? 'International',
    caloriesPerServing: 0,
    tags: [
      ...(meal.strCountry ? [meal.strCountry] : []),
      ...(meal.strTags ? meal.strTags.split(',').map((tag) => tag.trim()).filter(Boolean) : []),
    ],
    userId: 0,
    image: meal.strMealThumb,
    rating: 0,
    reviewCount: 0,
    mealType: [],
  };
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
   * Combine the DummyJSON catalog with ten dishes from five international cuisines.
   */
  async getWorldRecipes(params: RecipeSearchParams = {}): Promise<RecipesResponse> {
    const requestedLimit = params.limit ?? 100;
    const [dummyJson, mealsByArea] = await Promise.all([
      this.getRecipes({ limit: 50 }),
      Promise.all(
        featuredAreas.map((area) => this.getRecipesByCountry(area, { limit: 10 }))
      ),
    ]);
    const recipes = [
      ...dummyJson.recipes,
      ...mealsByArea.flatMap(({ recipes: areaRecipes }) => areaRecipes),
    ].slice(0, requestedLimit);

    return {
      recipes,
      total: recipes.length,
      skip: 0,
      limit: requestedLimit,
    };
  }

  async getRecipeCountries(): Promise<RecipeCountry[]> {
    const response = await mealDb.get<MealDbCountriesResponse>('/list.php', {
      params: { a: 'list' },
    });
    const countries = new Map<string, RecipeCountry>();
    (response.data.meals ?? []).forEach(({ strArea, strCountry }) => {
      if (strArea && strCountry) {
        countries.set(strArea, { area: strArea, country: strCountry });
      }
    });
    return Array.from(countries.values()).sort((first, second) =>
      first.country.localeCompare(second.country)
    );
  }

  async getRecipesByCountry(
    area: string,
    params: RecipeSearchParams = {}
  ): Promise<RecipesResponse> {
    const response = await mealDb.get<MealDbRecipesResponse>('/filter.php', {
      params: { a: area },
    });
    const meals = response.data.meals ?? [];
    const limit = params.limit ?? meals.length;

    return {
      recipes: meals.slice(0, limit).map(mapMealDbRecipe),
      total: meals.length,
      skip: 0,
      limit,
    };
  }

  /**
   * Get single recipe by ID
   */
  async getRecipeById(id: number): Promise<Recipe> {
    if (id < 0) {
      const response = await mealDb.get<MealDbRecipesResponse>('/lookup.php', {
        params: { i: Math.abs(id) },
      });
      const meal = response.data.meals?.[0];
      if (!meal) throw new Error('Recipe not found.');
      return mapMealDbRecipe(meal);
    }

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
   * Get recipes by tag. DummyJSON exposes recipe categories as tags.
   */
  async getRecipesByCategory(category: string, params: RecipeSearchParams = {}): Promise<RecipesResponse> {
    const response = await this.client.get<RecipesResponse>(`/tag/${encodeURIComponent(category)}`, {
      params,
    });
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
   * Get random recipe(s)
   */
  async getRandomRecipes(count: number = 1): Promise<Recipe[]> {
    const response = await this.client.get<{ recipes: Recipe[] }>(`/random/${count}`);
    return response.data.recipes;
  }

  /**
   * Get all recipe tags, which are the available categories in DummyJSON.
   */
  async getCategories(): Promise<string[]> {
    const response = await this.client.get<string[]>('/tags');
    return response.data;
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
