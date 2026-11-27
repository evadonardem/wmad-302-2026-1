import React, { ReactNode } from 'react';
import { FlatList, StyleSheet, useWindowDimensions, View } from 'react-native';
import { useRouter } from 'expo-router';
import type { ProductSummary } from '@/types/product';
import { ProductCard } from '@/components/ProductCard';
import { routes } from '@/utils/routes';

export const GRID_PADDING = 16;
export const GRID_GAP = 12;

export function useGridLayout() {
  const { width } = useWindowDimensions();
  const columns = width >= 1000 ? 4 : width >= 650 ? 3 : 2;
  const cardWidth = (width - GRID_PADDING * 2 - GRID_GAP * (columns - 1)) / columns;
  return { columns, cardWidth };
}

interface ProductGridProps {
  data: ProductSummary[];
  header?: ReactNode;
  footer?: ReactNode;
  empty?: ReactNode;
  refreshing?: boolean;
  onRefresh?: () => void;
  onEndReached?: () => void;
}

export function ProductGrid({
  data,
  header,
  footer,
  empty,
  refreshing = false,
  onRefresh,
  onEndReached,
}: ProductGridProps) {
  const { columns, cardWidth } = useGridLayout();
  const router = useRouter();
  return (
    <FlatList
      key={columns}
      data={data}
      numColumns={columns}
      keyExtractor={(item) => String(item.id)}
      ListHeaderComponent={header ? <View>{header}</View> : null}
      ListFooterComponent={footer ? <View>{footer}</View> : null}
      ListEmptyComponent={empty ? <View style={styles.empty}>{empty}</View> : null}
      contentContainerStyle={styles.content}
      columnWrapperStyle={columns > 1 ? styles.row : undefined}
      renderItem={({ item }) => (
        <ProductCard
          product={item}
          style={{ width: cardWidth }}
          onPress={(product) => router.push(routes.product(product.id))}
        />
      )}
      refreshing={refreshing}
      onRefresh={onRefresh}
      onEndReached={onEndReached}
      onEndReachedThreshold={0.5}
    />
  );
}

const styles = StyleSheet.create({
  content: { paddingHorizontal: GRID_PADDING, paddingBottom: 24, flexGrow: 1 },
  row: { gap: GRID_GAP, marginBottom: GRID_GAP },
  empty: { flex: 1, minHeight: 220 },
});
