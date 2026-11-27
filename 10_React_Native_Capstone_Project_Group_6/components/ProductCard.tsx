import React from 'react';
import { Image, Pressable, StyleProp, StyleSheet, View, ViewStyle } from 'react-native';
import { Card, IconButton, Text } from 'react-native-paper';
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
  const discountedPrice = product.price * (1 - product.discountPercentage / 100);
  return (
    <Card style={[styles.card, style]}>
      <View style={styles.imageWrap}>
        <Pressable onPress={() => onPress(product)} accessibilityRole="button">
          <Image source={{ uri: product.thumbnail }} style={styles.image} resizeMode="contain" />
        </Pressable>
        {onToggleWishlist ? (
          <IconButton
            icon={wishlisted ? 'heart' : 'heart-outline'}
            iconColor={wishlisted ? '#D32F2F' : undefined}
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
          <Text variant="titleSmall" numberOfLines={2}>{product.title}</Text>
        </Pressable>
        <Text variant="titleSmall">{formatCurrency(discountedPrice)}</Text>
        {product.discountPercentage > 0 ? (
          <Text variant="bodySmall" style={styles.oldPrice}>{formatCurrency(product.price)}</Text>
        ) : null}
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

const styles = StyleSheet.create({
  card: { overflow: 'hidden' },
  imageWrap: { height: 150, backgroundColor: '#FFFFFF' },
  image: { width: '100%', height: '100%' },
  wishlist: { position: 'absolute', top: 4, right: 4 },
  content: { gap: 4, paddingBottom: 12 },
  category: { textTransform: 'capitalize', opacity: 0.65 },
  oldPrice: { textDecorationLine: 'line-through', opacity: 0.6 },
});
