/**
 * Cart Screen - quantities, remove, coupon, totals, checkout.
 * State comes from CartContext (useReducer) which persists to AsyncStorage per user.
 */
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import { FlatList, Image, StyleSheet, View } from 'react-native';
import { Button, Chip, Divider, IconButton, Text, TextInput } from 'react-native-paper';
import { ConfirmDialog } from '@/components/ConfirmDialog';
import { EmptyState } from '@/components/EmptyState';
import { LoadingState } from '@/components/LoadingState';
import { PriceTag } from '@/components/PriceTag';
import { QuantityStepper } from '@/components/QuantityStepper';
import { Screen } from '@/components/Screen';
import { useSnackbar } from '@/components/SnackbarProvider';
import { spacing, useAppTheme } from '@/constants/theme';
import { useCart } from '@/context/CartContext';
import { CartItem } from '@/types/product';
import { formatCurrency } from '@/utils/format';
import { routes } from '@/utils/routes';

// Stable component identity so FlatList doesn't re-create the separator on every render
function ItemSeparator() {
  return <View style={styles.separator} />;
}

export default function CartScreen() {
  const theme = useAppTheme();
  const router = useRouter();
  const { show } = useSnackbar();
  const { items, totals, coupon, couponCode, isHydrated, setQuantity, removeItem, applyCoupon, removeCoupon } = useCart();

  const [couponInput, setCouponInput] = useState('');
  const [couponError, setCouponError] = useState<string | null>(null);
  const [pendingRemoval, setPendingRemoval] = useState<CartItem | null>(null);

  if (!isHydrated) {
    return (
      <Screen>
        <LoadingState message="Loading your cart…" />
      </Screen>
    );
  }

  if (items.length === 0) {
    return (
      <Screen>
        <EmptyState
          icon="cart-outline"
          title="Your cart is empty"
          message="Add a few products and they will show up here."
          actionLabel="Start shopping"
          onAction={() => router.navigate(routes.home)}
        />
      </Screen>
    );
  }

  const canApplyCoupon = couponInput.trim().length > 0;

  const handleApplyCoupon = () => {
    if (!canApplyCoupon) return;
    const result = applyCoupon(couponInput);
    if (result.ok) {
      setCouponInput('');
      setCouponError(null);
      show(result.message);
    } else {
      setCouponError(result.message);
    }
  };

  const couponInactive = coupon !== null && totals.couponDiscount === 0;

  return (
    <Screen>
      <FlatList
        data={items}
        keyExtractor={(item) => String(item.productId)}
        contentContainerStyle={styles.list}
        ItemSeparatorComponent={ItemSeparator}
        ListHeaderComponent={
          <Text variant="headlineSmall" style={styles.title}>
            Cart ({totals.totalQuantity} {totals.totalQuantity === 1 ? 'item' : 'items'})
          </Text>
        }
        renderItem={({ item }) => (
          <View style={[styles.item, { backgroundColor: theme.colors.surface }]}>
            <Image
              source={{ uri: item.thumbnail }}
              style={[styles.image, { backgroundColor: theme.colors.surfaceVariant }]}
              resizeMode="contain"
            />
            <View style={styles.itemInfo}>
              <Text variant="titleSmall" numberOfLines={2}>
                {item.title}
              </Text>
              <PriceTag price={item.price} discountPercentage={item.discountPercentage} />
              <QuantityStepper
                value={item.quantity}
                onDecrease={() =>
                  item.quantity <= 1 ? setPendingRemoval(item) : setQuantity(item.productId, item.quantity - 1)
                }
                onIncrease={() => setQuantity(item.productId, item.quantity + 1)}
                canIncrease={item.quantity < item.stock}
              />
              {item.quantity >= item.stock ? (
                <Text variant="labelSmall" style={{ color: theme.colors.warning }}>
                  Only {item.stock} in stock
                </Text>
              ) : null}
            </View>
            <IconButton
              icon="delete-outline"
              iconColor={theme.colors.error}
              onPress={() => setPendingRemoval(item)}
              accessibilityLabel={`Remove ${item.title}`}
            />
          </View>
        )}
      />

      <View
        style={[
          styles.summary,
          { backgroundColor: theme.colors.surface, borderTopColor: theme.colors.outlineVariant },
        ]}
      >
        {coupon ? (
          <View style={styles.couponApplied}>
            <Chip icon="tag" onClose={removeCoupon} closeIconAccessibilityLabel="Remove coupon">
              {couponCode}
            </Chip>
            {couponInactive ? (
              <Text variant="bodySmall" style={{ color: theme.colors.warning, flex: 1 }}>
                Needs a {formatCurrency(coupon.minSubtotal)} cart to apply.
              </Text>
            ) : null}
          </View>
        ) : (
          <View style={styles.couponRow}>
            <TextInput
              mode="outlined"
              dense
              label="Coupon code"
              value={couponInput}
              onChangeText={(value) => {
                setCouponInput(value);
                setCouponError(null);
              }}
              autoCapitalize="characters"
              error={Boolean(couponError)}
              style={styles.couponInput}
              onSubmitEditing={handleApplyCoupon}
            />
            <Button mode="outlined" onPress={handleApplyCoupon} disabled={!canApplyCoupon}>
              Apply
            </Button>
          </View>
        )}
        {couponError ? (
          <Text variant="bodySmall" style={{ color: theme.colors.error }}>
            {couponError}
          </Text>
        ) : null}

        <SummaryRow label="Subtotal" value={formatCurrency(totals.subtotal)} />
        {totals.productDiscount > 0 ? (
          <SummaryRow label="Product discounts" value={`-${formatCurrency(totals.productDiscount)}`} positive />
        ) : null}
        {totals.couponDiscount > 0 ? (
          <SummaryRow label={`Coupon ${couponCode}`} value={`-${formatCurrency(totals.couponDiscount)}`} positive />
        ) : null}
        <Divider style={styles.divider} />
        <SummaryRow label="Total" value={formatCurrency(totals.total)} bold />

        <Button
          mode="contained"
          onPress={() => router.push(routes.checkout)}
          contentStyle={styles.checkoutContent}
          style={styles.checkout}
        >
          Checkout
        </Button>
      </View>

      <ConfirmDialog
        visible={pendingRemoval !== null}
        title="Remove item?"
        message={pendingRemoval ? `Remove "${pendingRemoval.title}" from your cart?` : ''}
        confirmLabel="Remove"
        destructive
        onDismiss={() => setPendingRemoval(null)}
        onConfirm={() => {
          if (pendingRemoval) removeItem(pendingRemoval.productId);
          setPendingRemoval(null);
        }}
      />
    </Screen>
  );
}

interface SummaryRowProps {
  label: string;
  value: string;
  bold?: boolean;
  positive?: boolean;
}

function SummaryRow({ label, value, bold = false, positive = false }: SummaryRowProps) {
  const theme = useAppTheme();
  const valueColor = positive ? theme.colors.success : bold ? theme.colors.primary : theme.colors.onSurface;

  return (
    <View style={styles.summaryRow}>
      <Text
        variant={bold ? 'titleMedium' : 'bodyMedium'}
        style={{ color: bold ? theme.colors.onSurface : theme.colors.onSurfaceVariant }}
      >
        {label}
      </Text>
      <Text
        variant={bold ? 'titleMedium' : 'bodyMedium'}
        style={{ color: valueColor, fontWeight: bold ? '700' : '500' }}
      >
        {value}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  list: { padding: spacing.lg },
  title: { marginBottom: spacing.md },
  separator: { height: spacing.sm },
  item: { flexDirection: 'row', alignItems: 'center', borderRadius: 12, padding: spacing.md, gap: spacing.md },
  image: { width: 80, height: 80, borderRadius: 8 },
  itemInfo: { flex: 1, gap: spacing.xs },
  summary: { padding: spacing.lg, borderTopWidth: StyleSheet.hairlineWidth, gap: spacing.xs },
  couponRow: { flexDirection: 'row', gap: spacing.sm, alignItems: 'center' },
  couponInput: { flex: 1 },
  couponApplied: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  summaryRow: { flexDirection: 'row', justifyContent: 'space-between' },
  divider: { marginVertical: spacing.xs },
  checkout: { marginTop: spacing.sm },
  checkoutContent: { height: 48 },
});