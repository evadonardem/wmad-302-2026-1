import { recipeCacheStorage } from '@/utils/storage';
import type { Recipe, RecipesResponse } from '@/types/recipe';
import { RecipeApiService } from './recipeApi';

const mockClient = {
  get: jest.fn(),
  interceptors: {
    request: { use: jest.fn() },
    response: { use: jest.fn() },
  },
};

jest.mock('axios', () => ({
  __esModule: true,
  default: {
    create: jest.fn(() => mockClient),
  },
}));

jest.mock('@/utils/storage', () => ({
  recipeCacheStorage: {
    getResponse: jest.fn(),
    setResponse: jest.fn(),
    getRecipe: jest.fn(),
    setRecipes: jest.fn(),
  },
}));

const recipe: Recipe = {
  id: 8,
  name: 'Bean Bowl',
  ingredients: ['Beans'],
  instructions: ['Serve warm'],
  prepTimeMinutes: 5,
  cookTimeMinutes: 10,
  servings: 2,
  difficulty: 'Easy',
  cuisine: 'Mexican',
  caloriesPerServing: 250,
  tags: ['Dinner'],
  userId: 1,
  image: 'https://example.com/beans.jpg',
  rating: 4.5,
  reviewCount: 6,
  mealType: ['Dinner'],
};

const response: RecipesResponse = {
  recipes: [recipe],
  total: 1,
  skip: 0,
  limit: 20,
};

describe('RecipeApiService', () => {
  let service: RecipeApiService;

  beforeEach(() => {
    jest.clearAllMocks();
    jest.mocked(recipeCacheStorage.getResponse).mockResolvedValue(null);
    jest.mocked(recipeCacheStorage.getRecipe).mockResolvedValue(null);
    jest.mocked(recipeCacheStorage.setResponse).mockResolvedValue();
    jest.mocked(recipeCacheStorage.setRecipes).mockResolvedValue();
    service = new RecipeApiService();
  });

  it('fetches and caches a page of recipes', async () => {
    mockClient.get.mockResolvedValue({ data: response });

    await expect(service.getRecipes({ limit: 20 })).resolves.toEqual(response);
    expect(mockClient.get).toHaveBeenCalledWith('/', { params: { limit: 20 } });
    expect(recipeCacheStorage.setResponse).toHaveBeenCalledWith('recipes:{"limit":20}', response);
    expect(recipeCacheStorage.setRecipes).toHaveBeenCalledWith([recipe]);
  });

  it('returns the cached page when the API is unavailable', async () => {
    mockClient.get.mockRejectedValue(new Error('Network unavailable'));
    jest.mocked(recipeCacheStorage.getResponse).mockResolvedValue(response);

    await expect(service.getRecipes({ limit: 20 })).resolves.toEqual({ ...response, isCached: true });
  });

  it('returns a previously fetched recipe when offline', async () => {
    mockClient.get.mockRejectedValue(new Error('Network unavailable'));
    jest.mocked(recipeCacheStorage.getRecipe).mockResolvedValue(recipe);

    await expect(service.getRecipeById(recipe.id)).resolves.toEqual({ ...recipe, isCached: true });
  });

  it('fetches a recipe online and caches it', async () => {
    mockClient.get.mockResolvedValue({ data: recipe });

    await expect(service.getRecipeById(recipe.id)).resolves.toEqual(recipe);
    expect(recipeCacheStorage.setRecipes).toHaveBeenCalledWith([recipe]);
  });

  it('searches and caches query results', async () => {
    mockClient.get.mockResolvedValue({ data: response });

    await expect(service.searchRecipes('beans', { limit: 5 })).resolves.toEqual(response);
    expect(mockClient.get).toHaveBeenCalledWith('/search', { params: { q: 'beans', limit: 5 } });
  });

  it('filters a paginated recipe response by category', async () => {
    mockClient.get.mockResolvedValue({ data: { ...response, limit: 100 } });

    await expect(service.getRecipesByCategory('Dinner', { skip: 0, limit: 1 })).resolves.toEqual({
      recipes: [recipe],
      total: 1,
      skip: 0,
      limit: 1,
    });
  });

  it('loads by tag and returns random recipes', async () => {
    mockClient.get
      .mockResolvedValueOnce({ data: response })
      .mockResolvedValueOnce({ data: { recipes: [recipe] } });

    await expect(service.getRecipesByTag('Dinner')).resolves.toEqual(response);
    await expect(service.getRandomRecipes(1)).resolves.toEqual([recipe]);
  });

  it('returns distinct sorted cuisines and known meal types', async () => {
    mockClient.get.mockResolvedValue({
      data: { ...response, recipes: [recipe, { ...recipe, id: 9, cuisine: 'Italian' }] },
    });

    await expect(service.getCategories()).resolves.toEqual(['Italian', 'Mexican']);
    await expect(service.getMealTypes()).resolves.toContain('Breakfast');
  });

  it('keeps online results available if writing the offline cache fails', async () => {
    mockClient.get.mockResolvedValue({ data: response });
    jest.mocked(recipeCacheStorage.setResponse).mockRejectedValue(new Error('Storage unavailable'));
    const consoleError = jest.spyOn(console, 'error').mockImplementation(() => undefined);

    await expect(service.getRecipes()).resolves.toEqual(response);
    expect(consoleError).toHaveBeenCalledWith(
      'Recipe data loaded but could not be cached for offline use:',
      expect.any(Error)
    );
    consoleError.mockRestore();
  });

  it('surfaces the API error when no cached response exists', async () => {
    const networkError = new Error('Network unavailable');
    mockClient.get.mockRejectedValue(networkError);

    await expect(service.getRecipes()).rejects.toBe(networkError);
  });
});
