/**
 * Integration tests: Cart, Wishlist and Settings providers with the AsyncStorage mock
 */
import React from 'react';
import { act, renderHook, waitFor } from '@testing-library/react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { CartProvider, useCart } from '@/context/CartContext';
import { WishlistProvider, useWishlist } from '@/context/WishlistContext';
import { SettingsProvider, useAppTheme, useSettings, useT } from '@/context/SettingsContext';
import { christmasDarkPalette, getPalette, lightPalette } from '@/constants/palettes';
import { STORAGE_KEYS } from '@/utils/storage';
import type { ProductSummary } from '@/types/product';

const product = (id: number, overrides: Partial<ProductSummary> = {}): ProductSummary => ({
  id,
  title: `Product ${id}`,
  thumbnail: '',
  category: 'beauty',
  price: 40,
  discountPercentage: 0,
  rating: 4.6,
  stock: 3,
  ...overrides,
});

const stored = async (key: string) => JSON.parse((await AsyncStorage.getItem(key)) ?? 'null');

beforeEach(async () => {
  await AsyncStorage.clear();
});

describe('CartContext', () => {
  const wrapper = ({ children }: { children: React.ReactNode }) => <CartProvider>{children}</CartProvider>;

  it('restores the saved cart and persists changes', async () => {
    await AsyncStorage.setItem(
      STORAGE_KEYS.CART,
      JSON.stringify([{ productId: 9, title: 'Saved', thumbnail: '', price: 10, discountPercentage: 0, quantity: 1, stock: 5 }])
    );
    const { result } = renderHook(() => useCart(), { wrapper });
    await waitFor(() => expect(result.current.hydrated).toBe(true));
    expect(result.current.getQuantity(9)).toBe(1);

    act(() => result.current.addItem(product(1), 2));
    expect(result.current.totals.totalQuantity).toBe(3);
    await waitFor(async () => expect(await stored(STORAGE_KEYS.CART)).toHaveLength(2));

    act(() => result.current.updateQuantity(1, 1));
    act(() => result.current.removeItem(9));
    expect(result.current.items.map((i) => i.productId)).toEqual([1]);
    act(() => result.current.clearCart());
    expect(result.current.items).toHaveLength(0);
  });

  it('validates and applies coupons', async () => {
    const { result } = renderHook(() => useCart(), { wrapper });
    await waitFor(() => expect(result.current.hydrated).toBe(true));
    act(() => result.current.addItem(product(1)));

    let error: string | null = null;
    act(() => {
      error = result.current.applyCoupon('NOPE');
    });
    expect(error).toBe('Invalid coupon code');

    act(() => {
      error = result.current.applyCoupon('save10');
    });
    expect(error).toBeNull();
    expect(result.current.couponCode).toBe('SAVE10');
    expect(result.current.totals.couponDiscount).toBe(4);

    act(() => result.current.removeCoupon());
    expect(result.current.couponCode).toBeNull();
  });
});

describe('WishlistContext', () => {
  const wrapper = ({ children }: { children: React.ReactNode }) => <WishlistProvider>{children}</WishlistProvider>;

  it('toggles, removes and persists products', async () => {
    const { result } = renderHook(() => useWishlist(), { wrapper });
    await act(() => new Promise((resolve) => setTimeout(resolve, 0)));

    let added = false;
    act(() => {
      added = result.current.toggle(product(1));
    });
    expect(added).toBe(true);
    expect(result.current.isInWishlist(1)).toBe(true);
    await waitFor(async () => expect(await stored(STORAGE_KEYS.WISHLIST)).toHaveLength(1));

    act(() => {
      added = result.current.toggle(product(1));
    });
    expect(added).toBe(false);

    act(() => {
      result.current.toggle(product(2));
    });
    act(() => result.current.remove(2));
    expect(result.current.items).toHaveLength(0);
  });
});

describe('SettingsContext', () => {
  const wrapper = ({ children }: { children: React.ReactNode }) => <SettingsProvider>{children}</SettingsProvider>;
  const useAll = () => ({ settings: useSettings(), theme: useAppTheme(), t: useT() });

  it('switches palette, seasonal theme and language, and saves them', async () => {
    const { result } = renderHook(useAll, { wrapper });
    await waitFor(() => expect(result.current.settings.hydrated).toBe(true));

    act(() => result.current.settings.updateSettings({ themeMode: 'light', seasonTheme: 'lively' }));
    expect(result.current.theme.palette).toBe(lightPalette);
    expect(result.current.theme.season).toBe('lively');
    expect(result.current.settings.paperTheme.colors.primary).toBe(lightPalette.primary);

    act(() => result.current.settings.updateSettings({ themeMode: 'dark', seasonTheme: 'christmas' }));
    expect(result.current.theme.isDark).toBe(true);
    expect(result.current.theme.isHoliday).toBe(true);
    expect(result.current.theme.palette).toBe(christmasDarkPalette);
    expect(result.current.settings.navigationTheme.colors.background).toBe(christmasDarkPalette.background);

    act(() => result.current.settings.updateSettings({ seasonTheme: 'halloween' }));
    expect(result.current.theme.season).toBe('halloween');
    expect(result.current.theme.isHoliday).toBe(false);
    expect(result.current.theme.palette).toBe(getPalette(true, 'halloween'));

    act(() => result.current.settings.updateSettings({ language: 'fil' }));
    expect(result.current.t('tab.shop')).toBe('Tindahan');

    await waitFor(async () => expect(await stored(STORAGE_KEYS.SETTINGS)).toMatchObject({ language: 'fil', themeMode: 'dark' }));
  });

  it('merges stored settings with defaults', async () => {
    await AsyncStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify({ language: 'fil' }));
    const { result } = renderHook(useAll, { wrapper });
    await waitFor(() => expect(result.current.settings.hydrated).toBe(true));
    expect(result.current.settings.settings).toMatchObject({
      language: 'fil',
      orderNotifications: true,
      seasonTheme: 'lively',
      livelyBackground: true,
    });
  });
});
