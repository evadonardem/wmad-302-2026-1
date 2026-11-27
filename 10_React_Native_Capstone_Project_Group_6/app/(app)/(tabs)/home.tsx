/**
 * Home Screen - product discovery.
 * One virtualized grid with infinite scroll (skip/limit), pull-to-refresh, categories and flash deals.
 */
import { useRouter } from 'expo-router';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { FlatList, Pressable, StyleSheet, View } from 'react-native';
import { ActivityIndicator, Avatar, Button, Searchbar, Text } from 'react-native-paper';
import { EmptyState } from '@/components/EmptyState';
import { ErrorState } from '@/components/ErrorState';
import { ProductCard } from '@/components/ProductCard';
import { GRID_GAP, GRID_PADDING, ProductGrid, useGridLayout } from '@/components/ProductGrid';
import { Screen } from '@/components/Screen';
import { ProductCardSkeleton } from '@/components/Skeleton';
import { useSnackbar } from '@/components/SnackbarProvider';
import { spacing, useAppTheme } from '@/constants/theme';
import { useAuth } from '@/context/AuthContext';
import { useCart } from '@/context/CartContext';
import { useWishlist } from '@/context/WishlistContext';
import { useInfiniteList } from '@/hooks/useInfiniteList';
import { productApi } from '@/services/productApi';
import { CategoryInfo, ProductSummary } from '@/types/product';
import { routes } from '@/utils/routes';

const MAX_CATEGORY_CHIPS = 12;

// A null entry means that request failed; the screen keeps whatever it already has for that section.
interface HomeExtras {
  categories: CategoryInfo[] | null;
  deals: ProductSummary[] | null;
}

// Categories and deals are decorative: each one loads (or fails) independently of the other
// and of the product grid.
async function fetchHomeExtras(): Promise<HomeExtras> {
  const [categoryResult, dealResult] = await Promise.allSettled([
    productApi.getCategories(),
    productApi.getFlashDeals(),
  ]);

  if (categoryResult.status === 'rejected') {
    console.warn('Could not load categories:', categoryResult.reason);
  }
  if (dealResult.status === 'rejected') {
    console.warn('Could not load flash deals:', dealResult.reason);
  }

  return {
    categories: categoryResult.status === 'fulfilled' ? categoryResult.value : null,
    deals: dealResult.status === 'fulfilled' ? dealResult.value : null,
  };
}

export default function HomeScreen() {
  const theme = useAppTheme();
  const router = useRouter();
  const { user } = useAuth();
  const { addItem } = useCart();
  const wishlist = useWishlist();
  const { show } = useSnackbar();
  const { columns, cardWidth } = useGridLayout();

  const fetchPage = useCallback(async (skip: number, limit: number) => {
    const response = await productApi.getProducts({ skip, limit });
    return { items: response.products, total: response.total };
  }, []);
  const list = useInfiniteList(fetchPage);

  const [categories, setCategories] = useState<CategoryInfo[]>([]);
  const [deals, setDeals] = useState<ProductSummary[]>([]);

  const applyExtras = useCallback((extras: HomeExtras) => {
    if (extras.categories) setCategories(extras.categories);
    if (extras.deals) setDeals(extras.deals);
  }, []);

  useEffect(() => {
    let cancelled = false;
    fetchHomeExtras().then((extras) => {
      if (!cancelled) applyExtras(extras);
    });
    return () => {
      cancelled = true;
    };
  }, [applyExtras]);

  // Pull-to-refresh reloads the product grid and the header sections together
  const refreshAll = list.refresh;
  const handleRefresh = useCallback(() => {
    fetchHomeExtras().then(applyExtras);
    return refreshAll();
  }, [applyExtras, refreshAll]);

  const header = useMemo(
    () => (
      <View>
        <View style={[styles.welcome, { backgroundColor: theme.colors.primaryContainer }]}>
          <View style={styles.welcomeText}>
            <Text variant="headlineSmall" numberOfLines={1}>
              {user ? `Hi, ${user.firstName}` : 'Welcome to Marketplace'}
            </Text>
            <Text variant="bodyMedium" style={{ color: theme.colors.onSurfaceVariant }}>
              Find something you will love today
            </Text>
          </View>
          <Avatar.Icon size={48} icon="storefront" />
        </View>

        <Pressable
          onPress={() => router.navigate(routes.search())}
          style={styles.searchWrap}
          accessibilityRole="button"
          accessibilityLabel="Search products"
        >
          <View style={styles.noPointerEvents}>
            <Searchbar placeholder="Search products" value="" editable={false} />
          </View>
        </Pressable>

        {categories.length > 0 ? (
          <View style={styles.section}>
            <Text variant="titleMedium" style={styles.sectionTitle}>
              Shop by category
            </Text>
            <FlatList
              horizontal
              data={categories.slice(0, MAX_CATEGORY_CHIPS)}
              keyExtractor={(item) => item.slug}
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.chipRow}
              renderItem={({ item }) => (
                <Button mode="outlined" compact onPress={() => router.navigate(routes.search({ category: item.slug }))}>
                  {item.name}
                </Button>
              )}
            />
          </View>
        ) : null}

        {deals.length > 0 ? (
          <View style={styles.section}>
            <Text variant="titleMedium" style={styles.sectionTitle}>
              Flash deals
            </Text>
            <FlatList
              horizontal
              data={deals}
              keyExtractor={(item) => String(item.id)}
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.chipRow}
              renderItem={({ item }) => (
                <ProductCard
                  product={item}
                  style={styles.dealCard}
                  onPress={(product) => router.push(routes.product(product.id))}
                  onAddToCart={(product) => show(addItem(product).message)}
                  wishlisted={wishlist.isWishlisted(item.id)}
                  onToggleWishlist={(product) =>
                    show(wishlist.toggle(product) ? 'Saved to your wishlist.' : 'Removed from your wishlist.')
                  }
                />
              )}
            />
          </View>
        ) : null}

        <Text variant="titleMedium" style={[styles.sectionTitle, styles.recommended]}>
          Recommended for you
        </Text>
      </View>
    ),
    [theme, user, router, categories, deals, addItem, wishlist, show],
  );

  if (list.status === 'loading') {
    return (
      <Screen>
        <View style={styles.skeletonGrid}>
          {Array.from({ length: columns * 3 }, (_, index) => (
            <ProductCardSkeleton key={index} width={cardWidth} />
          ))}
        </View>
      </Screen>
    );
  }

  if (list.status === 'error' && list.items.length === 0) {
    return (
      <Screen>
        <ErrorState message={list.error ?? 'Could not load products.'} onRetry={list.reload} />
      </Screen>
    );
  }

  const footer =
    list.status === 'loadingMore' ? (
      <ActivityIndicator style={styles.footer} />
    ) : list.status === 'error' ? (
      <View style={styles.footer}>
        <Text variant="bodyMedium" style={{ color: theme.colors.error }}>
          {list.error}
        </Text>
        <Button onPress={list.loadMore}>Try again</Button>
      </View>
    ) : null;

  return (
    <Screen>
      <ProductGrid
        data={list.items}
        header={header}
        footer={footer}
        empty={
          <EmptyState
            icon="package-variant-closed"
            title="No products yet"
            message="Pull down to refresh and check again."
          />
        }
        refreshing={list.status === 'refreshing'}
        onRefresh={handleRefresh}
        onEndReached={list.hasMore ? list.loadMore : undefined}
      />
    </Screen>
  );
}

const DEAL_CARD_WIDTH = 160;

const styles = StyleSheet.create({
  welcome: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: spacing.lg,
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
  },
  welcomeText: { flex: 1, marginRight: spacing.md },
  searchWrap: { paddingHorizontal: GRID_PADDING, paddingTop: spacing.lg },
  noPointerEvents: { pointerEvents: 'none' },
  section: { marginTop: spacing.lg },
  sectionTitle: { paddingHorizontal: GRID_PADDING, marginBottom: spacing.sm },
  recommended: { marginTop: spacing.xl },
  chipRow: { paddingHorizontal: GRID_PADDING, gap: spacing.sm },
  dealCard: { width: DEAL_CARD_WIDTH },
  skeletonGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: GRID_GAP, padding: GRID_PADDING },
  footer: { padding: spacing.lg, alignItems: 'center' },
});