/**
 * Integration tests for the recipe and user API services (HTTP client mocked)
 */
import axios from 'axios';
import { recipeApi } from '../recipeApi';
import { userApi } from '../userApi';

jest.mock('axios', () => {
  const mockClient = { get: jest.fn(), post: jest.fn(), put: jest.fn() };
  return { __esModule: true, default: { create: jest.fn(() => mockClient) } };
});

const client = (axios.create as jest.Mock).mock.results[0].value as {
  get: jest.Mock;
  put: jest.Mock;
};

beforeEach(() => {
  client.get.mockReset();
  client.put.mockReset();
});

describe('recipeApi', () => {
  it('uses the DummyJSON recipes and users base URLs', () => {
    const baseUrls = (axios.create as jest.Mock).mock.calls.map((call) => call[0].baseURL);
    expect(baseUrls).toEqual(expect.arrayContaining(['https://dummyjson.com/recipes', 'https://dummyjson.com/users']));
  });

  it('gets a page of recipes', async () => {
    client.get.mockResolvedValueOnce({ data: { recipes: [], total: 50, skip: 0, limit: 20 } });
    const data = await recipeApi.getRecipes({ limit: 20, skip: 0 });
    expect(client.get).toHaveBeenCalledWith('/', { params: { limit: 20, skip: 0 } });
    expect(data.total).toBe(50);
  });

  it('gets one recipe by id', async () => {
    client.get.mockResolvedValueOnce({ data: { id: 7, name: 'Pasta' } });
    expect((await recipeApi.getRecipeById(7)).name).toBe('Pasta');
    expect(client.get).toHaveBeenCalledWith('/7');
  });

  it('searches with the q parameter', async () => {
    client.get.mockResolvedValueOnce({ data: { recipes: [] } });
    await recipeApi.searchRecipes('chicken', { limit: 0 });
    expect(client.get).toHaveBeenCalledWith('/search', { params: { q: 'chicken', limit: 0 } });
  });

  it('gets recipes by category using the meal-type endpoint', async () => {
    client.get.mockResolvedValueOnce({ data: { recipes: [] } });
    await recipeApi.getRecipesByCategory('Side Dish');
    expect(client.get).toHaveBeenCalledWith('/meal-type/side%20dish', { params: {} });
  });

  it('gets recipes by tag', async () => {
    client.get.mockResolvedValueOnce({ data: { recipes: [] } });
    await recipeApi.getRecipesByTag('Pizza');
    expect(client.get).toHaveBeenCalledWith('/tag/Pizza', { params: {} });
  });

  it('builds categories with counts from the recipes, biggest first', async () => {
    client.get.mockResolvedValue({
      data: {
        recipes: [{ mealType: ['Dinner'] }, { mealType: ['Dinner', 'Lunch'] }, { mealType: ['Snack'] }],
      },
    });

    expect(await recipeApi.getCategories()).toEqual([
      { name: 'Dinner', count: 2 },
      { name: 'Lunch', count: 1 },
      { name: 'Snack', count: 1 },
    ]);
    expect(client.get).toHaveBeenCalledWith('/', { params: { limit: 0, select: 'mealType' } });
    expect(await recipeApi.getMealTypes()).toEqual(['Dinner', 'Lunch', 'Snack']);
  });
});

describe('userApi', () => {
  it('updates a profile with PUT /users/{id}', async () => {
    client.put.mockResolvedValueOnce({ data: { id: 1, firstName: 'Em' } });
    const changes = { firstName: 'Em', lastName: 'Johnson', email: 'em@example.com' };
    expect(await userApi.updateUser(1, changes)).toEqual({ id: 1, firstName: 'Em' });
    expect(client.put).toHaveBeenCalledWith('/1', changes);
  });
});
