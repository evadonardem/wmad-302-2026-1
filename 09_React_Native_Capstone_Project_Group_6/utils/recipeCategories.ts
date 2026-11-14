import type { Recipe } from '@/types/recipe';

export const recipeCategories = [
  'Beef',
  'Chicken',
  'Seafood',
  'Vegetarian',
  'Dessert',
  'Breakfast',
  'Lunch',
  'Dinner',
  'Pasta',
] as const;

const categoryPatterns: Record<(typeof recipeCategories)[number], RegExp> = {
  Beef: /\b(beef|steak|brisket)\b/i,
  Chicken: /\b(chicken|poultry)\b/i,
  Seafood: /\b(seafood|fish|salmon|tuna|shrimp|prawn|crab|lobster)\b/i,
  Vegetarian: /\b(beef|steak|chicken|pork|bacon|ham|sausage|fish|salmon|tuna|shrimp|prawn|crab|lobster|turkey|lamb)\b/i,
  Dessert: /\b(dessert|cake|cookie|cookies|brownie|pudding|ice cream|cheesecake|cupcake|tart)\b/i,
  Breakfast: /\bbreakfast\b/i,
  Lunch: /\blunch\b/i,
  Dinner: /\bdinner\b/i,
  Pasta: /\b(pasta|noodle|lasagna|spaghetti|ravioli|macaroni)\b/i,
};

function recipeText(recipe: Recipe): string {
  return [
    recipe.name,
    ...recipe.ingredients,
    ...recipe.tags,
    ...recipe.mealType,
  ].join(' ');
}

export function matchesRecipeCategory(recipe: Recipe, category: string): boolean {
  const normalized = category.toLowerCase();
  const knownCategory = recipeCategories.find((item) => item.toLowerCase() === normalized);
  const text = recipeText(recipe);

  if (knownCategory === 'Vegetarian') return !categoryPatterns.Vegetarian.test(text);
  if (knownCategory) return categoryPatterns[knownCategory].test(text);

  return recipe.cuisine.toLowerCase() === normalized
    || recipe.mealType.some((meal) => meal.toLowerCase() === normalized)
    || recipe.tags.some((tag) => tag.toLowerCase() === normalized);
}

export function getRecipeCategoryCounts(recipes: Recipe[]) {
  return recipeCategories
    .map((name) => ({
      name,
      count: recipes.filter((recipe) => matchesRecipeCategory(recipe, name)).length,
    }))
    .filter((category) => category.count > 0);
}
