
/**
 * Order Details Screen - Marketplace App
 *
 * Features:
 * - Displays complete information for an individual order.
 * - Verifies that the order belongs to the signed-in user.
 * - Displays all purchased products and quantities.
 * - Shows subtotal, discount, shipping fee, and total.
 * - Displays complete customer shipping information.
 * - Shows payment and delivery methods.
 * - Provides six simulated order tracking milestones.
 * - Displays a tracking reference number and progress indicator.
 * - Saves tracking events and timestamps to AsyncStorage.
 * - Allows manual demonstration of the next tracking update.
 * - Allows cancellation of Processing orders.
 * - Uses browser-compatible confirmation and feedback dialogs.
 * - Supports dynamic light and dark themes.
 */

import React, {
  useEffect,
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
  Dialog,
  Divider,
  Portal,
  Text as PaperText,
  useTheme,
  type MD3Theme,
} from 'react-native-paper';

import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';

import {
  useLocalSearchParams,
  useRouter,
} from 'expo-router';

import { useAuth } from '@/context/AuthContext';

import { ordersStorage } from '@/utils/storage';

import type {
  Order,
  OrderStatus,
  TrackingMilestone,
} from '@/types/order';

type TrackingStep = {
  milestone: TrackingMilestone;
  title: string;
  description: string;
  icon: keyof typeof MaterialCommunityIcons.glyphMap;
};

const TRACKING_STEPS: TrackingStep[] = [
  {
    milestone: 'Order Placed',
    title: 'Order Placed',
    description:
      'Your order has been successfully placed and recorded.',
    icon: 'clipboard-check-outline',
  },
  {
    milestone: 'Order Confirmed',
    title: 'Order Confirmed',
    description:
      'Your order has been confirmed and is ready for processing.',
    icon: 'check-decagram-outline',
  },
  {
    milestone: 'Preparing Shipment',
    title: 'Preparing Shipment',
    description:
      'Your purchased products are being prepared for shipment.',
    icon: 'package-variant-closed',
  },
  {
    milestone: 'Shipped',
    title: 'Order Shipped',
    description:
      'Your order has been dispatched and is on its way.',
    icon: 'truck-fast-outline',
  },
  {
    milestone: 'Out for Delivery',
    title: 'Out for Delivery',
    description:
      'Your order is on its way to your delivery address.',
    icon: 'truck-delivery-outline',
  },
  {
    milestone: 'Delivered',
    title: 'Order Delivered',
    description:
      'Your order has successfully reached its destination.',
    icon: 'check-circle-outline',
  },
];

export default function OrderDetailsScreen() {
  const router = useRouter();

  const params = useLocalSearchParams<{
    id?: string | string[];
  }>();

  const rawOrderId = params.id;

  const orderId = Array.isArray(rawOrderId)
    ? rawOrderId[0]
    : rawOrderId;

  const theme = useTheme<MD3Theme>();
  const colors = theme.colors;

  const { user } = useAuth();

  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [cancelling, setCancelling] = useState(false);
  const [trackingUpdating, setTrackingUpdating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Cancellation confirmation dialog.
  const [cancelDialogVisible, setCancelDialogVisible] =
    useState(false);

  // Feedback dialog for cancellation and tracking updates.
  const [feedbackDialogVisible, setFeedbackDialogVisible] =
    useState(false);

  const [feedbackTitle, setFeedbackTitle] = useState('');
  const [feedbackMessage, setFeedbackMessage] = useState('');

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
          paddingBottom: 40,
        },

        header: {
          flexDirection: 'row',
          alignItems: 'center',
          marginBottom: 23,
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

        headerInfo: {
          flex: 1,
        },

        headerTitle: {
          fontSize: 22,
          fontWeight: '800',
          color: colors.onBackground,
        },

        headerSubtitle: {
          fontSize: 12,
          color: colors.onSurfaceVariant,
          marginTop: 3,
        },

        card: {
          backgroundColor: colors.surface,
          borderRadius: 17,
          padding: 17,
          marginBottom: 17,
          elevation: 1,
        },

        sectionHeader: {
          flexDirection: 'row',
          alignItems: 'center',
          marginBottom: 15,
        },

        sectionIcon: {
          width: 36,
          height: 36,
          borderRadius: 11,
          backgroundColor: colors.surfaceVariant,
          alignItems: 'center',
          justifyContent: 'center',
          marginRight: 11,
        },

        sectionTitle: {
          fontSize: 16,
          fontWeight: '800',
          color: colors.onSurface,
        },

        sectionSubtitle: {
          fontSize: 12,
          color: colors.onSurfaceVariant,
          marginTop: 3,
        },

        orderNumber: {
          fontSize: 19,
          fontWeight: '800',
          color: colors.onSurface,
          marginBottom: 6,
        },

        orderDate: {
          fontSize: 12,
          color: colors.onSurfaceVariant,
          marginBottom: 15,
        },

        statusBadge: {
          alignSelf: 'flex-start',
          paddingHorizontal: 13,
          paddingVertical: 7,
          borderRadius: 20,
        },

        statusText: {
          fontSize: 12,
          fontWeight: '800',
        },

        divider: {
          backgroundColor: colors.outlineVariant,
          marginVertical: 15,
        },

        infoRow: {
          flexDirection: 'row',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
          marginBottom: 12,
        },

        infoLabel: {
          flex: 1,
          fontSize: 13,
          color: colors.onSurfaceVariant,
          marginRight: 10,
        },

        infoValue: {
          flex: 1,
          fontSize: 13,
          fontWeight: '600',
          color: colors.onSurface,
          textAlign: 'right',
        },

        productRow: {
          flexDirection: 'row',
          alignItems: 'center',
          marginBottom: 15,
        },

        productImage: {
          width: 68,
          height: 68,
          borderRadius: 12,
          backgroundColor: colors.surfaceVariant,
        },

        productInfo: {
          flex: 1,
          marginLeft: 12,
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
          marginTop: 5,
        },

        productUnitPrice: {
          fontSize: 11,
          color: colors.onSurfaceVariant,
          marginTop: 3,
        },

        productTotal: {
          fontSize: 13,
          fontWeight: '800',
          color: colors.onSurface,
        },

        summaryRow: {
          flexDirection: 'row',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: 12,
        },

        summaryLabel: {
          fontSize: 13,
          color: colors.onSurfaceVariant,
        },

        summaryValue: {
          fontSize: 13,
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
          fontSize: 15,
          fontWeight: '800',
          color: colors.onSurface,
        },

        totalValue: {
          fontSize: 21,
          fontWeight: '800',
          color: colors.primary,
        },

        trackingReferenceContainer: {
          padding: 13,
          borderRadius: 12,
          backgroundColor: colors.surfaceVariant,
          marginBottom: 17,
        },

        trackingReferenceLabel: {
          fontSize: 11,
          fontWeight: '700',
          color: colors.onSurfaceVariant,
          marginBottom: 5,
        },

        trackingReferenceValue: {
          fontSize: 15,
          fontWeight: '800',
          color: colors.onSurface,
          letterSpacing: 0.5,
        },

        trackingProgressHeader: {
          flexDirection: 'row',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: 9,
        },

        trackingProgressLabel: {
          fontSize: 12,
          fontWeight: '700',
          color: colors.onSurface,
        },

        trackingProgressCount: {
          fontSize: 12,
          fontWeight: '800',
          color: colors.primary,
        },

        trackingProgressTrack: {
          height: 8,
          borderRadius: 10,
          overflow: 'hidden',
          backgroundColor: colors.surfaceVariant,
          marginBottom: 20,
        },

        trackingProgressFill: {
          height: '100%',
          borderRadius: 10,
          backgroundColor: colors.primary,
        },

        trackingStep: {
          flexDirection: 'row',
          minHeight: 112,
        },

        trackingIconColumn: {
          width: 35,
          alignItems: 'center',
        },

        trackingIcon: {
          width: 30,
          height: 30,
          borderRadius: 15,
          alignItems: 'center',
          justifyContent: 'center',
        },

        trackingLine: {
          width: 2,
          flex: 1,
          minHeight: 65,
          backgroundColor: colors.outlineVariant,
        },

        trackingContent: {
          flex: 1,
          paddingLeft: 13,
          paddingBottom: 20,
        },

        trackingTitle: {
          fontSize: 14,
          fontWeight: '800',
          color: colors.onSurface,
        },

        trackingDescription: {
          fontSize: 12,
          lineHeight: 18,
          color: colors.onSurfaceVariant,
          marginTop: 4,
        },

        trackingTimestamp: {
          fontSize: 11,
          fontWeight: '600',
          color: colors.primary,
          marginTop: 7,
        },

        trackingPending: {
          fontSize: 11,
          color: colors.onSurfaceVariant,
          marginTop: 7,
        },

        currentStepLabel: {
          fontSize: 10,
          fontWeight: '800',
          color: colors.primary,
          marginTop: 6,
        },

        trackingDemoNotice: {
          flexDirection: 'row',
          alignItems: 'flex-start',
          padding: 12,
          borderRadius: 11,
          backgroundColor: colors.surfaceVariant,
          marginTop: 8,
          marginBottom: 15,
        },

        trackingDemoNoticeText: {
          flex: 1,
          fontSize: 11,
          lineHeight: 18,
          color: colors.onSurfaceVariant,
          marginLeft: 9,
        },

        trackingButton: {
          marginTop: 3,
          marginBottom: 12,
        },

        trackingButtonText: {
          fontSize: 12,
        },

        cancelledContainer: {
          padding: 15,
          borderRadius: 13,
          backgroundColor: theme.dark
            ? '#542B30'
            : '#FCE4E4',
        },

        cancelledTitle: {
          fontSize: 15,
          fontWeight: '800',
          color: theme.dark ? '#FFAAAA' : '#B42318',
        },

        cancelledDescription: {
          fontSize: 12,
          lineHeight: 19,
          color: theme.dark ? '#FFD0D0' : '#8F2525',
          marginTop: 6,
        },

        addressText: {
          fontSize: 13,
          lineHeight: 21,
          color: colors.onSurface,
        },

        notesContainer: {
          marginTop: 15,
          padding: 12,
          borderRadius: 11,
          backgroundColor: colors.surfaceVariant,
        },

        notesLabel: {
          fontSize: 12,
          fontWeight: '800',
          color: colors.onSurface,
          marginBottom: 5,
        },

        notesText: {
          fontSize: 12,
          lineHeight: 19,
          color: colors.onSurfaceVariant,
        },

        paymentNotice: {
          flexDirection: 'row',
          alignItems: 'flex-start',
          padding: 13,
          borderRadius: 12,
          backgroundColor: colors.surfaceVariant,
          marginTop: 15,
        },

        paymentNoticeText: {
          flex: 1,
          fontSize: 12,
          lineHeight: 19,
          color: colors.onSurfaceVariant,
          marginLeft: 9,
        },

        cancelNotice: {
          flexDirection: 'row',
          alignItems: 'flex-start',
          padding: 13,
          borderRadius: 12,
          backgroundColor: theme.dark
            ? '#542B30'
            : '#FCE4E4',
          marginTop: 15,
        },

        cancelNoticeText: {
          flex: 1,
          fontSize: 12,
          lineHeight: 19,
          color: theme.dark ? '#FFD0D0' : '#8F2525',
          marginLeft: 9,
        },

        cancelButton: {
          marginTop: 5,
          marginBottom: 15,
          borderColor: colors.error,
        },

        footerButton: {
          marginTop: 5,
          marginBottom: 10,
        },

        centeredContainer: {
          flex: 1,
          alignItems: 'center',
          justifyContent: 'center',
          padding: 28,
          backgroundColor: colors.background,
        },

        loadingText: {
          fontSize: 13,
          color: colors.onSurfaceVariant,
          marginTop: 13,
        },

        errorTitle: {
          fontSize: 20,
          fontWeight: '800',
          color: colors.onSurface,
          marginTop: 15,
        },

        errorDescription: {
          fontSize: 13,
          lineHeight: 20,
          color: colors.onSurfaceVariant,
          textAlign: 'center',
          marginTop: 8,
          marginBottom: 22,
        },
      }),
    [colors, theme.dark],
  );

  /**
   * Format currency.
   */
  const formatCurrency = (amount: number) =>
    `$${amount.toFixed(2)}`;

  /**
   * Format date and time.
   */
  const formatDate = (date: string) => {
    const parsedDate = new Date(date);

    if (Number.isNaN(parsedDate.getTime())) {
      return 'Date unavailable';
    }

    return parsedDate.toLocaleString(undefined, {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
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
   * Load the selected order.
   *
   * Also verify that the order belongs to
   * the currently signed-in user.
   */
  useEffect(() => {
    let isActive = true;

    const loadOrder = async () => {
      if (!user) {
        setOrder(null);
        setError('Please sign in to view this order.');
        setLoading(false);
        return;
      }

      if (!orderId) {
        setOrder(null);
        setError('The order ID is missing or invalid.');
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);

        const savedOrder =
          await ordersStorage.getOrderById(orderId);

        if (!isActive) {
          return;
        }

        if (!savedOrder) {
          setOrder(null);
          setError(
            'We could not find this order. It may have been removed.',
          );
          return;
        }

        if (savedOrder.userId !== user.id) {
          setOrder(null);
          setError(
            'You are not authorized to view this order.',
          );
          return;
        }

        setOrder(savedOrder);
      } catch (loadError) {
        console.error(
          'Failed to load order details:',
          loadError,
        );

        if (isActive) {
          setOrder(null);
          setError(
            'Unable to load order details. Please try again.',
          );
        }
      } finally {
        if (isActive) {
          setLoading(false);
        }
      }
    };

    void loadOrder();

    return () => {
      isActive = false;
    };
  }, [orderId, user]);

  /**
   * Navigate back to My Orders.
   */
  const handleGoBack = () => {
    if (router.canGoBack()) {
      router.back();
    } else {
      router.replace('/(app)/my-orders');
    }
  };

  /**
   * Display a feedback dialog.
   */
  const showFeedback = (
    title: string,
    message: string,
  ) => {
    setFeedbackTitle(title);
    setFeedbackMessage(message);
    setFeedbackDialogVisible(true);
  };

  /**
   * Open the cancellation confirmation dialog.
   */
  const handleCancelOrder = () => {
    if (!order || !user || cancelling) {
      return;
    }

    if (order.status !== 'Processing') {
      showFeedback(
        'Cancellation Unavailable',
        'Only orders with Processing status can be cancelled.',
      );
      return;
    }

    setCancelDialogVisible(true);
  };

  /**
   * Confirm cancellation and save the new status.
   */
  const confirmCancelOrder = async () => {
    if (!order || !user || cancelling) {
      return;
    }

    setCancelDialogVisible(false);

    try {
      setCancelling(true);

      const updatedOrder = await ordersStorage.cancelOrder(
        order.id,
        user.id,
      );

      if (!updatedOrder) {
        const latestOrder =
          await ordersStorage.getOrderById(order.id);

        if (
          latestOrder &&
          latestOrder.userId === user.id
        ) {
          setOrder(latestOrder);
        }

        showFeedback(
          'Unable to Cancel Order',
          'This order may already have been updated, or it is no longer eligible for cancellation. Please check your order history.',
        );

        return;
      }

      setOrder(updatedOrder);

      showFeedback(
        'Order Cancelled',
        'Your order has been successfully cancelled. The updated status has been saved to your order history.',
      );
    } catch (cancelError) {
      console.error(
        'Failed to cancel order:',
        cancelError,
      );

      showFeedback(
        'Cancellation Failed',
        'We could not cancel your order. Please try again.',
      );
    } finally {
      setCancelling(false);
    }
  };

  /**
   * Save the next simulated tracking milestone.
   *
   * Each press advances only one milestone.
   * The storage function saves the new event and
   * timestamp to AsyncStorage.
   */
  const handleSimulateTrackingUpdate = async () => {
    if (
      !order ||
      !user ||
      trackingUpdating ||
      order.status === 'Cancelled' ||
      order.status === 'Delivered'
    ) {
      return;
    }

    try {
      setTrackingUpdating(true);

      const updatedOrder =
        await ordersStorage.advanceTracking(
          order.id,
          user.id,
        );

      if (!updatedOrder) {
        const latestOrder =
          await ordersStorage.getOrderById(order.id);

        if (
          latestOrder &&
          latestOrder.userId === user.id
        ) {
          setOrder(latestOrder);
        }

        showFeedback(
          'Tracking Update Unavailable',
          'The next tracking update could not be saved. The order may already be completed or updated. Please check the latest tracking information.',
        );

        return;
      }

      setOrder(updatedOrder);

      const latestEvent =
        updatedOrder.trackingEvents?.[
          updatedOrder.trackingEvents.length - 1
        ];

      showFeedback(
        latestEvent?.milestone === 'Delivered'
          ? 'Order Delivered'
          : 'Tracking Updated',
        latestEvent
          ? `${latestEvent.milestone} has been recorded successfully. The tracking history and timestamp have been saved.`
          : 'The tracking information has been updated successfully.',
      );
    } catch (trackingError) {
      console.error(
        'Failed to update order tracking:',
        trackingError,
      );

      showFeedback(
        'Tracking Update Failed',
        'We could not save the next tracking update. Please try again.',
      );
    } finally {
      setTrackingUpdating(false);
    }
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
          Loading order details...
        </Text>
      </View>
    );
  }

  /**
   * Error state.
   */
  if (error || !order) {
    return (
      <View style={styles.centeredContainer}>
        <MaterialCommunityIcons
          name="alert-circle-outline"
          size={65}
          color={colors.error}
        />

        <Text style={styles.errorTitle}>
          Unable to Open Order
        </Text>

        <Text style={styles.errorDescription}>
          {error ?? 'The requested order is unavailable.'}
        </Text>

        <Button
          mode="contained"
          icon="clipboard-list-outline"
          onPress={() =>
            router.replace('/(app)/my-orders')
          }
        >
          Back to My Orders
        </Button>
      </View>
    );
  }

  const statusColors = getStatusColors(order.status);

  // Use the saved tracking events as the source of truth.
  const trackingEvents = order.trackingEvents ?? [];

  const completedMilestones = new Set(
    trackingEvents.map((event) => event.milestone),
  );

  const completedCount = TRACKING_STEPS.filter(
    (step) => completedMilestones.has(step.milestone),
  ).length;

  const latestTrackingEvent =
    trackingEvents.length > 0
      ? trackingEvents[trackingEvents.length - 1]
      : null;

  const currentStepIndex = latestTrackingEvent
    ? TRACKING_STEPS.findIndex(
        (step) =>
          step.milestone === latestTrackingEvent.milestone,
      )
    : -1;

  const progressPercentage =
    (completedCount / TRACKING_STEPS.length) * 100;

  const canSimulateTracking =
    order.status !== 'Cancelled' &&
    order.status !== 'Delivered' &&
    completedCount < TRACKING_STEPS.length;

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

          <View style={styles.headerInfo}>
            <Text style={styles.headerTitle}>
              Order Details
            </Text>

            <Text style={styles.headerSubtitle}>
              Review your purchase information
            </Text>
          </View>
        </View>

        {/* Order Information */}
        <Card
          mode="elevated"
          style={styles.card}
        >
          <View style={styles.sectionHeader}>
            <View style={styles.sectionIcon}>
              <MaterialCommunityIcons
                name="receipt"
                size={21}
                color={colors.primary}
              />
            </View>

            <View>
              <Text style={styles.sectionTitle}>
                Order Information
              </Text>

              <Text style={styles.sectionSubtitle}>
                Your purchase reference
              </Text>
            </View>
          </View>

          <Text style={styles.orderNumber}>
            {order.id}
          </Text>

          <Text style={styles.orderDate}>
            Placed on {formatDate(order.createdAt)}
          </Text>

          <View
            style={[
              styles.statusBadge,
              {
                backgroundColor: statusColors.background,
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

          <Divider style={styles.divider} />

          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>
              Customer Username
            </Text>

            <Text style={styles.infoValue}>
              {order.username}
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

          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>
              Payment Method
            </Text>

            <Text style={styles.infoValue}>
              {order.paymentMethod}
            </Text>
          </View>

          {order.status === 'Processing' && (
            <View style={styles.cancelNotice}>
              <MaterialCommunityIcons
                name="information-outline"
                size={20}
                color={colors.error}
              />

              <Text style={styles.cancelNoticeText}>
                This order is still being processed. You can
                cancel it before it is shipped.
              </Text>
            </View>
          )}

          {order.status === 'Cancelled' && (
            <View style={styles.cancelNotice}>
              <MaterialCommunityIcons
                name="cancel"
                size={20}
                color={colors.error}
              />

              <Text style={styles.cancelNoticeText}>
                This order has already been cancelled.
                Cancellation cannot be reversed.
              </Text>
            </View>
          )}
        </Card>

        {/* Order Tracking */}
        <Card
          mode="elevated"
          style={styles.card}
        >
          <View style={styles.sectionHeader}>
            <View style={styles.sectionIcon}>
              <MaterialCommunityIcons
                name="truck-fast-outline"
                size={21}
                color={colors.primary}
              />
            </View>

            <View>
              <Text style={styles.sectionTitle}>
                Order Tracking
              </Text>

              <Text style={styles.sectionSubtitle}>
                Six-stage simulated delivery progress
              </Text>
            </View>
          </View>

          {order.status === 'Cancelled' ? (
            <View style={styles.cancelledContainer}>
              <Text style={styles.cancelledTitle}>
                Order Cancelled
              </Text>

              <Text style={styles.cancelledDescription}>
                This order has been cancelled. The delivery
                tracking process is no longer active.
              </Text>
            </View>
          ) : (
            <>
              {/* Tracking Reference */}
              <View style={styles.trackingReferenceContainer}>
                <Text style={styles.trackingReferenceLabel}>
                  TRACKING REFERENCE NUMBER
                </Text>

                <Text style={styles.trackingReferenceValue}>
                  {order.trackingNumber ?? 'Not available'}
                </Text>
              </View>

              {/* Tracking Progress */}
              <View style={styles.trackingProgressHeader}>
                <Text style={styles.trackingProgressLabel}>
                  Delivery Progress
                </Text>

                <Text style={styles.trackingProgressCount}>
                  {completedCount} of {TRACKING_STEPS.length} completed
                </Text>
              </View>

              <View style={styles.trackingProgressTrack}>
                <View
                  style={[
                    styles.trackingProgressFill,
                    { width: `${progressPercentage}%` },
                  ]}
                />
              </View>

              {/* Tracking Timeline */}
              {TRACKING_STEPS.map((step, index) => {
                const isCompleted =
                  completedMilestones.has(step.milestone);

                const isCurrent =
                  index === currentStepIndex;

                const savedEvent = trackingEvents.find(
                  (event) =>
                    event.milestone === step.milestone,
                );

                return (
                  <View
                    key={step.milestone}
                    style={styles.trackingStep}
                  >
                    <View style={styles.trackingIconColumn}>
                      <View
                        style={[
                          styles.trackingIcon,
                          {
                            backgroundColor: isCompleted
                              ? colors.primary
                              : colors.surfaceVariant,
                          },
                        ]}
                      >
                        <MaterialCommunityIcons
                          name={
                            isCompleted
                              ? 'check'
                              : step.icon
                          }
                          size={17}
                          color={
                            isCompleted
                              ? '#FFFFFF'
                              : colors.onSurfaceVariant
                          }
                        />
                      </View>

                      {index !== TRACKING_STEPS.length - 1 && (
                        <View
                          style={[
                            styles.trackingLine,
                            {
                              backgroundColor:
                                isCompleted &&
                                completedMilestones.has(
                                  TRACKING_STEPS[index + 1].milestone,
                                )
                                  ? colors.primary
                                  : colors.outlineVariant,
                            },
                          ]}
                        />
                      )}
                    </View>

                    <View style={styles.trackingContent}>
                      <Text style={styles.trackingTitle}>
                        {step.title}
                      </Text>

                      <Text style={styles.trackingDescription}>
                        {step.description}
                      </Text>

                      {isCompleted && savedEvent ? (
                        <Text style={styles.trackingTimestamp}>
                          <MaterialCommunityIcons
                            name="clock-outline"
                            size={12}
                          />{' '}
                          {formatDate(savedEvent.timestamp)}
                        </Text>
                      ) : (
                        <Text style={styles.trackingPending}>
                          Awaiting update
                        </Text>
                      )}

                      {isCurrent && (
                        <Text style={styles.currentStepLabel}>
                          LATEST TRACKING UPDATE
                        </Text>
                      )}
                    </View>
                  </View>
                );
              })}

              {/* Manual Demo Tracking Update */}
              {canSimulateTracking && (
                <Button
                  mode="contained"
                  icon="truck-fast-outline"
                  onPress={() => {
                    void handleSimulateTrackingUpdate();
                  }}
                  loading={trackingUpdating}
                  disabled={trackingUpdating || cancelling}
                  style={styles.trackingButton}
                  contentStyle={{ height: 49 }}
                  labelStyle={styles.trackingButtonText}
                >
                  {trackingUpdating
                    ? 'Saving Tracking Update...'
                    : 'Simulate Next Tracking Update'}
                </Button>
              )}

              {order.status === 'Delivered' && (
                <View style={styles.trackingDemoNotice}>
                  <MaterialCommunityIcons
                    name="check-circle-outline"
                    size={20}
                    color={colors.primary}
                  />

                  <Text style={styles.trackingDemoNoticeText}>
                    This order has completed all tracking stages.
                    Delivery has been marked as completed.
                  </Text>
                </View>
              )}
            </>
          )}

          <View style={styles.trackingDemoNotice}>
            <MaterialCommunityIcons
              name="information-outline"
              size={20}
              color={colors.primary}
            />

            <Text style={styles.trackingDemoNoticeText}>
              Tracking updates are simulated for this marketplace
              project. Use the button above to demonstrate the
              next milestone. No real-time courier updates are
              connected.
            </Text>
          </View>
        </Card>

        {/* Purchased Products */}
        <Card
          mode="elevated"
          style={styles.card}
        >
          <View style={styles.sectionHeader}>
            <View style={styles.sectionIcon}>
              <MaterialCommunityIcons
                name="shopping-outline"
                size={21}
                color={colors.primary}
              />
            </View>

            <View>
              <Text style={styles.sectionTitle}>
                Purchased Products
              </Text>

              <Text style={styles.sectionSubtitle}>
                {order.items.length} product type(s)
              </Text>
            </View>
          </View>

          {order.items.map((item, index) => (
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

                <Text style={styles.productUnitPrice}>
                  Unit price: {formatCurrency(item.price)}
                </Text>
              </View>

              <Text style={styles.productTotal}>
                {formatCurrency(item.price * item.quantity)}
              </Text>
            </View>
          ))}
        </Card>

        {/* Payment Summary */}
        <Card
          mode="elevated"
          style={styles.card}
        >
          <View style={styles.sectionHeader}>
            <View style={styles.sectionIcon}>
              <MaterialCommunityIcons
                name="wallet-outline"
                size={21}
                color={colors.primary}
              />
            </View>

            <View>
              <Text style={styles.sectionTitle}>
                Payment Summary
              </Text>

              <Text style={styles.sectionSubtitle}>
                Complete order cost breakdown
              </Text>
            </View>
          </View>

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

          <Divider style={styles.divider} />

          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>
              Total Amount
            </Text>

            <Text style={styles.totalValue}>
              {formatCurrency(order.total)}
            </Text>
          </View>

          <View style={styles.paymentNotice}>
            <MaterialCommunityIcons
              name="information-outline"
              size={20}
              color={colors.primary}
            />

            <Text style={styles.paymentNoticeText}>
              {order.paymentMethod === 'Cash on Delivery'
                ? 'Payment is set to Cash on Delivery. This marketplace demo does not process actual payments.'
                : 'Simulated Online Payment was selected. No real payment transaction was processed.'}
            </Text>
          </View>
        </Card>

        {/* Shipping Information */}
        <Card
          mode="elevated"
          style={styles.card}
        >
          <View style={styles.sectionHeader}>
            <View style={styles.sectionIcon}>
              <MaterialCommunityIcons
                name="map-marker-outline"
                size={21}
                color={colors.primary}
              />
            </View>

            <View>
              <Text style={styles.sectionTitle}>
                Shipping Information
              </Text>

              <Text style={styles.sectionSubtitle}>
                Delivery destination and contact details
              </Text>
            </View>
          </View>

          <Text style={styles.addressText}>
            {order.customer.fullName}
          </Text>

          <Text style={styles.addressText}>
            {order.customer.phone}
          </Text>

          <Text style={styles.addressText}>
            {order.customer.email}
          </Text>

          <Divider style={styles.divider} />

          <Text style={styles.addressText}>
            {order.customer.address}
          </Text>

          <Text style={styles.addressText}>
            {order.customer.city}, {order.customer.province}
          </Text>

          <Text style={styles.addressText}>
            Postal Code: {order.customer.postalCode}
          </Text>

          {order.customer.notes.trim().length > 0 && (
            <View style={styles.notesContainer}>
              <Text style={styles.notesLabel}>
                Delivery Notes
              </Text>

              <Text style={styles.notesText}>
                {order.customer.notes}
              </Text>
            </View>
          )}
        </Card>

        {/* Cancel Order */}
        {order.status === 'Processing' && (
          <Button
            mode="outlined"
            icon="cancel"
            textColor={colors.error}
            buttonColor="transparent"
            style={styles.cancelButton}
            contentStyle={{ height: 49 }}
            loading={cancelling}
            disabled={cancelling || trackingUpdating}
            onPress={handleCancelOrder}
          >
            {cancelling
              ? 'Cancelling Order...'
              : 'Cancel Order'}
          </Button>
        )}

        {/* Back to Orders */}
        <Button
          mode="contained"
          icon="clipboard-list-outline"
          onPress={() =>
            router.replace('/(app)/my-orders')
          }
          style={styles.footerButton}
          contentStyle={{ height: 49 }}
          disabled={cancelling || trackingUpdating}
        >
          Back to My Orders
        </Button>

        <Button
          mode="outlined"
          icon="shopping-outline"
          onPress={() =>
            router.replace('/(app)/(tabs)/home')
          }
          contentStyle={{ height: 47 }}
          disabled={cancelling || trackingUpdating}
        >
          Continue Shopping
        </Button>
      </ScrollView>

      {/* Dialogs */}
      <Portal>
        {/* Cancellation Confirmation Dialog */}
        <Dialog
          visible={cancelDialogVisible}
          onDismiss={() => {
            if (!cancelling) {
              setCancelDialogVisible(false);
            }
          }}
          dismissable={!cancelling}
        >
          <Dialog.Icon
            icon="alert-circle-outline"
            color={colors.error}
          />

          <Dialog.Title>
            Cancel Order?
          </Dialog.Title>

          <Dialog.Content>
            <PaperText variant="bodyMedium">
              Are you sure you want to cancel this order?
              This action cannot be undone.
            </PaperText>
          </Dialog.Content>

          <Dialog.Actions>
            <Button
              onPress={() =>
                setCancelDialogVisible(false)
              }
              disabled={cancelling}
            >
              Keep Order
            </Button>

            <Button
              textColor={colors.error}
              loading={cancelling}
              disabled={cancelling}
              onPress={() => {
                void confirmCancelOrder();
              }}
            >
              Yes, Cancel Order
            </Button>
          </Dialog.Actions>
        </Dialog>

        {/* Feedback Dialog */}
        <Dialog
          visible={feedbackDialogVisible}
          onDismiss={() =>
            setFeedbackDialogVisible(false)
          }
        >
          <Dialog.Title>
            {feedbackTitle}
          </Dialog.Title>

          <Dialog.Content>
            <PaperText variant="bodyMedium">
              {feedbackMessage}
            </PaperText>
          </Dialog.Content>

          <Dialog.Actions>
            <Button
              onPress={() =>
                setFeedbackDialogVisible(false)
              }
            >
              OK
            </Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>
    </View>
  );
}
