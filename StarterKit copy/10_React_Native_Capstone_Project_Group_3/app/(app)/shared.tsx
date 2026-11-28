/**
 * Shared Screen - opened from a shared cart / gift list link
 * (marketplace://shared?kind=cart&items=12x2,5x1&title=…). Loads the products
 * and lets the recipient add them all to their cart.
 */
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { FlatList, Image, Text, TouchableOpacity, View } from 'react-native';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { Button, Snackbar } from 'react-native-paper';
import { productApi } from '@/services/productApi';
import { useCart } from '@/context/CartContext';
import { useSettings } from '@/context/SettingsContext';
import { useThemedStyles } from '@/hooks';
import { EmptyState, ErrorState } from '@/components/CommonComponents';
import { LivelyBackground } from '@/components/LivelyBackground';
import { GlassCard } from '@/components/GlassCard';
import { SeasonSpinner } from '@/components/SeasonSpinner';
import { haptic } from '@/services/feedback';
import { decodeShareItems } from '@/utils/share';
import { formatPrice, getDiscountedPrice } from '@/utils/format';
import type { Product } from '@/types/product';
import { makeCommon } from '@/styles/common';
import { makeRewardsStyles } from '@/styles/rewards';

export default function SharedScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ kind?: string; items?: string; title?: string }>();
  const { addItem } = useCart();
  const { heading, t } = useSettings();
  const common = useThemedStyles(makeCommon);
  const styles = useThemedStyles(makeRewardsStyles);
  const shared = useMemo(() => decodeShareItems(params.items), [params.items]);
  const [products, setProducts] = useState<{ product: Product; quantity: number }[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [snackbar, setSnackbar] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    const results = await Promise.allSettled(shared.map((item) => productApi.getProductById(item.id)));
    const loaded = results.flatMap((result, index) =>
      result.status === 'fulfilled' ? [{ product: result.value, quantity: shared[index].quantity }] : []
    );
    if (loaded.length === 0 && shared.length > 0) setError(t('shared.error'));
    setProducts(loaded);
    setLoading(false);
  }, [shared, t]);

  useEffect(() => {
    load();
  }, [load]);

  const title = params.title || (params.kind === 'list' ? t('shared.list') : t('shared.cart'));

  const addAll = () => {
    products.forEach(({ product, quantity }) => {
      if (product.stock > 0) addItem(product, Math.min(quantity, product.stock));
    });
    haptic('success');
    setSnackbar(t('shared.added', { count: products.length }));
  };

  if (shared.length === 0) {
    return (
      <View style={common.screen}>
        <LivelyBackground />
        <EmptyState icon="link-variant-off" title={t('shared.invalid')} message={t('shared.invalidMessage')} />
      </View>
    );
  }

  return (
    <View style={common.screen}>
      <LivelyBackground />
      <Stack.Screen options={{ title }} />
      {loading ? (
        <View style={common.centered}>
          <SeasonSpinner size="large" />
        </View>
      ) : error ? (
        <ErrorState message={error} onRetry={load} />
      ) : (
        <FlatList
          data={products}
          keyExtractor={({ product }) => product.id.toString()}
          contentContainerStyle={common.scrollContent}
          ListHeaderComponent={
            <GlassCard>
              <Text style={[styles.listName, heading(24)]}>🔗 {title}</Text>
              <Text style={styles.listMeta}>{t('shared.intro', { count: products.length })}</Text>
              <Button mode="contained" icon="cart-plus" onPress={addAll} style={{ marginTop: 12 }}>
                {t('shared.addAll')}
              </Button>
            </GlassCard>
          }
          renderItem={({ item: { product, quantity } }) => (
            <TouchableOpacity style={styles.listItem} onPress={() => router.push(`/product/${product.id}`)}>
              <Image source={{ uri: product.thumbnail }} style={styles.listItemImage} resizeMode="contain" />
              <View style={styles.flex}>
                <Text style={styles.listItemTitle} numberOfLines={1}>
                  {quantity} × {product.title}
                </Text>
                <Text style={styles.listItemPrice}>
                  {formatPrice(getDiscountedPrice(product.price, product.discountPercentage))}
                </Text>
              </View>
            </TouchableOpacity>
          )}
        />
      )}
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
