/**
 * Order History Screen
 * Orders placed in the app + the user's carts from GET /carts/user/{id}.
 */
import React, { useCallback, useEffect, useState } from 'react';
import { FlatList, Image, RefreshControl, Text, TouchableOpacity, View } from 'react-native';
import { useRouter } from 'expo-router';
import { Card } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useAuth } from '@/context/AuthContext';
import { useSettings } from '@/context/SettingsContext';
import { useThemedStyles } from '@/hooks';
import { EmptyState, ErrorState } from '@/components/CommonComponents';
import { SeasonSpinner } from '@/components/SeasonSpinner';
import { OrderStatusChip } from '@/components/OrderStatusChip';
import { getOrders } from '@/services/orderService';
import { formatDate, formatPrice } from '@/utils/format';
import { getErrorMessage } from '@/utils/errors';
import type { Order } from '@/types/account';
import { makeCommon } from '@/styles/common';
import { makeOrdersStyles } from '@/styles/orders';

export default function OrdersScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const { palette, t } = useSettings();
  const common = useThemedStyles(makeCommon);
  const styles = useThemedStyles(makeOrdersStyles);
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(
    async (isRefresh = false) => {
      if (!user) return;
      if (isRefresh) setRefreshing(true);
      else setLoading(true);
      setError(null);
      try {
        setOrders(await getOrders(user.id));
      } catch (err) {
        setError(getErrorMessage(err, 'Failed to load orders'));
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [user]
  );

  useEffect(() => {
    load();
  }, [load]);

  if (loading) {
    return (
      <View style={common.centered}>
        <SeasonSpinner size="large" />
      </View>
    );
  }

  if (error) {
    return <ErrorState message={error} onRetry={() => load()} />;
  }

  const renderOrder = ({ item }: { item: Order }) => (
    <TouchableOpacity onPress={() => router.push(`/orders/${item.id}`)} activeOpacity={0.8}>
      <Card style={styles.orderCard} elevation={1}>
        <Card.Content>
          <View style={common.rowBetween}>
            <Text style={styles.orderNumber}>
              Order #{item.cartId}
              {item.giftWrap ? ' 🎁' : ''}
            </Text>
            <OrderStatusChip order={item} />
          </View>
          <Text style={styles.orderDate}>
            {item.createdAt ? formatDate(item.createdAt) : 'Past order'} · {item.totalQuantity} items
          </Text>
          <View style={styles.thumbs}>
            {item.lines.slice(0, 4).map((line) => (
              <Image key={line.id} source={{ uri: line.thumbnail }} style={styles.thumb} resizeMode="contain" />
            ))}
            {item.lines.length > 4 && <Text style={styles.moreText}>+{item.lines.length - 4}</Text>}
          </View>
          <View style={common.rowBetween}>
            <Text style={common.muted}>{t('cart.total')}</Text>
            <View style={common.row}>
              <Text style={styles.total}>{formatPrice(item.grandTotal)}</Text>
              <MaterialCommunityIcons name="chevron-right" size={22} color={palette.textMuted} />
            </View>
          </View>
        </Card.Content>
      </Card>
    </TouchableOpacity>
  );

  return (
    <FlatList
      style={common.screen}
      data={orders}
      keyExtractor={(item) => item.id}
      renderItem={renderOrder}
      contentContainerStyle={orders.length === 0 ? styles.emptyContent : styles.listContent}
      ListEmptyComponent={
        <EmptyState
          icon="package-variant"
          title={t('orders.empty')}
          message={t('orders.emptyMessage')}
          actionLabel={t('cart.continue')}
          onAction={() => router.replace('/home')}
        />
      }
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={() => load(true)}
          colors={[palette.primary]}
          tintColor={palette.primary}
        />
      }
    />
  );
}
