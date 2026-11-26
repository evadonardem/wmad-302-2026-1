/**
 * Categories Screen - grid of all categories with product counts.
 */
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useCallback, useEffect, useState } from 'react';
import { FlatList, RefreshControl, StyleSheet, useWindowDimensions, View } from 'react-native';
import { Card, Text } from 'react-native-paper';
import { ErrorState } from '@/components/ErrorState';
import { Screen } from '@/components/Screen';
import { Skeleton } from '@/components/Skeleton';
import { useSnackbar } from '@/components/SnackbarProvider';
import { spacing, useAppTheme } from '@/constants/theme';
import { productApi } from '@/services/productApi';
import { CategoryInfo } from '@/types/product';
import { getErrorMessage } from '@/utils/errors';
import { routes } from '@/utils/routes';

type IconName = React.ComponentProps<typeof MaterialCommunityIcons>['name'];

const CATEGORY_ICONS: Record<string, IconName> = {
  beauty: 'face-woman-shimmer',
  fragrances: 'spray',
  furniture: 'sofa',
  groceries: 'food-apple',
  'home-decoration': 'home-variant',
  'kitchen-accessories': 'silverware-fork-knife',
  laptops: 'laptop',
  'mens-shirts': 'tshirt-crew',
  'mens-shoes': 'shoe-formal',
  'mens-watches': 'watch',
  'mobile-accessories': 'headphones',
  motorcycle: 'motorbike',
  'skin-care': 'lotion-plus',
  smartphones: 'cellphone',
  'sports-accessories': 'basketball',
  sunglasses: 'sunglasses',
  tablets: 'tablet',
  tops: 'tshirt-v',
  vehicle: 'car',
  'womens-bags': 'purse',
  'womens-dresses': 'hanger',
  'womens-jewellery': 'diamond-stone',
  'womens-shoes': 'shoe-heel',
  'womens-watches': 'watch-variant',
};

const getCategoryIcon = (slug: string): IconName => CATEGORY_ICONS[slug] ?? 'tag-outline';

type Status = 'loading' | 'ready' | 'error';

export default function CategoriesScreen() {
  const theme = useAppTheme();
  const router = useRouter();
  const { width } = useWindowDimensions();
  const columns = width >= 900 ? 4 : width >= 600 ? 3 : 2;

  const { show } = useSnackbar();
  const [categories, setCategories] = useState<CategoryInfo[]>([]);
  const [counts, setCounts] = useState<Record<string, number>>({});
  const [status, setStatus] = useState<Status>('loading');
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    let cancelled = false;
    Promise.all([productApi.getCategories(), productApi.getCategoryCounts()])
      .then(([categoryList, countMap]) => {
        if (cancelled) return;
        setCategories(categoryList);
        setCounts(countMap);
        setError(null);
        setStatus('ready');
      })
      .catch((err) => {
        if (cancelled) return;
        setError(getErrorMessage(err, 'Could not load categories.'));
        setStatus('error');
      });
    return () => {
      cancelled = true;
    };
  }, [reloadKey]);

  const retry = () => {
    setStatus('loading');
    setReloadKey((key) => key + 1);
  };

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      const [categoryList, countMap] = await Promise.all([productApi.getCategories(), productApi.getCategoryCounts()]);
      setCategories(categoryList);
      setCounts(countMap);
    } catch {
      show('Could not refresh categories. Check your connection.');
    } finally {
      setRefreshing(false);
    }
  }, [show]);

  const header = (
    <View style={styles.header}>
      <Text variant="headlineSmall">Categories</Text>
      <Text variant="bodyMedium" style={{ color: theme.colors.onSurfaceVariant }}>
        Browse products by category
      </Text>
    </View>
  );

  if (status === 'loading') {
    return (
      <Screen>
        {header}
        <View style={styles.skeletons}>
          {Array.from({ length: 8 }, (_, index) => (
            <Skeleton key={index} height={130} borderRadius={12} width={`${100 / columns - 4}%`} />
          ))}
        </View>
      </Screen>
    );
  }

  if (status === 'error') {
    return (
      <Screen>
        <ErrorState message={error ?? 'Could not load categories.'} onRetry={retry} />
      </Screen>
    );
  }

  return (
    <Screen>
      <FlatList
        key={columns}
        data={categories}
        numColumns={columns}
        keyExtractor={(item) => item.slug}
        ListHeaderComponent={header}
        columnWrapperStyle={styles.row}
        contentContainerStyle={styles.content}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        renderItem={({ item }) => (
          <Card
            style={[styles.card, { backgroundColor: theme.colors.surface }]}
            mode="elevated"
            onPress={() => router.push(routes.search({ category: item.slug }))}
            accessibilityLabel={`${item.name}, ${counts[item.slug] ?? 0} products`}
          >
            <Card.Content style={styles.cardContent}>
              <View style={[styles.iconWrap, { backgroundColor: theme.colors.primaryContainer }]}>
                <MaterialCommunityIcons name={getCategoryIcon(item.slug)} size={30} color={theme.colors.primary} />
              </View>
              <Text variant="titleSmall" style={styles.name} numberOfLines={2}>
                {item.name}
              </Text>
              <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant }}>
                {counts[item.slug] ?? 0} products
              </Text>
            </Card.Content>
          </Card>
        )}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: { paddingHorizontal: spacing.lg, paddingTop: spacing.lg, paddingBottom: spacing.md },
  skeletons: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.md, paddingHorizontal: spacing.lg },
  content: { paddingBottom: spacing.xxl },
  row: { gap: spacing.md, paddingHorizontal: spacing.lg, marginBottom: spacing.md },
  card: { flex: 1 },
  cardContent: { alignItems: 'center', gap: spacing.xs, paddingVertical: spacing.lg },
  iconWrap: { width: 60, height: 60, borderRadius: 30, alignItems: 'center', justifyContent: 'center', marginBottom: spacing.xs },
  name: { textAlign: 'center', minHeight: 40 },
});
