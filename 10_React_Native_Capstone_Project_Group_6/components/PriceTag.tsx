import React from 'react';
import { View } from 'react-native';
import { Text } from 'react-native-paper';
import { formatCurrency } from '@/utils/format';

export function PriceTag({
  price,
  discountPercentage = 0,
}: {
  price: number;
  discountPercentage?: number;
}) {
  const discountedPrice = price * (1 - discountPercentage / 100);
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
      <Text variant="titleSmall">{formatCurrency(discountedPrice)}</Text>
      {discountPercentage > 0 ? (
        <Text variant="bodySmall" style={{ textDecorationLine: 'line-through', opacity: 0.65 }}>
          {formatCurrency(price)}
        </Text>
      ) : null}
    </View>
  );
}
