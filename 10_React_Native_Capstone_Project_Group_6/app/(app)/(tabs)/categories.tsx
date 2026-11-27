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
type Status = 'loading' | 'ready' | 'error';

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

const formatProductCount = (count: number): string => `${count} ${count === 1 ? 'product' : 'products'}`;

// Single source of truth for the category list + per-category product counts
function fetchCategoryData(): Promise<[CategoryInfo[], Record<string, number>]> {
  return Promise.all([productApi.getCategories(), productApi.getCategoryCounts()]);
}

interface CategoryCardProps {
  category: CategoryInfo;
  count: number;
  onPress: (slug: string) => void;
}

const CategoryCard = React.memo(function CategoryCard({ category, count, onPress }: CategoryCardProps) {
  const theme = useAppTheme();
  const countLabel = formatProductCount(count);

  return (
    <Card
      style={[styles.card, { backgroundColor: theme.colors.surface }]}
      mode="elevated"
      onPress={() => onPress(category.slug)}
      accessibilityRole="button"
      accessibilityLabel={`${category.name}, ${countLabel}`}
    >
      <Card.Content style={styles.cardContent}>
        <View style={[styles.iconWrap, { backgroundColor: theme.colors.primaryContainer }]}>
          <MaterialCommunityIcons name={getCategoryIcon(category.slug)} size={30} color={theme.colors.primary} />
        </View>
        <Text variant="titleSmall" style={styles.name} numberOfLines={2}>
          {category.name}
        </Text>
        <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant }}>
          {countLabel}
        </Text>
      </Card.Content>
    </Card>
  );
});

function CategoryCardSkeleton() {
  const theme = useAppTheme();
  return (
    <Card style={[styles.card, { backgroundColor: theme.colors.surface }]} mode="elevated">
      <Card.Content style={styles.cardContent}>
        <View style={styles.iconWrap}>
          <Skeleton height={60} width={60} borderRadius={30} />
        </View>
        <View style={styles.nameSkeleton}>
          <Skeleton height={16} width="75%" borderRadius={4} />
          <Skeleton height={16} width="50%" borderRadius={4} />
        </View>
        <Skeleton height={16} width="45%" borderRadius={4} />
      </Card.Content>
    </Card>
  );
}

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
    fetchCategoryData()
      .then(([categoryList, countMap]) => {
        if (cancelled) return;
        setCategories(categoryList);
        setCounts(countMap);
        setError(null);
        setStatus('ready');
      })
      .catch((err: unknown) => {
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
      const [categoryList, countMap] = await fetchCategoryData();
      setCategories(categoryList);
      setCounts(countMap);
    } catch {
      show('Could not refresh categories. Check your connection.');
    } finally {
      setRefreshing(false);
    }
  }, [show]);

  const openCategory = useCallback(
    (slug: string) => router.navigate(routes.search({ category: slug })),
    [router],
  );

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
        <View>
          {Array.from({ length: Math.ceil(8 / columns) }, (_, rowIndex) => (
            <View key={rowIndex} style={styles.row}>
              {Array.from({ length: columns }, (_, columnIndex) => (
                <CategoryCardSkeleton key={`${rowIndex}-${columnIndex}`} />
              ))}
            </View>
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
          <CategoryCard category={item} count={counts[item.slug] ?? 0} onPress={openCategory} />
        )}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: { paddingHorizontal: spacing.lg, paddingTop: spacing.lg, paddingBottom: spacing.md },
  content: { paddingBottom: spacing.xxl },
  row: { gap: spacing.md, paddingHorizontal: spacing.lg, marginBottom: spacing.md },
  card: { flex: 1 },
  cardContent: { alignItems: 'center', gap: spacing.xs, paddingVertical: spacing.lg },
  iconWrap: {
    width: 60,
    height: 60,
    borderRadius: 30,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.xs,
  },
  nameSkeleton: { height: 40, alignItems: 'center', justifyContent: 'space-between' },
  name: { textAlign: 'center', minHeight: 40 },
});