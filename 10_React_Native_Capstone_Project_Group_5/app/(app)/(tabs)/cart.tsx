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
import { View, Text, FlatList, ActivityIndicator, Image, ScrollView, Pressable } from 'react-native';
import { useRouter } from 'expo-router';
import {
  Button,
  TextInput,
  Dialog,
  Portal,
  HelperText,
  Snackbar,
} from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useAuth } from '@/context/AuthContext';
import { useCart } from '@/context/CartContext';
import { productApi } from '@/services/productApi';
import { ScreenBackground } from '@/components/ScreenBackground';
import { loadAddresses, formatAddress } from '@/services/addresses';
import { CartItem } from '@/types/product';
import { palette, useResponsive } from '@/constants/theme';
import { styles } from './cartStyles';

interface CheckoutErrors {
  name?: string;
  address?: string;
  phone?: string;
}

interface OrderResult {
  id: number;
  total: number;
  quantity: number;
}

export default function CartScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const { isWide } = useResponsive();
  const {
    items,
    isLoading,
    totalQuantity,
    total,
    discountedTotal,
    couponCode,
    couponDiscount,
    finalTotal,
    updateQuantity,
    removeItem,
    clearCart,
    applyCoupon,
    removeCoupon,
  } = useCart();

  const [removeTarget, setRemoveTarget] = useState<CartItem | null>(null);
  const [couponInput, setCouponInput] = useState('');
  const [snack, setSnack] = useState<string | null>(null);

  // Checkout form state
  const [checkoutOpen, setCheckoutOpen] = useState(false);
  const [name, setName] = useState('');
  const [address, setAddress] = useState('');
  const [phone, setPhone] = useState('');
  const [errors, setErrors] = useState<CheckoutErrors>({});
  const [submitting, setSubmitting] = useState(false);
  const [order, setOrder] = useState<OrderResult | null>(null);

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
    if (items.length === 0) return;
    setName(user ? `${user.firstName} ${user.lastName}` : '');
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
    if (items.length === 0) return;
    if (!validate()) return;

    setSubmitting(true);
    try {
      // Done: POST /carts/add with userId and products
      const created = await productApi.addCart({
        userId: user?.id ?? 1,
        products: items.map((i) => ({ id: i.productId, quantity: i.quantity })),
      });
      // Done: clear local cart on success, then show the confirmation state
      setOrder({ id: created.id, total: finalTotal, quantity: totalQuantity });
      clearCart();
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
    return (
      <View style={styles.cartItem}>
        <Image source={{ uri: item.thumbnail }} style={styles.itemImage} resizeMode="contain" />
        <View style={styles.itemInfo}>
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
    <View style={styles.header}>
      <Pressable style={styles.backButton} onPress={goBack} accessibilityLabel="Go back">
        <MaterialCommunityIcons name="arrow-left" size={22} color={palette.ink} />
      </Pressable>
      <Text style={styles.headerTitle}>My Cart</Text>
      <Text style={styles.headerCount}>{totalQuantity} items</Text>
    </View>
  );

  // Order Summary
  const summary = (
    <View style={isWide ? styles.summaryWide : styles.summaryContainer}>
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
      <View style={styles.summaryRow}>
        <Text style={styles.summaryLabel}>Sub Total</Text>
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
      <View style={styles.summaryRow}>
        <Text style={styles.summaryLabel}>Shipping</Text>
        <Text style={styles.summaryValue}>Free</Text>
      </View>
      <View style={styles.summaryRowDivider} />
      <View style={styles.summaryRowTotal}>
        <Text style={styles.summaryLabelTotal}>Total Amount</Text>
        <Text style={styles.summaryValueTotal}>${finalTotal.toFixed(2)}</Text>
      </View>
      <Button
        mode="contained"
        onPress={openCheckout}
        style={styles.checkoutButton}
        contentStyle={styles.buttonContent}
      >
        <Text style={styles.buttonText}>Checkout</Text>
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
        <Dialog visible={!!removeTarget} onDismiss={() => setRemoveTarget(null)}>
          <Dialog.Title>Remove Item</Dialog.Title>
          <Dialog.Content>
            <Text>Remove {removeTarget?.title} from cart?</Text>
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={() => setRemoveTarget(null)}>Cancel</Button>
            <Button textColor={palette.danger} onPress={confirmRemove}>
              Remove
            </Button>
          </Dialog.Actions>
        </Dialog>

        {/* Checkout form / order confirmation */}
        <Dialog visible={checkoutOpen} onDismiss={submitting ? undefined : closeCheckout}>
          {order ? (
            <>
              <Dialog.Title>Order placed 🎉</Dialog.Title>
              <Dialog.Content>
                <Text>Order #{order.id} was placed successfully.</Text>
                <Text style={{ marginTop: 8 }}>
                  {order.quantity} items · Total ${order.total.toFixed(2)}
                </Text>
              </Dialog.Content>
              <Dialog.Actions>
                <Button onPress={closeCheckout}>Continue Shopping</Button>
              </Dialog.Actions>
            </>
          ) : (
            <>
              <Dialog.Title>Checkout</Dialog.Title>
              <Dialog.ScrollArea>
                <ScrollView keyboardShouldPersistTaps="handled" style={{ maxHeight: 360 }}>
                  <Text style={{ marginVertical: 8 }}>
                    Total: ${finalTotal.toFixed(2)} ({totalQuantity} items)
                  </Text>
                  <TextInput
                    mode="outlined"
                    label="Full name"
                    value={name}
                    onChangeText={setName}
                    error={!!errors.name}
                  />
                  <HelperText type="error" visible={!!errors.name}>{errors.name}</HelperText>
                  <TextInput
                    mode="outlined"
                    label="Delivery address"
                    value={address}
                    onChangeText={setAddress}
                    multiline
                    error={!!errors.address}
                  />
                  <HelperText type="error" visible={!!errors.address}>{errors.address}</HelperText>
                  <TextInput
                    mode="outlined"
                    label="Phone number"
                    value={phone}
                    onChangeText={setPhone}
                    keyboardType="phone-pad"
                    error={!!errors.phone}
                  />
                  <HelperText type="error" visible={!!errors.phone}>{errors.phone}</HelperText>
                </ScrollView>
              </Dialog.ScrollArea>
              <Dialog.Actions>
                <Button onPress={closeCheckout} disabled={submitting}>Cancel</Button>
                <Button onPress={handleCheckout} loading={submitting} disabled={submitting}>
                  Place Order
                </Button>
              </Dialog.Actions>
            </>
          )}
        </Dialog>

        <Snackbar visible={!!snack} onDismiss={() => setSnack(null)} duration={3000}>
          {snack}
        </Snackbar>
      </Portal>
    </View>
  );
}