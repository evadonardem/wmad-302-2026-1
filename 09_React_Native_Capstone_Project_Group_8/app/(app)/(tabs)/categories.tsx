
/**
 * Categories Screen - Cookbook
 * Browse recipes by category
 */
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Card, Title } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { recipeApi } from '@/services/recipeApi';
import { styles } from './categoriesStyles';

interface Category {
  name: string;
  count?: number;
}

type CategoryIconName = React.ComponentProps<
  typeof MaterialCommunityIcons
>['name'];

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
      const categoryNames = await recipeApi.getCategories();

      // Get count for each category (optional - could be slow)
      const categoriesWithCounts = await Promise.all(
        categoryNames.slice(0, 12).map(async (name) => {
          try {
            const res = await recipeApi.getRecipesByCategory(name, {
              limit: 1,
            });
            return { name, count: res.total };
          } catch {
            return { name, count: 0 };
          }
        })
      );

      setCategories(categoriesWithCounts);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Failed to load categories'
      );
    } finally {
      setLoading(false);
    }
  };

  const renderCategory = ({ item }: { item: Category }) => (
    <TouchableOpacity
      style={styles.categoryCard}
      onPress={() =>
        router.push(
          `/app/(tabs)/search?category=${encodeURIComponent(item.name)}`
        )
      }
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

          {item.count !== undefined && (
            <Text style={styles.categoryCount}>
              {item.count} recipes
            </Text>
          )}
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
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Title style={styles.pageTitle}>Categories</Title>
      <Text style={styles.pageSubtitle}>
        Browse recipes by category
      </Text>

      <FlatList
        data={categories}
        renderItem={renderCategory}
        keyExtractor={(item) => item.name}
        numColumns={2}
        columnWrapperStyle={styles.gridWrapper}
        contentContainerStyle={styles.gridContent}
        ItemSeparatorComponent={() => (
          <View style={styles.separator} />
        )}
      />

      {/* Student Guide */}
      <View style={styles.guideContainer}>
        <Text style={styles.guideTitle}>
          📝 Student Implementation Guide
        </Text>
        <Text style={styles.guideText}>
          Enhance the categories screen:{'\n'}
          1. Add category images from assets{'\n'}
          2. Show recipe count per category{'\n'}
          3. Add sub-categories (e.g., Beef → Steaks, Roasts){'\n'}
          4. Add &quot;Popular&quot; and &quot;Trending&quot; sections{'\n'}
          5. Implement pull-to-refresh
        </Text>
      </View>
    </View>
  );
}

function getCategoryIcon(category: string): CategoryIconName {
  const icons: Record<string, CategoryIconName> = {
    Beef: 'food-steak',
    Chicken: 'food-drumstick',
    Dessert: 'cake',
    Lamb: 'food-steak',
    Pasta: 'pasta',
    Pork: 'food',
    Seafood: 'fish',
    Vegetarian: 'leaf',
    Breakfast: 'bread-slice',
    Appetizer: 'silverware-fork-knife',
    'Side Dish': 'bowl-mix',
    'Main Course': 'food',
    Soup: 'bowl-mix',
    Salad: 'leaf',
    Drink: 'cup',
  };

  return icons[category] || 'food';
}
