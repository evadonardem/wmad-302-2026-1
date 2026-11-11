import { getRecipeCategoryCounts, matchesRecipeCategory } from './recipeCategories';
import type { Recipe } from '@/types/recipe';

function createRecipe(overrides: Partial<Recipe> = {}): Recipe {
  return {
    id: 1,
    name: 'Roasted Chicken Pasta',
    ingredients: ['Chicken breast', 'Pasta'],
    instructions: ['Cook until done'],
    prepTimeMinutes: 10,
    cookTimeMinutes: 20,
    servings: 2,
    difficulty: 'Easy',
    cuisine: 'Italian',
    caloriesPerServing: 400,
    tags: ['Dinner'],
    userId: 1,
    image: 'https://example.com/recipe.png',
    rating: 4.5,
    reviewCount: 10,
    mealType: ['Dinner'],
    ...overrides,
  };
}

describe('recipe categories', () => {
  it('matches named ingredient and dish categories case-insensitively', () => {
    const recipe = createRecipe();
    expect(matchesRecipeCategory(recipe, 'chicken')).toBe(true);
    expect(matchesRecipeCategory(recipe, 'PASTA')).toBe(true);
    expect(matchesRecipeCategory(recipe, 'dinner')).toBe(true);
  });

  it('matches seafood and dessert from recipe content', () => {
    expect(matchesRecipeCategory(createRecipe({ name: 'Salmon Cakes' }), 'Seafood')).toBe(true);
    expect(matchesRecipeCategory(createRecipe({ name: 'Chocolate Cake' }), 'Dessert')).toBe(true);
  });

  it('classifies recipes without meat as vegetarian', () => {
    expect(matchesRecipeCategory(createRecipe({
      name: 'Vegetable Soup',
      ingredients: ['Carrot', 'Onion', 'Potato'],
      tags: [],
      mealType: ['Lunch'],
    }), 'Vegetarian')).toBe(true);
    expect(matchesRecipeCategory(createRecipe(), 'Vegetarian')).toBe(false);
  });

  it('falls back to cuisine, meal, and tag matching for custom categories', () => {
    const recipe = createRecipe({ cuisine: 'Italian', tags: ['Pesto'] });
    expect(matchesRecipeCategory(recipe, 'Italian')).toBe(true);
    expect(matchesRecipeCategory(recipe, 'Pesto')).toBe(true);
    expect(matchesRecipeCategory(recipe, 'Unknown')).toBe(false);
  });

  it('returns only categories with matching recipes and accurate counts', () => {
    const recipes = [
      createRecipe({ id: 1, ingredients: ['Beef', 'Tomato'], name: 'Beef Stew' }),
      createRecipe({ id: 2, ingredients: ['Beef', 'Potato'], name: 'Beef Pie' }),
    ];
    expect(getRecipeCategoryCounts(recipes)).toEqual([
      { name: 'Beef', count: 2 },
      { name: 'Dinner', count: 2 },
    ]);
  });
});
