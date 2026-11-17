
/**
 * Categories Screen - Marketplace
 * Browse products by category
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useTheme, type MD3Theme } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { productApi, type ProductCategory } from '@/services/productApi';
import { createCategoriesStyles } from './categoriesStyles';

interface Category extends ProductCategory {
  count?: number;
}

type IconName = React.ComponentProps<
  typeof MaterialCommunityIcons
>['name'];

export default function CategoriesScreen() {
  const router = useRouter();
  const theme = useTheme<MD3Theme>();
  const colors = theme.colors;
  const styles = createCategoriesStyles(colors);

  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadCategories = useCallback(async () => {
    try {
      setError(null);

      const categoryData = await productApi.getCategories();

      const categoriesWithCounts = await Promise.all(
        categoryData.slice(0, 12).map(async (category) => {
          try {
            const response = await productApi.getProductsByCategory(
              category.slug,
              { limit: 1 },
            );

            return {
              ...category,
              count: response.total,
            };
          } catch {
            return {
              ...category,
              count: 0,
            };
          }
        }),
      );

      setCategories(categoriesWithCounts);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'Failed to load categories. Please try again.',
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadCategories();
  }, [loadCategories]);

  const onRefresh = () => {
    setRefreshing(true);
    loadCategories();
  };

  const onRetry = () => {
    setLoading(true);
    loadCategories();
  };

  const openCategory = (category: Category) => {
    router.push({
      pathname: '/(app)/(tabs)/search',
      params: { category: category.slug },
    });
  };

  const renderCategory = ({ item }: { item: Category }) => (
    <TouchableOpacity
      style={styles.categoryCard}
      onPress={() => openCategory(item)}
      activeOpacity={0.75}
      accessibilityRole="button"
      accessibilityLabel={`Browse ${item.name}`}
    >
      <View style={styles.card}>
        <View style={styles.cardTopRow}>
          <View style={styles.iconContainer}>
            <MaterialCommunityIcons
              name={getCategoryIcon(item.slug)}
              size={30}
              color={colors.primary}
            />
          </View>

          <MaterialCommunityIcons
            name="arrow-top-right"
            size={19}
            color={colors.onSurfaceVariant}
          />
        </View>

        <Text style={styles.categoryName} numberOfLines={2}>
          {item.name}
        </Text>

        <Text style={styles.categoryCount}>
          {item.count ?? 0}{' '}
          {(item.count ?? 0) === 1 ? 'product' : 'products'}
        </Text>
      </View>
    </TouchableOpacity>
  );

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={styles.loadingText}>Loading categories...</Text>
        <Text style={styles.loadingSubtext}>
          Finding products for you
        </Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.errorContainer}>
        <View style={styles.errorIconContainer}>
          <MaterialCommunityIcons
            name="wifi-alert"
            size={38}
            color={colors.error}
          />
        </View>

        <Text style={styles.errorTitle}>
          Unable to load categories
        </Text>

        <Text style={styles.errorText}>{error}</Text>

        <TouchableOpacity
          style={styles.retryButton}
          onPress={onRetry}
          activeOpacity={0.8}
        >
          <MaterialCommunityIcons
            name="refresh"
            size={18}
            color={colors.onPrimary}
          />
          <Text style={styles.retryButtonText}>Try Again</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerTextContainer}>
          <Text style={styles.eyebrow}>EXPLORE OUR STORE</Text>
          <Text style={styles.pageTitle}>Categories</Text>
          <Text style={styles.pageSubtitle}>
            Find exactly what you&apos;re looking for.
          </Text>
        </View>

        <View style={styles.headerIconContainer}>
          <MaterialCommunityIcons
            name="shape-outline"
            size={30}
            color={colors.primary}
          />
        </View>
      </View>

      <View style={styles.banner}>
        <View style={styles.bannerTextContainer}>
          <Text style={styles.bannerTitle}>
            Shop by category
          </Text>
          <Text style={styles.bannerSubtitle}>
            Explore our collection and discover something new.
          </Text>
        </View>

        <MaterialCommunityIcons
          name="shopping-outline"
          size={38}
          color={colors.primary}
        />
      </View>

      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>All Categories</Text>
        <Text style={styles.sectionCount}>
          {categories.length} available
        </Text>
      </View>

      <FlatList
        data={categories}
        renderItem={renderCategory}
        keyExtractor={(item) => item.slug}
        numColumns={2}
        columnWrapperStyle={styles.gridWrapper}
        contentContainerStyle={styles.gridContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={[colors.primary]}
            tintColor={colors.primary}
          />
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <MaterialCommunityIcons
              name="shape-outline"
              size={42}
              color={colors.onSurfaceVariant}
            />
            <Text style={styles.emptyTitle}>
              No categories available
            </Text>
            <Text style={styles.emptyText}>
              Pull down to refresh and try again.
            </Text>
          </View>
        }
      />
    </View>
  );
}

function getCategoryIcon(category: string): IconName {
  const icons: Record<string, IconName> = {
    smartphones: 'cellphone',
    laptops: 'laptop',
    fragrances: 'spray',
    skincare: 'face-woman',
    groceries: 'cart',
    'home-decoration': 'home',
    furniture: 'sofa',
    'kitchen-accessories': 'silverware',
    'vehicle-accessories': 'car',
    'electronics-accessories': 'headphones',
  };

  return icons[category] || 'package-variant';
}
