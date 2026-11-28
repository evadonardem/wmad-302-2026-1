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
        <View style={styles.container}>
          <View style={[styles.sheet, { backgroundColor: theme.colors.surface }]}>
            <CartSheetHeader itemCount={0} onClose={() => router.navigate(routes.home)} />
            <LoadingState message="Loading your cart…" />
          </View>
        </View>
      </Screen>
    );
  }

  if (items.length === 0) {
    return (
      <Screen>
        <View style={styles.container}>
          <View style={[styles.sheet, { backgroundColor: theme.colors.surface }]}>
            <CartSheetHeader itemCount={0} onClose={() => router.navigate(routes.home)} />
            <EmptyState
              icon="cart-outline"
              title="Your cart is empty"
              message="Add a few products and they will show up here."
              actionLabel="Start shopping"
              onAction={() => router.navigate(routes.home)}
            />
          </View>
        </View>
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
      <View style={styles.container}>
        <View
          style={[
            styles.sheet,
            {
              backgroundColor: theme.colors.surface,
              borderColor: theme.colors.outlineVariant,
            },
          ]}
        >
          <CartSheetHeader
            itemCount={totals.totalQuantity}
            onClose={() => router.navigate(routes.home)}
          />
          <FlatList
            data={items}
            keyExtractor={(item) => String(item.productId)}
            contentContainerStyle={styles.list}
            ItemSeparatorComponent={ItemSeparator}
            renderItem={({ item }) => {
              const discountedPrice = item.price * (1 - item.discountPercentage / 100);
              return (
                <View
                  style={[
                    styles.item,
                    {
                      backgroundColor: theme.colors.surfaceVariant,
                      borderColor: theme.colors.outlineVariant,
                    },
                  ]}
                >
                  <Image
                    source={{ uri: item.thumbnail }}
                    style={[styles.image, { backgroundColor: theme.colors.surface }]}
                    resizeMode="contain"
                  />
                  <View style={styles.itemInfo}>
                    <Text variant="titleSmall" numberOfLines={2}>
                      {item.title}
                    </Text>
                    <Text variant="titleSmall" style={[styles.price, { color: theme.colors.primary }]}>
                      {formatCurrency(discountedPrice)}
                    </Text>
                    {item.discountPercentage > 0 ? (
                      <Text
                        variant="bodySmall"
                        style={[styles.oldPrice, { color: theme.colors.onSurfaceVariant }]}
                      >
                        {formatCurrency(item.price)}
                      </Text>
                    ) : null}
                    <QuantityStepper
                      value={item.quantity}
                      onDecrease={() =>
                        item.quantity <= 1
                          ? setPendingRemoval(item)
                          : setQuantity(item.productId, item.quantity - 1)
                      }
                      onIncrease={() => setQuantity(item.productId, item.quantity + 1)}
                      canIncrease={item.quantity < item.stock}
                      compact
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
              );
            }}
          />

          <View
            style={[
              styles.summary,
              {
                backgroundColor: theme.colors.surface,
                borderTopColor: theme.colors.outlineVariant,
              },
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
            <SummaryRow label="Express delivery" value="FREE" positive />
            <Divider style={styles.divider} />
            <SummaryRow label="Total" value={formatCurrency(totals.total)} bold />

            <Button
              mode="contained"
              icon="arrow-right"
              onPress={() => router.push(routes.checkout)}
              contentStyle={styles.checkoutContent}
              style={styles.checkout}
            >
              Proceed to Checkout
            </Button>
          </View>
        </View>
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

function CartSheetHeader({ itemCount, onClose }: { itemCount: number; onClose: () => void }) {
  const theme = useAppTheme();
  const itemLabel = itemCount === 1 ? 'item' : 'items';

  return (
    <>
      <View style={styles.handleContainer}>
        <View style={[styles.handle, { backgroundColor: theme.colors.outlineVariant }]} />
      </View>
      <View style={[styles.header, { borderBottomColor: theme.colors.outlineVariant }]}>
        <View style={styles.headerText}>
          <Text variant="titleLarge">Shopping Cart</Text>
          <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant }}>
            {itemCount} {itemLabel} ready for checkout
          </Text>
        </View>
        <IconButton
          icon="close"
          size={20}
          mode="contained"
          containerColor={theme.colors.surfaceVariant}
          onPress={onClose}
          accessibilityLabel="Close cart"
        />
      </View>
    </>
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
  container: { flex: 1, width: '100%', alignItems: 'center' },
  sheet: {
    flex: 1,
    width: '100%',
    maxWidth: 640,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    borderWidth: StyleSheet.hairlineWidth,
    overflow: 'hidden',
  },
  handleContainer: { alignItems: 'center', paddingTop: spacing.sm, paddingBottom: spacing.xs },
  handle: { width: 36, height: 4, borderRadius: 2 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.sm,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  headerText: { gap: 2 },
  list: { padding: spacing.md, paddingBottom: spacing.lg },
  separator: { height: spacing.sm },
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 14,
    borderWidth: StyleSheet.hairlineWidth,
    padding: spacing.sm,
    gap: spacing.sm,
  },
  image: { width: 64, height: 64, borderRadius: 10 },
  itemInfo: { flex: 1, gap: 2 },
  price: { fontWeight: '700' },
  oldPrice: { textDecorationLine: 'line-through' },
  summary: {
    paddingHorizontal: spacing.md,
    paddingTop: spacing.sm,
    paddingBottom: 96,
    borderTopWidth: StyleSheet.hairlineWidth,
    gap: 3,
  },
  couponRow: { flexDirection: 'row', gap: spacing.sm, alignItems: 'center' },
  couponInput: { flex: 1 },
  couponApplied: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  summaryRow: { flexDirection: 'row', justifyContent: 'space-between' },
  divider: { marginVertical: spacing.xs },
  checkout: { marginTop: spacing.sm, borderRadius: 14 },
  checkoutContent: { height: 48, flexDirection: 'row-reverse' },
});