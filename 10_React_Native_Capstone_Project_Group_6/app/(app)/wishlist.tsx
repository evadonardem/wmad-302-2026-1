import { useRouter } from 'expo-router';
import React from 'react';
import { FlatList, StyleSheet, View } from 'react-native';
import { Text } from 'react-native-paper';
import { EmptyState } from '@/components/EmptyState';
import { ErrorState } from '@/components/ErrorState';
import { LoadingState } from '@/components/LoadingState';
import { ProductCard } from '@/components/ProductCard';
import { GRID_GAP, GRID_PADDING, useGridLayout } from '@/components/ProductGrid';
import { Screen } from '@/components/Screen';
import { useSnackbar } from '@/components/SnackbarProvider';
import { spacing, useAppTheme } from '@/constants/theme';
import { useCart } from '@/context/CartContext';
import { useWishlist } from '@/context/WishlistContext';
import { routes } from '@/utils/routes';

export default function WishlistScreen() {
  const theme = useAppTheme();
  const router = useRouter();
  const { columns, cardWidth } = useGridLayout();
  const { items, isHydrated, error, isWishlisted, toggle } = useWishlist();
  const { addItem } = useCart();
  const { show } = useSnackbar();

  if (!isHydrated) {
    return (
      <Screen>
        <LoadingState message="Loading your wishlist..." />
      </Screen>
    );
  }

  if (error) {
    return (
      <Screen>
        <ErrorState message={error} />
      </Screen>
    );
  }

  return (
    <Screen>
      <FlatList
        key={columns}
        data={items}
        numColumns={columns}
        keyExtractor={(item) => String(item.id)}
        contentContainerStyle={styles.content}
        columnWrapperStyle={columns > 1 ? styles.row : undefined}
        ListHeaderComponent={
          <View style={styles.header}>
            <Text variant="bodyMedium" style={{ color: theme.colors.onSurfaceVariant }}>
              {items.length} {items.length === 1 ? 'saved product' : 'saved products'}
            </Text>
          </View>
        }
        ListEmptyComponent={
          <EmptyState
            icon="heart-outline"
            title="Your wishlist is empty"
            message="Save products you like and they’ll show up here."
            actionLabel="Browse products"
            onAction={() => router.replace(routes.home)}
          />
        }
        renderItem={({ item }) => (
          <ProductCard
            product={item}
            style={{ width: cardWidth }}
            onPress={(product) => router.push(routes.product(product.id))}
            wishlisted={isWishlisted(item.id)}
            onToggleWishlist={(product) => {
              toggle(product);
              show('Removed from your wishlist.');
            }}
            onAddToCart={(product) => show(addItem(product).message)}
          />
        )}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: {
    flexGrow: 1,
    paddingHorizontal: GRID_PADDING,
    paddingBottom: spacing.lg,
  },
  header: {
    paddingTop: spacing.lg,
    paddingBottom: spacing.md,
  },
  row: {
    gap: GRID_GAP,
    marginBottom: GRID_GAP,
  },
});
