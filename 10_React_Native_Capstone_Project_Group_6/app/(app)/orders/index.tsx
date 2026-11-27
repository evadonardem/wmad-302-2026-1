import { useRouter } from 'expo-router';
import React from 'react';
import { FlatList, StyleSheet, View } from 'react-native';
import { Card, Divider, Text } from 'react-native-paper';
import { EmptyState } from '@/components/EmptyState';
import { ErrorState } from '@/components/ErrorState';
import { LoadingState } from '@/components/LoadingState';
import { Screen } from '@/components/Screen';
import { spacing, useAppTheme } from '@/constants/theme';
import { useOrders } from '@/hooks/useOrders';
import type { Cart } from '@/types/product';
import { formatCurrency } from '@/utils/format';
import { routes } from '@/utils/routes';

function OrderCard({ order }: { order: Cart }) {
  const theme = useAppTheme();
  return (
    <Card style={[styles.card, { backgroundColor: theme.colors.surface }]} mode="elevated">
      <Card.Content style={styles.cardContent}>
        <View style={styles.orderHeader}>
          <View style={styles.headerText}>
            <Text variant="titleMedium">Order #{order.id}</Text>
            <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant }}>
              {order.totalProducts} {order.totalProducts === 1 ? 'product' : 'products'} · {order.totalQuantity}{' '}
              {order.totalQuantity === 1 ? 'item' : 'items'}
            </Text>
          </View>
          <Text variant="titleMedium">{formatCurrency(order.discountedTotal)}</Text>
        </View>
        <Divider />
        {order.products.slice(0, 3).map((product) => (
          <View key={product.id} style={styles.productRow}>
            <Text variant="bodyMedium" numberOfLines={1} style={styles.productTitle}>
              {product.title} × {product.quantity}
            </Text>
            <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant }}>
              {formatCurrency(product.discountedTotal)}
            </Text>
          </View>
        ))}
        {order.products.length > 3 ? (
          <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant }}>
            +{order.products.length - 3} more {order.products.length - 3 === 1 ? 'product' : 'products'}
          </Text>
        ) : null}
      </Card.Content>
    </Card>
  );
}

export default function OrdersScreen() {
  const theme = useAppTheme();
  const router = useRouter();
  const { orders, loading, error, reload } = useOrders();

  if (loading) {
    return (
      <Screen>
        <LoadingState message="Loading your orders..." />
      </Screen>
    );
  }

  if (error) {
    return (
      <Screen>
        <ErrorState message={error} onRetry={() => void reload()} />
      </Screen>
    );
  }

  return (
    <Screen>
      <FlatList
        data={orders}
        keyExtractor={(order) => String(order.id)}
        contentContainerStyle={styles.list}
        ItemSeparatorComponent={() => <View style={styles.separator} />}
        ListHeaderComponent={
          <Text variant="bodyMedium" style={[styles.subtitle, { color: theme.colors.onSurfaceVariant }]}>
            Track and review your purchases
          </Text>
        }
        ListEmptyComponent={
          <EmptyState
            icon="package-variant"
            title="No orders yet"
            message="Your purchases will appear here."
            actionLabel="Browse products"
            onAction={() => router.replace(routes.home)}
          />
        }
        renderItem={({ item }) => <OrderCard order={item} />}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  list: { flexGrow: 1, padding: spacing.md, paddingBottom: spacing.lg },
  subtitle: { paddingTop: spacing.sm, paddingBottom: spacing.md },
  separator: { height: spacing.md },
  card: { overflow: 'hidden' },
  cardContent: { gap: spacing.sm },
  orderHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: spacing.md },
  headerText: { flex: 1, gap: spacing.xs },
  productRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: spacing.sm },
  productTitle: { flex: 1 },
});
