export const routes = {
  home: '/(app)/(tabs)/home',
  categories: '/(app)/(tabs)/categories',
  cart: '/(app)/(tabs)/cart',
  profile: '/(app)/(tabs)/profile',
  login: (redirect?: string) =>
    `/(auth)/login${redirect ? `?redirect=${encodeURIComponent(redirect)}` : ''}`,
  register: '/(auth)/register',
  checkout: '/(app)/checkout',
  orders: '/(app)/orders',
  wishlist: '/(app)/wishlist',
  addresses: '/(app)/addresses',
  editProfile: '/(app)/edit-profile',
  settings: '/(app)/settings',
  product: (id: number) => `/(app)/product/${id}`,
  search: (params?: { category?: string; q?: string }) => {
    const query = new URLSearchParams();
    if (params?.category) query.set('category', params.category);
    if (params?.q) query.set('q', params.q);
    const suffix = query.toString();
    return `/(app)/(tabs)/search${suffix ? `?${suffix}` : ''}`;
  },
};

export function safeRedirect(redirect: string | string[] | undefined): string {
  const value = Array.isArray(redirect) ? redirect[0] : redirect;
  if (!value) return routes.home;
  return value.startsWith('/') ? value : routes.home;
}
