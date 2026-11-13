/**
 * Central place for route strings so screens never hand-build paths.
 * Group folders like (app), (tabs) and (auth) are not part of the URL in Expo Router,
 * so these paths leave them out (this also keeps web URLs clean, e.g. /recipe/1).
 */
export const routes = {
    home: '/home',
    /** search('Dinner') filters by meal type; search({ cuisine: 'Italian' }) / search({ tag: 'Pizza' }) also work */
    search: (filter?: string | { category?: string; cuisine?: string; tag?: string }) => {
        const f = typeof filter === 'string' ? { category: filter } : (filter ?? {});
        const qs = Object.entries(f)
            .filter(([, v]) => !!v)
            .map(([k, v]) => `${k}=${encodeURIComponent(v as string)}`)
            .join('&');
        return qs ? `/search?${qs}` : '/search';
    },
    planner: '/planner',
    favorites: '/favorites',
    categories: '/categories',
    profile: '/profile',
    recipe: (id: number) => `/recipe/${id}`,
    cooking: (id: number) => `/cooking/${id}`,
    editProfile: '/edit-profile',
    settings: '/settings',
    myRecipes: '/my-recipes',
    login: '/login',
    register: '/register',
} as const;