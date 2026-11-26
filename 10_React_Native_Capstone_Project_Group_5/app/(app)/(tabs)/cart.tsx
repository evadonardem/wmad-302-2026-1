/**
 * Cart Screen - Marketplace
 * Done: Students implement
 * - Cart state management (Context + useReducer)  -> context/CartContext.tsx
 * - Add/remove/update quantities
 * - Persist cart to AsyncStorage
 * - Apply coupons/discounts
 * - Checkout flow (POST /carts)
 * - DummyJSON Carts API: https://dummyjson.com/docs/carts
 * Responsive: list + fixed summary on phones, list + summary card side by side on tablet / web.
 */
import React, { useState } from 'react';
import { View, Text, FlatList, ActivityIndicator, Image, Pressable } from 'react-native';
import { useRouter } from 'expo-router';
import {
  Button,
  TextInput,
  Portal,
  HelperText,
  Snackbar,
} from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useAuth } from '@/context/AuthContext';
import { COUPONS, useCart } from '@/context/CartContext';
import { useRewards } from '@/context/RewardsContext';
import { productApi } from '@/services/productApi';
import { ScreenBackground } from '@/components/ScreenBackground';
import { AppDialog, DialogRow, DialogSectionLabel } from '@/components/AppDialog';
import { LuckySpinWheel } from '@/components/LuckySpinWheel';
import { addLocalOrder, OrderRecord, PAYMENT_LABELS, PaymentChoice } from '@/services/orders';
import { loadAddresses, formatAddress } from '@/services/addresses';
import { CartItem } from '@/types/product';
import { palette, useResponsive } from '@/constants/theme';
import { styles } from '@/styles/cart';

type IconName = React.ComponentProps<typeof MaterialCommunityIcons>['name'];

interface CheckoutErrors {
  name?: string;
  address?: string;
  phone?: string;
}

interface OrderResult {
  id: number;
  total: number;
  quantity: number;
  payment: PaymentChoice;
  name: string;
  address: string;
}

const PAYMENT_OPTIONS: { key: PaymentChoice; icon: IconName; title: string; subtitle: string }[] = [
  { key: 'card', icon: 'credit-card-outline', title: 'Credit / debit card', subtitle: 'Visa, Mastercard, Amex' },
  { key: 'wallet', icon: 'wallet-outline', title: 'E-payment', subtitle: 'GCash, Maya, PayPal' },
  { key: 'cod', icon: 'cash-multiple', title: 'Cash on delivery', subtitle: 'Pay the rider when it arrives' },
];

export default function CartScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const { isWide } = useResponsive();
  const { state: rewards, redeemCoupon } = useRewards();
  const {
    items,
    isLoading,
    couponCode,
    updateQuantity,
    removeItem,
    applyCoupon,
    removeCoupon,
  } = useCart();

  const [removeTarget, setRemoveTarget] = useState<CartItem | null>(null);
  const [couponInput, setCouponInput] = useState('');
  const [selectedRewardId, setSelectedRewardId] = useState<string | null>(null);
  const [snack, setSnack] = useState<string | null>(null);

  // Checkout form state
  const [checkoutOpen, setCheckoutOpen] = useState(false);
  const [name, setName] = useState('');
  const [address, setAddress] = useState('');
  const [phone, setPhone] = useState('');
  const [errors, setErrors] = useState<CheckoutErrors>({});
  const [submitting, setSubmitting] = useState(false);
  const [order, setOrder] = useState<OrderResult | null>(null);
  const [payment, setPayment] = useState<PaymentChoice>('card');
  const [spinOpen, setSpinOpen] = useState(false);
  const [summaryOpen, setSummaryOpen] = useState(true);

  // Checkout only what is ticked: quantity, totals, product discounts and the coupon are all
  // worked out from the selected items. New items arrive ticked; untick what you do not want yet.
  const [unchecked, setUnchecked] = useState<number[]>([]);
  const selectedItems = items.filter((i) => !unchecked.includes(i.productId));
  const totalQuantity = selectedItems.reduce((sum, i) => sum + i.quantity, 0);
  const total = selectedItems.reduce((sum, i) => sum + i.price * i.quantity, 0);
  const discountedTotal = selectedItems.reduce((sum, i) => sum + i.price * (1 - i.discountPercentage / 100) * i.quantity, 0);
  const couponPercent = couponCode ? COUPONS[couponCode] ?? 0 : 0;
  const couponDiscount = discountedTotal * (couponPercent / 100);
  const selectedReward = rewards.coupons.find((coupon) => coupon.id === selectedRewardId) ?? null;
  const rewardDiscount = selectedReward
    ? selectedReward.kind === 'discount'
      ? discountedTotal * (selectedReward.value / 100)
      : selectedReward.kind === 'points'
        ? Math.min(selectedReward.value, discountedTotal - couponDiscount)
        : 0
    : 0;
  const finalTotal = Math.max(0, discountedTotal - couponDiscount - rewardDiscount);
  const allSelected = items.length > 0 && selectedItems.length === items.length;

  const toggleItem = (productId: number) =>
    setUnchecked((prev) => (prev.includes(productId) ? prev.filter((id) => id !== productId) : [...prev, productId]));
  const toggleAll = () => setUnchecked(allSelected ? items.map((i) => i.productId) : []);

  const goBack = () => {
    if (router.canGoBack()) router.back();
    else router.push('/(app)/(tabs)/home');
  };

  const handleQuantity = (item: CartItem, newQuantity: number) => {
    if (newQuantity <= 0) {
      setRemoveTarget(item);
      return;
    }
    if (newQuantity > item.stock) {
      setSnack(`Only ${item.stock} items available`);
      return;
    }
    // Done: update state + AsyncStorage (the context persists every change)
    updateQuantity(item.productId, newQuantity);
  };

  const confirmRemove = () => {
    if (removeTarget) removeItem(removeTarget.productId);
    setRemoveTarget(null);
  };

  const handleApplyCoupon = () => {
    if (applyCoupon(couponInput)) {
      setSnack('Coupon applied');
      setCouponInput('');
    } else {
      setSnack('Invalid coupon code (try SAVE10 or SAVE20)');
    }
  };

  const openCheckout = () => {
    if (selectedItems.length === 0) return;
    setName(user ? `${user.firstName} ${user.lastName}` : '');
    setPayment('card');
    setErrors({});
    setOrder(null);
    setCheckoutOpen(true);
    // Pre-fill from the default saved address (Profile > Addresses)
    if (user) {
      loadAddresses(user.id).then((list) => {
        const preferred = list.find((a) => a.isDefault) ?? list[0];
        if (preferred) {
          setName(preferred.fullName);
          setAddress(formatAddress(preferred));
          setPhone(preferred.phone);
        }
      });
    }
  };

  const validate = (): boolean => {
    const next: CheckoutErrors = {};
    if (name.trim().length < 2) next.name = 'Enter your full name';
    if (address.trim().length < 8) next.address = 'Enter a complete delivery address';
    if (!/^[0-9+\-\s]{7,15}$/.test(phone.trim())) next.phone = 'Enter a valid phone number';
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const handleCheckout = async () => {
    if (selectedItems.length === 0) return;
    if (!validate()) return;

    const userId = user?.id ?? 1;
    setSubmitting(true);
    try {
      // Done: POST /carts/add with userId and products
      const created = await productApi.addCart({
        userId,
        products: selectedItems.map((i) => ({ id: i.productId, quantity: i.quantity })),
      });

      // DummyJSON does not persist the new cart, so keep a local copy for Profile > My orders
      const record: OrderRecord = {
        id: created.id,
        userId,
        total,
        discountedTotal: finalTotal,
        totalProducts: selectedItems.length,
        totalQuantity,
        products: selectedItems.map((i) => ({
          id: i.productId,
          title: i.title,
          price: i.price,
          quantity: i.quantity,
          total: i.price * i.quantity,
          discountPercentage: i.discountPercentage,
          discountedTotal: i.price * (1 - i.discountPercentage / 100) * i.quantity,
          thumbnail: i.thumbnail,
        })),
        placedAt: new Date().toISOString(),
        paymentMethod: payment,
        shippingName: name.trim(),
        shippingAddress: address.trim(),
        shippingPhone: phone.trim(),
      };
      await addLocalOrder(userId, record);

      // Done: only the ticked items were ordered, so remove just those and keep the rest in the cart
      setOrder({
        id: record.id,
        total: finalTotal,
        quantity: totalQuantity,
        payment,
        name: record.shippingName ?? name.trim(),
        address: record.shippingAddress ?? address.trim(),
      });
      selectedItems.forEach((i) => removeItem(i.productId));
      setUnchecked([]);
      if (selectedRewardId) redeemCoupon(selectedRewardId);
      setSelectedRewardId(null);
      removeCoupon();
      setPhone('');
      setAddress('');
    } catch (error) {
      setSnack(error instanceof Error ? error.message : 'Failed to place order');
    } finally {
      setSubmitting(false);
    }
  };

  const closeCheckout = () => {
    setCheckoutOpen(false);
    if (order) {
      setOrder(null);
      router.push('/(app)/(tabs)/home');
    }
  };

  const renderItem = ({ item }: { item: CartItem }) => {
    const discountedPrice = item.price * (1 - item.discountPercentage / 100);
    const checked = !unchecked.includes(item.productId);
    return (
      <View style={[styles.cartItem, checked && styles.cartItemChecked]}>
        <Pressable
          style={styles.check}
          onPress={() => toggleItem(item.productId)}
          accessibilityRole="checkbox"
          accessibilityState={{ checked }}
          accessibilityLabel={`Select ${item.title} for checkout`}
        >
          <MaterialCommunityIcons name={checked ? 'check-circle' : 'circle-outline'} size={28} color={checked ? palette.forest : palette.mist} />
        </Pressable>
        <Image source={{ uri: item.thumbnail }} style={[styles.itemImage, !checked && styles.itemDimmed]} resizeMode="contain" />
        <View style={[styles.itemInfo, !checked && styles.itemDimmed]}>
          <Text style={styles.itemTitle} numberOfLines={2}>{item.title}</Text>
          <View style={styles.itemPriceRow}>
            <Text style={styles.itemCurrentPrice}>${discountedPrice.toFixed(2)}</Text>
            {item.discountPercentage > 0 && (
              <Text style={styles.itemOriginalPrice}>${item.price.toFixed(2)}</Text>
            )}
          </View>
          <View style={styles.quantityControls}>
            <Pressable
              style={[styles.qtyButton, item.quantity <= 1 && styles.qtyButtonDisabled]}
              onPress={() => handleQuantity(item, item.quantity - 1)}
              disabled={item.quantity <= 1}
              accessibilityLabel="Decrease quantity"
            >
              <MaterialCommunityIcons name="minus" size={18} color={palette.surface} />
            </Pressable>
            <Text style={styles.quantityText}>{item.quantity}</Text>
            <Pressable
              style={[styles.qtyButton, item.quantity >= item.stock && styles.qtyButtonDisabled]}
              onPress={() => handleQuantity(item, item.quantity + 1)}
              disabled={item.quantity >= item.stock}
              accessibilityLabel="Increase quantity"
            >
              <MaterialCommunityIcons name="plus" size={18} color={palette.surface} />
            </Pressable>
            <Pressable onPress={() => setRemoveTarget(item)} accessibilityLabel="Remove item" style={{ marginLeft: 8 }}>
              <MaterialCommunityIcons name="delete-outline" size={22} color={palette.danger} />
            </Pressable>
          </View>
          <Text style={styles.itemLineTotal}>${(discountedPrice * item.quantity).toFixed(2)}</Text>
        </View>
      </View>
    );
  };

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={palette.sage} />
        <Text style={styles.loadingText}>Loading cart...</Text>
      </View>
    );
  }

  const isEmpty = items.length === 0;

  const header = (
    <View>
      <View style={styles.header}>
        <Pressable style={styles.backButton} onPress={goBack} accessibilityLabel="Go back">
          <MaterialCommunityIcons name="arrow-left" size={22} color={palette.ink} />
        </Pressable>
        <Text style={styles.headerTitle}>My Cart</Text>
        <Text style={styles.headerCount}>{selectedItems.length} of {items.length} selected</Text>
      </View>
      {items.length > 1 ? (
        <Pressable onPress={() => setSpinOpen(true)} style={styles.spinPickButton} accessibilityLabel="Spin to pick an item">
          <MaterialCommunityIcons name="ferris-wheel" size={18} color={palette.surface} />
          <Text style={styles.spinPickText}>Can&apos;t decide? Spin the Wheel!</Text>
        </Pressable>
      ) : null}
      <Pressable style={styles.selectAll} onPress={toggleAll} accessibilityRole="checkbox" accessibilityState={{ checked: allSelected }}>
        <MaterialCommunityIcons
          name={allSelected ? 'check-circle' : selectedItems.length > 0 ? 'minus-circle' : 'circle-outline'}
          size={26}
          color={selectedItems.length > 0 ? palette.forest : palette.mist}
        />
        <Text style={styles.selectAllText}>Select all ({items.length})</Text>
        <Text style={styles.selectAllHint}>Only ticked items are checked out and discounted</Text>
      </Pressable>
    </View>
  );

  // Order Summary
  const summary = (
    <View style={isWide ? styles.summaryWide : styles.summaryContainer}>
      <Pressable style={styles.summaryToggle} onPress={() => setSummaryOpen((v) => !v)} accessibilityRole="button" accessibilityLabel={summaryOpen ? 'Collapse order summary' : 'Expand order summary'}>
        <Text style={styles.summaryToggleTitle}>Order Summary</Text>
        <View style={styles.summaryToggleRight}>
          <Text style={styles.summaryToggleTotal}>${finalTotal.toFixed(2)}</Text>
          <MaterialCommunityIcons name={summaryOpen ? 'chevron-up' : 'chevron-down'} size={22} color={palette.ink} />
        </View>
      </Pressable>

      {summaryOpen ? (
        <>
          {/* Coupon */}
          {couponCode ? (
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Coupon {couponCode}</Text>
              <Text style={styles.discountValue} onPress={removeCoupon}>
                Remove
              </Text>
            </View>
          ) : (
            <View style={styles.couponRow}>
              <TextInput
                mode="outlined"
                dense
                placeholder="Coupon code"
                value={couponInput}
                onChangeText={setCouponInput}
                autoCapitalize="characters"
                style={{ flex: 1, marginRight: 8 }}
              />
              <Button mode="outlined" onPress={handleApplyCoupon} disabled={!couponInput.trim()}>
                Apply
              </Button>
            </View>
          )}

          {/* Game rewards */}
          <View style={styles.rewardSection}>
            <View style={styles.rewardHeader}>
              <MaterialCommunityIcons name="gift-outline" size={18} color={palette.forest} />
              <Text style={styles.rewardTitle}>Game Rewards</Text>
              {selectedReward ? (
                <Pressable onPress={() => setSelectedRewardId(null)} accessibilityRole="button">
                  <Text style={styles.discountValue}>Remove</Text>
                </Pressable>
              ) : null}
            </View>
            {rewards.coupons.length === 0 ? (
              <Text style={styles.rewardHint}>Play games to earn coupons you can use here.</Text>
            ) : (
              <View style={styles.rewardList}>
                {rewards.coupons.map((reward) => {
                  const active = selectedRewardId === reward.id;
                  return (
                    <Pressable
                      key={reward.id}
                      style={[styles.rewardOption, active && styles.rewardOptionActive]}
                      onPress={() => setSelectedRewardId(active ? null : reward.id)}
                      accessibilityRole="checkbox"
                      accessibilityState={{ checked: active }}
                      accessibilityLabel={`${reward.title} ${reward.code}`}
                    >
                      <MaterialCommunityIcons
                        name={active ? 'check-circle' : 'circle-outline'}
                        size={20}
                        color={active ? palette.forest : palette.mist}
                      />
                      <View style={styles.rewardOptionText}>
                        <Text style={[styles.rewardOptionTitle, active && styles.rewardOptionTitleActive]} numberOfLines={1}>
                          {reward.title}
                        </Text>
                        <Text style={styles.rewardOptionSub} numberOfLines={1}>
                          {reward.code} · {reward.kind === 'discount' ? `${reward.value}% off` : reward.kind === 'shipping' ? 'Free shipping' : `${reward.value} pts value`}
                        </Text>
                      </View>
                    </Pressable>
                  );
                })}
              </View>
            )}
          </View>

          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Sub Total ({totalQuantity} {totalQuantity === 1 ? 'item' : 'items'})</Text>
            <Text style={styles.summaryValue}>${total.toFixed(2)}</Text>
          </View>
          {total !== discountedTotal && (
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Discount</Text>
              <Text style={styles.discountValue}>-${(total - discountedTotal).toFixed(2)}</Text>
            </View>
          )}
          {couponDiscount > 0 && (
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Coupon</Text>
              <Text style={styles.discountValue}>-${couponDiscount.toFixed(2)}</Text>
            </View>
          )}
          {rewardDiscount > 0 && selectedReward ? (
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Game Reward ({selectedReward.title})</Text>
              <Text style={styles.discountValue}>-${rewardDiscount.toFixed(2)}</Text>
            </View>
          ) : selectedReward?.kind === 'shipping' ? (
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Game Reward ({selectedReward.title})</Text>
              <Text style={styles.discountValue}>Applied</Text>
            </View>
          ) : null}
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Shipping</Text>
            <Text style={styles.summaryValue}>Free</Text>
          </View>
          <View style={styles.summaryRowDivider} />
        </>
      ) : null}

      <View style={styles.summaryRowTotal}>
        <Text style={styles.summaryLabelTotal}>Total Amount</Text>
        <Text style={styles.summaryValueTotal}>${finalTotal.toFixed(2)}</Text>
      </View>
      <Button
        mode="contained"
        onPress={openCheckout}
        disabled={selectedItems.length === 0}
        style={styles.checkoutButton}
        contentStyle={styles.buttonContent}
      >
        <Text style={styles.buttonText}>{selectedItems.length === 0 ? 'Select items to check out' : `Checkout (${selectedItems.length})`}</Text>
      </Button>
    </View>
  );

  return (
    <View style={styles.container}>
      <ScreenBackground />
      {isEmpty ? (
        <View style={styles.emptyState}>
          <MaterialCommunityIcons name="cart-outline" size={80} color={palette.mist} />
          <Text style={styles.emptyTitle}>Your Cart is Empty</Text>
          <Text style={styles.emptyText}>Add some products to get started</Text>
          <Button
            mode="contained"
            onPress={() => router.push('/(app)/(tabs)/home')}
            style={styles.browseButton}
            contentStyle={styles.buttonContent}
          >
            <Text style={styles.buttonText}>Continue Shopping</Text>
          </Button>
        </View>
      ) : (
        <View style={[styles.layout, isWide && styles.layoutWide]}>
          <FlatList
            style={styles.list}
            data={items}
            renderItem={renderItem}
            keyExtractor={(item) => item.productId.toString()}
            contentContainerStyle={[styles.listContent, !isWide && styles.listContentPhone]}
            ItemSeparatorComponent={() => <View style={styles.separator} />}
            ListHeaderComponent={header}
          />
          {summary}
        </View>
      )}

      {/* Dialogs are used instead of Alert.alert because Alert buttons do nothing on web */}
      <Portal>
        {/* Remove confirmation */}
        <AppDialog
          visible={!!removeTarget}
          onDismiss={() => setRemoveTarget(null)}
          icon="trash-can-outline"
          eyebrow="Your cart"
          title="Remove item?"
          subtitle="This will take it out of your cart. You can always add it again."
          tone="danger"
          scroll={false}
          actions={[
            { label: 'Keep it', onPress: () => setRemoveTarget(null) },
            { label: 'Remove', tone: 'danger', icon: 'trash-can-outline', onPress: confirmRemove },
          ]}
        >
          {removeTarget ? (
            <DialogRow
              image={removeTarget.thumbnail}
              title={removeTarget.title}
              subtitle={`Qty ${removeTarget.quantity}`}
              meta={`$${(removeTarget.price * (1 - removeTarget.discountPercentage / 100)).toFixed(2)} each`}
            />
          ) : null}
        </AppDialog>

        {/* Checkout form / order confirmation */}
        <AppDialog
          visible={checkoutOpen}
          onDismiss={submitting ? undefined : closeCheckout}
          dismissable={!submitting}
          icon={order ? 'check-decagram' : 'credit-card-check-outline'}
          eyebrow={order ? 'Thank you' : 'Secure checkout'}
          title={order ? 'Order placed' : 'Checkout'}
          subtitle={
            order
              ? `Order #${order.id} is confirmed`
              : `${totalQuantity} ${totalQuantity === 1 ? 'item' : 'items'} · $${finalTotal.toFixed(2)} total`
          }
          scroll={!order}
          actions={
            order
              ? [{ label: 'Continue shopping', icon: 'shopping-outline', onPress: closeCheckout }]
              : [
                  { label: 'Cancel', onPress: closeCheckout, disabled: submitting },
                  { label: 'Place order', icon: 'lock-outline', onPress: handleCheckout, loading: submitting, disabled: submitting },
                ]
          }
        >
          {order ? (
            <View style={styles.confirmWrap}>
              <View style={styles.confirmBadge}>
                <MaterialCommunityIcons name="check-bold" size={36} color={palette.forest} />
              </View>
              <Text style={styles.confirmTitle}>We&rsquo;re getting it ready</Text>
              <Text style={styles.confirmSub}>
                {order.quantity} {order.quantity === 1 ? 'item' : 'items'} · ${order.total.toFixed(2)}
              </Text>

              <View style={styles.confirmCard}>
                <View style={styles.confirmRow}>
                  <Text style={styles.confirmLabel}>Order</Text>
                  <Text style={styles.confirmValue}>#{order.id}</Text>
                </View>
                <View style={styles.confirmRow}>
                  <Text style={styles.confirmLabel}>Payment</Text>
                  <Text style={styles.confirmValue}>{PAYMENT_LABELS[order.payment]}</Text>
                </View>
                <View style={styles.confirmRow}>
                  <Text style={styles.confirmLabel}>Deliver to</Text>
                  <Text style={styles.confirmValue} numberOfLines={1}>{order.name}</Text>
                </View>
                <View style={styles.confirmRow}>
                  <Text style={styles.confirmLabel}>Address</Text>
                  <Text style={styles.confirmValue} numberOfLines={2}>{order.address}</Text>
                </View>
              </View>

              <Text style={styles.confirmNote}>Track this order any time in Profile → My orders.</Text>
            </View>
          ) : (
            <>
              <View style={styles.checkoutSummary}>
                <Text style={styles.checkoutSummaryLabel}>TOTAL DUE</Text>
                <Text style={styles.checkoutTotal}>${finalTotal.toFixed(2)}</Text>
                <Text style={styles.checkoutMeta}>
                  {totalQuantity} {totalQuantity === 1 ? 'item' : 'items'} · {selectedItems.length} products · free shipping
                </Text>
              </View>

              <DialogSectionLabel>Delivery details</DialogSectionLabel>
              <TextInput
                mode="outlined"
                label="Full name"
                value={name}
                onChangeText={setName}
                error={!!errors.name}
                style={styles.checkoutField}
                outlineStyle={styles.checkoutOutline}
                left={<TextInput.Icon icon="account-outline" />}
              />
              <HelperText type="error" visible={!!errors.name}>{errors.name}</HelperText>
              <TextInput
                mode="outlined"
                label="Delivery address"
                value={address}
                onChangeText={setAddress}
                multiline
                error={!!errors.address}
                style={styles.checkoutField}
                outlineStyle={styles.checkoutOutline}
                left={<TextInput.Icon icon="map-marker-outline" />}
              />
              <HelperText type="error" visible={!!errors.address}>{errors.address}</HelperText>
              <TextInput
                mode="outlined"
                label="Phone number"
                value={phone}
                onChangeText={setPhone}
                keyboardType="phone-pad"
                error={!!errors.phone}
                style={styles.checkoutField}
                outlineStyle={styles.checkoutOutline}
                left={<TextInput.Icon icon="phone-outline" />}
              />
              <HelperText type="error" visible={!!errors.phone}>{errors.phone}</HelperText>

              <DialogSectionLabel>Payment method</DialogSectionLabel>
              <View style={styles.payList}>
                {PAYMENT_OPTIONS.map((option) => {
                  const selected = payment === option.key;
                  return (
                    <Pressable
                      key={option.key}
                      style={[styles.payOption, selected && styles.payOptionActive]}
                      onPress={() => setPayment(option.key)}
                      accessibilityRole="radio"
                      accessibilityState={{ checked: selected }}
                      accessibilityLabel={`${option.title}, ${option.subtitle}`}
                    >
                      <View style={[styles.payIcon, selected && styles.payIconActive]}>
                        <MaterialCommunityIcons
                          name={option.icon}
                          size={20}
                          color={selected ? palette.surface : palette.forest}
                        />
                      </View>
                      <View style={styles.payText}>
                        <Text style={[styles.payTitle, selected && styles.payTitleActive]}>{option.title}</Text>
                        <Text style={styles.paySub}>{option.subtitle}</Text>
                      </View>
                      <MaterialCommunityIcons
                        name={selected ? 'radiobox-marked' : 'radiobox-blank'}
                        size={20}
                        color={selected ? palette.forest : palette.mist}
                      />
                    </Pressable>
                  );
                })}
              </View>

              <View style={styles.secureNote}>
                <MaterialCommunityIcons name="shield-lock-outline" size={16} color={palette.forest} />
                <Text style={styles.secureNoteText}>
                  Payments are encrypted. This demo never stores full card numbers or security codes.
                </Text>
              </View>
            </>
          )}
        </AppDialog>

        <LuckySpinWheel
          visible={spinOpen}
          title="Spin Your Cart!"
          items={items.map((i) => ({ id: i.productId, label: i.title, image: i.thumbnail, subtitle: `$${(i.price * (1 - i.discountPercentage / 100)).toFixed(2)}` }))}
          onClose={() => setSpinOpen(false)}
          actionLabel="Add to checkout?"
          onAction={(picked) => {
            setUnchecked((prev) => prev.filter((id) => id !== picked.id));
            setSnack(`${picked.label} added to checkout`);
          }}
        />

        <Snackbar visible={!!snack} onDismiss={() => setSnack(null)} duration={3000}>
          {snack}
        </Snackbar>
      </Portal>
    </View>
  );
}