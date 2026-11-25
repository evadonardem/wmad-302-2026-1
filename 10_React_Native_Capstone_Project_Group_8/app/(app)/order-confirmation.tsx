
/**
 * Order Confirmation Screen - Marketplace App
 *
 * Features:
 * - Displays successful order placement
 * - Retrieves the saved order using its order ID
 * - Verifies that the order belongs to the signed-in user
 * - Displays purchased products and order summary
 * - Shows shipping and payment information
 * - Supports Light and Dark themes
 */

import React, { useEffect, useState } from 'react';

import {
  ActivityIndicator,
  Image,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import {
  Button,
  MD3Theme,
  useTheme,
} from 'react-native-paper';

import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';

import {
  useLocalSearchParams,
  useRouter,
} from 'expo-router';

import { useAuth } from '@/context/AuthContext';

import { ordersStorage } from '@/utils/storage';

import type { Order } from '@/types/order';

export default function OrderConfirmationScreen() {
  const router = useRouter();
  const theme = useTheme<MD3Theme>();

  const { orderId: orderIdParam } =
    useLocalSearchParams<{ orderId?: string | string[] }>();

  const { user } = useAuth();

  const orderId = Array.isArray(orderIdParam)
    ? orderIdParam[0]
    : orderIdParam;

  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState('');

  /**
   * Load the order and verify its ownership.
   */
  useEffect(() => {
    let isActive = true;

    const loadOrder = async () => {
      try {
        setLoading(true);
        setErrorMessage('');
        setOrder(null);

        if (!orderId) {
          throw new Error('The order ID is missing.');
        }

        if (!user) {
          throw new Error(
            'Please sign in to view your order confirmation.',
          );
        }

        const savedOrder =
          await ordersStorage.getOrderById(orderId);

        if (!savedOrder) {
          throw new Error(
            'We could not find this order. Please check your My Orders page.',
          );
        }

        if (savedOrder.userId !== user.id) {
          throw new Error(
            'You are not authorized to view this order.',
          );
        }

        if (isActive) {
          setOrder(savedOrder);
        }
      } catch (error) {
        console.error(
          'Failed to load order confirmation:',
          error,
        );

        if (isActive) {
          setErrorMessage(
            error instanceof Error
              ? error.message
              : 'Unable to load your order confirmation.',
          );
        }
      } finally {
        if (isActive) {
          setLoading(false);
        }
      }
    };

    loadOrder();

    return () => {
      isActive = false;
    };
  }, [orderId, user]);

  /**
   * Format currency.
   */
  const formatCurrency = (amount: number) =>
    `$${amount.toFixed(2)}`;

  /**
   * Format the order date.
   */
  const formatDate = (date: string) => {
    const parsedDate = new Date(date);

    if (Number.isNaN(parsedDate.getTime())) {
      return date;
    }

    return parsedDate.toLocaleString();
  };

  /**
   * Navigate to My Orders.
   */
  const handleViewOrders = () => {
    router.replace('/(app)/my-orders');
  };

  /**
   * Continue shopping.
   */
  const handleContinueShopping = () => {
    router.replace('/(app)/(tabs)/home');
  };

  const colors = theme.colors;

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },
    scrollContent: {
      padding: 20,
      paddingBottom: 36,
    },
    centeredContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      padding: 24,
      backgroundColor: colors.background,
    },
    loadingText: {
      marginTop: 14,
      fontSize: 15,
      color: colors.onSurfaceVariant,
    },
    errorIcon: {
      marginBottom: 16,
    },
    errorTitle: {
      fontSize: 22,
      fontWeight: '700',
      color: colors.onSurface,
      textAlign: 'center',
      marginBottom: 10,
    },
    errorText: {
      fontSize: 14,
      lineHeight: 21,
      color: colors.onSurfaceVariant,
      textAlign: 'center',
      marginBottom: 24,
    },
    successHeader: {
      alignItems: 'center',
      paddingVertical: 22,
    },
    successIconContainer: {
      width: 92,
      height: 92,
      borderRadius: 46,
      backgroundColor: colors.primaryContainer,
      justifyContent: 'center',
      alignItems: 'center',
      marginBottom: 18,
    },
    successTitle: {
      fontSize: 25,
      fontWeight: '800',
      color: colors.onSurface,
      textAlign: 'center',
      marginBottom: 8,
    },
    successDescription: {
      fontSize: 14,
      lineHeight: 21,
      color: colors.onSurfaceVariant,
      textAlign: 'center',
      paddingHorizontal: 10,
    },
    orderIdCard: {
      backgroundColor: colors.surface,
      borderRadius: 14,
      borderWidth: 1,
      borderColor: colors.outlineVariant,
      padding: 17,
      marginBottom: 18,
      alignItems: 'center',
    },
    orderIdLabel: {
      fontSize: 12,
      color: colors.onSurfaceVariant,
      marginBottom: 6,
    },
    orderIdValue: {
      fontSize: 18,
      fontWeight: '800',
      color: colors.primary,
      textAlign: 'center',
    },
    section: {
      backgroundColor: colors.surface,
      borderRadius: 14,
      borderWidth: 1,
      borderColor: colors.outlineVariant,
      padding: 16,
      marginBottom: 16,
    },
    sectionTitle: {
      fontSize: 17,
      fontWeight: '700',
      color: colors.onSurface,
      marginBottom: 14,
    },
    infoRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'flex-start',
      marginBottom: 11,
      gap: 12,
    },
    infoLabel: {
      flex: 1,
      fontSize: 13,
      color: colors.onSurfaceVariant,
    },
    infoValue: {
      flex: 1,
      fontSize: 13,
      fontWeight: '600',
      color: colors.onSurface,
      textAlign: 'right',
    },
    statusText: {
      color: colors.primary,
      fontWeight: '700',
    },
    productRow: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingVertical: 10,
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: colors.outlineVariant,
    },
    productImage: {
      width: 62,
      height: 62,
      borderRadius: 10,
      backgroundColor: colors.surfaceVariant,
      marginRight: 12,
    },
    productImagePlaceholder: {
      width: 62,
      height: 62,
      borderRadius: 10,
      backgroundColor: colors.surfaceVariant,
      justifyContent: 'center',
      alignItems: 'center',
      marginRight: 12,
    },
    productInfo: {
      flex: 1,
    },
    productTitle: {
      fontSize: 14,
      fontWeight: '600',
      color: colors.onSurface,
      marginBottom: 5,
    },
    productQuantity: {
      fontSize: 12,
      color: colors.onSurfaceVariant,
    },
    productPrice: {
      fontSize: 13,
      fontWeight: '700',
      color: colors.onSurface,
      marginLeft: 8,
    },
    divider: {
      height: 1,
      backgroundColor: colors.outlineVariant,
      marginVertical: 12,
    },
    totalRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginTop: 4,
    },
    totalLabel: {
      fontSize: 16,
      fontWeight: '700',
      color: colors.onSurface,
    },
    totalValue: {
      fontSize: 21,
      fontWeight: '800',
      color: colors.primary,
    },
    addressText: {
      fontSize: 13,
      lineHeight: 20,
      color: colors.onSurfaceVariant,
    },
    noteText: {
      fontSize: 12,
      lineHeight: 18,
      color: colors.onSurfaceVariant,
      marginTop: 8,
    },
    notice: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      backgroundColor: colors.secondaryContainer,
      borderRadius: 12,
      padding: 13,
      marginBottom: 18,
      gap: 10,
    },
    noticeText: {
      flex: 1,
      fontSize: 12,
      lineHeight: 18,
      color: colors.onSecondaryContainer,
    },
    primaryButton: {
      borderRadius: 10,
      marginBottom: 11,
    },
    secondaryButton: {
      borderRadius: 10,
    },
    buttonContent: {
      minHeight: 48,
    },
  });

  /**
   * Loading state.
   */
  if (loading) {
    return (
      <View style={styles.centeredContainer}>
        <ActivityIndicator
          size="large"
          color={colors.primary}
        />

        <Text style={styles.loadingText}>
          Loading your order confirmation...
        </Text>
      </View>
    );
  }

  /**
   * Missing, unavailable, or unauthorized order.
   */
  if (errorMessage || !order) {
    return (
      <View style={styles.centeredContainer}>
        <MaterialCommunityIcons
          name="alert-circle-outline"
          size={68}
          color={colors.error}
          style={styles.errorIcon}
        />

        <Text style={styles.errorTitle}>
          Unable to Display Order
        </Text>

        <Text style={styles.errorText}>
          {errorMessage ||
            'The requested order could not be loaded.'}
        </Text>

        <Button
          mode="contained"
          onPress={handleViewOrders}
          style={styles.primaryButton}
          contentStyle={styles.buttonContent}
          icon="receipt"
        >
          Go to My Orders
        </Button>

        <Button
          mode="outlined"
          onPress={handleContinueShopping}
          style={styles.secondaryButton}
          contentStyle={styles.buttonContent}
        >
          Continue Shopping
        </Button>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Success Header */}
        <View style={styles.successHeader}>
          <View style={styles.successIconContainer}>
            <MaterialCommunityIcons
              name="check-circle"
              size={62}
              color={colors.primary}
            />
          </View>

          <Text style={styles.successTitle}>
            Order Placed Successfully!
          </Text>

          <Text style={styles.successDescription}>
            Thank you for shopping with us. Your order has
            been saved and is now being processed.
          </Text>
        </View>

        {/* Order Number */}
        <View style={styles.orderIdCard}>
          <Text style={styles.orderIdLabel}>
            YOUR ORDER NUMBER
          </Text>

          <Text style={styles.orderIdValue}>
            {order.id}
          </Text>
        </View>

        {/* Order Information */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>
            Order Information
          </Text>

          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>
              Order Date
            </Text>

            <Text style={styles.infoValue}>
              {formatDate(order.createdAt)}
            </Text>
          </View>

          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>
              Order Status
            </Text>

            <Text
              style={[
                styles.infoValue,
                styles.statusText,
              ]}
            >
              {order.status}
            </Text>
          </View>

          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>
              Delivery Method
            </Text>

            <Text style={styles.infoValue}>
              {order.deliveryMethod}
            </Text>
          </View>

          <View style={[styles.infoRow, { marginBottom: 0 }]}>
            <Text style={styles.infoLabel}>
              Payment Method
            </Text>

            <Text style={styles.infoValue}>
              {order.paymentMethod}
            </Text>
          </View>
        </View>

        {/* Purchased Products */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>
            Purchased Products ({order.items.length})
          </Text>

          {order.items.map((item, index) => (
            <View
                key={`${item.title}-${index}`}
                style={styles.productRow}
            >
              {item.thumbnail ? (
                <Image
                  source={{ uri: item.thumbnail }}
                  style={styles.productImage}
                  resizeMode="contain"
                />
              ) : (
                <View style={styles.productImagePlaceholder}>
                  <MaterialCommunityIcons
                    name="image-outline"
                    size={25}
                    color={colors.onSurfaceVariant}
                  />
                </View>
              )}

              <View style={styles.productInfo}>
                <Text
                  style={styles.productTitle}
                  numberOfLines={2}
                >
                  {item.title}
                </Text>

                <Text style={styles.productQuantity}>
                  Quantity: {item.quantity}
                </Text>
              </View>

              <Text style={styles.productPrice}>
                {formatCurrency(
                  item.price * item.quantity,
                )}
              </Text>
            </View>
          ))}
        </View>

        {/* Order Summary */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>
            Order Summary
          </Text>

          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>
              Subtotal
            </Text>

            <Text style={styles.infoValue}>
              {formatCurrency(order.subtotal)}
            </Text>
          </View>

          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>
              Discount
            </Text>

            <Text
              style={[
                styles.infoValue,
                { color: colors.primary },
              ]}
            >
              -{formatCurrency(order.discount)}
            </Text>
          </View>

          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>
              Shipping Fee
            </Text>

            <Text style={styles.infoValue}>
              {formatCurrency(order.shippingFee)}
            </Text>
          </View>

          <View style={styles.divider} />

          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>
              Total Amount
            </Text>

            <Text style={styles.totalValue}>
              {formatCurrency(order.total)}
            </Text>
          </View>
        </View>

        {/* Shipping Information */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>
            Shipping Information
          </Text>

          <Text
            style={[
              styles.infoValue,
              {
                textAlign: 'left',
                marginBottom: 5,
              },
            ]}
          >
            {order.customer.fullName}
          </Text>

          <Text style={styles.addressText}>
            {order.customer.phone}
          </Text>

          <Text style={styles.addressText}>
            {order.customer.email}
          </Text>

          <Text style={[styles.addressText, { marginTop: 8 }]}>
            {order.customer.address}
          </Text>

          <Text style={styles.addressText}>
            {order.customer.city}, {order.customer.province}
          </Text>

          <Text style={styles.addressText}>
            Postal Code: {order.customer.postalCode}
          </Text>

          {!!order.customer.notes && (
            <Text style={styles.noteText}>
              Delivery Notes: {order.customer.notes}
            </Text>
          )}
        </View>

        {/* Demo Payment Notice */}
        {order.paymentMethod ===
          'Simulated Online Payment' && (
          <View style={styles.notice}>
            <MaterialCommunityIcons
              name="information-outline"
              size={20}
              color={colors.onSecondaryContainer}
            />

            <Text style={styles.noticeText}>
              This order used the simulated online payment
              option. No actual payment was processed or charged.
            </Text>
          </View>
        )}

        {/* Actions */}
        <Button
          mode="contained"
          onPress={handleViewOrders}
          style={styles.primaryButton}
          contentStyle={styles.buttonContent}
          icon="receipt"
        >
          View My Orders
        </Button>

        <Button
          mode="outlined"
          onPress={handleContinueShopping}
          style={styles.secondaryButton}
          contentStyle={styles.buttonContent}
          icon="shopping"
        >
          Continue Shopping
        </Button>
      </ScrollView>
    </View>
  );
}
