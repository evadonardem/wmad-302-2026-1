/**
 * Small status pill for orders, showing the current tracking stage
 */
import React from 'react';
import { Text, View } from 'react-native';
import type { Order } from '@/types/account';
import { getOrderStage } from '@/utils/orders';
import { useThemedStyles } from '@/hooks';
import { useT } from '@/context/SettingsContext';
import { makeOrdersStyles } from '@/styles/orders';

export function OrderStatusChip({ order }: { order: Order }) {
  const styles = useThemedStyles(makeOrdersStyles);
  const t = useT();
  const stage = getOrderStage(order);
  const done = stage === 'delivered';
  return (
    <View style={[styles.status, done ? styles.statusDone : styles.statusActive]}>
      <Text style={[styles.statusText, done ? styles.statusTextDone : styles.statusTextActive]}>
        {t(`orders.stage.${stage}`)}
      </Text>
    </View>
  );
}
