
/**
 * Categories Screen - Cookbook
 * Browse recipes using real category counts from DummyJSON.
 */

import React, { useCallback, useEffect, useState } from 'react';
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

import { recipeApi } from '@/services/recipeApi';
import type { Recipe } from '@/types/recipe';
import { styles } from './categoriesStyles';

interface Category {
  name: string;
  count: number;
}

type CategoryIconName = React.ComponentProps<
  typeof MaterialCommunityIcons
>['name'];

const CATEGORIES = [
  'Beef',
  'Chicken',
  'Dessert',
  'Lamb',
  'Pasta',
  'Pork',
  'Seafood',
  'Vegetarian',
];

const MEAT_KEYWORDS = [
  'beef', 'chicken', 'pork', 'bacon', 'ham', 'lamb',
  'mutton', 'turkey', 'duck', 'goat', 'veal', 'sausage',
  'fish', 'shrimp', 'prawn', 'salmon', 'tuna', 'crab',
  'lobster', 'squid', 'octopus', 'mussel', 'clam',
  'oyster', 'scallop', 'anchovy', 'sardine', 'cod',
  'tilapia',
];

const CATEGORY_KEYWORDS: Record<string, string[]> = {
  Beef: ['beef', 'steak', 'brisket', 'veal'],
  Chicken: ['chicken'],
  Lamb: ['lamb', 'mutton'],
  Pork: ['pork', 'bacon', 'ham', 'prosciutto', 'pancetta'],
  Seafood: [
    'seafood', 'fish', 'shrimp', 'prawn', 'salmon',
    'tuna', 'crab', 'lobster', 'squid', 'octopus',
    'mussel', 'clam', 'oyster', 'scallop', 'anchovy',
    'sardine', 'cod', 'tilapia',
  ],
};

function matchesCategory(recipe: Recipe, category: string): boolean {
  const searchableText = [
    recipe.name,
    recipe.cuisine,
    ...recipe.ingredients,
    ...recipe.tags,
  ].join(' ').toLowerCase();

  const tags = recipe.tags.map((tag) => tag.toLowerCase());

  if (category === 'Vegetarian') {
    const hasMeat = MEAT_KEYWORDS.some((keyword) =>
      new RegExp(`\\b${keyword}\\b`, 'i').test(searchableText)
    );

    return tags.includes('vegetarian') && !hasMeat;
  }

  if (category === 'Dessert') {
    return (
      tags.includes('dessert') ||
      recipe.mealType.some(
        (type) => type.toLowerCase() === 'dessert'
      )
    );
  }

  if (category === 'Pasta') {
    return (
      tags.includes('pasta') ||
      /\bpasta\b|\bspaghetti\b|\bpenne\b|\bmacaroni\b|\bfettuccine\b|\blasagna\b/i.test(
        searchableText
      )
    );
  }

  const keywords = CATEGORY_KEYWORDS[category];

  if (!keywords) {
    return false;
  }

  return keywords.some((keyword) =>
    new RegExp(`\\b${keyword}\\b`, 'i').test(searchableText)
  );
}

export default function CategoriesScreen() {
  const router = useRouter();

  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Load the actual recipe catalog and calculate category counts.
  const loadCategories = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await recipeApi.getRecipes({ limit: 0 });
      const recipes = response.recipes || [];

      const categoriesWithCounts = CATEGORIES.map((name) => ({
        name,
        count: recipes.filter((recipe) =>
          matchesCategory(recipe, name)
        ).length,
      }));

      setCategories(categoriesWithCounts);
    } catch (err) {
      console.error('Category loading error:', err);

      setError(
        err instanceof Error
          ? err.message
          : 'Failed to load categories.'
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadCategories();
  }, [loadCategories]);

  // Open Search Screen with the selected category.
  const handleCategoryPress = (category: string) => {
    router.push(
      `/(app)/(tabs)/search?category=${encodeURIComponent(category)}`
    );
  };

  const renderCategory = ({ item }: { item: Category }) => (
    <TouchableOpacity
      style={styles.categoryCard}
      onPress={() => handleCategoryPress(item.name)}
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

          <Title style={styles.categoryName}>
            {item.name}
          </Title>

          <Text style={styles.categoryCount}>
            {item.count} recipes
          </Text>
        </Card.Content>
      </Card>
    </TouchableOpacity>
  );

  if (loading && categories.length === 0) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#E85D04" />

        <Text style={styles.loadingText}>
          Loading categories...
        </Text>
      </View>
    );
  }

  if (error && categories.length === 0) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>
          {error}
        </Text>

        <TouchableOpacity
          onPress={loadCategories}
          style={{
            backgroundColor: '#E85D04',
            paddingHorizontal: 20,
            paddingVertical: 12,
            borderRadius: 10,
            marginTop: 15,
          }}
        >
          <Text style={{ color: '#FFFFFF', fontWeight: 'bold' }}>
            Try Again
          </Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Title style={styles.pageTitle}>
        Categories
      </Title>

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
        refreshControl={
          <RefreshControl
            refreshing={loading}
            onRefresh={loadCategories}
            colors={['#E85D04']}
          />
        }
        ListEmptyComponent={
          <Text style={styles.errorText}>
            No categories available.
          </Text>
        }
      />
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
  };

  return icons[category] || 'food';
}
