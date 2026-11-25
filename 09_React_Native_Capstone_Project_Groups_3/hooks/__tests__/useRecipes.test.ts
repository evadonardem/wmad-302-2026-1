import { renderHook, waitFor } from '@testing-library/react-native';
import { Recipe } from '@/types/recipe';
import { recipeApi } from '@/services/recipeApi';
import { totalMinutes, useAllRecipes } from '../useRecipes';

jest.mock('@/services/recipeApi', () => ({
  recipeApi: { getRecipes: jest.fn() },
}));

const recipe = (id: number, overrides: Partial<Recipe> = {}): Recipe => ({
  id,
  name: `Recipe ${id}`,
  ingredients: [],
  instructions: [],
  prepTimeMinutes: 10,
  cookTimeMinutes: 20,
  servings: 4,
  difficulty: 'Easy',
  cuisine: 'Italian',
  caloriesPerServing: 300,
  tags: [],
  userId: 1,
  image: '',
  rating: 4.5,
  reviewCount: 10,
  mealType: ['Dinner'],
  ...overrides,
});

describe('useAllRecipes', () => {
  it('loads every recipe once and lets screens look recipes up by id', async () => {
    (recipeApi.getRecipes as jest.Mock).mockResolvedValue({
      recipes: [recipe(1), recipe(2), recipe(3)],
      total: 3,
      skip: 0,
      limit: 0,
    });

    const { result } = renderHook(() => useAllRecipes());
    expect(result.current.loading).toBe(true);
    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(recipeApi.getRecipes).toHaveBeenCalledWith({ limit: 0 });
    expect(result.current.recipes).toHaveLength(3);
    expect(result.current.byId.get(2)?.name).toBe('Recipe 2');
    // pick keeps the order given and skips unknown ids
    expect(result.current.pick([3, 99, 1]).map((r) => r.id)).toEqual([3, 1]);

    // A second screen gets the cached copy without another request
    const second = renderHook(() => useAllRecipes());
    expect(second.result.current.loading).toBe(false);
    expect(recipeApi.getRecipes).toHaveBeenCalledTimes(1);
  });
});

describe('totalMinutes', () => {
  it('adds prep and cook time', () => {
    expect(totalMinutes(recipe(1, { prepTimeMinutes: 15, cookTimeMinutes: 25 }))).toBe(40);
  });
});
