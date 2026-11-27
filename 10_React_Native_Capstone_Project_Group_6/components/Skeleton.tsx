import React from 'react';
import { DimensionValue, StyleSheet, View } from 'react-native';
import { useAppTheme } from '@/constants/theme';

interface SkeletonProps {
  height?: number;
  width?: DimensionValue;
  borderRadius?: number;
}

export function Skeleton({ height = 20, width = '100%', borderRadius = 8 }: SkeletonProps) {
  const theme = useAppTheme();
  return (
    <View
      style={[
        styles.skeleton,
        { height, width, borderRadius, backgroundColor: theme.colors.surfaceVariant },
      ]}
    />
  );
}

export function ProductCardSkeleton({ width }: { width: DimensionValue }) {
  return (
    <View style={{ width, gap: 8 }}>
      <Skeleton height={160} borderRadius={12} />
      <Skeleton height={16} width="80%" />
      <Skeleton height={16} width="50%" />
    </View>
  );
}

const styles = StyleSheet.create({
  skeleton: { opacity: 0.7 },
});
