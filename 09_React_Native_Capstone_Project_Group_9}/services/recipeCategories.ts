import { Recipe } from '@/types/recipe';

const ingredientCategories = [
  'Chicken',
  'Beef',
  'Pork',
  'Shrimp',
  'Salmon',
  'Fish',
  'Egg',
  'Rice',
  'Pasta',
  'Noodles',
  'Potato',
  'Tomato',
  'Cheese',
  'Mushroom',
  'Spinach',
  'Broccoli',
  'Avocado',
  'Beans',
  'Lentils',
  'Garlic',
  'Onion',
  'Lemon',
  'Bread',
  'Chocolate',
  'Apple',
  'Banana',
];

export function matchesRecipeCategory(recipe: Recipe, category: string): boolean {
  const normalizedCategory = category.toLowerCase();
  if (recipe.tags.some((tag) => tag.toLowerCase() === normalizedCategory)) return true;
  if (recipe.cuisine.toLowerCase() === normalizedCategory) return true;
  if (recipe.mealType.some((meal) => meal.toLowerCase() === normalizedCategory)) return true;

  if (normalizedCategory === 'quick') {
    const totalTime = recipe.prepTimeMinutes + recipe.cookTimeMinutes;
    return totalTime > 0 && totalTime <= 30;
  }
  if (normalizedCategory === 'healthy') {
    return recipe.caloriesPerServing > 0 && recipe.caloriesPerServing <= 500;
  }

  return recipe.ingredients.some((ingredient) =>
    ingredient.toLowerCase().includes(normalizedCategory)
  );
}

function getImageRelevance(recipe: Recipe, category: string): number {
  const normalizedCategory = category.toLowerCase();
  let score = 0;
  if (recipe.tags.some((tag) => tag.toLowerCase() === normalizedCategory)) score += 100;
  if (recipe.cuisine.toLowerCase() === normalizedCategory) score += 100;
  if (recipe.mealType.some((meal) => meal.toLowerCase() === normalizedCategory)) score += 100;
  if (recipe.name.toLowerCase().includes(normalizedCategory)) score += 80;

  recipe.ingredients.forEach((ingredient) => {
    const normalizedIngredient = ingredient.toLowerCase();
    if (normalizedIngredient === normalizedCategory) score += 65;
    else if (normalizedIngredient.startsWith(normalizedCategory)) score += 55;
    else if (normalizedIngredient.includes(normalizedCategory)) score += 35;
  });
  return score;
}

export function getRecipeCategoryImage(recipes: Recipe[], category: string): string | undefined {
  const matchingRecipes = recipes.filter(
    (recipe) => recipe.image && matchesRecipeCategory(recipe, category)
  );
  if (matchingRecipes.length === 0) return undefined;

  if (category.toLowerCase() === 'quick') {
    matchingRecipes.sort(
      (first, second) =>
        first.prepTimeMinutes + first.cookTimeMinutes
        - second.prepTimeMinutes - second.cookTimeMinutes
    );
  } else if (category.toLowerCase() === 'healthy') {
    matchingRecipes.sort(
      (first, second) => first.caloriesPerServing - second.caloriesPerServing
    );
  } else {
    matchingRecipes.sort(
      (first, second) =>
        getImageRelevance(second, category) - getImageRelevance(first, category)
    );
  }
  return matchingRecipes[0].image;
}

export function getRecipeCategories(recipes: Recipe[]): { name: string; count: number }[] {
  const names = new Set<string>();

  recipes.forEach((recipe) => {
    recipe.tags.forEach((tag) => names.add(tag));
    if (recipe.cuisine) names.add(recipe.cuisine);
    recipe.mealType.forEach((meal) => names.add(meal));
  });

  ['Quick', 'Healthy', ...ingredientCategories].forEach((name) => {
    if (recipes.some((recipe) => matchesRecipeCategory(recipe, name))) names.add(name);
  });

  return Array.from(names)
    .map((name) => ({
      name,
      count: recipes.filter((recipe) => matchesRecipeCategory(recipe, name)).length,
    }))
    .filter((category) => category.count > 0)
    .sort((a, b) => b.count - a.count || a.name.localeCompare(b.name));
}

