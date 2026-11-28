/**
 * Home Screen - Marketplace Shop Tab
 * Lively background, seasonal banner, category shortcuts, flash deals with a
 * countdown, recently viewed products, and an infinitely scrolling responsive
 * product grid (GET /products?limit&skip).
 */
import React, { useCallback, useEffect, useState } from 'react';
import { FlatList, RefreshControl, ScrollView, Text, TouchableOpacity, View } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Snackbar } from 'react-native-paper';
import { useAuth } from '@/context/AuthContext';
import { useCart } from '@/context/CartContext';
import { useActivity } from '@/context/ActivityContext';
import { useSettings } from '@/context/SettingsContext';
import { productApi } from '@/services/productApi';
import { useGridColumns, useInfiniteScroll, useThemedStyles, PageResult } from '@/hooks';
import { CategoryChip, ErrorState, ProductCard, ProductGridSkeleton } from '@/components/CommonComponents';
import { SeasonSpinner } from '@/components/SeasonSpinner';
import { SeasonBanner } from '@/components/SeasonBanner';
import { LivelyBackground } from '@/components/LivelyBackground';
import { SeasonHero } from '@/components/SeasonHero';
import { RewardsStrip } from '@/components/RewardsStrip';
import { SEASONS } from '@/constants/seasons';
import { getCategoryIcon } from '@/constants/categories';
import type { Product, ProductCategory, ProductSummary } from '@/types/product';
import { makeCommon } from '@/styles/common';
import { makeHomeStyles } from '@/styles/home';

const PAGE_SIZE = 20;

/** Time left until midnight, formatted HH:MM:SS. */
function useCountdownToMidnight(): string {
  const getRemaining = () => {
    const now = new Date();
    const midnight = new Date(now);
    midnight.setHours(24, 0, 0, 0);
    const total = Math.max(0, Math.floor((midnight.getTime() - now.getTime()) / 1000));
    const pad = (n: number) => n.toString().padStart(2, '0');
    return `${pad(Math.floor(total / 3600))}:${pad(Math.floor((total % 3600) / 60))}:${pad(total % 60)}`;
  };
  const [remaining, setRemaining] = useState(getRemaining);
  useEffect(() => {
    const timer = setInterval(() => setRemaining(getRemaining()), 1000);
    return () => clearInterval(timer);
  }, []);
  return remaining;
}

export default function HomeScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const { addItem } = useCart();
  const { recentlyViewed } = useActivity();
  const { palette, season, heading, t } = useSettings();
  const motifs = SEASONS[season].motifs;
  const common = useThemedStyles(makeCommon);
  const styles = useThemedStyles(makeHomeStyles);
  const { columns, itemWidth } = useGridColumns();
  const countdown = useCountdownToMidnight();

  const [categories, setCategories] = useState<ProductCategory[]>([]);
  const [deals, setDeals] = useState<Product[]>([]);
  const [snackbar, setSnackbar] = useState<string | null>(null);

  const fetchPage = useCallback(async (page: number, limit: number): Promise<PageResult<Product>> => {
    const res = await productApi.getProducts({ limit, skip: page * limit });
    return { data: res.products, hasMore: res.skip + res.products.length < res.total, total: res.total };
  }, []);

  const { data: products, loading, refreshing, hasMore, error, loadMore, refresh } = useInfiniteScroll(
    fetchPage,
    PAGE_SIZE
  );

  const loadExtras = useCallback(async () => {
    try {
      const [categoryList, dealsRes] = await Promise.all([
        productApi.getCategories(),
        productApi.getProducts({ limit: 10, sortBy: 'discountPercentage', order: 'desc' }),
      ]);
      setCategories(categoryList);
      setDeals(dealsRes.products);
    } catch {
      // Optional sections: the product grid shows the main error state
    }
  }, []);

  useEffect(() => {
    refresh();
    loadExtras();
  }, [refresh, loadExtras]);

  const onRefresh = () => {
    refresh();
    loadExtras();
  };

  const handleAddToCart = (product: Product) => {
    addItem(product);
    setSnackbar(t('common.addedToCart', { title: product.title }));
  };

  const openProduct = (product: ProductSummary) => router.push(`/product/${product.id}`);

  const header = (
    <View>
      {/* Theme-colored hero: greeting, search and the season's scene */}
      <SeasonHero firstName={user?.firstName} />
      <RewardsStrip />

      <SeasonBanner />

      {/* Categories */}
      {categories.length > 0 && (
        <View style={styles.sectionContainer}>
          <View style={styles.sectionHeader}>
            <Text style={[styles.sectionTitle, heading(20)]}>{motifs[0]} {t('home.categories')}</Text>
            <TouchableOpacity onPress={() => router.push('/categories')}>
              <Text style={styles.seeAllText}>{t('common.seeAll')}</Text>
            </TouchableOpacity>
          </View>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chipRow}>
            {categories.slice(0, 12).map((category) => (
              <CategoryChip
                key={category.slug}
                label={category.name}
                icon={getCategoryIcon(category.slug)}
                onPress={() => router.push({ pathname: '/search', params: { category: category.slug } })}
              />
            ))}
          </ScrollView>
        </View>
      )}

      {/* Flash Deals */}
      {deals.length > 0 && (
        <View style={styles.sectionContainer}>
          <View style={styles.sectionHeader}>
            <View style={common.row}>
              <Text style={[styles.sectionTitle, heading(20)]}>{t('home.flashDeals')}</Text>
              <View style={styles.countdown}>
                <Text style={styles.countdownText}>{t('home.endsIn', { time: countdown })}</Text>
              </View>
            </View>
            <TouchableOpacity onPress={() => router.push({ pathname: '/search', params: { sort: 'discount' } })}>
              <Text style={styles.seeAllText}>{t('common.seeAll')}</Text>
            </TouchableOpacity>
          </View>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.dealsRow}>
            {deals.map((product) => (
              <ProductCard
                key={product.id}
                product={product}
                style={styles.dealCard}
                onPress={() => openProduct(product)}
              />
            ))}
          </ScrollView>
        </View>
      )}

      {/* Recently Viewed */}
      {recentlyViewed.length > 0 && (
        <View style={styles.sectionContainer}>
          <View style={styles.sectionHeader}>
            <Text style={[styles.sectionTitle, heading(20)]}>{motifs[2 % motifs.length]} {t('home.recentlyViewed')}</Text>
          </View>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.dealsRow}>
            {recentlyViewed.map((product) => (
              <ProductCard
                key={product.id}
                product={product}
                style={styles.recentCard}
                onPress={() => openProduct(product)}
              />
            ))}
          </ScrollView>
        </View>
      )}

      <View style={[styles.sectionHeader, styles.gridHeader]}>
        <Text style={[styles.sectionTitle, heading(20)]}>{motifs[1]} {t('home.recommended')}</Text>
      </View>
    </View>
  );

  const renderFooter = () => {
    if (loading) {
      return (
        <View style={common.listFooter}>
          <SeasonSpinner />
        </View>
      );
    }
    if (error && products.length > 0) {
      return (
        <TouchableOpacity style={common.listFooter} onPress={loadMore}>
          <Text style={common.footerError}>{error} · Tap to retry</Text>
        </TouchableOpacity>
      );
    }
    if (!hasMore && products.length > 0) {
      return (
        <View style={common.listFooter}>
          <Text style={common.muted}>{t('common.endOfList')}</Text>
        </View>
      );
    }
    return null;
  };

  const renderEmpty = () => {
    if (refreshing) return <ProductGridSkeleton count={columns * 3} itemWidth={itemWidth} />;
    if (error) return <ErrorState message={error} onRetry={refresh} />;
    return null;
  };

  return (
    <SafeAreaView style={common.screen} edges={[]}>
      <LivelyBackground />
      <FlatList
        key={`grid-${columns}`}
        data={products}
        keyExtractor={(item) => item.id.toString()}
        numColumns={columns}
        columnWrapperStyle={common.gridRow}
        renderItem={({ item }) => (
          <ProductCard
            product={item}
            style={{ width: itemWidth }}
            onPress={() => openProduct(item)}
            onAddToCart={() => handleAddToCart(item)}
          />
        )}
        ListHeaderComponent={header}
        ListEmptyComponent={renderEmpty}
        ListFooterComponent={renderFooter}
        onEndReached={loadMore}
        onEndReachedThreshold={0.5}
        refreshControl={
          <RefreshControl
            refreshing={refreshing && products.length > 0}
            onRefresh={onRefresh}
            colors={[palette.primary]}
            tintColor={palette.primary}
          />
        }
        contentContainerStyle={styles.listContent}
      />
      <Snackbar
        visible={!!snackbar}
        onDismiss={() => setSnackbar(null)}
        duration={2500}
        action={{ label: t('common.viewCart'), onPress: () => router.push('/cart') }}
      >
        {snackbar}
      </Snackbar>
    </SafeAreaView>
  );
}
