import React from 'react';
import { View } from 'react-native';
import { IconButton, Text } from 'react-native-paper';

interface QuantityStepperProps {
  value: number;
  onDecrease: () => void;
  onIncrease: () => void;
  canIncrease?: boolean;
}

export function QuantityStepper({
  value,
  onDecrease,
  onIncrease,
  canIncrease = true,
}: QuantityStepperProps) {
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center' }}>
      <IconButton icon="minus" size={18} onPress={onDecrease} accessibilityLabel="Decrease quantity" />
      <Text variant="bodyMedium">{value}</Text>
      <IconButton
        icon="plus"
        size={18}
        onPress={onIncrease}
        disabled={!canIncrease}
        accessibilityLabel="Increase quantity"
      />
    </View>
  );
}
