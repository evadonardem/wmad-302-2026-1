/**
 * Integration-style tests for the service layer and storage.
 * Network calls are stubbed; AsyncStorage uses the official jest mock.
 */
import AsyncStorage from '@react-native-async-storage/async-storage';
import { recipeApi } from '@/services/recipeApi';
import { authApi } from '@/services/authApi';
import { userApi } from '@/services/userApi';
import { authStorage, favoritesStorage, settingsStorage, DEFAULT_SETTINGS } from '@/utils/storage';
import { AuthUser } from '@/types/auth';
import { Recipe } from '@/types/recipe';

// jest hoists these above the imports at run time
jest.mock('@react-native-async-storage/async-storage', () =>
    require('@react-native-async-storage/async-storage/jest/async-storage-mock')
);

jest.mock('expo-secure-store', () => {
    const store: Record<string, string> = {};
    return {
        isAvailableAsync: async () => true,
        setItemAsync: async (k: string, v: string) => { store[k] = v; },
        getItemAsync: async (k: string) => store[k] ?? null,
        deleteItemAsync: async (k: string) => { delete store[k]; },
    };
});

const recipe = (id: number, over: Partial<Recipe> = {}): Recipe => ({
    id,
    name: `Recipe ${id}`,
    ingredients: [],
    instructions: [],
    prepTimeMinutes: 10,
    cookTimeMinutes: 10,
    servings: 2,
    difficulty: 'Easy',
    cuisine: 'Italian',
    caloriesPerServing: 200,
    tags: [],
    userId: 1,
    image: '',
    rating: 4,
    reviewCount: 1,
    mealType: ['Dinner'],
    ...over,
});

beforeEach(async () => {
    await AsyncStorage.clear();
    jest.restoreAllMocks();
});

describe('recipeApi.queryRecipes', () => {
    it('paginates the full list when there is no search text', async () => {
        const all = Array.from({ length: 12 }, (_, i) => recipe(i + 1));
        jest.spyOn(recipeApi, 'getAllRecipes').mockResolvedValue(all);
        const page = await recipeApi.queryRecipes({}, { skip: 10, limit: 10 });
        expect(page.data.map((r) => r.id)).toEqual([11, 12]);
        expect(page.hasMore).toBe(false);
        expect(page.total).toBe(12);
    });

    it('uses the search endpoint for text and then applies filters', async () => {
        const search = jest.spyOn(recipeApi, 'searchRecipes').mockResolvedValue({
            recipes: [recipe(1, { mealType: ['Dessert'] }), recipe(2, { mealType: ['Dinner'] })],
            total: 2,
            skip: 0,
            limit: 0,
        });
        const page = await recipeApi.queryRecipes({ q: ' cake ', category: 'Dessert' });
        expect(search).toHaveBeenCalledWith('cake', { limit: 0 });
        expect(page.data.map((r) => r.id)).toEqual([1]);
    });

    it('sorts results', async () => {
        jest.spyOn(recipeApi, 'getAllRecipes').mockResolvedValue([recipe(1, { rating: 3 }), recipe(2, { rating: 5 })]);
        const page = await recipeApi.queryRecipes({ sort: 'rating' });
        expect(page.data.map((r) => r.id)).toEqual([2, 1]);
    });
});

describe('favoritesStorage', () => {
    it('returns an empty list by default (regression: used to return null)', async () => {
        expect(await favoritesStorage.getIds()).toEqual([]);
    });

    it('adds, toggles and removes ids with persistence', async () => {
        await favoritesStorage.addId(1);
        await favoritesStorage.addId(1);
        expect(await favoritesStorage.getIds()).toEqual([1]);
        expect(await favoritesStorage.toggleId(2)).toBe(true);
        expect(await favoritesStorage.toggleId(1)).toBe(false);
        expect(await favoritesStorage.getIds()).toEqual([2]);
        await favoritesStorage.removeId(2);
        expect(await favoritesStorage.getIds()).toEqual([]);
    });

    it('settings fall back to defaults', async () => {
        expect(await settingsStorage.get()).toEqual(DEFAULT_SETTINGS);
    });
});

describe('authApi auth flow', () => {
    const session: AuthUser = {
        id: 1,
        username: 'emilys',
        email: 'e@x.com',
        firstName: 'Emily',
        lastName: 'J',
        gender: 'female',
        image: 'img',
        token: 'tok',
        refreshToken: 'ref',
    };

    afterEach(() => authApi.logout());

    it('registers, then falls back to a demo session carrying the new profile', async () => {
        jest.spyOn(userApi, 'addUser').mockResolvedValue({ id: 209 });
        jest
            .spyOn(authApi, 'login')
            .mockRejectedValueOnce(new Error('Invalid credentials')) // new account cannot log in on DummyJSON
            .mockResolvedValueOnce(session); // demo session

        const user = await authApi.register({
            firstName: 'Ana',
            lastName: 'Cruz',
            username: 'ana',
            password: 'secret1',
            email: 'ana@x.com',
            gender: 'female',
        });

        expect(user.id).toBe(209);
        expect(user.firstName).toBe('Ana');
        expect(user.username).toBe('ana');
        expect(user.token).toBe('tok');
        expect(authApi.getStoredUser()?.email).toBe('ana@x.com');
        expect(authApi.hasValidTokens()).toBe(true);
    });

    it('persists tokens and restores them on hydrate', async () => {
        authApi.setTokens(session);
        await new Promise<void>((resolve) => setImmediate(() => resolve()));
        authApi.logout();
        expect(authApi.getStoredUser()).toBeNull();
        authApi.setTokens(session);
        await new Promise<void>((resolve) => setImmediate(() => resolve()));
        const restored = await authApi.hydrate();
        expect(restored?.token).toBe('tok');
    });

    it('logout clears the tokens', () => {
        authApi.setTokens(session);
        authApi.logout();
        expect(authApi.hasValidTokens()).toBe(false);
    });
});

describe('authStorage (secure token storage)', () => {
    const user = {
        id: 1, username: 'emilys', email: 'e@x.com', firstName: 'Emily', lastName: 'J',
        gender: 'female' as const, image: '', token: 'access-123', refreshToken: 'refresh-456',
    };

    it('keeps tokens out of AsyncStorage and restores the full user', async () => {
        await authStorage.setUser(user);
        const plain = await AsyncStorage.getItem('auth_user');
        expect(plain).not.toContain('access-123');
        expect(plain).not.toContain('refresh-456');
        expect(await authStorage.getUser()).toEqual(user);
    });

    it('clears both the profile and the tokens', async () => {
        await authStorage.setUser(user);
        await authStorage.clearUser();
        expect(await authStorage.getUser()).toBeNull();
    });
});