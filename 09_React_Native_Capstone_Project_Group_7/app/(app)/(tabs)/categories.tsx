/**
 * Categories Screen - Cookbook
 * Browse recipes by category with recipe counts and pull-to-refresh
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
import { Card, Title, Button } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { recipeApi } from '@/services/recipeApi';
import { styles } from './categoriesStyles';

interface Category {
  name: string;
  count: number;
}

type IconName = React.ComponentProps<typeof MaterialCommunityIcons>['name'];

export default function CategoriesScreen() {
  const router = useRouter();
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadCategories = useCallback(async (isRefresh = false) => {
    try {
      if (!isRefresh) setLoading(true);
      setError(null);

      const categoryNames = await recipeApi.getCategories();
      const categoriesWithCounts = await Promise.all(
        categoryNames.map(async (name) => {
          try {
            const res = await recipeApi.getRecipesByCategory(name, { limit: 1 });
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

  const renderCategory = ({ item }: { item: Category }) => (
    <TouchableOpacity
      style={styles.categoryCard}
      onPress={() => router.push(`/(app)/(tabs)/search?category=${encodeURIComponent(item.name)}`)}
      activeOpacity={0.8}
    >
      <Card style={styles.card} elevation={1}>
        <Card.Content style={styles.cardContent}>
          <View style={styles.iconContainer}>
            <MaterialCommunityIcons
              name={getCategoryIcon(item.name)}
              size={32}
              color="#E85D04"
            />
          </View>
          <Title style={styles.categoryName}>{item.name}</Title>
          <Text style={styles.categoryCount}>{item.count} recipes</Text>
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
        <Button mode="contained" onPress={() => loadCategories()} style={{ marginTop: 12 }}>
          Retry
        </Button>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Title style={styles.pageTitle}>Categories</Title>
      <Text style={styles.pageSubtitle}>Browse recipes by category & meal type</Text>

      <FlatList
        data={categories}
        renderItem={renderCategory}
        keyExtractor={(item) => item.name}
        numColumns={2}
        columnWrapperStyle={styles.gridWrapper}
        contentContainerStyle={styles.gridContent}
        ItemSeparatorComponent={() => <View style={styles.separator} />}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#E85D04']} />
        }
      />
    </View>
  );
}

function getCategoryIcon(category: string): IconName {
  const icons: Record<string, IconName> = {
    Beef: 'cow',
    Chicken: 'food-drumstick',
    Dessert: 'cake-variant',
    Lamb: 'sheep',
    Pasta: 'noodles',
    Pork: 'pig',
    Seafood: 'fish',
    Vegetarian: 'leaf',
    Breakfast: 'weather-sunset-up',
    Lunch: 'food',
    Dinner: 'silverware-fork-knife',
    Snack: 'cookie',
    Appetizer: 'food-apple',
    Salad: 'sprout',
  };
  return icons[category] || 'food';
}
