/**
 * Favorites reducer (pure, unit-tested)
 */
export interface FavoritesState {
    ids: number[];
    isLoaded: boolean;
}

export type FavoritesAction =
    | { type: 'HYDRATE'; payload: number[] }
    | { type: 'ADD'; payload: number }
    | { type: 'REMOVE'; payload: number }
    | { type: 'TOGGLE'; payload: number }
    | { type: 'CLEAR' };

export const initialFavoritesState: FavoritesState = { ids: [], isLoaded: false };

export function favoritesReducer(state: FavoritesState, action: FavoritesAction): FavoritesState {
    switch (action.type) {
        case 'HYDRATE':
            return { ids: action.payload, isLoaded: true };
        case 'ADD':
            return state.ids.includes(action.payload)
                ? state
                : { ...state, ids: [...state.ids, action.payload] };
        case 'REMOVE':
            return { ...state, ids: state.ids.filter((id) => id !== action.payload) };
        case 'TOGGLE':
            return state.ids.includes(action.payload)
                ? { ...state, ids: state.ids.filter((id) => id !== action.payload) }
                : { ...state, ids: [...state.ids, action.payload] };
        case 'CLEAR':
            return { ...state, ids: [] };
        default:
            return state;
    }
}