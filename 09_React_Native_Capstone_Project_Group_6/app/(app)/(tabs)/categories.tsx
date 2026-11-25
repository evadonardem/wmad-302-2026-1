import React, { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, FlatList, RefreshControl, Text, TouchableOpacity, View } from 'react-native';
import { useRouter } from 'expo-router';
import { Card, Title, useTheme } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { recipeApi } from '@/services/recipeApi';
import { getRecipeCategoryCounts } from '@/utils/recipeCategories';
import { styles } from './categoriesStyles';

interface Category {
  name: string;
  count: number;
}

const categoryPalette = { accent: '#E85D04', soft: '#FFF3E0' };

export default function CategoriesScreen() {
  const router = useRouter();
  const { colors } = useTheme();
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isOffline, setIsOffline] = useState(false);

  const loadCategories = useCallback(async (refresh = false) => {
    if (refresh) setRefreshing(true);
    else setLoading(true);
    setError(null);
    try {
      const response = await recipeApi.getRecipes({ limit: 100 });
      const { recipes } = response;
      setIsOffline(Boolean(response.isCached));
      const categories = getRecipeCategoryCounts(recipes);
      setCategories(categories.sort((a, b) => b.count - a.count || a.name.localeCompare(b.name)));
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : 'Failed to load categories');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    void loadCategories();
  }, [loadCategories]);

  const renderCategory = ({ item }: { item: Category }) => {
    const palette = categoryPalette;
    return (
      <TouchableOpacity
        style={styles.categoryCard}
        onPress={() => router.push(`/(app)/(tabs)/search?category=${encodeURIComponent(item.name)}`)}
        activeOpacity={0.85}
      >
        <Card
          style={[styles.card, { backgroundColor: colors.surface, borderColor: palette.soft }]}
          elevation={1}
        >
          <View style={[styles.cardAccent, { backgroundColor: palette.accent }]} />
          <Card.Content style={styles.cardContent}>
            <View style={[styles.iconContainer, { backgroundColor: palette.soft }]}>
              <MaterialCommunityIcons name={getCategoryIcon(item.name)} size={32} color={palette.accent} />
            </View>
            <Title style={[styles.categoryName, { color: colors.onSurface }]}>{item.name}</Title>
            <View style={[styles.countBadge, { backgroundColor: palette.soft }]}>
              <Text style={[styles.categoryCount, { color: palette.accent }]}>
                {item.count} {item.count === 1 ? 'recipe' : 'recipes'}
              </Text>
            </View>
          </Card.Content>
        </Card>
      </TouchableOpacity>
    );
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#E85D04" />
        <Text style={styles.loadingText}>Finding your favorite cuisines...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>{error}</Text>
        <TouchableOpacity onPress={() => { void loadCategories(); }}>
          <Text style={styles.retryText}>Try again</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.surface }]}>
      <View style={styles.pageHeader}>
        <View style={styles.pageHeaderCopy}>
          <Title style={[styles.pageTitle, { color: colors.onBackground }]}>Recipe categories</Title>
          <Text style={[styles.pageSubtitle, { color: colors.onSurfaceVariant }]}>Browse by ingredient, meal, and dish type.</Text>
        </View>
        <View style={styles.headerIconContainer}>
          <MaterialCommunityIcons name="silverware-fork-knife" size={28} color="#E85D04" />
        </View>
      </View>
      {isOffline && <Text style={[styles.loadingText, { color: colors.onSurfaceVariant }]}>Offline mode · using saved recipes</Text>}
      <FlatList
        data={categories}
        renderItem={renderCategory}
        keyExtractor={(item) => item.name}
        numColumns={2}
        columnWrapperStyle={styles.gridWrapper}
        contentContainerStyle={styles.gridContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={() => { void loadCategories(true); }} colors={['#E85D04']} />
        }
        ListEmptyComponent={<Text style={styles.errorText}>No cuisines are available right now.</Text>}
      />
    </View>
  );
}

function getCategoryIcon(category: string): React.ComponentProps<typeof MaterialCommunityIcons>['name'] {
  const icons: Record<string, React.ComponentProps<typeof MaterialCommunityIcons>['name']> = {
    Beef: 'hamburger',
    Chicken: 'food',
    Seafood: 'fish',
    Vegetarian: 'leaf',
    Dessert: 'cupcake',
    Breakfast: 'coffee',
    Lunch: 'food',
    Dinner: 'food',
    Pasta: 'pasta',
    American: 'hamburger',
    Asian: 'noodles',
    French: 'food-croissant',
    Indian: 'food',
    Italian: 'food',
    Japanese: 'food',
    Korean: 'food',
    Mediterranean: 'food-variant',
    Mexican: 'taco',
    Pakistani: 'food',
    Thai: 'noodles',
  };
  return icons[category] || 'earth';
}
