/**
 * Order Detail Screen - tracking timeline, items, shipping, summary and "Buy Again"
 */
import React, { useCallback, useEffect, useState } from 'react';
import { Image, ScrollView, Text, TouchableOpacity, View } from 'react-native';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { Button, Card, Divider, Snackbar } from 'react-native-paper';
import { useCart } from '@/context/CartContext';
import { useSettings } from '@/context/SettingsContext';
import { useThemedStyles } from '@/hooks';
import { EmptyState, ErrorState } from '@/components/CommonComponents';
import { SeasonSpinner } from '@/components/SeasonSpinner';
import { LivelyBackground } from '@/components/LivelyBackground';
import { OrderStatusChip } from '@/components/OrderStatusChip';
import { OrderTimeline } from '@/components/OrderTimeline';
import { DeliveryRoute } from '@/components/DeliveryRoute';
import { getOrderById } from '@/services/orderService';
import { shareReceipt } from '@/services/receipt';
import { SEASONS } from '@/constants/seasons';
import { formatDeliveryDay } from '@/utils/delivery';
import { productApi } from '@/services/productApi';
import { formatDate, formatPrice } from '@/utils/format';
import { getErrorMessage } from '@/utils/errors';
import type { Order } from '@/types/account';
import { makeCommon } from '@/styles/common';
import { makeOrdersStyles } from '@/styles/orders';

export default function OrderDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { addItem } = useCart();
  const { palette, season, t } = useSettings();
  const common = useThemedStyles(makeCommon);
  const styles = useThemedStyles(makeOrdersStyles);
  const [printing, setPrinting] = useState(false);
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [reordering, setReordering] = useState(false);
  const [snackbar, setSnackbar] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    setError(null);
    try {
      setOrder(await getOrderById(id));
    } catch (err) {
      setError(getErrorMessage(err, 'Failed to load order'));
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    load();
  }, [load]);

  /** Adds every item again, using current prices and stock from the API. */
  const handleBuyAgain = async () => {
    if (!order) return;
    setReordering(true);
    try {
      const products = await Promise.all(order.lines.map((line) => productApi.getProductById(line.id)));
      let added = 0;
      products.forEach((product, index) => {
        if (product.stock > 0) {
          addItem(product, order.lines[index].quantity);
          added += 1;
        }
      });
      setSnackbar(
        added === products.length
          ? t('orders.addedAgain')
          : `${added} of ${products.length} items are in stock and were added`
      );
    } catch (err) {
      setSnackbar(getErrorMessage(err, 'Could not add items to cart'));
    } finally {
      setReordering(false);
    }
  };

  const handleReceipt = async () => {
    if (!order) return;
    setPrinting(true);
    try {
      await shareReceipt(order, palette.primary, SEASONS[season].emoji);
    } catch (err) {
      setSnackbar(getErrorMessage(err, 'Could not create the receipt'));
    } finally {
      setPrinting(false);
    }
  };

  if (loading) {
    return (
      <View style={common.centered}>
        <SeasonSpinner size="large" />
      </View>
    );
  }
  if (error) return <ErrorState message={error} onRetry={load} />;
  if (!order) {
    return <EmptyState icon="package-variant-closed" title="Order not found" message="This order does not exist." />;
  }

  return (
    <View style={common.screen}>
      <LivelyBackground />
      <ScrollView contentContainerStyle={common.scrollContent}>
        <Stack.Screen options={{ title: `Order #${order.cartId}` }} />

        <Card style={common.card} elevation={1}>
          <Card.Content>
            <View style={common.rowBetween}>
              <Text style={styles.orderNumber}>Order #{order.cartId}</Text>
              <OrderStatusChip order={order} />
            </View>
            <Text style={styles.orderDate}>
              {order.createdAt ? `Placed ${formatDate(order.createdAt)}` : 'Past order'}
            </Text>
          </Card.Content>
        </Card>

        <Card style={common.card} elevation={1}>
          <Card.Content>
            <Text style={common.sectionTitle}>Tracking</Text>
            <DeliveryRoute order={order} />
            {order.deliveryDate && (
              <Text style={[styles.detailText, { marginVertical: 8 }]}>
                🗓️ {t('checkout.delivery')}: {formatDeliveryDay(order.deliveryDate)} · {order.deliverySlot}
              </Text>
            )}
            <OrderTimeline order={order} />
          </Card.Content>
        </Card>

        <Card style={common.card} elevation={1}>
          <Card.Content>
            <Text style={common.sectionTitle}>Items ({order.totalQuantity})</Text>
            {order.lines.map((line, index) => (
              <View key={line.id}>
                {index > 0 && <Divider style={styles.lineDivider} />}
                <TouchableOpacity style={styles.line} onPress={() => router.push(`/product/${line.id}`)}>
                  <Image source={{ uri: line.thumbnail }} style={styles.lineImage} resizeMode="contain" />
                  <View style={styles.lineInfo}>
                    <Text style={styles.lineTitle} numberOfLines={2}>
                      {line.title}
                    </Text>
                    <Text style={common.muted}>
                      {line.quantity} × {formatPrice(line.price)}
                    </Text>
                  </View>
                  <Text style={styles.lineTotal}>{formatPrice(line.discountedTotal)}</Text>
                </TouchableOpacity>
              </View>
            ))}
            <Button
              mode="contained-tonal"
              icon="cart-arrow-down"
              onPress={handleBuyAgain}
              loading={reordering}
              disabled={reordering}
              style={common.primaryButton}
            >
              {t('orders.buyAgain')}
            </Button>
          </Card.Content>
        </Card>

        {(order.shipping || order.paymentLabel) && (
          <Card style={common.card} elevation={1}>
            <Card.Content>
              {order.shipping && (
                <>
                  <Text style={common.sectionTitle}>Shipping</Text>
                  <Text style={styles.detailText}>{order.shipping.fullName}</Text>
                  <Text style={styles.detailText}>{order.shipping.phone}</Text>
                  <Text style={styles.detailText}>
                    {order.shipping.street}, {order.shipping.city} {order.shipping.postalCode}
                  </Text>
                </>
              )}
              {order.giftWrap && (
                <View style={styles.giftNote}>
                  <Text style={styles.detailText}>🎁 Gift wrapped</Text>
                  {order.giftMessage && <Text style={styles.giftNoteText}>“{order.giftMessage}”</Text>}
                </View>
              )}
              {order.paymentLabel && (
                <>
                  <Text style={[common.sectionTitle, styles.paymentTitle]}>Payment</Text>
                  <Text style={styles.detailText}>{order.paymentLabel}</Text>
                </>
              )}
            </Card.Content>
          </Card>
        )}

        <Card style={common.card} elevation={1}>
          <Card.Content>
            <Text style={common.sectionTitle}>Summary</Text>
            <View style={common.summaryRow}>
              <Text style={common.summaryLabel}>Subtotal</Text>
              <Text style={common.summaryValue}>{formatPrice(order.subtotal)}</Text>
            </View>
            {order.productDiscount > 0 && (
              <View style={common.summaryRow}>
                <Text style={common.summaryLabel}>{t('cart.productDiscounts')}</Text>
                <Text style={common.summaryDiscount}>-{formatPrice(order.productDiscount)}</Text>
              </View>
            )}
            {order.couponDiscount > 0 && (
              <View style={common.summaryRow}>
                <Text style={common.summaryLabel}>Coupon ({order.couponCode})</Text>
                <Text style={common.summaryDiscount}>-{formatPrice(order.couponDiscount)}</Text>
              </View>
            )}
            <View style={common.summaryRow}>
              <Text style={common.summaryLabel}>{t('cart.shipping')}</Text>
              <Text style={common.summaryValue}>
                {order.shippingFee === 0 ? t('cart.free') : formatPrice(order.shippingFee)}
              </Text>
            </View>
            {!!order.giftWrapFee && (
              <View style={common.summaryRow}>
                <Text style={common.summaryLabel}>Gift wrap</Text>
                <Text style={common.summaryValue}>{formatPrice(order.giftWrapFee)}</Text>
              </View>
            )}
            <Divider style={common.divider} />
            <View style={common.rowBetween}>
              <Text style={common.summaryTotalLabel}>{t('cart.total')}</Text>
              <Text style={common.summaryTotalValue}>{formatPrice(order.grandTotal)}</Text>
            </View>
            <Button
              mode="outlined"
              icon="file-pdf-box"
              onPress={handleReceipt}
              loading={printing}
              disabled={printing}
              style={common.primaryButton}
            >
              {t('orders.receipt')}
            </Button>
          </Card.Content>
        </Card>
      </ScrollView>
      <Snackbar
        visible={!!snackbar}
        onDismiss={() => setSnackbar(null)}
        duration={2500}
        action={{ label: t('common.viewCart'), onPress: () => router.push('/cart') }}
      >
        {snackbar}
      </Snackbar>
    </View>
  );
}
