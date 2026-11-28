/**
 * Reusable UI Components (themed: they follow light/dark and the seasonal palettes)
 */

import React from 'react';
import {
  DimensionValue,
  Image,
  Platform,
  StyleProp,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  ViewStyle,
} from 'react-native';
import { Badge, Button, Card, IconButton } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import type { ProductSummary } from '@/types/product';
import type { IconName } from '@/constants/categories';
import type { Palette } from '@/constants/palettes';
import { formatCategory, formatPrice, getDiscountedPrice } from '@/utils/format';
import { useThemedStyles } from '@/hooks';
import { useAppTheme, useSettings, useT } from '@/context/SettingsContext';
import { SEASONS } from '@/constants/seasons';
import { SeasonSpinner } from './SeasonSpinner';
import { useFlyToCart } from './FlyToCart';

/** Top-rated products get the season's ribbon ("🎃 Spooky pick", "🎁 Gift idea" …). */
export function isSeasonPick(product: ProductSummary): boolean {
  return product.rating >= 4.5 && product.stock > 0;
}

interface ProductCardProps {
  product: ProductSummary;
  onPress: () => void;
  /** Shows a cart button on the card when provided. */
  onAddToCart?: () => void;
  style?: StyleProp<ViewStyle>;
}

export function ProductCard({ product, onPress, onAddToCart, style }: ProductCardProps) {
  const styles = useThemedStyles(makeStyles);
  const { palette, isHoliday, season } = useAppTheme();
  const flyToCart = useFlyToCart();
  const t = useT();
  const discountedPrice = getDiscountedPrice(product.price, product.discountPercentage);
  const inStock = product.stock > 0;

  return (
    <TouchableOpacity
      style={[styles.cardWrapper, style]}
      onPress={onPress}
      activeOpacity={0.8}
      // On web a "button" role renders <button>, which can't contain the add-to-cart button
      accessibilityRole={Platform.OS === 'web' ? 'link' : 'button'}
      accessibilityLabel={`${product.title}, ${formatPrice(discountedPrice)}`}
    >
      <Card style={styles.card} elevation={2}>
        <View style={styles.imageContainer}>
          <Image source={{ uri: product.thumbnail }} style={styles.productImage} resizeMode="contain" />
          {product.discountPercentage > 0 && (
            <Badge style={styles.discountBadge}>{`-${Math.round(product.discountPercentage)}%`}</Badge>
          )}
          {isSeasonPick(product) && (
            <View style={styles.giftRibbon}>
              <Text style={styles.giftRibbonText}>{t(`pick.${season}`)}</Text>
            </View>
          )}
        </View>
        <Card.Content style={styles.cardContent}>
          <Text style={styles.productCategory} numberOfLines={1}>
            {formatCategory(product.category)}
          </Text>
          <Text style={styles.productTitle} numberOfLines={2}>
            {product.title}
          </Text>
          <View style={styles.priceRow}>
            <Text style={styles.currentPrice}>{formatPrice(discountedPrice)}</Text>
            {product.discountPercentage > 0 && (
              <Text style={styles.originalPrice}>{formatPrice(product.price)}</Text>
            )}
          </View>
          <View style={styles.footerRow}>
            <Text style={styles.ratingText} numberOfLines={1}>
              ⭐ {product.rating.toFixed(1)} · {inStock ? 'In Stock' : 'Out of Stock'}
            </Text>
            {onAddToCart && (
              <IconButton
                icon={isHoliday ? 'gift-outline' : 'cart-plus'}
                size={20}
                mode="contained"
                containerColor={palette.primaryContainer}
                iconColor={palette.primary}
                style={styles.addButton}
                onPress={(event) => {
                  flyToCart(product.thumbnail, { x: event.nativeEvent.pageX, y: event.nativeEvent.pageY });
                  onAddToCart();
                }}
                disabled={!inStock}
                accessibilityLabel={`Add ${product.title} to cart`}
              />
            )}
          </View>
        </Card.Content>
      </Card>
    </TouchableOpacity>
  );
}

interface CategoryChipProps {
  label: string;
  selected?: boolean;
  onPress: () => void;
  icon?: IconName;
  style?: StyleProp<ViewStyle>;
}

export function CategoryChip({ label, selected, onPress, icon, style }: CategoryChipProps) {
  const styles = useThemedStyles(makeStyles);
  const { palette } = useAppTheme();
  return (
    <TouchableOpacity
      style={[styles.categoryChip, selected && styles.categoryChipSelected, style]}
      onPress={onPress}
      accessibilityRole="button"
      accessibilityState={{ selected: !!selected }}
    >
      {icon && (
        <MaterialCommunityIcons
          name={icon}
          size={16}
          color={selected ? palette.onPrimary : palette.primary}
          style={styles.chipIcon}
        />
      )}
      <Text style={[styles.categoryChipText, selected && styles.categoryChipTextSelected]}>{label}</Text>
    </TouchableOpacity>
  );
}

interface LoadingOverlayProps {
  visible: boolean;
  message?: string;
}

export function LoadingOverlay({ visible, message }: LoadingOverlayProps) {
  const styles = useThemedStyles(makeStyles);
  const t = useT();
  if (!visible) return null;

  return (
    <View style={styles.loadingOverlay}>
      <SeasonSpinner size="large" />
      <Text style={styles.loadingText}>{message ?? t('common.loading')}</Text>
    </View>
  );
}

interface EmptyStateProps {
  icon: IconName;
  title: string;
  message: string;
  actionLabel?: string;
  onAction?: () => void;
}

export function EmptyState({ icon, title, message, actionLabel, onAction }: EmptyStateProps) {
  const styles = useThemedStyles(makeStyles);
  const { palette, season, heading, t } = useSettings();
  const scene = SEASONS[season].scenery;
  return (
    <View style={styles.emptyState}>
      <View style={[styles.emptyCircle, { backgroundColor: palette.primaryContainer }]}>
        <MaterialCommunityIcons name={icon} size={64} color={palette.primary} />
      </View>
      <Text style={styles.emptyScene} accessibilityElementsHidden importantForAccessibility="no">
        {scene[0]} {scene[2]} {scene[4]}
      </Text>
      <Text style={[styles.emptyTitle, heading(24)]}>{title}</Text>
      <Text style={styles.emptyMessage}>{message}</Text>
      <Text style={styles.emptyCaption}>{t(`empty.${season}`)}</Text>
      {actionLabel && onAction && (
        <Button mode="contained" onPress={onAction} style={styles.actionButton} contentStyle={styles.actionContent}>
          {actionLabel}
        </Button>
      )}
    </View>
  );
}

interface ErrorStateProps {
  message: string;
  onRetry?: () => void;
}

export function ErrorState({ message, onRetry }: ErrorStateProps) {
  const t = useT();
  return (
    <EmptyState
      icon="cloud-alert"
      title="Something went wrong"
      message={message}
      actionLabel={onRetry ? t('common.retry') : undefined}
      onAction={onRetry}
    />
  );
}

interface SkeletonProps {
  height?: number;
  width?: DimensionValue;
  borderRadius?: number;
  style?: StyleProp<ViewStyle>;
}

export function Skeleton({ height = 20, width = '100%', borderRadius = 8, style }: SkeletonProps) {
  const styles = useThemedStyles(makeStyles);
  return <View style={[styles.skeleton, { height, width, borderRadius }, style]} />;
}

/** Placeholder grid shown while products load. */
export function ProductGridSkeleton({ count = 4, itemWidth }: { count?: number; itemWidth: number }) {
  const styles = useThemedStyles(makeStyles);
  return (
    <View style={styles.skeletonGrid}>
      {Array.from({ length: count }, (_, index) => (
        <View key={index} style={{ width: itemWidth }}>
          <Skeleton height={140} borderRadius={12} />
          <Skeleton height={12} width="50%" style={styles.skeletonLine} />
          <Skeleton height={16} width="90%" style={styles.skeletonLine} />
          <Skeleton height={18} width="40%" style={styles.skeletonLine} />
        </View>
      ))}
    </View>
  );
}

interface QuantitySelectorProps {
  value: number;
  min?: number;
  max: number;
  onChange: (value: number) => void;
}

export function QuantitySelector({ value, min = 1, max, onChange }: QuantitySelectorProps) {
  const styles = useThemedStyles(makeStyles);
  return (
    <View style={styles.quantity}>
      <IconButton
        icon="minus"
        size={18}
        onPress={() => onChange(value - 1)}
        disabled={value <= min}
        accessibilityLabel="Decrease quantity"
      />
      <Text style={styles.quantityText}>{value}</Text>
      <IconButton
        icon="plus"
        size={18}
        onPress={() => onChange(value + 1)}
        disabled={value >= max}
        accessibilityLabel="Increase quantity"
      />
    </View>
  );
}

const makeStyles = (c: Palette) =>
  StyleSheet.create({
    cardWrapper: {
      marginBottom: 12,
    },
    card: {
      borderRadius: 12,
      overflow: 'hidden',
      backgroundColor: c.surface,
      borderWidth: 1.5,
      borderColor: c.primaryContainer,
    },
    imageContainer: {
      position: 'relative',
      height: 150,
      backgroundColor: c.surfaceMuted,
      alignItems: 'center',
      justifyContent: 'center',
    },
    productImage: {
      width: '90%',
      height: '90%',
    },
    discountBadge: {
      position: 'absolute',
      top: 8,
      left: 8,
      zIndex: 1,
      backgroundColor: c.danger,
    },
    giftRibbon: {
      position: 'absolute',
      bottom: 0,
      left: 0,
      right: 0,
      paddingVertical: 3,
      alignItems: 'center',
      backgroundColor: c.secondary,
    },
    giftRibbonText: {
      fontSize: 11,
      fontWeight: '700',
      color: c.isDark ? c.background : '#FFFFFF',
    },
    cardContent: {
      padding: 12,
    },
    productTitle: {
      fontSize: 15,
      lineHeight: 20,
      fontWeight: '700',
      color: c.text,
      marginBottom: 6,
    },
    productCategory: {
      fontSize: 12,
      color: c.primary,
      fontWeight: '500',
      marginTop: 4,
    },
    footerRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
    },
    ratingText: {
      flexShrink: 1,
      fontSize: 12,
      color: c.textMuted,
      fontWeight: '500',
    },
    addButton: {
      margin: 0,
    },
    priceRow: {
      flexDirection: 'row',
      alignItems: 'center',
      flexWrap: 'wrap',
      gap: 6,
      marginBottom: 6,
    },
    currentPrice: {
      fontSize: 17,
      fontWeight: '700',
      color: c.primary,
    },
    originalPrice: {
      fontSize: 12,
      color: c.strike,
      textDecorationLine: 'line-through',
    },
    categoryChip: {
      paddingHorizontal: 16,
      paddingVertical: 8,
      borderRadius: 20,
      borderColor: c.primaryContainer,
      borderWidth: 1.5,
      backgroundColor: c.surface,
      flexDirection: 'row',
      alignItems: 'center',
    },
    categoryChipSelected: {
      backgroundColor: c.primary,
      borderColor: c.primary,
    },
    chipIcon: {
      marginRight: 4,
    },
    categoryChipText: {
      fontSize: 13,
      fontWeight: '500',
      color: c.primary,
    },
    categoryChipTextSelected: {
      color: c.onPrimary,
    },
    loadingOverlay: {
      ...StyleSheet.absoluteFillObject,
      justifyContent: 'center',
      alignItems: 'center',
      backgroundColor: c.overlay,
      zIndex: 100,
    },
    loadingText: {
      marginTop: 12,
      fontSize: 16,
      color: c.textMuted,
    },
    emptyState: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      paddingHorizontal: 32,
      paddingVertical: 48,
    },
    emptyCircle: {
      width: 128,
      height: 128,
      borderRadius: 64,
      alignItems: 'center',
      justifyContent: 'center',
    },
    emptyScene: {
      fontSize: 30,
      marginTop: 12,
      letterSpacing: 6,
    },
    emptyCaption: {
      fontSize: 14,
      fontWeight: '600',
      color: c.primary,
      marginTop: 10,
      textAlign: 'center',
    },
    emptyTitle: {
      fontSize: 22,
      fontWeight: '700',
      color: c.text,
      marginTop: 20,
      textAlign: 'center',
    },
    emptyMessage: {
      fontSize: 16,
      color: c.textMuted,
      marginTop: 8,
      textAlign: 'center',
    },
    actionButton: {
      marginTop: 24,
      borderRadius: 8,
    },
    actionContent: {
      paddingHorizontal: 16,
      paddingVertical: 6,
    },
    skeleton: {
      backgroundColor: c.skeleton,
    },
    skeletonGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 12,
      paddingHorizontal: 16,
    },
    skeletonLine: {
      marginTop: 8,
    },
    quantity: {
      flexDirection: 'row',
      alignItems: 'center',
      borderWidth: 1,
      borderColor: c.border,
      borderRadius: 8,
    },
    quantityText: {
      minWidth: 28,
      textAlign: 'center',
      fontSize: 16,
      fontWeight: '600',
      color: c.text,
    },
  });
