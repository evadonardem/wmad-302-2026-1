
/**
 * My Orders Screen - Marketplace App
 *
 * Features:
 * - Displays the signed-in user's order history.
 * - Shows order number, date, and status.
 * - Displays purchased products and quantities.
 * - Shows subtotal, discount, shipping, and total.
 * - Allows customers to open individual order details.
 * - Supports dynamic light and dark themes.
 * - Refreshes order history whenever the screen is focused.
 */

import React, {
  useCallback,
  useMemo,
  useState,
} from 'react';

import {
  ActivityIndicator,
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

import {
  Button,
  Card,
  Divider,
  useTheme,
  type MD3Theme,
} from 'react-native-paper';

import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';

import {
  useFocusEffect,
  useRouter,
} from 'expo-router';

import { useAuth } from '@/context/AuthContext';

import { ordersStorage } from '@/utils/storage';

import type {
  Order,
  OrderStatus,
} from '@/types/order';

export default function MyOrdersScreen() {
  const router = useRouter();

  const theme = useTheme<MD3Theme>();
  const colors = theme.colors;

  const { user } = useAuth();

  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  /**
   * Theme-aware screen styles.
   */
  const styles = useMemo(
    () =>
      StyleSheet.create({
        container: {
          flex: 1,
          backgroundColor: colors.background,
        },

        content: {
          padding: 18,
          paddingBottom: 35,
        },

        header: {
          flexDirection: 'row',
          alignItems: 'center',
          marginBottom: 22,
        },

        backButton: {
          width: 42,
          height: 42,
          borderRadius: 14,
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: colors.surfaceVariant,
          marginRight: 13,
        },

        headerText: {
          flex: 1,
        },

        title: {
          fontSize: 23,
          fontWeight: '800',
          color: colors.onBackground,
        },

        subtitle: {
          fontSize: 13,
          color: colors.onSurfaceVariant,
          marginTop: 3,
        },

        overviewCard: {
          backgroundColor: colors.surface,
          borderRadius: 17,
          padding: 17,
          marginBottom: 23,
          elevation: 1,
        },

        overviewRow: {
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-around',
        },

        overviewItem: {
          flex: 1,
          alignItems: 'center',
        },

        overviewValue: {
          fontSize: 21,
          fontWeight: '800',
          color: colors.primary,
        },

        overviewLabel: {
          fontSize: 12,
          color: colors.onSurfaceVariant,
          marginTop: 4,
        },

        overviewDivider: {
          width: 1,
          height: 38,
          backgroundColor: colors.outlineVariant,
        },

        sectionHeader: {
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: 13,
        },

        sectionTitle: {
          fontSize: 18,
          fontWeight: '800',
          color: colors.onBackground,
        },

        orderCount: {
          fontSize: 12,
          color: colors.onSurfaceVariant,
        },

        orderCard: {
          backgroundColor: colors.surface,
          borderRadius: 17,
          padding: 15,
          marginBottom: 15,
          elevation: 1,
        },

        orderHeader: {
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
        },

        orderNumber: {
          fontSize: 14,
          fontWeight: '800',
          color: colors.onSurface,
        },

        orderDate: {
          fontSize: 12,
          color: colors.onSurfaceVariant,
          marginTop: 5,
        },

        statusBadge: {
          paddingHorizontal: 11,
          paddingVertical: 6,
          borderRadius: 20,
        },

        statusText: {
          fontSize: 11,
          fontWeight: '800',
        },

        divider: {
          marginVertical: 14,
          backgroundColor: colors.outlineVariant,
        },

        productsHeader: {
          fontSize: 13,
          fontWeight: '700',
          color: colors.onSurface,
          marginBottom: 11,
        },

        productRow: {
          flexDirection: 'row',
          alignItems: 'center',
          marginBottom: 11,
        },

        productImage: {
          width: 52,
          height: 52,
          borderRadius: 10,
          backgroundColor: colors.surfaceVariant,
        },

        productInfo: {
          flex: 1,
          marginLeft: 11,
          marginRight: 8,
        },

        productTitle: {
          fontSize: 13,
          fontWeight: '700',
          color: colors.onSurface,
        },

        productQuantity: {
          fontSize: 12,
          color: colors.onSurfaceVariant,
          marginTop: 4,
        },

        productPrice: {
          fontSize: 13,
          fontWeight: '700',
          color: colors.onSurface,
        },

        moreItems: {
          fontSize: 12,
          color: colors.primary,
          fontWeight: '700',
          marginTop: 2,
        },

        summaryRow: {
          flexDirection: 'row',
          justifyContent: 'space-between',
          marginBottom: 9,
        },

        summaryLabel: {
          fontSize: 12,
          color: colors.onSurfaceVariant,
        },

        summaryValue: {
          fontSize: 12,
          fontWeight: '600',
          color: colors.onSurface,
        },

        discountValue: {
          color: colors.primary,
        },

        totalRow: {
          flexDirection: 'row',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginTop: 5,
        },

        totalLabel: {
          fontSize: 14,
          fontWeight: '800',
          color: colors.onSurface,
        },

        totalValue: {
          fontSize: 19,
          fontWeight: '800',
          color: colors.primary,
        },

        deliveryInfo: {
          flexDirection: 'row',
          alignItems: 'center',
          marginTop: 13,
          padding: 11,
          borderRadius: 11,
          backgroundColor: colors.surfaceVariant,
        },

        deliveryText: {
          flex: 1,
          fontSize: 12,
          color: colors.onSurfaceVariant,
          marginLeft: 8,
        },

        viewDetails: {
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'center',
          marginTop: 15,
          paddingTop: 12,
          borderTopWidth: 1,
          borderTopColor: colors.outlineVariant,
        },

        viewDetailsText: {
          fontSize: 12,
          fontWeight: '800',
          color: colors.primary,
          marginRight: 5,
        },

        emptyContainer: {
          flex: 1,
          alignItems: 'center',
          justifyContent: 'center',
          padding: 30,
        },

        emptyTitle: {
          fontSize: 21,
          fontWeight: '800',
          color: colors.onSurface,
          marginTop: 17,
        },

        emptyText: {
          fontSize: 14,
          lineHeight: 21,
          color: colors.onSurfaceVariant,
          textAlign: 'center',
          marginTop: 9,
          marginBottom: 22,
        },

        centeredContainer: {
          flex: 1,
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: colors.background,
          padding: 25,
        },

        loadingText: {
          color: colors.onSurfaceVariant,
          marginTop: 12,
          fontSize: 13,
        },

        errorText: {
          color: colors.error,
          textAlign: 'center',
          marginTop: 12,
          marginBottom: 15,
        },
      }),
    [colors],
  );

  /**
   * Format currency.
   */
  const formatCurrency = (amount: number) =>
    `$${amount.toFixed(2)}`;

  /**
   * Format order date.
   */
  const formatDate = (date: string) => {
    const parsedDate = new Date(date);

    if (Number.isNaN(parsedDate.getTime())) {
      return 'Date unavailable';
    }

    return parsedDate.toLocaleDateString(undefined, {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  /**
   * Return status colors.
   */
  const getStatusColors = (status: OrderStatus) => {
    switch (status) {
      case 'Processing':
        return {
          background: theme.dark ? '#59451F' : '#FFF3CD',
          text: theme.dark ? '#FFD980' : '#856404',
        };

      case 'Shipped':
        return {
          background: theme.dark ? '#173D58' : '#DCEEFF',
          text: theme.dark ? '#91CBFF' : '#075985',
        };

      case 'Delivered':
        return {
          background: theme.dark ? '#174B35' : '#DDF5E6',
          text: theme.dark ? '#8DE0AF' : '#166534',
        };

      case 'Cancelled':
        return {
          background: theme.dark ? '#542B30' : '#FCE4E4',
          text: theme.dark ? '#FFAAAA' : '#B42318',
        };

      default:
        return {
          background: colors.surfaceVariant,
          text: colors.onSurfaceVariant,
        };
    }
  };

  /**
   * Refresh orders whenever this screen receives focus.
   */
  useFocusEffect(
    useCallback(() => {
      let isActive = true;

      const fetchOrders = async () => {
        if (!user) {
          setOrders([]);
          setLoading(false);
          setError(null);
          return;
        }

        try {
          setLoading(true);
          setError(null);

          const savedOrders =
            await ordersStorage.getUserOrders(user.id);

          if (isActive) {
            setOrders(savedOrders);
          }
        } catch (loadError) {
          console.error('Failed to load orders:', loadError);

          if (isActive) {
            setError(
              'Unable to load your orders. Please try again.',
            );
          }
        } finally {
          if (isActive) {
            setLoading(false);
          }
        }
      };

      void fetchOrders();

      return () => {
        isActive = false;
      };
    }, [user]),
  );

  /**
   * Retry loading orders.
   */
  const handleRetry = async () => {
    if (!user) {
      setOrders([]);
      setLoading(false);
      setError(null);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const savedOrders =
        await ordersStorage.getUserOrders(user.id);

      setOrders(savedOrders);
    } catch (loadError) {
      console.error('Failed to reload orders:', loadError);

      setError(
        'Unable to load your orders. Please try again.',
      );
    } finally {
      setLoading(false);
    }
  };

  /**
   * Calculate order statistics.
   */
  const totalSpent = orders.reduce(
    (sum, order) => sum + order.total,
    0,
  );

  const totalItems = orders.reduce(
    (sum, order) =>
      sum +
      order.items.reduce(
        (itemSum, item) => itemSum + item.quantity,
        0,
      ),
    0,
  );

  /**
   * Navigate back.
   */
  const handleGoBack = () => {
    if (router.canGoBack()) {
      router.back();
    } else {
      router.replace('/(app)/(tabs)/profile');
    }
  };

  /**
   * Open individual order details.
   */
  const handleViewOrder = (orderId: string) => {
    router.push({
      pathname: '/(app)/order-details/[id]',
      params: {
        id: orderId,
      },
    });
  };

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
          Loading your orders...
        </Text>
      </View>
    );
  }

  /**
   * Error state.
   */
  if (error) {
    return (
      <View style={styles.centeredContainer}>
        <MaterialCommunityIcons
          name="alert-circle-outline"
          size={58}
          color={colors.error}
        />

        <Text style={styles.errorText}>
          {error}
        </Text>

        <Button
          mode="contained"
          onPress={() => {
            void handleRetry();
          }}
        >
          Try Again
        </Button>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.content}
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
              color={colors.onSurface}
            />
          </TouchableOpacity>

          <View style={styles.headerText}>
            <Text style={styles.title}>
              My Orders
            </Text>

            <Text style={styles.subtitle}>
              View and manage your purchases
            </Text>
          </View>
        </View>

        {/* Order Statistics */}
        <Card
          mode="elevated"
          style={styles.overviewCard}
        >
          <View style={styles.overviewRow}>
            <View style={styles.overviewItem}>
              <Text style={styles.overviewValue}>
                {orders.length}
              </Text>

              <Text style={styles.overviewLabel}>
                Total Orders
              </Text>
            </View>

            <View style={styles.overviewDivider} />

            <View style={styles.overviewItem}>
              <Text style={styles.overviewValue}>
                {totalItems}
              </Text>

              <Text style={styles.overviewLabel}>
                Items Purchased
              </Text>
            </View>
          </View>

          <Divider style={styles.divider} />

          <View style={styles.overviewItem}>
            <Text style={styles.overviewValue}>
              {formatCurrency(totalSpent)}
            </Text>

            <Text style={styles.overviewLabel}>
              Total Order Value
            </Text>
          </View>
        </Card>

        {/* Orders List */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>
            Order History
          </Text>

          <Text style={styles.orderCount}>
            {orders.length} order(s)
          </Text>
        </View>

        {/* Empty State */}
        {orders.length === 0 ? (
          <View style={styles.emptyContainer}>
            <MaterialCommunityIcons
              name="package-variant-closed"
              size={75}
              color={colors.onSurfaceVariant}
            />

            <Text style={styles.emptyTitle}>
              No Orders Yet
            </Text>

            <Text style={styles.emptyText}>
              You haven&apos;t placed any orders yet.
              Start shopping and your purchases
              will appear here.
            </Text>

            <Button
              mode="contained"
              icon="shopping"
              onPress={() =>
                router.replace('/(app)/(tabs)/home')
              }
            >
              Start Shopping
            </Button>
          </View>
        ) : (
          orders.map((order) => {
            const statusColors = getStatusColors(
              order.status,
            );

            const displayedItems = order.items.slice(0, 2);

            const remainingItems =
              order.items.length - displayedItems.length;

            return (
              <TouchableOpacity
                key={order.id}
                activeOpacity={0.85}
                onPress={() => handleViewOrder(order.id)}
                accessibilityRole="button"
                accessibilityLabel={`View order ${order.id} details`}
              >
                <Card
                  mode="elevated"
                  style={styles.orderCard}
                >
                  <View style={styles.orderHeader}>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.orderNumber}>
                        {order.id}
                      </Text>

                      <Text style={styles.orderDate}>
                        Placed on {formatDate(order.createdAt)}
                      </Text>
                    </View>

                    <View
                      style={[
                        styles.statusBadge,
                        {
                          backgroundColor:
                            statusColors.background,
                        },
                      ]}
                    >
                      <Text
                        style={[
                          styles.statusText,
                          { color: statusColors.text },
                        ]}
                      >
                        {order.status}
                      </Text>
                    </View>
                  </View>

                  <Divider style={styles.divider} />

                  {/* Purchased Products */}
                  <Text style={styles.productsHeader}>
                    Purchased Products
                  </Text>

                  {displayedItems.map((item, index) => (
                    <View
                      key={`${order.id}-${item.productId}-${index}`}
                      style={styles.productRow}
                    >
                      <Image
                        source={{ uri: item.thumbnail }}
                        style={styles.productImage}
                        resizeMode="contain"
                      />

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

                  {remainingItems > 0 && (
                    <Text style={styles.moreItems}>
                      +{remainingItems} more product(s)
                    </Text>
                  )}

                  <Divider style={styles.divider} />

                  {/* Order Summary */}
                  <View style={styles.summaryRow}>
                    <Text style={styles.summaryLabel}>
                      Subtotal
                    </Text>

                    <Text style={styles.summaryValue}>
                      {formatCurrency(order.subtotal)}
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
                      -{formatCurrency(order.discount)}
                    </Text>
                  </View>

                  <View style={styles.summaryRow}>
                    <Text style={styles.summaryLabel}>
                      Shipping Fee
                    </Text>

                    <Text style={styles.summaryValue}>
                      {formatCurrency(order.shippingFee)}
                    </Text>
                  </View>

                  <View style={styles.totalRow}>
                    <Text style={styles.totalLabel}>
                      Total Amount
                    </Text>

                    <Text style={styles.totalValue}>
                      {formatCurrency(order.total)}
                    </Text>
                  </View>

                  {/* Delivery and Payment Information */}
                  <View style={styles.deliveryInfo}>
                    <MaterialCommunityIcons
                      name="truck-delivery-outline"
                      size={20}
                      color={colors.primary}
                    />

                    <Text style={styles.deliveryText}>
                      {order.deliveryMethod} · {order.paymentMethod}
                    </Text>
                  </View>

                  {/* View Order Details */}
                  <View style={styles.viewDetails}>
                    <Text style={styles.viewDetailsText}>
                      View Order Details
                    </Text>

                    <MaterialCommunityIcons
                      name="arrow-right"
                      size={17}
                      color={colors.primary}
                    />
                  </View>
                </Card>
              </TouchableOpacity>
            );
          })
        )}
      </ScrollView>
    </View>
  );
}
