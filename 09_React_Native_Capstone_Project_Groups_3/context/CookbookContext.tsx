/**
 * Cookbook Context - the user's personal cookbook data, kept on the device
 *
 * One reducer holds favorites, shopping list, meal plan, collections,
 * notes & ratings, cooking history and recently viewed recipes.
 * Everything is saved to AsyncStorage (key 'cookbook_state') after each change
 * and loaded back on app start.
 */
import React, { createContext, ReactNode, useCallback, useContext, useEffect, useMemo, useReducer } from 'react';
import {
  CookbookAction,
  CookbookData,
  CookbookState,
  DayKey,
  MealPlan,
  NewShoppingLine,
  RecipeNote,
  ShoppingItem,
} from '@/types/cookbook';
import { displayName, ingredientKey } from '@/utils/ingredients';
import { favoritesStorage, getStorageItem, setStorageItem } from '@/utils/storage';

export const DAYS: { key: DayKey; label: string; short: string }[] = [
  { key: 'mon', label: 'Monday', short: 'Mon' },
  { key: 'tue', label: 'Tuesday', short: 'Tue' },
  { key: 'wed', label: 'Wednesday', short: 'Wed' },
  { key: 'thu', label: 'Thursday', short: 'Thu' },
  { key: 'fri', label: 'Friday', short: 'Fri' },
  { key: 'sat', label: 'Saturday', short: 'Sat' },
  { key: 'sun', label: 'Sunday', short: 'Sun' },
];

const MAX_RECENT = 12;

const emptyPlan = (): MealPlan => ({ mon: [], tue: [], wed: [], thu: [], fri: [], sat: [], sun: [] });

export const initialCookbookState: CookbookState = {
  hydrated: false,
  favorites: [],
  shopping: [],
  mealPlan: emptyPlan(),
  collections: [],
  notes: {},
  cooked: [],
  recent: [],
};

function addShoppingLines(items: ShoppingItem[], lines: NewShoppingLine[], ids: string[]): ShoppingItem[] {
  const next = items.map((item) => ({ ...item, details: [...item.details], recipeIds: [...item.recipeIds] }));
  lines.forEach((line, index) => {
    const text = line.text.trim();
    if (!text) return;
    const key = ingredientKey(text) || text.toLowerCase();
    const existing = next.find((item) => item.key === key);
    if (existing) {
      // Same ingredient again: merge it into one row
      if (!existing.details.includes(text)) existing.details.push(text);
      if (line.recipeId !== undefined && !existing.recipeIds.includes(line.recipeId)) {
        existing.recipeIds.push(line.recipeId);
      }
      existing.checked = false;
    } else {
      next.push({
        id: ids[index],
        key,
        name: displayName(key),
        details: [text],
        recipeIds: line.recipeId !== undefined ? [line.recipeId] : [],
        checked: false,
      });
    }
  });
  return next;
}

export function cookbookReducer(state: CookbookState, action: CookbookAction): CookbookState {
  switch (action.type) {
    case 'HYDRATE':
      return {
        ...state,
        ...action.payload,
        mealPlan: { ...emptyPlan(), ...action.payload.mealPlan },
        hydrated: true,
      };

    case 'TOGGLE_FAVORITE':
      return {
        ...state,
        favorites: state.favorites.includes(action.recipeId)
          ? state.favorites.filter((id) => id !== action.recipeId)
          : [action.recipeId, ...state.favorites],
      };

    case 'CLEAR_FAVORITES':
      return { ...state, favorites: [] };

    case 'ADD_TO_SHOPPING':
      return { ...state, shopping: addShoppingLines(state.shopping, action.lines, action.ids) };

    case 'TOGGLE_SHOPPING_ITEM':
      return {
        ...state,
        shopping: state.shopping.map((item) =>
          item.id === action.id ? { ...item, checked: !item.checked } : item
        ),
      };

    case 'REMOVE_SHOPPING_ITEM':
      return { ...state, shopping: state.shopping.filter((item) => item.id !== action.id) };

    case 'CLEAR_CHECKED_SHOPPING':
      return { ...state, shopping: state.shopping.filter((item) => !item.checked) };

    case 'CLEAR_SHOPPING':
      return { ...state, shopping: [] };

    case 'ADD_TO_PLAN': {
      const day = state.mealPlan[action.day];
      if (day.includes(action.recipeId)) return state;
      return { ...state, mealPlan: { ...state.mealPlan, [action.day]: [...day, action.recipeId] } };
    }

    case 'REMOVE_FROM_PLAN':
      return {
        ...state,
        mealPlan: {
          ...state.mealPlan,
          [action.day]: state.mealPlan[action.day].filter((id) => id !== action.recipeId),
        },
      };

    case 'CLEAR_PLAN':
      return { ...state, mealPlan: emptyPlan() };

    case 'CREATE_COLLECTION':
      return {
        ...state,
        collections: [
          ...state.collections,
          {
            id: action.id,
            name: action.name.trim(),
            recipeIds: action.recipeId !== undefined ? [action.recipeId] : [],
            createdAt: action.createdAt,
          },
        ],
      };

    case 'RENAME_COLLECTION':
      return {
        ...state,
        collections: state.collections.map((c) =>
          c.id === action.id ? { ...c, name: action.name.trim() } : c
        ),
      };

    case 'DELETE_COLLECTION':
      return { ...state, collections: state.collections.filter((c) => c.id !== action.id) };

    case 'TOGGLE_IN_COLLECTION':
      return {
        ...state,
        collections: state.collections.map((c) => {
          if (c.id !== action.collectionId) return c;
          const has = c.recipeIds.includes(action.recipeId);
          return {
            ...c,
            recipeIds: has ? c.recipeIds.filter((id) => id !== action.recipeId) : [...c.recipeIds, action.recipeId],
          };
        }),
      };

    case 'SAVE_NOTE':
      return {
        ...state,
        notes: {
          ...state.notes,
          [String(action.recipeId)]: { rating: action.rating, text: action.text, updatedAt: action.updatedAt },
        },
      };

    case 'MARK_COOKED':
      return { ...state, cooked: [...state.cooked, { recipeId: action.recipeId, cookedAt: action.cookedAt }] };

    case 'ADD_RECENT':
      return {
        ...state,
        recent: [action.recipeId, ...state.recent.filter((id) => id !== action.recipeId)].slice(0, MAX_RECENT),
      };

    case 'CLEAR_HISTORY':
      return { ...state, cooked: [], recent: [] };

    default:
      return state;
  }
}

const newId = () => `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;

interface CookbookContextType extends CookbookState {
  isFavorite: (recipeId: number) => boolean;
  toggleFavorite: (recipeId: number) => void;
  clearFavorites: () => void;
  addToShoppingList: (lines: string[], recipeId?: number) => void;
  toggleShoppingItem: (id: string) => void;
  removeShoppingItem: (id: string) => void;
  clearCheckedShopping: () => void;
  clearShopping: () => void;
  addToPlan: (day: DayKey, recipeId: number) => void;
  removeFromPlan: (day: DayKey, recipeId: number) => void;
  clearPlan: () => void;
  createCollection: (name: string, recipeId?: number) => string;
  renameCollection: (id: string, name: string) => void;
  deleteCollection: (id: string) => void;
  toggleInCollection: (collectionId: string, recipeId: number) => void;
  getNote: (recipeId: number) => RecipeNote | undefined;
  saveNote: (recipeId: number, rating: number, text: string) => void;
  markCooked: (recipeId: number) => void;
  addRecent: (recipeId: number) => void;
  clearHistory: () => void;
}

const CookbookContext = createContext<CookbookContextType | undefined>(undefined);

export function CookbookProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(cookbookReducer, initialCookbookState);

  // Load saved data once. Older versions kept only favorite ids, so bring those over.
  useEffect(() => {
    const load = async () => {
      const saved = await getStorageItem<Partial<CookbookData>>('cookbook_state');
      if (saved) {
        dispatch({ type: 'HYDRATE', payload: saved });
      } else {
        const oldFavorites = await favoritesStorage.getIds();
        dispatch({ type: 'HYDRATE', payload: { favorites: oldFavorites } });
      }
    };
    load().catch(() => dispatch({ type: 'HYDRATE', payload: {} }));
  }, []);

  // Save after every change (only once loading has finished, so we never overwrite with empty data)
  useEffect(() => {
    if (!state.hydrated) return;
    const { hydrated: _hydrated, ...data } = state;
    setStorageItem('cookbook_state', data).catch((err) =>
      console.error('Failed to save cookbook data:', err)
    );
  }, [state]);

  const isFavorite = useCallback((recipeId: number) => state.favorites.includes(recipeId), [state.favorites]);
  const toggleFavorite = useCallback((recipeId: number) => dispatch({ type: 'TOGGLE_FAVORITE', recipeId }), []);
  const clearFavorites = useCallback(() => dispatch({ type: 'CLEAR_FAVORITES' }), []);

  const addToShoppingList = useCallback((lines: string[], recipeId?: number) => {
    dispatch({
      type: 'ADD_TO_SHOPPING',
      lines: lines.map((text) => ({ text, recipeId })),
      ids: lines.map(() => newId()),
    });
  }, []);
  const toggleShoppingItem = useCallback((id: string) => dispatch({ type: 'TOGGLE_SHOPPING_ITEM', id }), []);
  const removeShoppingItem = useCallback((id: string) => dispatch({ type: 'REMOVE_SHOPPING_ITEM', id }), []);
  const clearCheckedShopping = useCallback(() => dispatch({ type: 'CLEAR_CHECKED_SHOPPING' }), []);
  const clearShopping = useCallback(() => dispatch({ type: 'CLEAR_SHOPPING' }), []);

  const addToPlan = useCallback((day: DayKey, recipeId: number) => dispatch({ type: 'ADD_TO_PLAN', day, recipeId }), []);
  const removeFromPlan = useCallback(
    (day: DayKey, recipeId: number) => dispatch({ type: 'REMOVE_FROM_PLAN', day, recipeId }),
    []
  );
  const clearPlan = useCallback(() => dispatch({ type: 'CLEAR_PLAN' }), []);

  const createCollection = useCallback((name: string, recipeId?: number) => {
    const id = newId();
    dispatch({ type: 'CREATE_COLLECTION', id, name, recipeId, createdAt: Date.now() });
    return id;
  }, []);
  const renameCollection = useCallback((id: string, name: string) => dispatch({ type: 'RENAME_COLLECTION', id, name }), []);
  const deleteCollection = useCallback((id: string) => dispatch({ type: 'DELETE_COLLECTION', id }), []);
  const toggleInCollection = useCallback(
    (collectionId: string, recipeId: number) => dispatch({ type: 'TOGGLE_IN_COLLECTION', collectionId, recipeId }),
    []
  );

  const getNote = useCallback((recipeId: number) => state.notes[String(recipeId)], [state.notes]);
  const saveNote = useCallback(
    (recipeId: number, rating: number, text: string) =>
      dispatch({ type: 'SAVE_NOTE', recipeId, rating, text, updatedAt: Date.now() }),
    []
  );
  const markCooked = useCallback((recipeId: number) => dispatch({ type: 'MARK_COOKED', recipeId, cookedAt: Date.now() }), []);
  const addRecent = useCallback((recipeId: number) => dispatch({ type: 'ADD_RECENT', recipeId }), []);
  const clearHistory = useCallback(() => dispatch({ type: 'CLEAR_HISTORY' }), []);

  const value = useMemo(
    () => ({
      ...state,
      isFavorite,
      toggleFavorite,
      clearFavorites,
      addToShoppingList,
      toggleShoppingItem,
      removeShoppingItem,
      clearCheckedShopping,
      clearShopping,
      addToPlan,
      removeFromPlan,
      clearPlan,
      createCollection,
      renameCollection,
      deleteCollection,
      toggleInCollection,
      getNote,
      saveNote,
      markCooked,
      addRecent,
      clearHistory,
    }),
    [
      state, isFavorite, toggleFavorite, clearFavorites, addToShoppingList, toggleShoppingItem,
      removeShoppingItem, clearCheckedShopping, clearShopping, addToPlan, removeFromPlan, clearPlan,
      createCollection, renameCollection, deleteCollection, toggleInCollection, getNote, saveNote,
      markCooked, addRecent, clearHistory,
    ]
  );

  return <CookbookContext.Provider value={value}>{children}</CookbookContext.Provider>;
}

export function useCookbook(): CookbookContextType {
  const context = useContext(CookbookContext);
  if (context === undefined) {
    throw new Error('useCookbook must be used within a CookbookProvider');
  }
  return context;
}
