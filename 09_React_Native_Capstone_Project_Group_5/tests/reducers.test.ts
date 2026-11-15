import { authReducer, initialAuthState } from '@/context/authReducer';
import { favoritesReducer, initialFavoritesState } from '@/context/favoritesReducer';
import { AuthUser } from '@/types/auth';

const user: AuthUser = {
    id: 1,
    username: 'emilys',
    email: 'e@example.com',
    firstName: 'Emily',
    lastName: 'Johnson',
    gender: 'female',
    image: '',
    token: 't',
    refreshToken: 'r',
};

describe('authReducer', () => {
    it('starts loading with no user', () => {
        expect(initialAuthState.isLoading).toBe(true);
        expect(initialAuthState.isAuthenticated).toBe(false);
    });

    it('AUTH_START clears the error and sets loading', () => {
        const next = authReducer({ ...initialAuthState, error: 'x', isLoading: false }, { type: 'AUTH_START' });
        expect(next.isLoading).toBe(true);
        expect(next.error).toBeNull();
    });

    it('AUTH_SUCCESS authenticates the user', () => {
        const next = authReducer(initialAuthState, { type: 'AUTH_SUCCESS', payload: user });
        expect(next.user).toEqual(user);
        expect(next.isAuthenticated).toBe(true);
        expect(next.isLoading).toBe(false);
    });

    it('AUTH_FAILURE stores the message and clears the user', () => {
        const next = authReducer(
            { ...initialAuthState, user, isAuthenticated: true },
            { type: 'AUTH_FAILURE', payload: 'bad' }
        );
        expect(next.user).toBeNull();
        expect(next.error).toBe('bad');
        expect(next.isAuthenticated).toBe(false);
    });

    it('AUTH_LOGOUT clears the session', () => {
        const next = authReducer({ ...initialAuthState, user, isAuthenticated: true }, { type: 'AUTH_LOGOUT' });
        expect(next.user).toBeNull();
        expect(next.isAuthenticated).toBe(false);
    });

    it('AUTH_HYDRATE handles a saved and a missing session', () => {
        expect(authReducer(initialAuthState, { type: 'AUTH_HYDRATE', payload: user }).isAuthenticated).toBe(true);
        const none = authReducer(initialAuthState, { type: 'AUTH_HYDRATE', payload: null });
        expect(none.isAuthenticated).toBe(false);
        expect(none.isLoading).toBe(false);
    });

    it('AUTH_UPDATE_USER merges fields and ignores updates without a user', () => {
        const withUser = authReducer(
            { ...initialAuthState, user, isAuthenticated: true },
            { type: 'AUTH_UPDATE_USER', payload: { firstName: 'Em' } }
        );
        expect(withUser.user?.firstName).toBe('Em');
        expect(withUser.user?.lastName).toBe('Johnson');
        expect(authReducer(initialAuthState, { type: 'AUTH_UPDATE_USER', payload: { firstName: 'Em' } }).user).toBeNull();
    });

    it('AUTH_CLEAR_ERROR clears the error', () => {
        expect(authReducer({ ...initialAuthState, error: 'x' }, { type: 'AUTH_CLEAR_ERROR' }).error).toBeNull();
    });
});

describe('favoritesReducer', () => {
    it('HYDRATE loads ids and marks loaded', () => {
        const next = favoritesReducer(initialFavoritesState, { type: 'HYDRATE', payload: [1, 2] });
        expect(next).toEqual({ ids: [1, 2], isLoaded: true });
    });

    it('ADD does not duplicate', () => {
        const once = favoritesReducer(initialFavoritesState, { type: 'ADD', payload: 3 });
        const twice = favoritesReducer(once, { type: 'ADD', payload: 3 });
        expect(twice.ids).toEqual([3]);
    });

    it('REMOVE drops the id', () => {
        const next = favoritesReducer({ ids: [1, 2], isLoaded: true }, { type: 'REMOVE', payload: 1 });
        expect(next.ids).toEqual([2]);
    });

    it('TOGGLE adds then removes', () => {
        const added = favoritesReducer(initialFavoritesState, { type: 'TOGGLE', payload: 5 });
        expect(added.ids).toEqual([5]);
        expect(favoritesReducer(added, { type: 'TOGGLE', payload: 5 }).ids).toEqual([]);
    });

    it('CLEAR empties the list', () => {
        expect(favoritesReducer({ ids: [1, 2], isLoaded: true }, { type: 'CLEAR' }).ids).toEqual([]);
    });
});