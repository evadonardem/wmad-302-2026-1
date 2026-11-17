
/**
 * Checkout Screen - Marketplace App
 *
 * Features:
 * - Customer contact information
 * - Separately saved contact information
 * - Separately saved shipping address
 * - Automatic saved information loading
 * - Delivery selection
 * - Payment selection
 * - Order summary
 * - Normal cart checkout
 * - Direct Buy Now checkout
 * - Order validation and local storage
 * - Dedicated Order Confirmation screen
 * - Automatic tracking reference and initial tracking event
 *
 * Online payment is simulated only.
 *
 * Direct checkout does not modify or clear the customer's saved cart.
 */

import React, {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from 'react';

import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

import {
  Button,
  MD3Theme,
  TextInput,
  useTheme,
} from 'react-native-paper';

import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';

import {
  useFocusEffect,
  useLocalSearchParams,
  useRouter,
} from 'expo-router';

import { useAuth } from '@/context/AuthContext';

import {
  cartStorage,
  ordersStorage,
  contactInformationStorage,
  shippingAddressStorage,
} from '@/utils/storage';

import type {
  CartItem,
  Product,
} from '@/types/product';

import type {
  DeliveryMethod,
  Order,
  PaymentMethod,
  ShippingAddress,
} from '@/types/order';

import { createCheckoutStyles } from './checkoutStyles';

const STANDARD_DELIVERY_FEE = 5;
const EXPRESS_DELIVERY_FEE = 12;

const initialAddress: ShippingAddress = {
  fullName: '',
  phone: '',
  email: '',
  address: '',
  city: '',
  province: '',
  postalCode: '',
  notes: '',
};

export default function CheckoutScreen() {
  const router = useRouter();

  const {
    mode,
    productId,
    quantity: requestedQuantityParam,
  } = useLocalSearchParams<{
    mode?: string;
    productId?: string;
    quantity?: string;
  }>();

  const isDirectCheckout = mode === 'direct';

  const requestedQuantity = Number(requestedQuantityParam);

  const theme = useTheme<MD3Theme>();

  const styles = useMemo(
    () => createCheckoutStyles(theme),
    [theme],
  );

  const { user } = useAuth();

  const [items, setItems] = useState<CartItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const [address, setAddress] =
    useState<ShippingAddress>(initialAddress);

  const [deliveryMethod, setDeliveryMethod] =
    useState<DeliveryMethod>('Standard Delivery');

  const [paymentMethod, setPaymentMethod] =
    useState<PaymentMethod>('Cash on Delivery');

  /**
   * Load saved Contact Information and Shipping Address.
   *
   * Contact Information and Shipping Address are stored
   * separately for each signed-in user.
   *
   * If no saved contact information exists, the signed-in
   * account's name and email are used as fallback values.
   *
   * Delivery notes are not part of the saved shipping
   * address record because they may change per order.
   */
  useEffect(() => {
    let isActive = true;

    const loadSavedCustomerInformation = async () => {
      if (!user) {
        return;
      }

      try {
        const [
          savedContact,
          savedShippingAddress,
        ] = await Promise.all([
          contactInformationStorage.get(user.id),
          shippingAddressStorage.get(user.id),
        ]);

        if (!isActive) {
          return;
        }

        setAddress({
          ...initialAddress,

          // Saved Contact Information
          fullName:
            savedContact?.fullName ??
            `${user.firstName ?? ''} ${user.lastName ?? ''}`.trim(),

          email:
            savedContact?.email ??
            user.email ??
            '',

          phone:
            savedContact?.phone ?? '',

          // Saved Shipping Address
          address:
            savedShippingAddress?.address ?? '',

          city:
            savedShippingAddress?.city ?? '',

          province:
            savedShippingAddress?.province ?? '',

          postalCode:
            savedShippingAddress?.postalCode ?? '',

          // Delivery notes are entered separately per order.
          notes: '',
        });
      } catch (error) {
        console.error(
          'Failed to load saved customer information:',
          error,
        );
      }
    };

    loadSavedCustomerInformation();

    return () => {
      isActive = false;
    };
  }, [user]);

  /**
   * Load Checkout items.
   *
   * Normal checkout:
   * Loads the customer's saved cart.
   *
   * Direct checkout:
   * Loads only the selected product and requested quantity.
   * The saved cart is never modified.
   */
  useFocusEffect(
    useCallback(() => {
      let isActive = true;

      const loadCheckoutItems = async () => {
        try {
          setLoading(true);

          if (isDirectCheckout) {
            if (
              !productId ||
              !/^\d+$/.test(productId) ||
              !Number.isInteger(requestedQuantity) ||
              requestedQuantity < 1
            ) {
              throw new Error(
                'Invalid direct purchase information. Please return to the product and try again.',
              );
            }

            const response = await fetch(
              `https://dummyjson.com/products/${productId}`,
            );

            if (!response.ok) {
              throw new Error(
                'Unable to load the selected product. Please try again.',
              );
            }

            const product: Product = await response.json();

            if (product.stock <= 0) {
              throw new Error(
                'This product is currently out of stock.',
              );
            }

            if (requestedQuantity > product.stock) {
              throw new Error(
                `Only ${product.stock} item(s) are currently available.`,
              );
            }

            const directItem: CartItem = {
              productId: product.id,
              title: product.title,
              thumbnail: product.thumbnail,
              price: product.price,
              discountPercentage: product.discountPercentage,
              quantity: requestedQuantity,
              stock: product.stock,
            };

            if (isActive) {
              setItems([directItem]);
            }
          } else {
            const savedItems = await cartStorage.getCart();

            if (isActive) {
              setItems(savedItems ?? []);
            }
          }
        } catch (error) {
          console.error(
            'Failed to load checkout items:',
            error,
          );

          if (isActive) {
            setItems([]);

            Alert.alert(
              'Unable to Load Checkout',
              error instanceof Error
                ? error.message
                : 'Please return and try again.',
            );
          }
        } finally {
          if (isActive) {
            setLoading(false);
          }
        }
      };

      loadCheckoutItems();

      return () => {
        isActive = false;
      };
    }, [
      isDirectCheckout,
      productId,
      requestedQuantity,
    ]),
  );

  /**
   * Update one shipping or contact information field.
   */
  const updateAddress = (
    field: keyof ShippingAddress,
    value: string,
  ) => {
    setAddress((previous) => ({
      ...previous,
      [field]: value,
    }));
  };

  /**
   * Calculate order amounts.
   */
  const subtotal = items.reduce(
    (total, item) => total + item.price * item.quantity,
    0,
  );

  const discount = items.reduce(
    (total, item) =>
      total +
      item.price *
        item.quantity *
        (item.discountPercentage / 100),
    0,
  );

  const shippingFee =
    deliveryMethod === 'Express Delivery'
      ? EXPRESS_DELIVERY_FEE
      : STANDARD_DELIVERY_FEE;

  const total = subtotal - discount + shippingFee;

  const totalQuantity = items.reduce(
    (sum, item) => sum + item.quantity,
    0,
  );

  /**
   * Format currency consistently with the Cart screen.
   */
  const formatCurrency = (amount: number) =>
    `$${amount.toFixed(2)}`;

  /**
   * Show a validation message.
   */
  const showValidationError = (message: string) => {
    Alert.alert('Incomplete Information', message);
  };

  /**
   * Validate customer and shipping information.
   */
  const validateForm = (): boolean => {
    if (!user) {
      showValidationError(
        'Your account session is unavailable. Please sign in again.',
      );
      return false;
    }

    if (items.length === 0) {
      showValidationError(
        isDirectCheckout
          ? 'The selected product is unavailable. Please return to the product page and try again.'
          : 'Your cart is empty. Add products before checking out.',
      );
      return false;
    }

    if (!address.fullName.trim()) {
      showValidationError('Please enter your full name.');
      return false;
    }

    if (!address.email.trim()) {
      showValidationError('Please enter your email address.');
      return false;
    }

    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!emailPattern.test(address.email.trim())) {
      showValidationError(
        'Please enter a valid email address.',
      );
      return false;
    }

    const phoneDigits = address.phone.replace(/\D/g, '');

    if (phoneDigits.length < 7) {
      showValidationError(
        'Please enter a valid phone number.',
      );
      return false;
    }

    if (!address.address.trim()) {
      showValidationError(
        'Please enter your complete street address.',
      );
      return false;
    }

    if (!address.city.trim()) {
      showValidationError('Please enter your city.');
      return false;
    }

    if (!address.province.trim()) {
      showValidationError('Please enter your province.');
      return false;
    }

    if (!address.postalCode.trim()) {
      showValidationError(
        'Please enter your postal code.',
      );
      return false;
    }

    return true;
  };

  /**
   * Place an order.
   *
   * Direct purchase:
   * Saves the order without touching the customer's cart.
   *
   * Normal cart checkout:
   * Saves the order and clears the purchased cart.
   *
   * Contact Information and Shipping Address are saved
   * separately for the signed-in user.
   *
   * The order also receives its own permanent customer
   * snapshot so future profile changes do not modify
   * previously placed orders.
   *
   * A tracking reference and initial tracking event are
   * created automatically when the order is placed.
   *
   * After successful storage, navigate to the dedicated
   * Order Confirmation screen.
   */
  const handlePlaceOrder = async () => {
    if (submitting) {
      return;
    }

    if (!validateForm()) {
      return;
    }

    if (!user) {
      return;
    }

    try {
      setSubmitting(true);

      /**
       * Retrieve the correct Checkout items.
       *
       * Direct checkout uses the selected product already
       * loaded into this screen.
       *
       * Normal checkout retrieves the latest saved cart.
       */
      const latestCart = isDirectCheckout
        ? items
        : await cartStorage.getCart();

      if (!latestCart || latestCart.length === 0) {
        setItems([]);

        showValidationError(
          isDirectCheckout
            ? 'The selected product is unavailable. Please return to the product page and try again.'
            : 'Your cart is empty. Please add products before placing an order.',
        );

        return;
      }

      // Recalculate the amounts using the correct Checkout items.
      const latestSubtotal = latestCart.reduce(
        (sum, item) =>
          sum + item.price * item.quantity,
        0,
      );

      const latestDiscount = latestCart.reduce(
        (sum, item) =>
          sum +
          item.price *
            item.quantity *
            (item.discountPercentage / 100),
        0,
      );

      // Confirm that all products are still available.
      const unavailableItem = latestCart.find(
        (item) =>
          item.quantity <= 0 ||
          item.quantity > item.stock,
      );

      if (unavailableItem) {
        showValidationError(
          `${unavailableItem.title} has an invalid quantity or insufficient stock. Please update your cart.`,
        );

        return;
      }

      const latestShippingFee =
        deliveryMethod === 'Express Delivery'
          ? EXPRESS_DELIVERY_FEE
          : STANDARD_DELIVERY_FEE;

      const latestTotal =
        latestSubtotal -
        latestDiscount +
        latestShippingFee;

      /**
       * Prepare the separate Contact Information record.
       */
      const savedContact = {
        fullName: address.fullName.trim(),
        email: address.email.trim(),
        phone: address.phone.trim(),
      };

      /**
       * Prepare the separate Shipping Address record.
       */
      const savedShippingAddress = {
        address: address.address.trim(),
        city: address.city.trim(),
        province: address.province.trim(),
        postalCode: address.postalCode.trim(),
      };

      /**
       * Save Contact Information and Shipping Address
       * separately for the currently signed-in user.
       *
       * These records can be loaded automatically during
       * the user's next checkout.
       */
      await Promise.all([
        contactInformationStorage.save(
          user.id,
          savedContact,
        ),

        shippingAddressStorage.save(
          user.id,
          savedShippingAddress,
        ),
      ]);

      // Generate the order ID and tracking reference.
      const orderTimestamp = new Date().toISOString();
      const orderReference = Date.now();

      const orderId = `ORD-${orderReference}`;
      const trackingNumber = `TRK-${orderReference}`;

      /**
       * Create the order with its own permanent customer
       * information snapshot.
       *
       * This information belongs to this particular order.
       * Updating the saved contact or shipping address later
       * will not change this existing order.
       */
      const order: Order = {
        id: orderId,
        userId: user.id,
        username: user.username,

        customer: {
          ...savedContact,
          ...savedShippingAddress,
          notes: address.notes.trim(),
        },

        items: latestCart.map((item) => ({
          ...item,
        })),

        subtotal: latestSubtotal,
        discount: latestDiscount,
        shippingFee: latestShippingFee,
        total: latestTotal,
        paymentMethod,
        deliveryMethod,
        status: 'Processing',
        createdAt: orderTimestamp,

        // Initial tracking information.
        trackingNumber,

        trackingEvents: [
          {
            milestone: 'Order Placed',
            description:
              'Your order has been successfully placed.',
            timestamp: orderTimestamp,
          },
        ],
      };

      /**
       * Save the order according to the Checkout mode.
       *
       * Direct purchase:
       * Saves the order without touching the customer's cart.
       *
       * Normal cart checkout:
       * Saves the order and clears the purchased cart.
       */
      if (isDirectCheckout) {
        await ordersStorage.saveOrder(order);
      } else {
        await ordersStorage.completeOrder(order);
      }

      // Clear the local Checkout screen state.
      setItems([]);

      // Open the dedicated confirmation screen.
      router.replace({
        pathname: '/(app)/order-confirmation',
        params: {
          orderId: order.id,
        },
      });
    } catch (error) {
      console.error('Failed to place order:', error);

      Alert.alert(
        'Order Failed',
        'We could not place your order. Your cart should remain available. Please try again.',
      );
    } finally {
      setSubmitting(false);
    }
  };

  /**
   * Return to the previous screen.
   */
  const handleGoBack = () => {
    if (router.canGoBack()) {
      router.back();
    } else if (isDirectCheckout) {
      router.replace('/(app)/(tabs)/home');
    } else {
      router.replace('/(app)/(tabs)/cart');
    }
  };

  /**
   * Continue shopping.
   */
  const handleContinueShopping = () => {
    router.replace('/(app)/(tabs)/home');
  };

  /**
   * Loading state.
   */
  if (loading) {
    return (
      <View
        style={[
          styles.container,
          {
            justifyContent: 'center',
            alignItems: 'center',
          },
        ]}
      >
        <ActivityIndicator
          size="large"
          color={theme.colors.primary}
        />

        <Text
          style={{
            marginTop: 12,
            color: theme.colors.onSurfaceVariant,
          }}
        >
          Loading checkout...
        </Text>
      </View>
    );
  }

  /**
   * Empty checkout state.
   */
  if (items.length === 0) {
    return (
      <View style={styles.container}>
        <View style={styles.emptyContainer}>
          <MaterialCommunityIcons
            name={isDirectCheckout ? 'package-variant' : 'cart-outline'}
            size={70}
            color={theme.colors.onSurfaceVariant}
          />

          <Text style={styles.emptyTitle}>
            {isDirectCheckout
              ? 'Unable to Load Product'
              : 'Your Cart Is Empty'}
          </Text>

          <Text style={styles.emptyText}>
            {isDirectCheckout
              ? 'The selected product could not be loaded. Please return to the product page and try again.'
              : 'You need to add products to your cart before proceeding to checkout.'}
          </Text>

          <Button
            mode="contained"
            onPress={handleContinueShopping}
          >
            Continue Shopping
          </Button>
        </View>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={
        Platform.OS === 'ios' ? 'padding' : undefined
      }
    >
      <ScrollView
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={handleGoBack}
            accessibilityRole="button"
            accessibilityLabel="Go back"
          >
            <MaterialCommunityIcons
              name="arrow-left"
              size={22}
              color={theme.colors.onSurface}
            />
          </TouchableOpacity>

          <View style={styles.headerTextContainer}>
            <Text style={styles.headerTitle}>
              Checkout
            </Text>

            <Text style={styles.headerSubtitle}>
              {isDirectCheckout
                ? 'Complete your direct purchase'
                : 'Complete your order details'}
            </Text>
          </View>
        </View>

        {/* Contact Information */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <MaterialCommunityIcons
              name="account-outline"
              size={22}
              color={theme.colors.primary}
              style={styles.sectionIcon}
            />

            <Text style={styles.sectionTitle}>
              Contact Information
            </Text>
          </View>

          <Text style={styles.sectionDescription}>
            Enter your contact details for order updates.
          </Text>

          <TextInput
            mode="outlined"
            label="Full Name"
            value={address.fullName}
            onChangeText={(value) =>
              updateAddress('fullName', value)
            }
            style={styles.field}
            autoCapitalize="words"
          />

          <TextInput
            mode="outlined"
            label="Email Address"
            value={address.email}
            onChangeText={(value) =>
              updateAddress('email', value)
            }
            style={styles.field}
            keyboardType="email-address"
            autoCapitalize="none"
          />

          <TextInput
            mode="outlined"
            label="Phone Number"
            value={address.phone}
            onChangeText={(value) =>
              updateAddress('phone', value)
            }
            style={styles.field}
            keyboardType="phone-pad"
            placeholder="+63 9XX XXX XXXX"
          />
        </View>

        {/* Shipping Address */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <MaterialCommunityIcons
              name="map-marker-outline"
              size={22}
              color={theme.colors.primary}
              style={styles.sectionIcon}
            />

            <Text style={styles.sectionTitle}>
              Shipping Address
            </Text>
          </View>

          <Text style={styles.sectionDescription}>
            Where should we deliver your order?
          </Text>

          <TextInput
            mode="outlined"
            label="Street Address / House Number"
            value={address.address}
            onChangeText={(value) =>
              updateAddress('address', value)
            }
            style={styles.field}
            multiline
          />

          <TextInput
            mode="outlined"
            label="City / Municipality"
            value={address.city}
            onChangeText={(value) =>
              updateAddress('city', value)
            }
            style={styles.field}
          />

          <View style={styles.fieldRow}>
            <View style={styles.halfField}>
              <TextInput
                mode="outlined"
                label="Province"
                value={address.province}
                onChangeText={(value) =>
                  updateAddress('province', value)
                }
                style={styles.field}
              />
            </View>

            <View style={styles.halfField}>
              <TextInput
                mode="outlined"
                label="Postal Code"
                value={address.postalCode}
                onChangeText={(value) =>
                  updateAddress('postalCode', value)
                }
                style={styles.field}
                keyboardType="numeric"
              />
            </View>
          </View>

          <TextInput
            mode="outlined"
            label="Delivery Notes (Optional)"
            value={address.notes}
            onChangeText={(value) =>
              updateAddress('notes', value)
            }
            style={styles.field}
            multiline
            numberOfLines={3}
            placeholder="Landmarks, instructions, or other details"
          />
        </View>

        {/* Delivery Method */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <MaterialCommunityIcons
              name="truck-delivery-outline"
              size={22}
              color={theme.colors.primary}
              style={styles.sectionIcon}
            />

            <Text style={styles.sectionTitle}>
              Delivery Method
            </Text>
          </View>

          <Text style={styles.sectionDescription}>
            Select your preferred delivery option.
          </Text>

          <TouchableOpacity
            style={[
              styles.optionCard,
              deliveryMethod === 'Standard Delivery' &&
                styles.optionCardSelected,
            ]}
            onPress={() =>
              setDeliveryMethod('Standard Delivery')
            }
            accessibilityRole="radio"
            accessibilityState={{
              checked:
                deliveryMethod === 'Standard Delivery',
            }}
          >
            <View style={styles.optionIconContainer}>
              <MaterialCommunityIcons
                name="truck-outline"
                size={23}
                color={theme.colors.primary}
              />
            </View>

            <View style={styles.optionTextContainer}>
              <Text style={styles.optionTitle}>
                Standard Delivery
              </Text>

              <Text style={styles.optionDescription}>
                Regular delivery service
              </Text>

              <Text style={styles.optionDescription}>
                {formatCurrency(STANDARD_DELIVERY_FEE)}
              </Text>
            </View>

            <View
              style={[
                styles.radioOuter,
                deliveryMethod === 'Standard Delivery' &&
                  styles.radioOuterSelected,
              ]}
            >
              {deliveryMethod === 'Standard Delivery' && (
                <View style={styles.radioInner} />
              )}
            </View>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.optionCard,
              deliveryMethod === 'Express Delivery' &&
                styles.optionCardSelected,
            ]}
            onPress={() =>
              setDeliveryMethod('Express Delivery')
            }
            accessibilityRole="radio"
            accessibilityState={{
              checked:
                deliveryMethod === 'Express Delivery',
            }}
          >
            <View style={styles.optionIconContainer}>
              <MaterialCommunityIcons
                name="truck-fast-outline"
                size={23}
                color={theme.colors.primary}
              />
            </View>

            <View style={styles.optionTextContainer}>
              <Text style={styles.optionTitle}>
                Express Delivery
              </Text>

              <Text style={styles.optionDescription}>
                Priority delivery service
              </Text>

              <Text style={styles.optionDescription}>
                {formatCurrency(EXPRESS_DELIVERY_FEE)}
              </Text>
            </View>

            <View
              style={[
                styles.radioOuter,
                deliveryMethod === 'Express Delivery' &&
                  styles.radioOuterSelected,
              ]}
            >
              {deliveryMethod === 'Express Delivery' && (
                <View style={styles.radioInner} />
              )}
            </View>
          </TouchableOpacity>
        </View>

        {/* Payment Method */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <MaterialCommunityIcons
              name="credit-card-outline"
              size={22}
              color={theme.colors.primary}
              style={styles.sectionIcon}
            />

            <Text style={styles.sectionTitle}>
              Payment Method
            </Text>
          </View>

          <Text style={styles.sectionDescription}>
            Choose how you would like to pay.
          </Text>

          <TouchableOpacity
            style={[
              styles.optionCard,
              paymentMethod === 'Cash on Delivery' &&
                styles.optionCardSelected,
            ]}
            onPress={() =>
              setPaymentMethod('Cash on Delivery')
            }
            accessibilityRole="radio"
            accessibilityState={{
              checked:
                paymentMethod === 'Cash on Delivery',
            }}
          >
            <View style={styles.optionIconContainer}>
              <MaterialCommunityIcons
                name="cash"
                size={23}
                color={theme.colors.primary}
              />
            </View>

            <View style={styles.optionTextContainer}>
              <Text style={styles.optionTitle}>
                Cash on Delivery
              </Text>

              <Text style={styles.optionDescription}>
                Pay when your order arrives.
              </Text>
            </View>

            <View
              style={[
                styles.radioOuter,
                paymentMethod === 'Cash on Delivery' &&
                  styles.radioOuterSelected,
              ]}
            >
              {paymentMethod === 'Cash on Delivery' && (
                <View style={styles.radioInner} />
              )}
            </View>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.optionCard,
              paymentMethod === 'Simulated Online Payment' &&
                styles.optionCardSelected,
            ]}
            onPress={() =>
              setPaymentMethod('Simulated Online Payment')
            }
            accessibilityRole="radio"
            accessibilityState={{
              checked:
                paymentMethod === 'Simulated Online Payment',
            }}
          >
            <View style={styles.optionIconContainer}>
              <MaterialCommunityIcons
                name="credit-card-check-outline"
                size={23}
                color={theme.colors.primary}
              />
            </View>

            <View style={styles.optionTextContainer}>
              <Text style={styles.optionTitle}>
                Online Payment (Demo)
              </Text>

              <Text style={styles.optionDescription}>
                Simulated payment for demonstration only.
              </Text>
            </View>

            <View
              style={[
                styles.radioOuter,
                paymentMethod === 'Simulated Online Payment' &&
                  styles.radioOuterSelected,
              ]}
            >
              {paymentMethod === 'Simulated Online Payment' && (
                <View style={styles.radioInner} />
              )}
            </View>
          </TouchableOpacity>
        </View>

        {/* Order Summary */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <MaterialCommunityIcons
              name="receipt"
              size={22}
              color={theme.colors.primary}
              style={styles.sectionIcon}
            />

            <Text style={styles.sectionTitle}>
              Order Summary
            </Text>
          </View>

          <Text style={styles.sectionDescription}>
            {totalQuantity} item(s) in your order
          </Text>

          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>
              Subtotal
            </Text>

            <Text style={styles.summaryValue}>
              {formatCurrency(subtotal)}
            </Text>
          </View>

          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>
              Discount
            </Text>

            <Text
              style={[
                styles.summaryValue,
                styles.discountValue,
              ]}
            >
              -{formatCurrency(discount)}
            </Text>
          </View>

          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>
              Shipping Fee
            </Text>

            <Text style={styles.summaryValue}>
              {formatCurrency(shippingFee)}
            </Text>
          </View>

          <View style={styles.summaryDivider} />

          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>
              Total Amount
            </Text>

            <Text style={styles.totalValue}>
              {formatCurrency(total)}
            </Text>
          </View>
        </View>

        {/* Payment Notice */}
        {paymentMethod === 'Simulated Online Payment' && (
          <View style={styles.notice}>
            <MaterialCommunityIcons
              name="information-outline"
              size={20}
              color={theme.colors.onSecondaryContainer}
            />

            <Text style={styles.noticeText}>
              This is a demonstration payment option.
              No actual payment will be processed or charged.
            </Text>
          </View>
        )}

        {/* Place Order */}
        <Button
          mode="contained"
          onPress={handlePlaceOrder}
          loading={submitting}
          disabled={submitting}
          style={styles.placeOrderButton}
          contentStyle={styles.buttonContent}
          icon="check-circle-outline"
        >
          {submitting ? 'Placing Order...' : 'Place Order'}
        </Button>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
