import AsyncStorage from '@react-native-async-storage/async-storage';
import { favoritesStorage, userRecipesStorage } from './storage';
import type { Recipe } from '@/types/recipe';

const recipe: Recipe = {
  id: -101,
  name: 'Roasted squash',
  ingredients: ['Squash'],
  instructions: ['Roast until tender'],
  prepTimeMinutes: 10,
  cookTimeMinutes: 30,
  servings: 2,
  difficulty: 'Easy',
  cuisine: 'American',
  caloriesPerServing: 120,
  tags: ['Dinner'],
  userId: 1,
  image: '',
  rating: 0,
  reviewCount: 0,
  mealType: ['Dinner'],
};

jest.mock('@react-native-async-storage/async-storage', () => (
  require('@react-native-async-storage/async-storage/jest/async-storage-mock')
));
jest.mock('expo-secure-store', () => ({
  getItemAsync: jest.fn(),
  setItemAsync: jest.fn(),
  deleteItemAsync: jest.fn(),
}));

describe('favoritesStorage', () => {
  beforeEach(async () => {
    await AsyncStorage.removeItem('favorite_recipe_ids');
    await AsyncStorage.removeItem('user_recipes');
  });

  it('stores and loads favorites separately for each user', async () => {
    await favoritesStorage.setIds('1', [2, 4]);
    await favoritesStorage.setIds('2', [7]);

    await expect(favoritesStorage.getIds('1')).resolves.toEqual([2, 4]);
    await expect(favoritesStorage.getIds('2')).resolves.toEqual([7]);
  });

  it('does not assign unscoped legacy favorites to any user', async () => {
    await AsyncStorage.setItem('favorite_recipe_ids', JSON.stringify([2, 4]));

    await expect(favoritesStorage.getIds('1')).resolves.toEqual([]);
    await expect(favoritesStorage.getIds('2')).resolves.toEqual([]);
  });

  it('does not expose favorites stored under the shared development ID', async () => {
    await AsyncStorage.setItem('favorite_recipe_ids', JSON.stringify({ 0: [2, 4] }));

    await expect(favoritesStorage.getIds('username:user2')).resolves.toEqual([]);
  });

  it('stores user-created recipes separately by account', async () => {
    const secondUserRecipe = { ...recipe, id: -202, userId: 2 };
    await userRecipesStorage.addRecipe(1, recipe);
    await userRecipesStorage.addRecipe(2, secondUserRecipe);

    await expect(userRecipesStorage.getRecipes(1)).resolves.toEqual([recipe]);
    await expect(userRecipesStorage.getRecipes(2)).resolves.toEqual([secondUserRecipe]);
    await expect(userRecipesStorage.getRecipe(1, -101)).resolves.toEqual(recipe);
  });

  it('removes a recipe only from the requested account', async () => {
    const secondUserRecipe = { ...recipe, id: -202, userId: 2 };
    await userRecipesStorage.addRecipe(1, recipe);
    await userRecipesStorage.addRecipe(2, secondUserRecipe);

    await expect(userRecipesStorage.removeRecipe(1, -101)).resolves.toBe(true);
    await expect(userRecipesStorage.removeRecipe(1, -202)).resolves.toBe(false);
    await expect(userRecipesStorage.getRecipes(1)).resolves.toEqual([]);
    await expect(userRecipesStorage.getRecipes(2)).resolves.toEqual([secondUserRecipe]);
  });
});
