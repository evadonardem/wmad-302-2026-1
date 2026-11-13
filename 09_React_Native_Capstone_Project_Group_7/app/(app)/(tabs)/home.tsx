/**
 * Home Screen - Cookbook Discover Tab
 * Recipe discovery with pagination, categories, and pull-to-refresh
 */
import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  FlatList,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '@/context/AuthContext';
import { recipeApi } from '@/services/recipeApi';
import { Recipe } from '@/types/recipe';
import { Card, Title, Chip, Avatar, Button } from 'react-native-paper';
import { styles } from './homeStyles';

const PAGE_SIZE = 10;

export default function HomeScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchRecipes = useCallback(async (isRefresh = false) => {
    try {
      if (!isRefresh) setLoading(true);
      setError(null);

      const data = await recipeApi.getRecipes({ limit: PAGE_SIZE, skip: 0 });
      setRecipes(data.recipes);
      setTotal(data.total);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load recipes');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchRecipes();
  }, [fetchRecipes]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchRecipes(true);
  };

  const handleLoadMore = async () => {
    if (loadingMore || recipes.length >= total) return;
    try {
      setLoadingMore(true);
      const data = await recipeApi.getRecipes({ limit: PAGE_SIZE, skip: recipes.length });
      setRecipes((prev) => [...prev, ...data.recipes]);
      setTotal(data.total);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load more recipes');
    } finally {
      setLoadingMore(false);
    }
  };

  const renderRecipe = ({ item }: { item: Recipe }) => (
    <TouchableOpacity
      style={styles.recipeCard}
      onPress={() => router.push(`/(app)/recipe/${item.id}`)}
      activeOpacity={0.8}
    >
      <Card style={styles.card} elevation={2}>
        <View style={styles.imageContainer}>
          <Image
            source={{ uri: item.image }}
            style={styles.recipeImage}
            resizeMode="cover"
          />
          <View style={styles.difficultyBadge}>
            <Chip
              style={[
                styles.difficultyChip,
                item.difficulty === 'Easy' && styles.easy,
                item.difficulty === 'Medium' && styles.medium,
                item.difficulty === 'Hard' && styles.hard,
              ]}
            >
              {item.difficulty}
            </Chip>
          </View>
        </View>
        <Card.Content style={styles.cardContent}>
          <Title style={styles.recipeTitle} numberOfLines={1}>
            {item.name}
          </Title>
          <View style={styles.metaRow}>
            <Text style={styles.metaText}>
              ⏱️ {item.prepTimeMinutes + item.cookTimeMinutes} min
            </Text>
            <Text style={styles.metaText}>👥 {item.servings} servings</Text>
            <Text style={styles.metaText}>🔥 {item.caloriesPerServing} cal</Text>
          </View>
          <View style={styles.cuisineRow}>
            <Chip style={styles.cuisineChip}>{item.cuisine}</Chip>
            {item.mealType.slice(0, 2).map((meal) => (
              <Chip key={meal} style={styles.mealChip}>{meal}</Chip>
            ))}
          </View>
          <View style={styles.ratingRow}>
            <Text style={styles.ratingText}>
              ⭐ {item.rating.toFixed(1)} ({item.reviewCount} reviews)
            </Text>
          </View>
        </Card.Content>
      </Card>
    </TouchableOpacity>
  );

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#E85D04" />
        <Text style={styles.loadingText}>Loading recipes...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>{error}</Text>
        <Button mode="contained" onPress={() => fetchRecipes()} style={styles.retryButton}>
          Retry
        </Button>
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.scrollView}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#E85D04']} />
      }
      contentContainerStyle={styles.scrollContent}
    >
      <View style={styles.welcomeContainer}>
        <View style={styles.welcomeTextContainer}>
          <Text style={styles.welcomeGreeting}>
            {user ? `Welcome back, ${user.firstName}!` : 'Welcome to Cookbook!'}
          </Text>
          <Text style={styles.welcomeSubtitle}>Discover delicious recipes</Text>
        </View>
        <Avatar.Icon size={56} icon="chef-hat" style={styles.welcomeAvatar} />
      </View>

      <View style={styles.sectionContainer}>
        <View style={styles.sectionHeader}>
          <Title style={styles.sectionTitle}>Categories</Title>
          <TouchableOpacity onPress={() => router.push('/(app)/(tabs)/categories')} style={styles.seeAll}>
            <Text style={styles.seeAllText}>All Categories</Text>
          </TouchableOpacity>
        </View>
        <FlatList
          data={[
            'Chicken', 'Beef', 'Pasta', 'Seafood', 'Vegetarian', 'Dessert', 'Breakfast', 'Dinner',
          ]}
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.categoryList}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={[styles.categoryChip, { backgroundColor: '#FFF3E0' }]}
              onPress={() => router.push(`/(app)/(tabs)/search?category=${encodeURIComponent(item)}`)}
            >
              <Text style={styles.categoryChipText}>{item}</Text>
            </TouchableOpacity>
          )}
          keyExtractor={(item) => item}
        />
      </View>

      <View style={styles.sectionContainer}>
        <View style={styles.sectionHeader}>
          <Title style={styles.sectionTitle}>
            Featured Recipes ({recipes.length}/{total})
          </Title>
          <TouchableOpacity onPress={() => router.push('/(app)/(tabs)/search')} style={styles.seeAll}>
            <Text style={styles.seeAllText}>Search & Filter</Text>
          </TouchableOpacity>
        </View>
        <FlatList
          data={recipes}
          renderItem={renderRecipe}
          keyExtractor={(item) => item.id.toString()}
          scrollEnabled={false}
          ItemSeparatorComponent={() => <View style={styles.cardSeparator} />}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>No recipes found</Text>
            </View>
          }
        />

        {recipes.length < total && (
          <Button
            mode="outlined"
            onPress={handleLoadMore}
            loading={loadingMore}
            disabled={loadingMore}
            style={{ marginTop: 16, borderColor: '#E85D04' }}
            textColor="#E85D04"
          >
            {loadingMore ? 'Loading more...' : `Load More (${total - recipes.length} remaining)`}
          </Button>
        )}
      </View>
    </ScrollView>
  );
}
