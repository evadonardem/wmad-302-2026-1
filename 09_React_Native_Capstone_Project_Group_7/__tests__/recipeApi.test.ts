import { describe, it, expect } from '@jest/globals';
import { recipeApi } from '@/services/recipeApi';

describe('RecipeApiService', () => {
  it('returns predefined categories list', async () => {
    const categories = await recipeApi.getCategories();
    expect(Array.isArray(categories)).toBe(true);
    expect(categories).toContain('Chicken');
    expect(categories).toContain('Dessert');
  });

  it('returns meal types list', async () => {
    const mealTypes = await recipeApi.getMealTypes();
    expect(mealTypes).toEqual(
      expect.arrayContaining(['Breakfast', 'Lunch', 'Dinner', 'Dessert'])
    );
  });
});
