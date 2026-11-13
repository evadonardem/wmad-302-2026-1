/**
 * Categories Screen - Cookbook
 * Browse recipes by category (DummyJSON meal types: Breakfast, Dinner, Snack, ...)
 *
 * - Grid layout (2 columns on phones, 3 on tablets)
 * - Recipe count per category, loaded in a single request
 * - Tapping a category opens Search filtered to that category
 * - Pull to refresh
 */
import React, { useCallback, useEffect, useState } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  useWindowDimensions,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Button, Card, Title } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { recipeApi, CategoryCount } from '@/services/recipeApi';
import { styles } from './categoriesStyles';

type IconName = keyof typeof MaterialCommunityIcons.glyphMap;

export default function CategoriesScreen() {
  const router = useRouter();
  const { width } = useWindowDimensions();
  const numColumns = width >= 700 ? 3 : 2;

  const [categories, setCategories] = useState<CategoryCount[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadCategories = useCallback(async (isRefresh = false) => {
    try {
      if (!isRefresh) setLoading(true);
      setError(null);
      setCategories(await recipeApi.getCategories());
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load categories');
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
    loadCategories(true);
  };

  const openCategory = (name: string) => {
    router.push({ pathname: '/search', params: { category: name } });
  };

  const renderCategory = ({ item }: { item: CategoryCount }) => (
    <TouchableOpacity
      style={[styles.categoryCard, { width: numColumns === 3 ? '31%' : '48%' }]}
      onPress={() => openCategory(item.name)}
      activeOpacity={0.8}
      accessibilityRole="button"
      accessibilityLabel={`${item.name}, ${item.count} recipes`}
    >
      <Card style={styles.card} elevation={1}>
        <Card.Content style={styles.cardContent}>
          <View style={styles.iconContainer}>
            <MaterialCommunityIcons name={getCategoryIcon(item.name)} size={32} color="#E85D04" />
          </View>
          <Title style={styles.categoryName}>{item.name}</Title>
          <Text style={styles.categoryCount}>
            {item.count} recipe{item.count === 1 ? '' : 's'}
          </Text>
        </Card.Content>
      </Card>
    </TouchableOpacity>
  );

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#E85D04" />
        <Text style={styles.loadingText}>Loading categories...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>{error}</Text>
        <Button mode="contained" onPress={() => loadCategories()} style={styles.retryButton}>
          Try Again
        </Button>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <FlatList
        // FlatList needs a new key when the number of columns changes (phone <-> tablet)
        key={`grid-${numColumns}`}
        data={categories}
        renderItem={renderCategory}
        keyExtractor={(item) => item.name}
        numColumns={numColumns}
        columnWrapperStyle={styles.gridWrapper}
        contentContainerStyle={styles.gridContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#E85D04']} />
        }
        ListHeaderComponent={
          <View>
            <Title style={styles.pageTitle}>Categories</Title>
            <Text style={styles.pageSubtitle}>Browse recipes by category</Text>
          </View>
        }
        ListEmptyComponent={
          <Text style={styles.emptyText}>No categories found. Pull down to refresh.</Text>
        }
      />
    </View>
  );
}

function getCategoryIcon(category: string): IconName {
  const icons: Record<string, IconName> = {
    Breakfast: 'egg-fried',
    Lunch: 'food',
    Dinner: 'silverware-fork-knife',
    Snack: 'cookie',
    Snacks: 'cookie',
    Dessert: 'cake',
    Appetizer: 'leaf',
    'Side Dish': 'bowl',
    Beverage: 'glass-mug',
  };
  return icons[category] || 'food';
}
