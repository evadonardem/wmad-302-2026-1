
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
import { Card, Title } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { productApi, ProductCategory } from '@/services/productApi';
import { styles } from './categoriesStyles';

interface Category extends ProductCategory {
  count?: number;
}

type IconName = React.ComponentProps<typeof MaterialCommunityIcons>['name'];

export default function CategoriesScreen() {
  const router = useRouter();

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
        err instanceof Error ? err.message : 'Failed to load categories',
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
      activeOpacity={0.8}
    >
      <Card style={styles.card} elevation={1}>
        <Card.Content style={styles.cardContent}>
          <View style={styles.iconContainer}>
            <MaterialCommunityIcons
              name={getCategoryIcon(item.slug)}
              size={32}
              color="#43A52F"
            />
          </View>

          <Title style={styles.categoryName}>
            {item.name}
          </Title>

          {item.count !== undefined && (
            <Text style={styles.categoryCount}>
              {item.count} products
            </Text>
          )}
        </Card.Content>
      </Card>
    </TouchableOpacity>
  );

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#43A52F" />
        <Text style={styles.loadingText}>Loading categories...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>{error}</Text>

        <TouchableOpacity onPress={loadCategories}>
          <Text style={{ color: '#43A52F', marginTop: 12 }}>
            Tap to try again
          </Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Title style={styles.pageTitle}>Categories</Title>

      <Text style={styles.pageSubtitle}>
        Browse products by category
      </Text>

      <FlatList
        data={categories}
        renderItem={renderCategory}
        keyExtractor={(item) => item.slug}
        numColumns={2}
        columnWrapperStyle={styles.gridWrapper}
        contentContainerStyle={styles.gridContent}
        ItemSeparatorComponent={() => <View style={styles.separator} />}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={['#43A52F']}
            tintColor="#43A52F"
          />
        }
      />

      <View style={styles.guideContainer}>
        <Text style={styles.guideTitle}>
          📝 Student Implementation Guide
        </Text>

        <Text style={styles.guideText}>
          Enhance the categories screen:{'\n'}
          1. Add category images/banners{'\n'}
          2. Show product count per category{'\n'}
          3. Add sub-categories navigation{'\n'}
          4. Add &quot;Featured Brands&quot; section{'\n'}
          5. Implement pull-to-refresh
        </Text>
      </View>
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
