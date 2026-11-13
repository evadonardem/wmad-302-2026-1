
/**
 * Home Screen - Cookbook Discover Tab
 * Supports Light Mode, Dark Mode, and System Default.
 * API: https://dummyjson.com/docs/recipes
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

import {
  Card,
  Title,
  Chip,
  Avatar,
  Button,
  useTheme,
} from 'react-native-paper';

import type { MD3Theme } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';

import { createHomeStyles } from './homeStyles';

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

const MEAL_TYPES = [
  {
    label: 'Breakfast',
    icon: 'weather-sunny' as const,
  },
  {
    label: 'Lunch',
    icon: 'food-apple' as const,
  },
  {
    label: 'Dinner',
    icon: 'weather-night' as const,
  },
  {
    label: 'Snacks',
    icon: 'cookie' as const,
  },
];

export default function HomeScreen() {
  const router = useRouter();
  const { user } = useAuth();

  const theme = useTheme<MD3Theme>();
  const colors = theme.colors;
  const styles = createHomeStyles(colors);

  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch recipes from DummyJSON API
  const fetchRecipes = useCallback(async (isRefresh = false) => {
    try {
      if (isRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      setError(null);

      const response = await fetch(
        'https://dummyjson.com/recipes?limit=20'
      );

      if (!response.ok) {
        throw new Error('Failed to fetch recipes');
      }

      const data: RecipesResponse = await response.json();
      setRecipes(data.recipes);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'Failed to load recipes'
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  // Load recipes when the screen opens
  useEffect(() => {
    fetchRecipes();
  }, [fetchRecipes]);

  // Pull-to-refresh
  const onRefresh = () => {
    fetchRecipes(true);
  };

  // Open the existing Search screen
  const openSearch = () => {
    router.push('/(app)/(tabs)/search');
  };

  // Open Search with a selected meal type
  const openMealType = (mealType: string) => {
    router.push(
      `/(app)/(tabs)/search?query=${encodeURIComponent(mealType)}`
    );
  };

  // Select one recipe for the current day.
  // The selection changes each calendar day.
  const today = new Date();
  const startOfYear = new Date(today.getFullYear(), 0, 0);
  const dayOfYear = Math.floor(
    (today.getTime() - startOfYear.getTime()) /
      (1000 * 60 * 60 * 24)
  );

  const recipeOfDay =
    recipes.length > 0
      ? recipes[dayOfYear % recipes.length]
      : null;

  // Popular Recipes: highest rating first.
  // Review count is used when two recipes have the same rating.
  const popularRecipes = [...recipes]
    .sort((a, b) => {
      if (b.rating !== a.rating) {
        return b.rating - a.rating;
      }

      return b.reviewCount - a.reviewCount;
    })
    .slice(0, 6);

  // Render individual recipe card
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

            <Text style={styles.metaText}>
              👥 {item.servings} servings
            </Text>

            <Text style={styles.metaText}>
              🔥 {item.caloriesPerServing} cal
            </Text>
          </View>

          <View style={styles.cuisineRow}>
            <Chip style={styles.cuisineChip}>
              {item.cuisine}
            </Chip>

            {item.mealType.slice(0, 2).map((meal) => (
              <Chip key={meal} style={styles.mealChip}>
                {meal}
              </Chip>
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

  // Initial loading screen
  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={styles.loadingText}>
          Loading recipes...
        </Text>
      </View>
    );
  }

  // Error screen
  if (error) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>{error}</Text>

        <Button
          mode="contained"
          onPress={() => fetchRecipes()}
          style={styles.retryButton}
          buttonColor={colors.primary}
        >
          Retry
        </Button>
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.scrollView}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={onRefresh}
          colors={[colors.primary]}
          tintColor={colors.primary}
        />
      }
      contentContainerStyle={styles.scrollContent}
    >
      {/* Welcome Header */}
      <View style={styles.welcomeContainer}>
        <View style={styles.welcomeTextContainer}>
          <Text style={styles.welcomeGreeting}>
            {user
              ? `Welcome back, ${user.firstName}!`
              : 'Welcome to Cookbook!'}
          </Text>

          <Text style={styles.welcomeSubtitle}>
            Discover delicious recipes
          </Text>
        </View>

        <Avatar.Icon
          size={56}
          icon="chef-hat"
          style={styles.welcomeAvatar}
          color={colors.onPrimaryContainer}
        />
      </View>

      {/* Home Search Bar */}
      <View style={styles.searchBarContainer}>
        <TouchableOpacity
          style={styles.searchBar}
          onPress={openSearch}
          activeOpacity={0.8}
          accessibilityRole="button"
          accessibilityLabel="Search recipes or ingredients"
        >
          <MaterialCommunityIcons
            name="magnify"
            size={24}
            color={colors.primary}
          />

          <Text style={styles.searchPlaceholder}>
            Search recipes or ingredients...
          </Text>

          <MaterialCommunityIcons
            name="tune-variant"
            size={21}
            color={colors.onSurfaceVariant}
          />
        </TouchableOpacity>
      </View>

      {/* Categories */}
      <View style={styles.sectionContainer}>
        <View style={styles.sectionHeader}>
          <Title style={styles.sectionTitle}>
            Categories
          </Title>
        </View>

        <FlatList
          data={[
            'Beef',
            'Chicken',
            'Dessert',
            'Lamb',
            'Pasta',
            'Pork',
            'Seafood',
            'Vegetarian',
          ]}
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.categoryList}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={styles.categoryChip}
              onPress={() =>
                router.push(`/(app)/(tabs)/search?category=${item}`)
              }
            >
              <Text style={styles.categoryChipText}>
                {item}
              </Text>
            </TouchableOpacity>
          )}
          keyExtractor={(item) => item}
        />
      </View>

      {/* Browse by Meal Type */}
      <View style={styles.sectionContainer}>
        <View style={styles.sectionHeader}>
          <Title style={styles.sectionTitle}>
            Browse by Meal Type
          </Title>
        </View>

        <View
          style={{
            flexDirection: 'row',
            flexWrap: 'wrap',
            justifyContent: 'space-between',
            rowGap: 10,
          }}
        >
          {MEAL_TYPES.map((item) => (
            <TouchableOpacity
              key={item.label}
              style={{
                width: '48%',
                minHeight: 82,
                flexDirection: 'row',
                alignItems: 'center',
                padding: 12,
                borderRadius: 15,
                borderWidth: 1,
                borderColor: colors.outlineVariant,
                backgroundColor: colors.surface,
              }}
              activeOpacity={0.8}
              onPress={() => openMealType(item.label)}
              accessibilityRole="button"
              accessibilityLabel={`Browse ${item.label} recipes`}
            >
              <View
                style={{
                  width: 42,
                  height: 42,
                  borderRadius: 21,
                  alignItems: 'center',
                  justifyContent: 'center',
                  backgroundColor: colors.primaryContainer,
                  marginRight: 10,
                }}
              >
                <MaterialCommunityIcons
                  name={item.icon}
                  size={23}
                  color={colors.onPrimaryContainer}
                />
              </View>

              <Text
                style={{
                  flex: 1,
                  fontSize: 14,
                  fontWeight: '700',
                  color: colors.onSurface,
                }}
              >
                {item.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Recipe of the Day */}
      {recipeOfDay && (
        <View style={styles.dailyRecipeSection}>
          <View style={styles.sectionHeader}>
            <Title style={styles.sectionTitle}>
              Recipe of the Day
            </Title>

            <MaterialCommunityIcons
              name="star-circle"
              size={24}
              color={colors.primary}
            />
          </View>

          <Card style={styles.dailyRecipeCard} elevation={3}>
            <View style={styles.dailyImageContainer}>
              <Image
                source={{ uri: recipeOfDay.image }}
                style={styles.dailyRecipeImage}
                resizeMode="cover"
              />

              <View style={styles.dailyBadge}>
                <MaterialCommunityIcons
                  name="star"
                  size={14}
                  color="#FFFFFF"
                />

                <Text style={styles.dailyBadgeText}>
                  TODAY'S PICK
                </Text>
              </View>
            </View>

            <Card.Content style={styles.dailyContent}>
              <Text style={styles.dailyCuisine}>
                {recipeOfDay.cuisine.toUpperCase()}
              </Text>

              <Title style={styles.dailyTitle}>
                {recipeOfDay.name}
              </Title>

              <View style={styles.dailyMetaRow}>
                <View style={styles.dailyMetaItem}>
                  <MaterialCommunityIcons
                    name="clock-outline"
                    size={17}
                    color={colors.primary}
                  />

                  <Text style={styles.dailyMetaText}>
                    {recipeOfDay.prepTimeMinutes +
                      recipeOfDay.cookTimeMinutes} min
                  </Text>
                </View>

                <View style={styles.dailyMetaItem}>
                  <MaterialCommunityIcons
                    name="chef-hat"
                    size={17}
                    color={colors.primary}
                  />

                  <Text style={styles.dailyMetaText}>
                    {recipeOfDay.difficulty}
                  </Text>
                </View>

                <View style={styles.dailyMetaItem}>
                  <MaterialCommunityIcons
                    name="star"
                    size={17}
                    color="#F9A825"
                  />

                  <Text style={styles.dailyMetaText}>
                    {recipeOfDay.rating.toFixed(1)}
                  </Text>
                </View>
              </View>

              <Button
                mode="contained"
                onPress={() =>
                  router.push(`/(app)/recipe/${recipeOfDay.id}`)
                }
                style={styles.dailyButton}
                contentStyle={styles.dailyButtonContent}
                buttonColor={colors.primary}
                textColor={colors.onPrimary}
                icon="arrow-right"
                accessibilityLabel={`View ${recipeOfDay.name} recipe`}
              >
                View Recipe
              </Button>
            </Card.Content>
          </Card>
        </View>
      )}

      {/* Popular Recipes */}
      <View style={styles.sectionContainer}>
        <View style={styles.sectionHeader}>
          <View>
            <Title style={styles.sectionTitle}>
              Popular Recipes
            </Title>

            <Text
              style={{
                fontSize: 12,
                color: colors.onSurfaceVariant,
                marginTop: 3,
              }}
            >
              Top-rated recipes you might enjoy
            </Text>
          </View>

          <TouchableOpacity
            onPress={openSearch}
            style={styles.seeAll}
            accessibilityRole="button"
            accessibilityLabel="See all recipes"
          >
            <Text style={styles.seeAllText}>
              See All
            </Text>
          </TouchableOpacity>
        </View>

        <FlatList
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.featuredList}
          data={popularRecipes}
          renderItem={renderRecipe}
          keyExtractor={(item) => item.id.toString()}
          ItemSeparatorComponent={() => (
            <View style={styles.cardSeparator} />
          )}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>
                No popular recipes available
              </Text>
            </View>
          }
        />
      </View>

      {/* Featured Recipes */}
      <View style={styles.sectionContainer}>
        <View style={styles.sectionHeader}>
          <Title style={styles.sectionTitle}>
            Featured Recipes
          </Title>

          <TouchableOpacity
            onPress={openSearch}
            style={styles.seeAll}
          >
            <Text style={styles.seeAllText}>
              See All
            </Text>
          </TouchableOpacity>
        </View>

        <FlatList
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.featuredList}
          data={recipes.slice(0, 10)}
          renderItem={renderRecipe}
          keyExtractor={(item) => item.id.toString()}
          ItemSeparatorComponent={() => (
            <View style={styles.cardSeparator} />
          )}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>
                No recipes found
              </Text>
            </View>
          }
        />
      </View>
    </ScrollView>
  );
}
