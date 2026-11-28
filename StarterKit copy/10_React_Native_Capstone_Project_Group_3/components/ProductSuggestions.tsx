/**
 * Product page suggestions:
 *  - "Frequently bought together": this product plus two top-rated picks from a
 *    complementary category, with one button to add the whole bundle;
 *  - "Similar products": more from the same category.
 * DummyJSON has no recommendation endpoint, so both are built from category lists.
 */
import React, { useEffect, useState } from 'react';
import { Image, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { Button } from 'react-native-paper';
import { productApi } from '@/services/productApi';
import { useCart } from '@/context/CartContext';
import { useSettings } from '@/context/SettingsContext';
import { ProductCard } from './CommonComponents';
import { useFlyToCart } from './FlyToCart';
import { formatPrice, getDiscountedPrice } from '@/utils/format';
import type { Product } from '@/types/product';

/** Category that pairs well with each category (falls back to the same one). */
export const COMPLEMENTARY_CATEGORIES: Record<string, string> = {
  smartphones: 'mobile-accessories',
  tablets: 'mobile-accessories',
  laptops: 'mobile-accessories',
  'mobile-accessories': 'smartphones',
  'mens-shirts': 'mens-shoes',
  'mens-shoes': 'mens-watches',
  'mens-watches': 'mens-shirts',
  'womens-dresses': 'womens-shoes',
  'womens-shoes': 'womens-bags',
  'womens-bags': 'womens-jewellery',
  'womens-jewellery': 'womens-watches',
  'womens-watches': 'womens-dresses',
  tops: 'womens-jewellery',
  beauty: 'skin-care',
  'skin-care': 'fragrances',
  fragrances: 'beauty',
  furniture: 'home-decoration',
  'home-decoration': 'furniture',
  'kitchen-accessories': 'groceries',
  groceries: 'kitchen-accessories',
  'sports-accessories': 'sunglasses',
  sunglasses: 'sports-accessories',
  motorcycle: 'sports-accessories',
  vehicle: 'motorcycle',
};

/** Two well-rated, in-stock picks that are not the product itself. */
export function pickBundle(product: Product, candidates: Product[]): Product[] {
  return candidates
    .filter((candidate) => candidate.id !== product.id && candidate.stock > 0)
    .sort((a, b) => b.rating - a.rating)
    .slice(0, 2);
}

export function ProductSuggestions({ product, cardWidth }: { product: Product; cardWidth: number }) {
  const router = useRouter();
  const { addItem } = useCart();
  const { palette, heading, t } = useSettings();
  const flyToCart = useFlyToCart();
  const [similar, setSimilar] = useState<Product[]>([]);
  const [bundle, setBundle] = useState<Product[]>([]);

  useEffect(() => {
    let active = true;
    const pairCategory = COMPLEMENTARY_CATEGORIES[product.category] ?? product.category;
    Promise.all([
      productApi.getProductsByCategory(product.category, { limit: 12 }),
      pairCategory === product.category
        ? Promise.resolve(null)
        : productApi.getProductsByCategory(pairCategory, { limit: 12 }),
    ])
      .then(([same, pair]) => {
        if (!active) return;
        setSimilar(same.products.filter((p) => p.id !== product.id));
        setBundle(pickBundle(product, (pair ?? same).products));
      })
      .catch(() => undefined); // optional section
    return () => {
      active = false;
    };
  }, [product]);

  const bundleItems = [product, ...bundle];
  const bundleTotal = bundleItems.reduce((sum, p) => sum + getDiscountedPrice(p.price, p.discountPercentage), 0);

  return (
    <View>
      {bundle.length > 0 && (
        <View style={[styles.bundle, { borderColor: palette.primaryContainer, backgroundColor: palette.surface }]}>
          <Text style={[{ color: palette.text }, heading(20)]}>🤝 {t('product.boughtTogether')}</Text>
          <View style={styles.bundleRow}>
            {bundleItems.map((item, index) => (
              <React.Fragment key={item.id}>
                {index > 0 && <Text style={[styles.plus, { color: palette.primary }]}>+</Text>}
                <View style={styles.bundleItem}>
                  <Image source={{ uri: item.thumbnail }} style={[styles.bundleImage, { backgroundColor: palette.surfaceMuted }]} />
                  <Text style={[styles.bundleTitle, { color: palette.text }]} numberOfLines={2}>
                    {item.title}
                  </Text>
                </View>
              </React.Fragment>
            ))}
          </View>
          <Button
            mode="contained"
            icon="cart-plus"
            onPress={(event) => {
              bundleItems.forEach((item) => addItem(item));
              flyToCart(product.thumbnail, { x: event.nativeEvent.pageX, y: event.nativeEvent.pageY });
            }}
          >
            {t('product.addBundle', { count: bundleItems.length, total: formatPrice(bundleTotal) })}
          </Button>
        </View>
      )}

      {similar.length > 0 && (
        <View>
          <Text style={[styles.sectionTitle, { color: palette.text }, heading(20)]}>✨ {t('product.similar')}</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.similarRow}>
            {similar.map((item) => (
              <ProductCard
                key={item.id}
                product={item}
                style={{ width: cardWidth }}
                onPress={() => router.push(`/product/${item.id}`)}
              />
            ))}
          </ScrollView>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  bundle: {
    borderWidth: 1.5,
    borderRadius: 16,
    padding: 14,
    marginVertical: 12,
    gap: 12,
  },
  bundleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  bundleItem: {
    flex: 1,
    alignItems: 'center',
  },
  bundleImage: {
    width: 64,
    height: 64,
    borderRadius: 12,
  },
  bundleTitle: {
    fontSize: 11,
    textAlign: 'center',
    marginTop: 4,
  },
  plus: {
    fontSize: 22,
    fontWeight: '900',
    marginHorizontal: 4,
  },
  sectionTitle: {
    marginTop: 8,
    marginBottom: 8,
  },
  similarRow: {
    gap: 12,
    paddingBottom: 4,
  },
});
