import React from 'react';
import { StyleSheet, View } from 'react-native';
import { IconButton, Text } from 'react-native-paper';
import { useAppTheme } from '@/constants/theme';

interface QuantityStepperProps {
  value: number;
  onDecrease: () => void;
  onIncrease: () => void;
  canIncrease?: boolean;
  compact?: boolean;
}

export function QuantityStepper({
  value,
  onDecrease,
  onIncrease,
  canIncrease = true,
  compact = false,
}: QuantityStepperProps) {
  const theme = useAppTheme();

  return (
    <View
      style={[
        compact ? styles.compact : styles.regular,
        compact && {
          borderColor: theme.colors.outlineVariant,
          backgroundColor: theme.colors.surface,
        },
      ]}
    >
      <IconButton
        icon="minus"
        size={compact ? 14 : 18}
        style={compact ? styles.compactButton : undefined}
        onPress={onDecrease}
        accessibilityLabel="Decrease quantity"
      />
      <Text variant={compact ? 'labelMedium' : 'bodyMedium'}>{value}</Text>
      <IconButton
        icon="plus"
        size={compact ? 14 : 18}
        style={compact ? styles.compactButton : undefined}
        onPress={onIncrease}
        disabled={!canIncrease}
        accessibilityLabel="Increase quantity"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  regular: { flexDirection: 'row', alignItems: 'center' },
  compact: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-end',
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: 16,
    paddingHorizontal: 4,
  },
  compactButton: { width: 28, height: 28, margin: 0 },
});
