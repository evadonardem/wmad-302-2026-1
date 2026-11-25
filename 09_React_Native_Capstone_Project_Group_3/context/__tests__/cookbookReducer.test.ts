import { cookbookReducer, initialCookbookState } from '../CookbookContext';
import { CookbookState } from '@/types/cookbook';

const ready: CookbookState = cookbookReducer(initialCookbookState, { type: 'HYDRATE', payload: {} });

describe('cookbookReducer', () => {
  describe('HYDRATE', () => {
    it('marks the state as loaded and fills in a full week', () => {
      const state = cookbookReducer(initialCookbookState, {
        type: 'HYDRATE',
        payload: { favorites: [3], mealPlan: { mon: [1] } as CookbookState['mealPlan'] },
      });
      expect(state.hydrated).toBe(true);
      expect(state.favorites).toEqual([3]);
      expect(state.mealPlan.mon).toEqual([1]);
      expect(state.mealPlan.sun).toEqual([]);
    });
  });

  describe('favorites', () => {
    it('toggles a recipe in and out (newest first)', () => {
      let state = cookbookReducer(ready, { type: 'TOGGLE_FAVORITE', recipeId: 1 });
      state = cookbookReducer(state, { type: 'TOGGLE_FAVORITE', recipeId: 2 });
      expect(state.favorites).toEqual([2, 1]);
      state = cookbookReducer(state, { type: 'TOGGLE_FAVORITE', recipeId: 1 });
      expect(state.favorites).toEqual([2]);
    });

    it('clears all favorites', () => {
      const state = cookbookReducer({ ...ready, favorites: [1, 2] }, { type: 'CLEAR_FAVORITES' });
      expect(state.favorites).toEqual([]);
    });
  });

  describe('shopping list', () => {
    const withItems = () => {
      let state = cookbookReducer(ready, {
        type: 'ADD_TO_SHOPPING',
        lines: [
          { text: '2 tablespoons olive oil', recipeId: 1 },
          { text: '1 onion, chopped', recipeId: 1 },
        ],
        ids: ['a', 'b'],
      });
      state = cookbookReducer(state, {
        type: 'ADD_TO_SHOPPING',
        lines: [{ text: '1/4 cup olive oil', recipeId: 2 }],
        ids: ['c'],
      });
      return state;
    };

    it('merges the same ingredient from different recipes into one row', () => {
      const state = withItems();
      expect(state.shopping).toHaveLength(2);
      const oil = state.shopping.find((item) => item.key === 'olive oil');
      expect(oil?.name).toBe('Olive oil');
      expect(oil?.details).toEqual(['2 tablespoons olive oil', '1/4 cup olive oil']);
      expect(oil?.recipeIds).toEqual([1, 2]);
    });

    it('ignores empty lines', () => {
      const state = cookbookReducer(ready, { type: 'ADD_TO_SHOPPING', lines: [{ text: '   ' }], ids: ['x'] });
      expect(state.shopping).toEqual([]);
    });

    it('ticks items off and clears ticked ones', () => {
      let state = withItems();
      state = cookbookReducer(state, { type: 'TOGGLE_SHOPPING_ITEM', id: 'a' });
      expect(state.shopping.find((i) => i.id === 'a')?.checked).toBe(true);
      state = cookbookReducer(state, { type: 'CLEAR_CHECKED_SHOPPING' });
      expect(state.shopping.map((i) => i.id)).toEqual(['b']);
    });

    it('un-ticks an item when the same ingredient is added again', () => {
      let state = withItems();
      state = cookbookReducer(state, { type: 'TOGGLE_SHOPPING_ITEM', id: 'b' });
      state = cookbookReducer(state, { type: 'ADD_TO_SHOPPING', lines: [{ text: '2 onions', recipeId: 3 }], ids: ['d'] });
      expect(state.shopping.find((i) => i.id === 'b')?.checked).toBe(false);
    });

    it('removes one item or the whole list', () => {
      let state = cookbookReducer(withItems(), { type: 'REMOVE_SHOPPING_ITEM', id: 'b' });
      expect(state.shopping).toHaveLength(1);
      state = cookbookReducer(state, { type: 'CLEAR_SHOPPING' });
      expect(state.shopping).toEqual([]);
    });
  });

  describe('meal plan', () => {
    it('adds a recipe to a day only once', () => {
      let state = cookbookReducer(ready, { type: 'ADD_TO_PLAN', day: 'mon', recipeId: 7 });
      state = cookbookReducer(state, { type: 'ADD_TO_PLAN', day: 'mon', recipeId: 7 });
      expect(state.mealPlan.mon).toEqual([7]);
    });

    it('removes a recipe and clears the week', () => {
      let state = cookbookReducer(ready, { type: 'ADD_TO_PLAN', day: 'tue', recipeId: 1 });
      state = cookbookReducer(state, { type: 'ADD_TO_PLAN', day: 'tue', recipeId: 2 });
      state = cookbookReducer(state, { type: 'REMOVE_FROM_PLAN', day: 'tue', recipeId: 1 });
      expect(state.mealPlan.tue).toEqual([2]);
      state = cookbookReducer(state, { type: 'CLEAR_PLAN' });
      expect(state.mealPlan.tue).toEqual([]);
    });
  });

  describe('collections', () => {
    const created = cookbookReducer(ready, {
      type: 'CREATE_COLLECTION',
      id: 'c1',
      name: '  Date night ',
      recipeId: 5,
      createdAt: 100,
    });

    it('creates a collection with a trimmed name and first recipe', () => {
      expect(created.collections).toEqual([{ id: 'c1', name: 'Date night', recipeIds: [5], createdAt: 100 }]);
    });

    it('creates an empty collection when no recipe is given', () => {
      const state = cookbookReducer(ready, { type: 'CREATE_COLLECTION', id: 'c2', name: 'Prep', createdAt: 1 });
      expect(state.collections[0].recipeIds).toEqual([]);
    });

    it('toggles recipes in a collection', () => {
      let state = cookbookReducer(created, { type: 'TOGGLE_IN_COLLECTION', collectionId: 'c1', recipeId: 6 });
      expect(state.collections[0].recipeIds).toEqual([5, 6]);
      state = cookbookReducer(state, { type: 'TOGGLE_IN_COLLECTION', collectionId: 'c1', recipeId: 5 });
      expect(state.collections[0].recipeIds).toEqual([6]);
    });

    it('renames and deletes', () => {
      let state = cookbookReducer(created, { type: 'RENAME_COLLECTION', id: 'c1', name: ' Party ' });
      expect(state.collections[0].name).toBe('Party');
      state = cookbookReducer(state, { type: 'DELETE_COLLECTION', id: 'c1' });
      expect(state.collections).toEqual([]);
    });
  });

  describe('notes, history and recently viewed', () => {
    it('saves a note and rating per recipe', () => {
      const state = cookbookReducer(ready, { type: 'SAVE_NOTE', recipeId: 4, rating: 5, text: 'Less salt', updatedAt: 9 });
      expect(state.notes['4']).toEqual({ rating: 5, text: 'Less salt', updatedAt: 9 });
    });

    it('records cooked meals', () => {
      const state = cookbookReducer(ready, { type: 'MARK_COOKED', recipeId: 4, cookedAt: 123 });
      expect(state.cooked).toEqual([{ recipeId: 4, cookedAt: 123 }]);
    });

    it('keeps the 12 most recently viewed recipes, newest first, without duplicates', () => {
      let state = ready;
      for (let id = 1; id <= 14; id++) state = cookbookReducer(state, { type: 'ADD_RECENT', recipeId: id });
      state = cookbookReducer(state, { type: 'ADD_RECENT', recipeId: 5 });
      expect(state.recent).toHaveLength(12);
      expect(state.recent[0]).toBe(5);
      expect(state.recent.filter((id) => id === 5)).toHaveLength(1);
    });

    it('clears cooking history and recently viewed', () => {
      const state = cookbookReducer(
        { ...ready, cooked: [{ recipeId: 1, cookedAt: 1 }], recent: [1] },
        { type: 'CLEAR_HISTORY' }
      );
      expect(state.cooked).toEqual([]);
      expect(state.recent).toEqual([]);
    });
  });
});
