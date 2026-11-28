import { useRouter } from 'expo-router';
import React, { useRef, useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { Button, Card, Divider, Text } from 'react-native-paper';
import { EmptyState } from '@/components/EmptyState';
import { LoadingState } from '@/components/LoadingState';
import { Screen } from '@/components/Screen';
import { spacing, useAppTheme } from '@/constants/theme';
import { useAuth } from '@/context/AuthContext';
import { useCart } from '@/context/CartContext';
import { saveLocalOrder } from '@/services/orderStorage';
import type { Cart } from '@/types/product';
import { getErrorMessage } from '@/utils/errors';
import { formatCurrency } from '@/utils/format';
import { routes } from '@/utils/routes';

export default function CheckoutScreen() {
  const theme = useAppTheme();
  const router = useRouter();
  const { user } = useAuth();
  const { items, totals, couponCode, isHydrated, clearCart, removeCoupon } = useCart();
  const [placedOrder, setPlacedOrder] = useState<Cart | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const submittingRef = useRef(false);

  const handlePlaceOrder = async () => {
    if (submittingRef.current || !user || items.length === 0) return;
    submittingRef.current = true;
    setSubmitting(true);
    setError(null);

    const order: Cart = {
      id: Date.now(),
      userId: user.id,
      products: items.map((item) => {
        const total = item.price * item.quantity;
        return {
          id: item.productId,
          title: item.title,
          price: item.price,
          quantity: item.quantity,
          total,
          discountPercentage: item.discountPercentage,
          discountedTotal: total * (1 - item.discountPercentage / 100),
          thumbnail: item.thumbnail,
        };
      }),
      total: totals.subtotal,
      discountedTotal: totals.total,
      totalProducts: items.length,
      totalQuantity: totals.totalQuantity,
    };

    try {
      await saveLocalOrder(order);
      clearCart();
      removeCoupon();
      setPlacedOrder(order);
    } catch (caught: unknown) {
      setError(getErrorMessage(caught, 'Could not place your order.'));
    } finally {
      submittingRef.current = false;
      setSubmitting(false);
    }
  };

  if (!isHydrated) {
    return (
      <Screen>
        <LoadingState message="Preparing checkout..." />
      </Screen>
    );
  }

  if (placedOrder) {
    return (
      <Screen>
        <View style={styles.success}>
          <Card mode="outlined" style={{ backgroundColor: theme.colors.surface }}>
            <Card.Content style={styles.cardContent}>
              <Text variant="headlineSmall">Order placed!</Text>
              <Text variant="bodyMedium">
                Order #{placedOrder.id} has been saved on this device.
              </Text>
              <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant }}>
                No payment was processed.
              </Text>
            </Card.Content>
          </Card>
          <Button mode="contained" onPress={() => router.replace(routes.orders)}>
            View my orders
          </Button>
          <Button mode="text" onPress={() => router.replace(routes.home)}>
            Continue shopping
          </Button>
        </View>
      </Screen>
    );
  }

  if (items.length === 0) {
    return (
      <Screen>
        <EmptyState
          icon="cart-outline"
          title="Your cart is empty"
          message="Add products before checking out."
          actionLabel="Continue shopping"
          onAction={() => router.replace(routes.home)}
        />
      </Screen>
    );
  }

  return (
    <Screen>
      <ScrollView contentContainerStyle={styles.content}>
        <Text variant="headlineSmall">Review your order</Text>
        <Text variant="bodyMedium" style={{ color: theme.colors.onSurfaceVariant }}>
          No payment details are required. You will not be charged.
        </Text>

        <Card mode="outlined" style={{ backgroundColor: theme.colors.surface }}>
          <Card.Content style={styles.cardContent}>
            {items.map((item) => (
              <View key={item.productId} style={styles.row}>
                <View style={styles.productInfo}>
                  <Text variant="titleSmall">{item.title}</Text>
                  <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant }}>
                    {item.quantity} × {formatCurrency(item.price)}
                  </Text>
                </View>
                <Text variant="titleSmall">
                  {formatCurrency(item.price * item.quantity * (1 - item.discountPercentage / 100))}
                </Text>
              </View>
            ))}
            <Divider />
            <SummaryRow label="Subtotal" value={formatCurrency(totals.subtotal)} />
            {totals.productDiscount > 0 ? (
              <SummaryRow label="Product discounts" value={`-${formatCurrency(totals.productDiscount)}`} />
            ) : null}
            {totals.couponDiscount > 0 ? (
              <SummaryRow
                label={`Coupon ${couponCode ?? ''}`}
                value={`-${formatCurrency(totals.couponDiscount)}`}
              />
            ) : null}
            <Divider />
            <SummaryRow label="Total" value={formatCurrency(totals.total)} bold />
          </Card.Content>
        </Card>

        {error ? (
          <Text variant="bodyMedium" style={{ color: theme.colors.error }}>
            {error}
          </Text>
        ) : null}
        <Button
          mode="contained"
          icon="check"
          loading={submitting}
          disabled={submitting || !user}
          onPress={() => void handlePlaceOrder()}
          contentStyle={styles.submitContent}
        >
          Place order
        </Button>
      </ScrollView>
    </Screen>
  );
}

function SummaryRow({ label, value, bold = false }: { label: string; value: string; bold?: boolean }) {
  return (
    <View style={styles.row}>
      <Text variant={bold ? 'titleMedium' : 'bodyMedium'}>{label}</Text>
      <Text variant={bold ? 'titleMedium' : 'bodyMedium'}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  content: { padding: spacing.lg, gap: spacing.md, paddingBottom: spacing.xl },
  cardContent: { gap: spacing.md },
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: spacing.md },
  productInfo: { flex: 1, gap: spacing.xs },
  submitContent: { height: 48 },
  success: { flex: 1, justifyContent: 'center', padding: spacing.lg, gap: spacing.md },
});
