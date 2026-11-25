import { describe, expect, it } from '@jest/globals';
import { getRecipeCategoryImage, matchesRecipeCategory } from './recipeCategories';
import { Recipe } from '@/types/recipe';

function makeRecipe(overrides: Partial<Recipe>): Recipe {
  return {
    id: 1,
    name: 'Sample recipe',
    ingredients: [],
    instructions: [],
    prepTimeMinutes: 10,
    cookTimeMinutes: 10,
    servings: 2,
    difficulty: 'Easy',
    cuisine: 'Italian',
    caloriesPerServing: 300,
    tags: [],
    userId: 1,
    image: 'sample.jpg',
    rating: 4,
    reviewCount: 1,
    mealType: ['Dinner'],
    ...overrides,
  };
}

describe('recipe category image matching', () => {
  it('prefers a recipe named for the ingredient over one that merely contains it', () => {
    const recipes = [
      makeRecipe({ id: 1, name: 'Corn salad', ingredients: ['Tomato'], image: 'corn-salad.jpg' }),
      makeRecipe({ id: 2, name: 'Tomato bruschetta', ingredients: ['Tomato', 'Bread'], image: 'tomato.jpg' }),
    ];

    expect(getRecipeCategoryImage(recipes, 'Tomato')).toBe('tomato.jpg');
  });

  it('does not use an unrelated image when no recipe matches', () => {
    const recipes = [makeRecipe({ name: 'Corn salad', image: 'corn-salad.jpg' })];

    expect(getRecipeCategoryImage(recipes, 'Tomato')).toBeUndefined();
  });

  it('does not classify missing timing or calorie data as Quick or Healthy', () => {
    const recipe = makeRecipe({ prepTimeMinutes: 0, cookTimeMinutes: 0, caloriesPerServing: 0 });

    expect(matchesRecipeCategory(recipe, 'Quick')).toBe(false);
    expect(matchesRecipeCategory(recipe, 'Healthy')).toBe(false);
  });
});

