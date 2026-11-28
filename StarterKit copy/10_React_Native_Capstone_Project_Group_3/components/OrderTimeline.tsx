/**
 * Order tracking timeline: Placed → Packed → Shipped → Delivered
 */
import React from 'react';
import { Text, View } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import type { Order } from '@/types/account';
import { getOrderStage, getStageTime, ORDER_STAGES } from '@/utils/orders';
import { useThemedStyles } from '@/hooks';
import { useT } from '@/context/SettingsContext';
import { makeOrdersStyles } from '@/styles/orders';

function formatStageTime(date: Date): string {
  return date.toLocaleString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' });
}

export function OrderTimeline({ order }: { order: Order }) {
  const styles = useThemedStyles(makeOrdersStyles);
  const t = useT();
  const currentIndex = ORDER_STAGES.indexOf(getOrderStage(order));

  return (
    <View accessibilityRole="list">
      {ORDER_STAGES.map((stage, index) => {
        const done = index <= currentIndex;
        const isLast = index === ORDER_STAGES.length - 1;
        const time = getStageTime(order, stage);
        return (
          <View key={stage} style={styles.timelineStep}>
            <View style={styles.timelineRail}>
              <View style={[styles.timelineDot, done && styles.timelineDotDone]}>
                {done && <MaterialCommunityIcons name="check" size={14} color="#FFFFFF" />}
              </View>
              {!isLast && <View style={[styles.timelineLine, index < currentIndex && styles.timelineLineDone]} />}
            </View>
            <View style={styles.timelineContent}>
              <Text style={[styles.timelineLabel, !done && styles.timelineLabelPending]}>
                {t(`orders.stage.${stage}`)}
              </Text>
              {time && (
                <Text style={styles.timelineTime}>
                  {done ? formatStageTime(time) : `Expected ${formatStageTime(time)}`}
                </Text>
              )}
            </View>
          </View>
        );
      })}
    </View>
  );
}
