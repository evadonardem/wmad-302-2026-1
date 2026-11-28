/**
 * Checkout Screen
 * Shipping form (validated), payment selection, optional gift wrapping, order
 * summary and order placement via POST /carts/add, followed by a confirmation
 * state with confetti and an "order placed" notification.
 */
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, Text, View } from 'react-native';
import { useFocusEffect, useRouter } from 'expo-router';
import { Button, Card, Chip, Divider, HelperText, RadioButton, Switch, TextInput } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useAuth } from '@/context/AuthContext';
import { useCart } from '@/context/CartContext';
import { useSettings } from '@/context/SettingsContext';
import { useAsyncStorage, useThemedStyles } from '@/hooks';
import { EmptyState } from '@/components/CommonComponents';
import { LivelyBackground } from '@/components/LivelyBackground';
import { Confetti } from '@/components/Confetti';
import { placeOrder } from '@/services/orderService';
import { notifyOrderPlaced } from '@/services/notifications';
import { STORAGE_KEYS } from '@/utils/storage';
import { calculateCartTotals, GIFT_WRAP_FEE } from '@/utils/cart';
import { DELIVERY_SLOTS, formatDeliveryDay, getDeliveryDates } from '@/utils/delivery';
import { confirmWithBiometrics } from '@/services/biometrics';
import { formatPrice } from '@/utils/format';
import { getErrorMessage } from '@/utils/errors';
import { ShippingErrors, hasErrors, validateShipping } from '@/utils/validation';
import type { Address, Order, PaymentMethod, ShippingDetails } from '@/types/account';
import { makeCommon } from '@/styles/common';
import { makeCheckoutStyles } from '@/styles/checkout';

const COD_ID = 'cod';

const EMPTY_SHIPPING: ShippingDetails = { fullName: '', phone: '', street: '', city: '', postalCode: '' };

function addressToShipping(address: Address): ShippingDetails {
  const { fullName, phone, street, city, postalCode } = address;
  return { fullName, phone, street, city, postalCode };
}

export default function CheckoutScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const { items, couponCode, clearCart } = useCart();
  const { palette, isHoliday, settings, t } = useSettings();
  const common = useThemedStyles(makeCommon);
  const styles = useThemedStyles(makeCheckoutStyles);
  const [addresses, , addressesLoading, reloadAddresses] = useAsyncStorage<Address[]>(STORAGE_KEYS.ADDRESSES, []);
  const [paymentMethods, , paymentsLoading, reloadPayments] = useAsyncStorage<PaymentMethod[]>(
    STORAGE_KEYS.PAYMENT_METHODS,
    []
  );
  const prefilledRef = useRef(false);
  const paymentPrefilledRef = useRef(false);

  const [shipping, setShipping] = useState<ShippingDetails>(EMPTY_SHIPPING);
  const [selectedAddressId, setSelectedAddressId] = useState<string | null>(null);
  const [paymentId, setPaymentId] = useState<string>(COD_ID);
  const [giftWrap, setGiftWrap] = useState(false);
  const [giftMessage, setGiftMessage] = useState('');
  const [errors, setErrors] = useState<ShippingErrors>({});
  const [submitted, setSubmitted] = useState(false);
  const [placing, setPlacing] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [placedOrder, setPlacedOrder] = useState<Order | null>(null);
  const deliveryDates = useMemo(() => getDeliveryDates(), []);
  const [deliveryDate, setDeliveryDate] = useState(() => deliveryDates[0].toISOString());
  const [deliverySlot, setDeliverySlot] = useState<string>(DELIVERY_SLOTS[0]);

  const totals = useMemo(() => calculateCartTotals(items, couponCode, giftWrap), [items, couponCode, giftWrap]);
  const confettiColors = useMemo(
    () => [palette.primary, ...palette.accents, palette.gold],
    [palette]
  );

  // Pick up addresses / payment methods added on their screens while checkout was open
  useFocusEffect(
    useCallback(() => {
      reloadAddresses();
      reloadPayments();
    }, [reloadAddresses, reloadPayments])
  );

  // Prefill from the default address (or the user's name) once storage has loaded
  useEffect(() => {
    if (addressesLoading || prefilledRef.current) return;
    prefilledRef.current = true;
    const preferred = addresses.find((a) => a.isDefault) ?? addresses[0];
    if (preferred) {
      setShipping(addressToShipping(preferred));
      setSelectedAddressId(preferred.id);
    } else if (user) {
      setShipping((prev) => ({
        ...prev,
        fullName: prev.fullName || `${user.firstName} ${user.lastName}`,
        phone: prev.phone || user.phone || '',
      }));
    }
  }, [addressesLoading, addresses, user]);

  useEffect(() => {
    if (paymentsLoading || paymentPrefilledRef.current) return;
    paymentPrefilledRef.current = true;
    const preferred = paymentMethods.find((p) => p.isDefault);
    if (preferred) setPaymentId(preferred.id);
  }, [paymentsLoading, paymentMethods]);

  const paymentLabel = useMemo(
    () =>
      paymentId === COD_ID
        ? 'Cash on Delivery'
        : (paymentMethods.find((p) => p.id === paymentId)?.label ?? 'Cash on Delivery'),
    [paymentId, paymentMethods]
  );

  const updateField = (field: keyof ShippingDetails, value: string) => {
    const next = { ...shipping, [field]: value };
    setShipping(next);
    setSelectedAddressId(null);
    if (submitted) setErrors(validateShipping(next));
  };

  const selectAddress = (address: Address) => {
    const next = addressToShipping(address);
    setShipping(next);
    setSelectedAddressId(address.id);
    if (submitted) setErrors(validateShipping(next));
  };

  const handlePlaceOrder = async () => {
    if (!user) return;
    setSubmitted(true);
    const validation = validateShipping(shipping);
    setErrors(validation);
    if (hasErrors(validation)) return;

    if (settings.biometricCheckout && !(await confirmWithBiometrics(t('checkout.biometricPrompt')))) {
      setSubmitError(t('checkout.biometricFailed'));
      return;
    }

    setPlacing(true);
    setSubmitError(null);
    try {
      const order = await placeOrder({
        userId: user.id,
        items,
        couponCode,
        shipping: {
          fullName: shipping.fullName.trim(),
          phone: shipping.phone.trim(),
          street: shipping.street.trim(),
          city: shipping.city.trim(),
          postalCode: shipping.postalCode.trim(),
        },
        paymentLabel,
        giftWrap,
        giftMessage,
        deliveryDate,
        deliverySlot,
      });
      setPlacedOrder(order);
      clearCart();
      if (settings.orderNotifications) {
        notifyOrderPlaced(order, isHoliday).catch(() => undefined);
      }
    } catch (err) {
      setSubmitError(getErrorMessage(err, 'Could not place your order. Please try again.'));
    } finally {
      setPlacing(false);
    }
  };

  // Confirmation state
  if (placedOrder) {
    return (
      <View style={common.screen}>
        <LivelyBackground />
        <ScrollView contentContainerStyle={styles.confirmation}>
          <View style={styles.successIcon}>
            <MaterialCommunityIcons name={isHoliday ? 'gift' : 'check-bold'} size={48} color="#FFFFFF" />
          </View>
          <Text style={styles.successTitle}>{isHoliday ? 'Ho ho ho! Order Placed! 🎄' : 'Order Placed!'}</Text>
          <Text style={styles.successText}>
            Thank you for your purchase. Your order #{placedOrder.cartId} is being processed.
          </Text>
          <Card style={[common.card, styles.confirmationCard]}>
            <Card.Content>
              <View style={common.summaryRow}>
                <Text style={common.summaryLabel}>Items</Text>
                <Text style={common.summaryValue}>{placedOrder.totalQuantity}</Text>
              </View>
              <View style={common.summaryRow}>
                <Text style={common.summaryLabel}>Payment</Text>
                <Text style={common.summaryValue}>{placedOrder.paymentLabel}</Text>
              </View>
              {placedOrder.giftWrap && (
                <View style={common.summaryRow}>
                  <Text style={common.summaryLabel}>Gift wrap</Text>
                  <Text style={common.summaryValue}>🎁 Yes</Text>
                </View>
              )}
              {placedOrder.deliveryDate && (
                <View style={common.summaryRow}>
                  <Text style={common.summaryLabel}>{t('checkout.delivery')}</Text>
                  <Text style={common.summaryValue}>
                    {formatDeliveryDay(placedOrder.deliveryDate)} · {placedOrder.deliverySlot}
                  </Text>
                </View>
              )}
              <View style={common.summaryRow}>
                <Text style={common.summaryLabel}>Deliver to</Text>
                <Text style={[common.summaryValue, styles.deliverTo]} numberOfLines={2}>
                  {placedOrder.shipping?.street}, {placedOrder.shipping?.city}
                </Text>
              </View>
              <Divider style={common.divider} />
              <View style={common.rowBetween}>
                <Text style={common.summaryTotalLabel}>Total Paid</Text>
                <Text style={common.summaryTotalValue}>{formatPrice(placedOrder.grandTotal)}</Text>
              </View>
            </Card.Content>
          </Card>
          <Button
            mode="contained"
            style={styles.fullButton}
            contentStyle={common.buttonContent}
            onPress={() => router.replace(`/orders/${placedOrder.id}`)}
          >
            View Order
          </Button>
          <Button mode="text" style={styles.fullButton} onPress={() => router.replace('/home')}>
            {t('cart.continue')}
          </Button>
        </ScrollView>
        <Confetti colors={confettiColors} />
      </View>
    );
  }

  if (items.length === 0) {
    return (
      <EmptyState
        icon="cart-off"
        title="Nothing to check out"
        message="Your cart is empty."
        actionLabel={t('cart.continue')}
        onAction={() => router.replace('/home')}
      />
    );
  }

  const renderField = (
    field: keyof ShippingDetails,
    label: string,
    props: Partial<React.ComponentProps<typeof TextInput>> = {}
  ) => (
    <View>
      <TextInput
        mode="outlined"
        label={label}
        value={shipping[field]}
        onChangeText={(v) => updateField(field, v)}
        error={!!errors[field]}
        style={common.input}
        disabled={placing}
        {...props}
      />
      <HelperText type="error" visible={!!errors[field]}>
        {errors[field] ?? ' '}
      </HelperText>
    </View>
  );

  return (
    <KeyboardAvoidingView
      style={common.screen}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
    >
      <ScrollView contentContainerStyle={common.scrollContent} keyboardShouldPersistTaps="handled">
        {/* Shipping */}
        <Card style={common.card} elevation={1}>
          <Card.Content>
            <Text style={common.sectionTitle}>Shipping Address</Text>
            {addresses.length > 0 && (
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.addressChips}>
                {addresses.map((address) => (
                  <Chip
                    key={address.id}
                    selected={selectedAddressId === address.id}
                    onPress={() => selectAddress(address)}
                    icon="map-marker"
                  >
                    {address.label}
                  </Chip>
                ))}
              </ScrollView>
            )}
            {renderField('fullName', 'Full Name', { autoComplete: 'name' })}
            {renderField('phone', 'Phone', { keyboardType: 'phone-pad', autoComplete: 'tel' })}
            {renderField('street', 'Street Address', { autoComplete: 'street-address' })}
            <View style={styles.row}>
              <View style={styles.flex}>{renderField('city', 'City')}</View>
              <View style={styles.flex}>
                {renderField('postalCode', 'Postal Code', { keyboardType: 'number-pad', autoComplete: 'postal-code' })}
              </View>
            </View>
            <Button compact mode="text" icon="map-marker-plus" onPress={() => router.push('/addresses')}>
              Manage addresses
            </Button>
          </Card.Content>
        </Card>

        {/* Delivery day and time slot */}
        <Card style={common.card} elevation={1}>
          <Card.Content>
            <Text style={common.sectionTitle}>🚚 {t('checkout.delivery')}</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.addressChips}>
              {deliveryDates.map((date) => {
                const iso = date.toISOString();
                return (
                  <Chip key={iso} selected={deliveryDate === iso} onPress={() => setDeliveryDate(iso)} icon="calendar">
                    {formatDeliveryDay(date)}
                  </Chip>
                );
              })}
            </ScrollView>
            <View style={styles.slotGrid}>
              {DELIVERY_SLOTS.map((slot) => (
                <Chip key={slot} selected={deliverySlot === slot} onPress={() => setDeliverySlot(slot)} icon="clock-outline">
                  {slot}
                </Chip>
              ))}
            </View>
          </Card.Content>
        </Card>

        {/* Payment */}
        <Card style={common.card} elevation={1}>
          <Card.Content>
            <Text style={common.sectionTitle}>Payment Method</Text>
            <RadioButton.Group value={paymentId} onValueChange={setPaymentId}>
              <RadioButton.Item label="Cash on Delivery" value={COD_ID} mode="android" style={styles.radio} />
              {paymentMethods.map((method) => (
                <RadioButton.Item
                  key={method.id}
                  label={method.label}
                  value={method.id}
                  mode="android"
                  style={styles.radio}
                />
              ))}
            </RadioButton.Group>
            <Button compact mode="text" icon="credit-card-plus" onPress={() => router.push('/payment-methods')}>
              Add payment method
            </Button>
          </Card.Content>
        </Card>

        {/* Gift wrapping */}
        <Card style={common.card} elevation={1}>
          <Card.Content>
            <View style={styles.giftRow}>
              <Text style={styles.giftLabel}>🎁 Gift wrap this order (+{formatPrice(GIFT_WRAP_FEE)})</Text>
              <Switch value={giftWrap} onValueChange={setGiftWrap} accessibilityLabel="Gift wrap" />
            </View>
            {giftWrap && (
              <TextInput
                mode="outlined"
                label="Gift message (optional)"
                value={giftMessage}
                onChangeText={setGiftMessage}
                multiline
                maxLength={150}
                style={styles.giftInput}
                placeholder={isHoliday ? 'Merry Christmas! 🎄' : 'Enjoy your gift!'}
              />
            )}
          </Card.Content>
        </Card>

        {/* Summary */}
        <Card style={common.card} elevation={1}>
          <Card.Content>
            <Text style={common.sectionTitle}>Order Summary</Text>
            {items.map((item) => (
              <View key={item.productId} style={common.summaryRow}>
                <Text style={[common.summaryLabel, styles.flex]} numberOfLines={1}>
                  {item.quantity} × {item.title}
                </Text>
              </View>
            ))}
            <Divider style={common.divider} />
            <View style={common.summaryRow}>
              <Text style={common.summaryLabel}>Subtotal</Text>
              <Text style={common.summaryValue}>{formatPrice(totals.subtotal)}</Text>
            </View>
            {totals.productDiscount > 0 && (
              <View style={common.summaryRow}>
                <Text style={common.summaryLabel}>{t('cart.productDiscounts')}</Text>
                <Text style={common.summaryDiscount}>-{formatPrice(totals.productDiscount)}</Text>
              </View>
            )}
            {totals.couponDiscount > 0 && (
              <View style={common.summaryRow}>
                <Text style={common.summaryLabel}>Coupon ({couponCode})</Text>
                <Text style={common.summaryDiscount}>-{formatPrice(totals.couponDiscount)}</Text>
              </View>
            )}
            <View style={common.summaryRow}>
              <Text style={common.summaryLabel}>{t('cart.shipping')}</Text>
              <Text style={common.summaryValue}>
                {totals.shippingFee === 0 ? t('cart.free') : formatPrice(totals.shippingFee)}
              </Text>
            </View>
            {totals.giftWrapFee > 0 && (
              <View style={common.summaryRow}>
                <Text style={common.summaryLabel}>Gift wrap</Text>
                <Text style={common.summaryValue}>{formatPrice(totals.giftWrapFee)}</Text>
              </View>
            )}
            <Divider style={common.divider} />
            <View style={common.rowBetween}>
              <Text style={common.summaryTotalLabel}>{t('cart.total')}</Text>
              <Text style={common.summaryTotalValue}>{formatPrice(totals.grandTotal)}</Text>
            </View>
          </Card.Content>
        </Card>

        {submitError && (
          <View style={styles.errorBox}>
            <Text style={styles.errorText}>{submitError}</Text>
          </View>
        )}
        {submitted && hasErrors(errors) && <Text style={styles.errorText}>Please fix the highlighted fields.</Text>}

        <Button
          mode="contained"
          icon="check-circle-outline"
          onPress={handlePlaceOrder}
          loading={placing}
          disabled={placing}
          style={styles.fullButton}
          contentStyle={common.buttonContent}
        >
          Place Order · {formatPrice(totals.grandTotal)}
        </Button>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
