import React from 'react';
import { DimensionValue, Image, Pressable, StyleProp, StyleSheet, View, ViewStyle } from 'react-native';
import { Card, IconButton, Text } from 'react-native-paper';
import { Skeleton } from '@/components/Skeleton';
import { useAppTheme } from '@/constants/theme';
import type { ProductSummary } from '@/types/product';
import { formatCurrency } from '@/utils/format';

interface ProductCardProps {
  product: ProductSummary;
  onPress: (product: ProductSummary) => void;
  onAddToCart?: (product: ProductSummary) => void;
  wishlisted?: boolean;
  onToggleWishlist?: (product: ProductSummary) => void;
  style?: StyleProp<ViewStyle>;
}

export function ProductCard({
  product,
  onPress,
  onAddToCart,
  wishlisted = false,
  onToggleWishlist,
  style,
}: ProductCardProps) {
  const theme = useAppTheme();
  const discountedPrice = product.price * (1 - product.discountPercentage / 100);
  return (
    <Card style={[styles.card, style]}>
      <View style={styles.imageWrap}>
        <Pressable
          style={styles.imagePressable}
          onPress={() => onPress(product)}
          accessibilityRole="button"
        >
          <Image source={{ uri: product.thumbnail }} style={styles.image} resizeMode="contain" />
        </Pressable>
        {onToggleWishlist ? (
          <IconButton
            icon={wishlisted ? 'heart' : 'heart-outline'}
            iconColor={wishlisted ? theme.colors.error : undefined}
            containerColor="#FFFFFF"
            size={18}
            style={styles.wishlist}
            onPress={() => onToggleWishlist(product)}
            accessibilityLabel={wishlisted ? 'Remove from wishlist' : 'Add to wishlist'}
          />
        ) : null}
      </View>
      <Card.Content style={styles.content}>
        <Text variant="bodySmall" numberOfLines={1} style={styles.category}>{product.category}</Text>
        <Pressable onPress={() => onPress(product)} accessibilityRole="button">
          <Text variant="titleSmall" numberOfLines={2} style={styles.title}>{product.title}</Text>
        </Pressable>
        <Text variant="titleSmall">{formatCurrency(discountedPrice)}</Text>
        {product.discountPercentage > 0 ? (
          <Text variant="bodySmall" style={styles.oldPrice}>{formatCurrency(product.price)}</Text>
        ) : <View style={styles.oldPricePlaceholder} />}
        {onAddToCart ? (
          <IconButton
            icon="cart-plus"
            onPress={() => onAddToCart(product)}
            accessibilityLabel={`Add ${product.title} to cart`}
          />
        ) : null}
      </Card.Content>
    </Card>
  );
}

export function ProductCardSkeleton({ width }: { width: DimensionValue }) {
  return (
    <Card style={[styles.card, { width }]}>
      <View style={styles.imageWrap}>
        <Skeleton height={150} borderRadius={0} />
      </View>
      <Card.Content style={styles.content}>
        <Skeleton height={16} width="55%" borderRadius={4} />
        <View style={styles.titleSkeleton}>
          <Skeleton height={16} width="95%" borderRadius={4} />
          <Skeleton height={16} width="65%" borderRadius={4} />
        </View>
        <Skeleton height={20} width="55%" borderRadius={4} />
        <Skeleton height={16} width="40%" borderRadius={4} />
      </Card.Content>
    </Card>
  );
}

const styles = StyleSheet.create({
  card: { overflow: 'hidden' },
  imageWrap: { height: 150, backgroundColor: '#FFFFFF' },
  imagePressable: { flex: 1 },
  image: { width: '100%', height: '100%' },
  wishlist: { position: 'absolute', top: 4, right: 4 },
  content: { gap: 4, paddingBottom: 12 },
  title: { minHeight: 40 },
  titleSkeleton: { height: 40, justifyContent: 'space-between' },
  category: { textTransform: 'capitalize', opacity: 0.65 },
  oldPrice: { textDecorationLine: 'line-through', opacity: 0.6 },
  oldPricePlaceholder: { height: 16 },
});
