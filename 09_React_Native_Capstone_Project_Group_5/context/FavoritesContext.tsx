/**
 * Favorites Context - recipe ids persisted in AsyncStorage
 */
import React, {
    createContext,
    ReactNode,
    useCallback,
    useContext,
    useEffect,
    useMemo,
    useReducer,
} from 'react';
import { favoritesStorage } from '@/utils/storage';
import { favoritesReducer, initialFavoritesState } from '@/context/favoritesReducer';

interface FavoritesContextType {
    ids: number[];
    count: number;
    isLoaded: boolean;
    isFavorite: (id: number) => boolean;
    addFavorite: (id: number) => void;
    removeFavorite: (id: number) => void;
    toggleFavorite: (id: number) => void;
    clearFavorites: () => void;
}

const FavoritesContext = createContext<FavoritesContextType | undefined>(undefined);

export function FavoritesProvider({ children }: { children: ReactNode }) {
    const [state, dispatch] = useReducer(favoritesReducer, initialFavoritesState);

    useEffect(() => {
        let active = true;
        favoritesStorage
            .getIds()
            .then((ids) => active && dispatch({ type: 'HYDRATE', payload: ids }))
            .catch(() => active && dispatch({ type: 'HYDRATE', payload: [] }));
        return () => {
            active = false;
        };
    }, []);

    // Persist after every change (but never before the initial load finished)
    useEffect(() => {
        if (!state.isLoaded) return;
        favoritesStorage.setIds(state.ids).catch(() => undefined);
    }, [state.ids, state.isLoaded]);

    const isFavorite = useCallback((id: number) => state.ids.includes(id), [state.ids]);
    const addFavorite = useCallback((id: number) => dispatch({ type: 'ADD', payload: id }), []);
    const removeFavorite = useCallback((id: number) => dispatch({ type: 'REMOVE', payload: id }), []);
    const toggleFavorite = useCallback((id: number) => dispatch({ type: 'TOGGLE', payload: id }), []);
    const clearFavorites = useCallback(() => dispatch({ type: 'CLEAR' }), []);

    const value = useMemo(
        () => ({
            ids: state.ids,
            count: state.ids.length,
            isLoaded: state.isLoaded,
            isFavorite,
            addFavorite,
            removeFavorite,
            toggleFavorite,
            clearFavorites,
        }),
        [state, isFavorite, addFavorite, removeFavorite, toggleFavorite, clearFavorites]
    );

    return <FavoritesContext.Provider value={value}>{children}</FavoritesContext.Provider>;
}

export function useFavorites(): FavoritesContextType {
    const context = useContext(FavoritesContext);
    if (!context) throw new Error('useFavorites must be used within a FavoritesProvider');
    return context;
}