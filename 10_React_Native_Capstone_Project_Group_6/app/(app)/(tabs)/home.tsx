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

const DEAL_CARD_WIDTH = 160;

export default function HomeScreen() {
  const theme = useAppTheme();
  const router = useRouter();
  const { user } = useAuth();
  const { addItem } = useCart();
  const wishlist = useWishlist();
  const { show } = useSnackbar();
  const { columns, cardWidth } = useGridLayout();

  const fetchPage = useCallback(
    async (skip: number, limit: number) => {
      const response = await productApi.getProducts({ skip, limit });
      return { items: response.products, total: response.total };
    },
    [],
  );
  const list = useInfiniteList(fetchPage);

  const [categories, setCategories] = useState<CategoryInfo[]>([]);
  const [deals, setDeals] = useState<ProductSummary[]>([]);

  // Categories and deals are decorative: if they fail, the product grid still works.
  useEffect(() => {
    let cancelled = false;
    Promise.all([productApi.getCategories(), productApi.getFlashDeals()])
      .then(([categoryList, dealList]) => {
        if (cancelled) return;
        setCategories(categoryList);
        setDeals(dealList);
      })
      .catch((error) => console.warn('Could not load home extras:', error));
    return () => {
      cancelled = true;
    };
  }, []);

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

        <Pressable onPress={() => router.push(routes.search())} style={styles.searchWrap} accessibilityRole="search" accessibilityLabel="Search products">
          <View pointerEvents="none">
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
              data={categories.slice(0, 12)}
              keyExtractor={(item) => item.slug}
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.chipRow}
              renderItem={({ item }) => (
                <Button mode="outlined" compact onPress={() => router.push(routes.search({ category: item.slug }))}>
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
                  style={{ width: DEAL_CARD_WIDTH }}
                  onPress={(product) => router.push(routes.product(product.id))}
                  onAddToCart={(product) => show(addItem(product).message)}
                  wishlisted={wishlist.isWishlisted(item.id)}
                  onToggleWishlist={(product) => show(wishlist.toggle(product) ? 'Saved to your wishlist.' : 'Removed from your wishlist.')}
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
        empty={<EmptyState icon="package-variant-closed" title="No products yet" message="Pull down to refresh and check again." />}
        refreshing={list.status === 'refreshing'}
        onRefresh={list.refresh}
        onEndReached={list.hasMore ? list.loadMore : undefined}
      />
    </Screen>
  );
}

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
  section: { marginTop: spacing.lg },
  sectionTitle: { paddingHorizontal: GRID_PADDING, marginBottom: spacing.sm },
  recommended: { marginTop: spacing.xl },
  chipRow: { paddingHorizontal: GRID_PADDING, gap: spacing.sm },
  skeletonGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: GRID_GAP, padding: GRID_PADDING },
  footer: { padding: spacing.lg, alignItems: 'center' },
});
