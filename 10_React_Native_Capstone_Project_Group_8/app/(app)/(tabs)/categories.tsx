/**
 * Categories Screen - Marketplace
 * Browse products by category
 */
import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { Card, Title } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { productApi } from '@/services/productApi';
import { styles } from './categoriesStyles';

interface Category {
  name: string;
  count?: number;
}

export default function CategoriesScreen() {
  const router = useRouter();
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadCategories();
  }, []);

  const loadCategories = async () => {
    try {
      setLoading(true);
      const categoryNames = await productApi.getCategories();
      // Get count for each category
      const categoriesWithCounts = await Promise.all(
        categoryNames.slice(0, 12).map(async (name) => {
          try {
            const res = await productApi.getProductsByCategory(name, { limit: 1 });
            return { name, count: res.total };
          } catch {
            return { name, count: 0 };
          }
        })
      );
      setCategories(categoriesWithCounts);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load categories');
    } finally {
      setLoading(false);
    }
  };

  const renderCategory = ({ item }: { item: Category }) => (
    <TouchableOpacity
      style={styles.categoryCard}
      onPress={() => router.push(`/app/(tabs)/search?category=${encodeURIComponent(item.name)}`)}
      activeOpacity={0.8}
    >
      <Card style={styles.card} elevation={1}>
        <Card.Content style={styles.cardContent}>
          <View style={styles.iconContainer}>
            <MaterialCommunityIcons
              name={getCategoryIcon(item.name)}
              size={32}
              color="#1A73E8"
            />
          </View>
          <Title style={styles.categoryName}>
            {item.name.charAt(0).toUpperCase() + item.name.slice(1).replace('-', ' ')}
          </Title>
          {item.count !== undefined && (
            <Text style={styles.categoryCount}>{item.count} products</Text>
          )}
        </Card.Content>
      </Card>
    </TouchableOpacity>
  );

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#1A73E8" />
        <Text style={styles.loadingText}>Loading categories...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>{error}</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Title style={styles.pageTitle}>Categories</Title>
      <Text style={styles.pageSubtitle}>Browse products by category</Text>

      <FlatList
        data={categories}
        renderItem={renderCategory}
        keyExtractor={(item) => item.name}
        numColumns={2}
        columnWrapperStyle={styles.gridWrapper}
        contentContainerStyle={styles.gridContent}
        ItemSeparatorComponent={() => <View style={styles.separator} />}
      />

      {/* Student Guide */}
      <View style={styles.guideContainer}>
        <Text style={styles.guideTitle}>📝 Student Implementation Guide</Text>
        <Text style={styles.guideText}>
          Enhance the categories screen:\n
          1. Add category images/banners\n
          2. Show product count per category\n
          3. Add sub-categories navigation\n
          4. Add "Featured Brands" section\n
          5. Implement pull-to-refresh
        </Text>
      </View>
    </View>
  );
}

type IconName = React.ComponentProps<typeof MaterialCommunityIcons>['name'];

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