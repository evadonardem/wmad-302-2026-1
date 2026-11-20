/**
 * Cart & Checkout Screen - Crimson Obsidian Dark Glassmorphism (2-Column Desktop Layout)
 */
import React, { useState } from 'react';
import { CrimsonAmbientBackdrop } from '@/components/CrimsonAmbientBackdrop';
import {
  View,
  Text,
  TouchableOpacity,
  Image,
  Modal,
  ScrollView,
  Alert,
  Platform,
  useWindowDimensions,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '@/context/AuthContext';
import { useCart, AVAILABLE_COUPONS } from '@/context/CartContext';
import { productApi } from '@/services/productApi';
import { CartItem, OrderRecord } from '@/types/product';
import { Title, Button, TextInput as PaperTextInput } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { CrimsonHeader } from '@/components/CrimsonHeader';
import { useDesignMode } from '@/context/DesignModeContext';
import { GLASS_PALETTE, glassSurface } from '@/constants/glassTheme';
import { styles } from './cartStyles';

const PAYMENT_METHODS = [
  'Cash on Delivery (COD)',
  'GCash / Maya E-Wallet',
  'Credit / Debit Card',
];

export default function CartScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const { width } = useWindowDimensions();
  const { isCrimson } = useDesignMode();
  const {
    items,
    couponCode,
    totals,
    updateQuantity,
    removeFromCart,
    applyCoupon,
    removeCoupon,
    clearCart,
    recordOrder,
  } = useCart();

  const [promoInput, setPromoInput] = useState('');
  const [promoFeedback, setPromoFeedback] = useState<{ ok: boolean; text: string } | null>(null);

  const [checkoutVisible, setCheckoutVisible] = useState(false);
  const [shippingAddress, setShippingAddress] = useState(
    '123 Session Road, Baguio City, Benguet 2600'
  );
  const [contactPhone, setContactPhone] = useState('0917-555-0199');
  const [paymentMethod, setPaymentMethod] = useState(PAYMENT_METHODS[0]);
  const [placingOrder, setPlacingOrder] = useState(false);
  const [confirmedOrder, setConfirmedOrder] = useState<OrderRecord | null>(null);

  const isDesktop = width >= 920;

  const handleApplyCoupon = () => {
    const res = applyCoupon(promoInput);
    setPromoFeedback({ ok: res.valid, text: res.message });
    if (res.valid) setPromoInput('');
  };

  const handleRemoveItem = (productId: number, title: string) => {
    if (Platform.OS === 'web') {
      if (window.confirm(`Remove "${title}" from cart?`)) {
        removeFromCart(productId);
      }
      return;
    }

    Alert.alert('Remove Item', `Remove "${title}" from cart?`, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Remove', style: 'destructive', onPress: () => removeFromCart(productId) },
    ]);
  };

  const handlePlaceOrder = async () => {
    if (!shippingAddress.trim()) {
      const msg = 'Please enter a valid delivery address.';
      if (Platform.OS === 'web') { window.alert(msg); } else { Alert.alert('Missing Address', msg); }
      return;
    }
    if (!contactPhone.trim()) {
      const msg = 'Please enter your contact phone number.';
      if (Platform.OS === 'web') { window.alert(msg); } else { Alert.alert('Missing Contact', msg); }
      return;
    }

    setPlacingOrder(true);
    try {
      const userId = user?.id || 1;
      const apiProducts = items.map((i) => ({ id: i.productId, quantity: i.quantity }));

      await productApi.createCartOrder(userId, apiProducts);

      const newOrder: OrderRecord = {
        id: Math.floor(10000 + Math.random() * 90000),
        userId,
        date: new Date().toISOString(),
        status: 'Processing',
        shippingAddress: shippingAddress.trim(),
        paymentMethod,
        couponCode: couponCode || undefined,
        items: items.map((item) => {
          const unitDiscounted = item.price * (1 - item.discountPercentage / 100);
          return {
            id: item.productId,
            title: item.title,
            price: item.price,
            quantity: item.quantity,
            total: item.price * item.quantity,
            discountPercentage: item.discountPercentage,
            discountedTotal: unitDiscounted * item.quantity,
            thumbnail: item.thumbnail,
          };
        }),
        total: totals.subtotal,
        discountedTotal: totals.finalTotal,
        totalProducts: totals.totalProducts,
        totalQuantity: totals.totalQuantity,
      };

      recordOrder(newOrder);
      clearCart();
      setCheckoutVisible(false);
      setConfirmedOrder(newOrder);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Checkout failed. Please try again.';
      if (Platform.OS === 'web') { window.alert(msg); } else { Alert.alert('Checkout Error', msg); }
    } finally {
      setPlacingOrder(false);
    }
  };

  const renderCartRow = (item: CartItem) => {
    const discountedPrice = item.price * (1 - item.discountPercentage / 100);
    return (
      <View key={item.productId} style={[styles.cartItem, { marginBottom: 10 }]}>
        <TouchableOpacity onPress={() => router.push(`/(app)/(tabs)/product/${item.productId}`)}>
          <Image source={{ uri: item.thumbnail }} style={styles.itemImage} resizeMode="contain" />
        </TouchableOpacity>

        <View style={styles.itemInfo}>
          <Text style={styles.itemTitle} numberOfLines={2}>
            {item.title}
          </Text>
          <View style={styles.itemPriceRow}>
            <Text style={styles.itemCurrentPrice}>₱{discountedPrice.toFixed(2)}</Text>
            {item.discountPercentage > 0 && (
              <Text style={styles.itemOriginalPrice}>₱{item.price.toFixed(2)}</Text>
            )}
          </View>
        </View>

        <View style={styles.quantityControls}>
          <TouchableOpacity
            onPress={() => updateQuantity(item.productId, item.quantity - 1)}
            disabled={item.quantity <= 1}
            style={{
              width: 30,
              height: 30,
              borderRadius: 8,
              backgroundColor: 'rgba(255,255,255,0.08)',
              borderWidth: 1,
              borderColor: 'rgba(255,255,255,0.16)',
              alignItems: 'center',
              justifyContent: 'center',
              opacity: item.quantity <= 1 ? 0.45 : 1,
            }}
          >
            <MaterialCommunityIcons name="minus" size={16} color="#FFFFFF" />
          </TouchableOpacity>

          <Text style={styles.quantityText}>{item.quantity}</Text>

          <TouchableOpacity
            onPress={() => updateQuantity(item.productId, item.quantity + 1)}
            style={{
              width: 30,
              height: 30,
              borderRadius: 8,
              backgroundColor: GLASS_PALETTE.crimson,
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <MaterialCommunityIcons name="plus" size={16} color="#FFFFFF" />
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => handleRemoveItem(item.productId, item.title)}
            style={{ padding: 6 }}
          >
            <MaterialCommunityIcons name="trash-can-outline" size={20} color="#94A3B8" />
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  if (confirmedOrder) {
    return (
      <View style={[styles.container, { backgroundColor: isCrimson ? '#09090D' : '#F4F6FA', backgroundImage: isCrimson ? undefined : 'radial-gradient(circle at 18% 15%, rgba(251,191,36,0.22), transparent 45%), radial-gradient(circle at 85% 25%, rgba(56,189,248,0.18), transparent 48%)' } as object]}>
      <CrimsonAmbientBackdrop />
      <CrimsonHeader />
        <View style={styles.emptyState}>
          <MaterialCommunityIcons name="check-decagram" size={72} color="#22C55E" />
          <Text style={styles.emptyTitle}>Order Confirmed! #{confirmedOrder.id}</Text>
          <Text style={styles.emptyText}>
            Total Paid: ₱{confirmedOrder.discountedTotal.toFixed(2)} · {confirmedOrder.paymentMethod}
          </Text>
          <View style={{ flexDirection: 'row', gap: 12, marginTop: 24 }}>
            <Button
              mode="contained"
              buttonColor="#E11D48"
              textColor="#FFFFFF"
              onPress={() => {
                setConfirmedOrder(null);
                router.push('/(app)/(tabs)/profile');
              }}
            >
              View Order History
            </Button>
            <Button
              mode="outlined"
              textColor="#F8FAFC"
              style={{ borderColor: 'rgba(255,255,255,0.25)' }}
              onPress={() => {
                setConfirmedOrder(null);
                router.push('/(app)/(tabs)/home');
              }}
            >
              Continue Shopping
            </Button>
          </View>
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: isCrimson ? '#09090D' : '#F4F6FA', backgroundImage: isCrimson ? undefined : 'radial-gradient(circle at 18% 15%, rgba(251,191,36,0.22), transparent 45%), radial-gradient(circle at 85% 25%, rgba(56,189,248,0.18), transparent 48%)' } as object]}>
      <CrimsonHeader />

      {items.length === 0 ? (
        <View style={styles.emptyState}>
          <MaterialCommunityIcons name="cart-off" size={80} color="#64748B" />
          <Text style={styles.emptyTitle}>Your Cart is Empty</Text>
          <Text style={styles.emptyText}>Add products from the marketplace to get started</Text>
          <Button
            mode="contained"
            buttonColor="#E11D48"
            textColor="#FFFFFF"
            onPress={() => router.push('/(app)/(tabs)/home')}
            style={styles.browseButton}
            contentStyle={styles.buttonContent}
          >
            <Text style={styles.buttonText}>Continue Shopping</Text>
          </Button>
        </View>
      ) : (
        <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 110 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 16 }}>
            <MaterialCommunityIcons name="cart-outline" size={24} color="#E11D48" />
            <Title style={styles.headerTitle}>
              Shopping Cart ({totals.totalQuantity} items)
            </Title>
          </View>

          <View
            style={{
              flexDirection: isDesktop ? 'row' : 'column',
              alignItems: 'flex-start',
              gap: 18,
            }}
          >
            {/* Left Column: Cart Item Rows */}
            <View style={{ flex: isDesktop ? 1.85 : undefined, width: '100%' }}>
              {items.map(renderCartRow)}

              <TouchableOpacity
                onPress={() => router.push('/(app)/(tabs)/home')}
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: 6,
                  marginTop: 8,
                  paddingVertical: 8,
                }}
              >
                <MaterialCommunityIcons name="arrow-left" size={18} color="#FF1E42" />
                <Text style={{ color: '#FF1E42', fontSize: 14, fontWeight: '700' }}>
                  Continue Shopping
                </Text>
              </TouchableOpacity>
            </View>

            {/* Right Column: Promo Voucher & Order Summary Panel */}
            <View
              style={[
                glassSurface(0.84, 18, true),
                {
                  flex: isDesktop ? 1 : undefined,
                  width: '100%',
                  padding: 18,
                },
              ]}
            >
              <Text style={{ fontSize: 14, fontWeight: '800', color: '#FFFFFF', marginBottom: 10 }}>
                Promo Voucher
              </Text>

              {couponCode ? (
                <View
                  style={{
                    flexDirection: 'row',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    backgroundColor: 'rgba(225, 29, 72, 0.2)',
                    borderWidth: 1,
                    borderColor: GLASS_PALETTE.crimsonBorder,
                    paddingHorizontal: 12,
                    paddingVertical: 9,
                    borderRadius: 10,
                    marginBottom: 14,
                  }}
                >
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                    <View
                      style={{
                        backgroundColor: GLASS_PALETTE.crimson,
                        paddingHorizontal: 8,
                        paddingVertical: 3,
                        borderRadius: 6,
                      }}
                    >
                      <Text style={{ fontSize: 12, fontWeight: '800', color: '#FFFFFF' }}>
                        {couponCode}
                      </Text>
                    </View>
                    <Text style={{ fontSize: 12, fontWeight: '700', color: '#CBD5E1' }}>
                      {AVAILABLE_COUPONS[couponCode]?.label}
                    </Text>
                  </View>
                  <TouchableOpacity onPress={removeCoupon}>
                    <MaterialCommunityIcons name="close-circle" size={20} color="#FF1E42" />
                  </TouchableOpacity>
                </View>
              ) : (
                <View style={{ marginBottom: 14 }}>
                  <Text style={{ fontSize: 12, color: '#94A3B8', marginBottom: 8 }}>
                    Try: SAVE10, WELCOME20, DEAL15
                  </Text>
                  <View style={{ flexDirection: 'row', gap: 8, alignItems: 'center' }}>
                    <PaperTextInput
                      mode="outlined"
                      outlineColor="rgba(255,255,255,0.2)"
                      activeOutlineColor="#E11D48"
                      textColor="#FFFFFF"
                      placeholderTextColor="#94A3B8"
                      placeholder="Enter voucher code"
                      value={promoInput}
                      onChangeText={setPromoInput}
                      autoCapitalize="characters"
                      dense
                      style={{ flex: 1, backgroundColor: 'rgba(12, 12, 18, 0.85)' }}
                    />
                    <Button
                      mode="contained"
                      buttonColor="#E11D48"
                      textColor="#FFFFFF"
                      onPress={handleApplyCoupon}
                    >
                      Apply
                    </Button>
                  </View>
                </View>
              )}

              {promoFeedback && (
                <Text
                  style={{
                    fontSize: 12,
                    marginBottom: 10,
                    color: promoFeedback.ok ? '#22C55E' : '#FF1E42',
                  }}
                >
                  {promoFeedback.text}
                </Text>
              )}

              <View style={styles.summaryRowDivider} />

              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Subtotal</Text>
                <Text style={styles.summaryValue}>₱{totals.subtotal.toFixed(2)}</Text>
              </View>
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Shipping Fee</Text>
                <Text style={styles.summaryValue}>₱0.00</Text>
              </View>
              {totals.productDiscount > 0 && (
                <View style={styles.summaryRow}>
                  <Text style={styles.summaryLabel}>Product Discounts</Text>
                  <Text style={styles.discountValue}>-₱{totals.productDiscount.toFixed(2)}</Text>
                </View>
              )}
              {totals.couponDiscount > 0 && (
                <View style={styles.summaryRow}>
                  <Text style={styles.summaryLabel}>Voucher ({couponCode})</Text>
                  <Text style={styles.discountValue}>-₱{totals.couponDiscount.toFixed(2)}</Text>
                </View>
              )}

              <View style={styles.summaryRowDivider} />

              <View style={styles.summaryRowTotal}>
                <Text style={styles.summaryLabelTotal}>Total</Text>
                <Text style={styles.summaryValueTotal}>₱{totals.finalTotal.toFixed(2)}</Text>
              </View>

              <Button
                mode="contained"
                buttonColor="#E11D48"
                textColor="#FFFFFF"
                onPress={() => setCheckoutVisible(true)}
                style={styles.checkoutButton}
                contentStyle={styles.buttonContent}
              >
                <Text style={styles.buttonText}>Proceed to Checkout →</Text>
              </Button>
            </View>
          </View>
        </ScrollView>
      )}

      {/* Dark Glass Checkout Modal */}
      <Modal
        visible={checkoutVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setCheckoutVisible(false)}
      >
        <View
          style={{
            flex: 1,
            backgroundColor: 'rgba(0,0,0,0.75)',
            justifyContent: 'center',
            padding: 16,
          }}
        >
          <ScrollView
            contentContainerStyle={[
              glassSurface(0.95, 20, true),
              { padding: 20, maxWidth: 520, width: '100%', alignSelf: 'center' },
            ]}
          >
            <View
              style={{
                flexDirection: 'row',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: 14,
              }}
            >
              <Text style={{ fontSize: 18, fontWeight: '800', color: '#FFFFFF' }}>
                Checkout &amp; Delivery
              </Text>
              <TouchableOpacity onPress={() => setCheckoutVisible(false)}>
                <MaterialCommunityIcons name="close" size={24} color="#CBD5E1" />
              </TouchableOpacity>
            </View>

            <PaperTextInput
              label="Shipping Address"
              mode="outlined"
              outlineColor="rgba(255,255,255,0.2)"
              activeOutlineColor="#E11D48"
              textColor="#FFFFFF"
              value={shippingAddress}
              onChangeText={setShippingAddress}
              multiline
              style={{ marginBottom: 12, backgroundColor: 'rgba(12, 12, 18, 0.9)' }}
            />

            <PaperTextInput
              label="Contact Phone"
              mode="outlined"
              outlineColor="rgba(255,255,255,0.2)"
              activeOutlineColor="#E11D48"
              textColor="#FFFFFF"
              value={contactPhone}
              onChangeText={setContactPhone}
              keyboardType="phone-pad"
              style={{ marginBottom: 14, backgroundColor: 'rgba(12, 12, 18, 0.9)' }}
            />

            <Text style={{ fontSize: 13, fontWeight: '700', color: '#FFFFFF', marginBottom: 8 }}>
              Payment Method
            </Text>
            <View style={{ gap: 8, marginBottom: 16 }}>
              {PAYMENT_METHODS.map((method) => {
                const selected = paymentMethod === method;
                return (
                  <TouchableOpacity
                    key={method}
                    onPress={() => setPaymentMethod(method)}
                    style={{
                      flexDirection: 'row',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: 12,
                      borderRadius: 10,
                      borderWidth: 1.5,
                      borderColor: selected ? '#E11D48' : 'rgba(255,255,255,0.16)',
                      backgroundColor: selected
                        ? 'rgba(225, 29, 72, 0.2)'
                        : 'rgba(12, 12, 18, 0.85)',
                    }}
                  >
                    <Text
                      style={{
                        fontSize: 13,
                        fontWeight: '600',
                        color: selected ? '#FFFFFF' : '#CBD5E1',
                      }}
                    >
                      {method}
                    </Text>
                    <MaterialCommunityIcons
                      name={selected ? 'radiobox-marked' : 'radiobox-blank'}
                      size={20}
                      color={selected ? '#E11D48' : '#64748B'}
                    />
                  </TouchableOpacity>
                );
              })}
            </View>

            <View
              style={{
                backgroundColor: 'rgba(225, 29, 72, 0.16)',
                borderWidth: 1,
                borderColor: GLASS_PALETTE.crimsonBorder,
                padding: 12,
                borderRadius: 10,
                marginBottom: 16,
                flexDirection: 'row',
                justifyContent: 'space-between',
              }}
            >
              <Text style={{ fontSize: 14, fontWeight: '700', color: '#FFFFFF' }}>
                Order Total ({totals.totalQuantity} items)
              </Text>
              <Text style={{ fontSize: 16, fontWeight: '900', color: '#FF1E42' }}>
                ₱{totals.finalTotal.toFixed(2)}
              </Text>
            </View>

            <Button
              mode="contained"
              buttonColor="#E11D48"
              textColor="#FFFFFF"
              loading={placingOrder}
              disabled={placingOrder}
              onPress={handlePlaceOrder}
              style={{ borderRadius: 10 }}
              contentStyle={{ height: 48 }}
            >
              Place Order · ₱{totals.finalTotal.toFixed(2)}
            </Button>
          </ScrollView>
        </View>
      </Modal>
    </View>
  );
}