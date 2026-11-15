/**
 * Home Screen - Cookbook Discover Tab
 * Students implement: Recipe grid, categories, featured recipes
 * API: https://dummyjson.com/docs/recipes
 */
import React, { useState, useEffect } from 'react';
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
import { Card, Title, Subtitle, Chip, Avatar, Button } from 'react-native-paper';
import { styles } from './homeStyles';

// Types for DummyJSON Recipes API
interface Recipe {
  id: number;
  name: string;
  ingredients: string[];
  instructions: string[];
  prepTimeMinutes: number;
  cookTimeMinutes: number;
  servings: number;
  difficulty: 'Easy' | 'Medium' | 'Hard';
  cuisine: string;
  caloriesPerServing: number;
  tags: string[];
  userId: number;
  image: string;
  rating: number;
  reviewCount: number;
  mealType: string[];
}

interface RecipesResponse {
  recipes: Recipe[];
  total: number;
  skip: number;
  limit: number;
}

export default function HomeScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchRecipes = async (isRefresh = false) => {
    try {
      if (!isRefresh) setLoading(true);
      setError(null);

      const response = await fetch('https://dummyjson.com/recipes?limit=20');
      if (!response.ok) throw new Error('Failed to fetch recipes');

      const data: RecipesResponse = await response.json();
      setRecipes(data.recipes);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load recipes');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchRecipes();
  }, []);

  const onRefresh = () => fetchRecipes(true);

  const renderRecipe = ({ item }: { item: Recipe }) => (
    <TouchableOpacity
      style={styles.recipeCard}
      onPress={() => router.push(`/(app)/(tabs)/recipe/${item.id}`)}
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
        <Button mode="contained" onPress={fetchRecipes} style={styles.retryButton}>
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
      {/* Welcome Header */}
      <View style={styles.welcomeContainer}>
        <View style={styles.welcomeTextContainer}>
          <Text style={styles.welcomeGreeting}>
            {user ? `Welcome back, ${user.firstName}!` : 'Welcome to Cookbook!'}
          </Text>
          <Text style={styles.welcomeSubtitle}>Discover delicious recipes</Text>
        </View>
        <Avatar.Icon size={56} icon="chef-hat" style={styles.welcomeAvatar} />
      </View>

      {/* Categories */}
      <View style={styles.sectionContainer}>
        <View style={styles.sectionHeader}>
          <Title style={styles.sectionTitle}>Categories</Title>
        </View>
        <FlatList
          data={[
            'Beef', 'Chicken', 'Dessert', 'Lamb', 'Pasta', 'Pork', 'Seafood', 'Vegetarian',
          ]}
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.categoryList}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={[styles.categoryChip, { backgroundColor: '#FFF3E0' }]}
              onPress={() => router.push(`/(app)/(tabs)/search?category=${item}`)}
            >
              <Text style={styles.categoryChipText}>{item}</Text>
            </TouchableOpacity>
          )}
          keyExtractor={(item) => item}
        />
      </View>

      {/* Featured Recipes */}
      <View style={styles.sectionContainer}>
        <View style={styles.sectionHeader}>
          <Title style={styles.sectionTitle}>Featured Recipes</Title>
          <TouchableOpacity onPress={() => router.push('/(app)/(tabs)/search')} style={styles.seeAll}>
            <Text style={styles.seeAllText}>See All</Text>
          </TouchableOpacity>
        </View>
        <FlatList
          data={recipes.slice(0, 10)}
          renderItem={renderRecipe}
          keyExtractor={(item) => item.id.toString()}
          ItemSeparatorComponent={() => <View style={styles.cardSeparator} />}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>No recipes found</Text>
            </View>
          }
        />
      </View>
    </ScrollView>
  );
}