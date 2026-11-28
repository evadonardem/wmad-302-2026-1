/**
 * Compare Screen - up to 3 products side by side.
 * The best value in each numeric row (lowest price, highest rating, …) is highlighted.
 */
import React, { useState } from 'react';
import { Image, ScrollView, Text, TouchableOpacity, View } from 'react-native';
import { useRouter } from 'expo-router';
import { Button, Card, IconButton, Snackbar } from 'react-native-paper';
import { useActivity, MAX_COMPARE } from '@/context/ActivityContext';
import { useCart } from '@/context/CartContext';
import { useSettings } from '@/context/SettingsContext';
import { useThemedStyles } from '@/hooks';
import { EmptyState } from '@/components/CommonComponents';
import { LivelyBackground } from '@/components/LivelyBackground';
import { formatCategory, formatPrice, getDiscountedPrice } from '@/utils/format';
import type { Product } from '@/types/product';
import { makeCommon } from '@/styles/common';
import { makeAccountStyles } from '@/styles/account';

interface CompareRow {
  label: string;
  value: (p: Product) => string;
  /** Numeric score; the highest score in the row is highlighted. */
  score?: (p: Product) => number;
}

const ROWS: CompareRow[] = [
  {
    label: 'Price',
    value: (p) => formatPrice(getDiscountedPrice(p.price, p.discountPercentage)),
    score: (p) => -getDiscountedPrice(p.price, p.discountPercentage),
  },
  { label: 'Discount', value: (p) => `${Math.round(p.discountPercentage)}%`, score: (p) => p.discountPercentage },
  { label: 'Rating', value: (p) => `⭐ ${p.rating.toFixed(1)}`, score: (p) => p.rating },
  { label: 'Reviews', value: (p) => String(p.reviews.length), score: (p) => p.reviews.length },
  { label: 'Stock', value: (p) => String(p.stock), score: (p) => p.stock },
  { label: 'Brand', value: (p) => p.brand ?? '—' },
  { label: 'Category', value: (p) => formatCategory(p.category) },
  { label: 'Weight', value: (p) => `${p.weight} g`, score: (p) => -p.weight },
  { label: 'Warranty', value: (p) => p.warrantyInformation },
  { label: 'Shipping', value: (p) => p.shippingInformation },
  { label: 'Returns', value: (p) => p.returnPolicy },
];

export default function CompareScreen() {
  const router = useRouter();
  const { compare, toggleCompare, clearCompare } = useActivity();
  const { addItem } = useCart();
  const { t } = useSettings();
  const common = useThemedStyles(makeCommon);
  const styles = useThemedStyles(makeAccountStyles);
  const [snackbar, setSnackbar] = useState<string | null>(null);

  if (compare.length === 0) {
    return (
      <EmptyState
        icon="compare-horizontal"
        title="Nothing to compare"
        message={`Tap the compare icon on up to ${MAX_COMPARE} products to see them side by side.`}
        actionLabel={t('cart.continue')}
        onAction={() => router.replace('/search')}
      />
    );
  }

  const bestIndex = (row: CompareRow): number | null => {
    if (!row.score || compare.length < 2) return null;
    const scores = compare.map(row.score);
    const best = Math.max(...scores);
    return scores.filter((s) => s === best).length === 1 ? scores.indexOf(best) : null;
  };

  return (
    <View style={common.screen}>
      <LivelyBackground />
      <ScrollView contentContainerStyle={common.scrollContent}>
        <Card style={common.card} elevation={1}>
          <Card.Content>
            {/* Product headers */}
            <View style={styles.compareHeader}>
              <View style={styles.compareLabelCell} />
              {compare.map((product) => (
                <View key={product.id} style={styles.compareCell}>
                  <IconButton
                    icon="close"
                    size={16}
                    onPress={() => toggleCompare(product)}
                    accessibilityLabel={`Remove ${product.title} from compare`}
                  />
                  <TouchableOpacity onPress={() => router.push(`/product/${product.id}`)} style={{ alignItems: 'center' }}>
                    <Image source={{ uri: product.thumbnail }} style={styles.compareImage} resizeMode="contain" />
                    <Text style={styles.compareTitle} numberOfLines={2}>
                      {product.title}
                    </Text>
                  </TouchableOpacity>
                </View>
              ))}
            </View>

            {ROWS.map((row) => {
              const best = bestIndex(row);
              return (
                <View key={row.label} style={styles.compareRow}>
                  <View style={styles.compareLabelCell}>
                    <Text style={styles.compareLabel}>{row.label}</Text>
                  </View>
                  {compare.map((product, index) => (
                    <View key={product.id} style={styles.compareCell}>
                      <Text style={[styles.compareValue, best === index && styles.compareBest]}>{row.value(product)}</Text>
                    </View>
                  ))}
                </View>
              );
            })}

            {/* Add to cart buttons */}
            <View style={styles.compareHeader}>
              <View style={styles.compareLabelCell} />
              {compare.map((product) => (
                <View key={product.id} style={styles.compareCell}>
                  <IconButton
                    icon="cart-plus"
                    mode="contained"
                    disabled={product.stock <= 0}
                    onPress={() => {
                      addItem(product);
                      setSnackbar(t('common.addedToCart', { title: product.title }));
                    }}
                    accessibilityLabel={`Add ${product.title} to cart`}
                  />
                </View>
              ))}
            </View>
          </Card.Content>
        </Card>

        <Text style={common.muted}>Green values are the best in each row.</Text>
        <Button mode="text" onPress={clearCompare} style={common.primaryButton}>
          {t('common.clear')}
        </Button>
      </ScrollView>
      <Snackbar
        visible={!!snackbar}
        onDismiss={() => setSnackbar(null)}
        duration={2500}
        action={{ label: t('common.viewCart'), onPress: () => router.push('/cart') }}
      >
        {snackbar}
      </Snackbar>
    </View>
  );
}
