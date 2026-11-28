/**
 * Categories Screen - Marketplace
 * Responsive grid of all categories with product counts; tapping one opens the filtered search.
 */
import React, { useCallback, useEffect, useState } from 'react';
import { FlatList, RefreshControl, Text, TouchableOpacity, View } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { SEASONS } from '@/constants/seasons';
import { Card } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { productApi } from '@/services/productApi';
import { ErrorState, Skeleton } from '@/components/CommonComponents';
import { LivelyBackground } from '@/components/LivelyBackground';
import { getCategoryIcon } from '@/constants/categories';
import { useSettings } from '@/context/SettingsContext';
import { useGridColumns, useThemedStyles } from '@/hooks';
import { getErrorMessage } from '@/utils/errors';
import type { ProductCategory } from '@/types/product';
import { makeCommon } from '@/styles/common';
import { makeCategoriesStyles } from '@/styles/categories';

interface CategoryWithCount extends ProductCategory {
  count: number;
}

export default function CategoriesScreen() {
  const router = useRouter();
  const { palette, season, heading, t } = useSettings();
  const insets = useSafeAreaInsets();
  const common = useThemedStyles(makeCommon);
  const styles = useThemedStyles(makeCategoriesStyles);
  const { columns, itemWidth } = useGridColumns();

  const [categories, setCategories] = useState<CategoryWithCount[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadCategories = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);
    setError(null);
    try {
      const [list, counts] = await Promise.all([productApi.getCategories(), productApi.getCategoryCounts()]);
      setCategories(list.map((category) => ({ ...category, count: counts[category.slug] ?? 0 })));
    } catch (err) {
      setError(getErrorMessage(err, 'Failed to load categories'));
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadCategories();
  }, [loadCategories]);

  const renderCategory = ({ item }: { item: CategoryWithCount }) => (
    <TouchableOpacity
      style={[styles.categoryCard, { width: itemWidth }]}
      onPress={() => router.push({ pathname: '/search', params: { category: item.slug } })}
      activeOpacity={0.8}
      accessibilityRole="button"
      accessibilityLabel={`${item.name}, ${item.count} products`}
    >
      <Card style={styles.card} elevation={1}>
        <Card.Content style={styles.cardContent}>
          <View style={styles.iconContainer}>
            <MaterialCommunityIcons name={getCategoryIcon(item.slug)} size={32} color={palette.primary} />
          </View>
          <Text style={styles.categoryName} numberOfLines={1}>
            {item.name}
          </Text>
          <Text style={styles.categoryCount}>{t('categories.count', { count: item.count })}</Text>
        </Card.Content>
      </Card>
    </TouchableOpacity>
  );

  const header = (
    <View style={[styles.header, { paddingTop: insets.top + 16 }]}>
      <Text style={[styles.pageTitle, heading(28)]}>{SEASONS[season].emoji} {t('categories.title')}</Text>
      <Text style={styles.pageSubtitle}>{t('categories.subtitle')}</Text>
    </View>
  );

  if (loading) {
    return (
      <SafeAreaView style={common.screen} edges={[]}>
        <LivelyBackground />
        {header}
        <View style={styles.skeletonGrid}>
          {Array.from({ length: columns * 4 }, (_, i) => (
            <View key={i} style={[styles.categoryCard, { width: itemWidth }]}>
              <Skeleton height={130} borderRadius={12} />
            </View>
          ))}
        </View>
      </SafeAreaView>
    );
  }

  if (error) {
    return (
      <SafeAreaView style={common.screen} edges={[]}>
        <LivelyBackground />
        {header}
        <ErrorState message={error} onRetry={() => loadCategories()} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={common.screen} edges={[]}>
      <LivelyBackground />
      <FlatList
        key={`grid-${columns}`}
        data={categories}
        renderItem={renderCategory}
        keyExtractor={(item) => item.slug}
        numColumns={columns}
        columnWrapperStyle={common.gridRow}
        contentContainerStyle={styles.gridContent}
        ListHeaderComponent={header}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => loadCategories(true)}
            colors={[palette.primary]}
            tintColor={palette.primary}
          />
        }
      />
    </SafeAreaView>
  );
}
