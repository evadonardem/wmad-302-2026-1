/**
 * Integration tests for CookbookProvider: loading saved data, saving changes
 * to AsyncStorage, and every action exposed to the screens.
 */
import AsyncStorage from '@react-native-async-storage/async-storage';
import { act, renderHook, waitFor } from '@testing-library/react-native';
import { CookbookProvider, useCookbook } from '../CookbookContext';

const renderCookbook = async () => {
  const hook = renderHook(() => useCookbook(), { wrapper: CookbookProvider });
  await waitFor(() => expect(hook.result.current.hydrated).toBe(true));
  return hook;
};

const savedState = async () => JSON.parse((await AsyncStorage.getItem('cookbook_state')) ?? 'null');

beforeEach(async () => {
  await AsyncStorage.clear();
});

describe('CookbookProvider - loading', () => {
  it('starts empty on a fresh install', async () => {
    const { result } = await renderCookbook();
    expect(result.current.favorites).toEqual([]);
    expect(result.current.shopping).toEqual([]);
  });

  it('brings over favorites saved by the older version of the app', async () => {
    await AsyncStorage.setItem('favorite_recipe_ids', JSON.stringify([4, 5]));
    const { result } = await renderCookbook();
    expect(result.current.favorites).toEqual([4, 5]);
  });

  it('restores everything saved last time', async () => {
    await AsyncStorage.setItem(
      'cookbook_state',
      JSON.stringify({ favorites: [9], recent: [3], cooked: [{ recipeId: 3, cookedAt: 1 }] })
    );
    const { result } = await renderCookbook();
    expect(result.current.favorites).toEqual([9]);
    expect(result.current.recent).toEqual([3]);
    expect(result.current.cooked).toHaveLength(1);
    expect(result.current.mealPlan.mon).toEqual([]);
  });
});

describe('CookbookProvider - actions are saved to the device', () => {
  it('favorites', async () => {
    const { result } = await renderCookbook();
    act(() => result.current.toggleFavorite(12));
    expect(result.current.isFavorite(12)).toBe(true);
    await waitFor(async () => expect((await savedState()).favorites).toEqual([12]));

    act(() => result.current.clearFavorites());
    expect(result.current.favorites).toEqual([]);
  });

  it('shopping list', async () => {
    const { result } = await renderCookbook();
    act(() => result.current.addToShoppingList(['2 cups rice', '1 onion'], 5));
    expect(result.current.shopping).toHaveLength(2);

    const [rice, onion] = result.current.shopping;
    act(() => result.current.toggleShoppingItem(rice.id));
    expect(result.current.shopping[0].checked).toBe(true);

    act(() => result.current.clearCheckedShopping());
    expect(result.current.shopping.map((item) => item.id)).toEqual([onion.id]);

    act(() => result.current.removeShoppingItem(onion.id));
    expect(result.current.shopping).toEqual([]);

    act(() => result.current.addToShoppingList(['Milk']));
    act(() => result.current.clearShopping());
    expect(result.current.shopping).toEqual([]);
    await waitFor(async () => expect((await savedState()).shopping).toEqual([]));
  });

  it('meal plan', async () => {
    const { result } = await renderCookbook();
    act(() => result.current.addToPlan('fri', 3));
    expect(result.current.mealPlan.fri).toEqual([3]);
    act(() => result.current.removeFromPlan('fri', 3));
    expect(result.current.mealPlan.fri).toEqual([]);
    act(() => result.current.addToPlan('sat', 4));
    act(() => result.current.clearPlan());
    expect(result.current.mealPlan.sat).toEqual([]);
  });

  it('collections', async () => {
    const { result } = await renderCookbook();
    let id = '';
    act(() => {
      id = result.current.createCollection('Date night', 1);
    });
    expect(result.current.collections[0]).toMatchObject({ id, name: 'Date night', recipeIds: [1] });

    act(() => result.current.toggleInCollection(id, 2));
    act(() => result.current.renameCollection(id, 'Party'));
    expect(result.current.collections[0]).toMatchObject({ name: 'Party', recipeIds: [1, 2] });

    act(() => result.current.deleteCollection(id));
    expect(result.current.collections).toEqual([]);
  });

  it('notes, cooking history and recently viewed', async () => {
    const { result } = await renderCookbook();
    act(() => result.current.saveNote(7, 4, 'Great with rice'));
    expect(result.current.getNote(7)).toMatchObject({ rating: 4, text: 'Great with rice' });
    expect(result.current.getNote(8)).toBeUndefined();

    act(() => result.current.markCooked(7));
    act(() => result.current.addRecent(7));
    expect(result.current.cooked).toHaveLength(1);
    expect(result.current.recent).toEqual([7]);

    act(() => result.current.clearHistory());
    expect(result.current.cooked).toEqual([]);
    expect(result.current.recent).toEqual([]);
  });
});

describe('useCookbook', () => {
  it('throws when used outside CookbookProvider', () => {
    const spy = jest.spyOn(console, 'error').mockImplementation(() => {});
    expect(() => renderHook(() => useCookbook())).toThrow('useCookbook must be used within a CookbookProvider');
    spy.mockRestore();
  });
});
