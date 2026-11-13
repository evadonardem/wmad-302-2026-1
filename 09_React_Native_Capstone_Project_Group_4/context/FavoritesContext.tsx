/**
 * Favorites Context with useReducer & favoritesStorage persistence
 */
import React, {
  createContext,
  useContext,
  useReducer,
  useEffect,
  useCallback,
  ReactNode,
} from 'react';
import { Recipe } from '@/types/recipe';
import { recipeApi } from '@/services/recipeApi';
import { favoritesStorage } from '@/utils/storage';

interface FavoritesState {
  favoriteIds: number[];
  favorites: Recipe[];
  isLoading: boolean;
  error: string | null;
}

type FavoritesAction =
  | { type: 'LOAD_START' }
  | { type: 'LOAD_SUCCESS'; payload: { ids: number[]; recipes: Recipe[] } }
  | { type: 'LOAD_FAILURE'; payload: string }
  | { type: 'ADD_FAVORITE'; payload: Recipe }
  | { type: 'REMOVE_FAVORITE'; payload: number };

const initialState: FavoritesState = {
  favoriteIds: [],
  favorites: [],
  isLoading: true,
  error: null,
};

function favoritesReducer(state: FavoritesState, action: FavoritesAction): FavoritesState {
  switch (action.type) {
    case 'LOAD_START':
      return { ...state, isLoading: true, error: null };

    case 'LOAD_SUCCESS':
      return {
        ...state,
        favoriteIds: action.payload.ids,
        favorites: action.payload.recipes,
        isLoading: false,
        error: null,
      };

    case 'LOAD_FAILURE':
      return {
        ...state,
        isLoading: false,
        error: action.payload,
      };

    case 'ADD_FAVORITE': {
      if (state.favoriteIds.includes(action.payload.id)) return state;
      return {
        ...state,
        favoriteIds: [action.payload.id, ...state.favoriteIds],
        favorites: [action.payload, ...state.favorites],
      };
    }

    case 'REMOVE_FAVORITE':
      return {
        ...state,
        favoriteIds: state.favoriteIds.filter((id) => id !== action.payload),
        favorites: state.favorites.filter((recipe) => recipe.id !== action.payload),
      };

    default:
      return state;
  }
}

interface FavoritesContextType extends FavoritesState {
  isFavorite: (recipeId: number) => boolean;
  addFavorite: (recipe: Recipe) => Promise<void>;
  removeFavorite: (recipeId: number) => Promise<void>;
  toggleFavorite: (recipe: Recipe) => Promise<void>;
  refreshFavorites: () => Promise<void>;
}

const FavoritesContext = createContext<FavoritesContextType | undefined>(undefined);

export function FavoritesProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(favoritesReducer, initialState);

  const loadFavorites = useCallback(async () => {
    dispatch({ type: 'LOAD_START' });
    try {
      const ids = await favoritesStorage.getIds();

      if (ids.length === 0) {
        dispatch({ type: 'LOAD_SUCCESS', payload: { ids: [], recipes: [] } });
        return;
      }

      const settled = await Promise.allSettled(
        ids.map((id) => recipeApi.getRecipeById(id))
      );

      const recipes: Recipe[] = [];
      settled.forEach((result) => {
        if (result.status === 'fulfilled') {
          recipes.push(result.value);
        }
      });

      dispatch({ type: 'LOAD_SUCCESS', payload: { ids, recipes } });
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to load favorites';
      dispatch({ type: 'LOAD_FAILURE', payload: message });
    }
  }, []);

  useEffect(() => {
    loadFavorites();
  }, [loadFavorites]);

  const isFavorite = useCallback(
    (recipeId: number) => state.favoriteIds.includes(recipeId),
    [state.favoriteIds]
  );

  const addFavorite = useCallback(
    async (recipe: Recipe) => {
      if (state.favoriteIds.includes(recipe.id)) return;
      dispatch({ type: 'ADD_FAVORITE', payload: recipe });
      await favoritesStorage.addId(recipe.id);
    },
    [state.favoriteIds]
  );

  const removeFavorite = useCallback(async (recipeId: number) => {
    dispatch({ type: 'REMOVE_FAVORITE', payload: recipeId });
    await favoritesStorage.removeId(recipeId);
  }, []);

  const toggleFavorite = useCallback(
    async (recipe: Recipe) => {
      if (state.favoriteIds.includes(recipe.id)) {
        await removeFavorite(recipe.id);
      } else {
        await addFavorite(recipe);
      }
    },
    [state.favoriteIds, addFavorite, removeFavorite]
  );

  return (
    <FavoritesContext.Provider
      value={{
        ...state,
        isFavorite,
        addFavorite,
        removeFavorite,
        toggleFavorite,
        refreshFavorites: loadFavorites,
      }}
    >
      {children}
    </FavoritesContext.Provider>
  );
}

export function useFavorites(): FavoritesContextType {
  const context = useContext(FavoritesContext);
  if (context === undefined) {
    throw new Error('useFavorites must be used within a FavoritesProvider');
  }
  return context;
}