/**
 * Home Screen - Cookbook Discover Tab
 * Supports Light Mode, Dark Mode, and System Default.
 * Includes Recommended and Recently Viewed Recipes.
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

import {
  useRouter,
  useFocusEffect,
} from 'expo-router';

import { useAuth } from '@/context/AuthContext';
import { useSettings } from '@/context/SettingsContext';
import { recentlyViewedStorage } from '@/utils/storage';

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

// Checks whether any ingredient contains one of the specified words.
const hasIngredientKeyword = (
  ingredients: string[],
  keywords: string[]
): boolean => {
  const ingredientText = ingredients.join(' ').toLowerCase();

  return keywords.some((keyword) =>
    ingredientText.includes(keyword)
  );
};

// Ingredient-based dietary filtering.
// This is a basic recommendation helper, not a food-safety guarantee.
const isCompatibleWithDiet = (
  recipe: Recipe,
  dietaryPreferences: string[]
): boolean => {
  const ingredients = recipe.ingredients;

  const meatKeywords = [
    'chicken',
    'beef',
    'pork',
    'lamb',
    'turkey',
    'bacon',
    'ham',
    'sausage',
    'meat',
    'duck',
    'goat',
    'veal',
  ];

  const seafoodKeywords = [
    'fish',
    'salmon',
    'tuna',
    'shrimp',
    'prawn',
    'crab',
    'lobster',
    'squid',
    'anchovy',
    'seafood',
    'oyster',
    'clam',
    'mussel',
    'sardine',
  ];

  const dairyKeywords = [
    'milk',
    'cheese',
    'butter',
    'cream',
    'yogurt',
    'yoghurt',
    'whey',
  ];

  const animalProductKeywords = [
    'egg',
    'honey',
    ...dairyKeywords,
  ];

  const glutenKeywords = [
    'wheat',
    'flour',
    'bread',
    'pasta',
    'barley',
    'rye',
    'couscous',
    'breadcrumbs',
    'soy sauce',
  ];

  const lowCarbKeywords = [
    'rice',
    'pasta',
    'bread',
    'potato',
    'sugar',
    'flour',
    'noodles',
    'corn',
    'couscous',
  ];

  for (const preference of dietaryPreferences) {
    switch (preference.toLowerCase()) {
      case 'vegetarian':
        if (
          hasIngredientKeyword(ingredients, [
            ...meatKeywords,
            ...seafoodKeywords,
          ])
        ) {
          return false;
        }
        break;

      case 'vegan':
        if (
          hasIngredientKeyword(ingredients, [
            ...meatKeywords,
            ...seafoodKeywords,
            ...animalProductKeywords,
          ])
        ) {
          return false;
        }
        break;

      case 'pescatarian':
        if (
          hasIngredientKeyword(ingredients, meatKeywords)
        ) {
          return false;
        }
        break;

      case 'gluten-free':
        if (
          hasIngredientKeyword(ingredients, glutenKeywords)
        ) {
          return false;
        }
        break;

      case 'dairy-free':
        if (
          hasIngredientKeyword(ingredients, dairyKeywords)
        ) {
          return false;
        }
        break;

      case 'low-carb':
        if (
          hasIngredientKeyword(ingredients, lowCarbKeywords)
        ) {
          return false;
        }
        break;

      // Halal status cannot be reliably determined from
      // the DummyJSON recipe ingredients.
      case 'halal':
      default:
        break;
    }
  }

  return true;
};

export default function HomeScreen() {
  const router = useRouter();
  const { user } = useAuth();

  const { settings, isSettingsLoaded } = useSettings();

  const theme = useTheme<MD3Theme>();
  const colors = theme.colors;
  const styles = createHomeStyles(colors);

  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [recentlyViewedRecipes, setRecentlyViewedRecipes] =
    useState<Recipe[]>([]);

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // ======================================
  // FETCH RECIPES FROM DUMMYJSON
  // ======================================

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

  // Load recipes when the screen opens.
  useEffect(() => {
    fetchRecipes();
  }, [fetchRecipes]);

  // ======================================
  // LOAD RECENTLY VIEWED RECIPES
  // ======================================

  useFocusEffect(
    useCallback(() => {
      let isActive = true;

      const loadRecentlyViewed = async () => {
        try {
          const recipeIds = await recentlyViewedStorage.getIds();

          if (recipeIds.length === 0) {
            if (isActive) {
              setRecentlyViewedRecipes([]);
            }

            return;
          }

          const viewedRecipes = await Promise.all(
            recipeIds.map(
              async (recipeId): Promise<Recipe | null> => {
                try {
                  const response = await fetch(
                    `https://dummyjson.com/recipes/${recipeId}`
                  );

                  if (!response.ok) {
                    return null;
                  }

                  return (await response.json()) as Recipe;
                } catch {
                  return null;
                }
              }
            )
          );

          if (isActive) {
            setRecentlyViewedRecipes(
              viewedRecipes.filter(
                (recipe): recipe is Recipe => recipe !== null
              )
            );
          }
        } catch (error) {
          console.error(
            'Failed to load recently viewed recipes:',
            error
          );
        }
      };

      void loadRecentlyViewed();

      return () => {
        isActive = false;
      };
    }, [])
  );

  // ======================================
  // PULL TO REFRESH
  // ======================================

  const onRefresh = () => {
    fetchRecipes(true);
  };

  // ======================================
  // NAVIGATION
  // ======================================

  const openSearch = () => {
    router.push('/(app)/(tabs)/search');
  };

  const openMealType = (mealType: string) => {
    router.push(
      `/(app)/(tabs)/search?query=${encodeURIComponent(mealType)}`
    );
  };

  const openSettings = () => {
    router.push('/(app)/settings');
  };

  // ======================================
  // RECIPE OF THE DAY
  // ======================================

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

  // ======================================
  // POPULAR RECIPES
  // ======================================

  const popularRecipes = [...recipes]
    .sort((a, b) => {
      if (b.rating !== a.rating) {
        return b.rating - a.rating;
      }

      return b.reviewCount - a.reviewCount;
    })
    .slice(0, 6);

  // ======================================
  // RECOMMENDED FOR YOU
  // ======================================

  const dietaryPreferences = settings.dietaryPreferences;
  const preferredCuisines = settings.preferredCuisines;
  const cookingDifficulty = settings.cookingDifficulty;

  const hasPreferences =
    dietaryPreferences.length > 0 ||
    preferredCuisines.length > 0 ||
    cookingDifficulty !== 'Any';

  const dietaryFilteredRecipes = recipes.filter((recipe) =>
    isCompatibleWithDiet(recipe, dietaryPreferences)
  );

  const hasDietaryMatches = dietaryFilteredRecipes.length > 0;

  const recommendationSource =
    hasDietaryMatches
      ? dietaryFilteredRecipes
      : recipes;

  const recommendedRecipes = [...recommendationSource]
    .map((recipe) => {
      let score = 0;

      const normalizedCuisine = recipe.cuisine.toLowerCase();

      const cuisineMatches = preferredCuisines.some(
        (cuisine) =>
          cuisine.toLowerCase() === normalizedCuisine
      );

      if (cuisineMatches) {
        score += 3;
      }

      if (
        cookingDifficulty !== 'Any' &&
        recipe.difficulty === cookingDifficulty
      ) {
        score += 2;
      }

      const normalizedTags = recipe.tags.map((tag) =>
        tag.toLowerCase()
      );

      dietaryPreferences.forEach((preference) => {
        if (normalizedTags.includes(preference.toLowerCase())) {
          score += 1;
        }
      });

      return {
        recipe,
        score,
      };
    })
    .sort((a, b) => {
      if (b.score !== a.score) {
        return b.score - a.score;
      }

      if (b.recipe.rating !== a.recipe.rating) {
        return b.recipe.rating - a.recipe.rating;
      }

      return b.recipe.reviewCount - a.recipe.reviewCount;
    })
    .slice(0, 6)
    .map((item) => item.recipe);

  const hasHalalPreference = dietaryPreferences.some(
    (preference) => preference.toLowerCase() === 'halal'
  );

  const hasDietaryFilterPreference = dietaryPreferences.some(
    (preference) =>
      preference.toLowerCase() !== 'halal'
  );

  // ======================================
  // RENDER RECIPE CARD
  // ======================================

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

  // ======================================
  // INITIAL LOADING SCREEN
  // ======================================

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

  // ======================================
  // ERROR SCREEN
  // ======================================

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

  // ======================================
  // MAIN HOME SCREEN
  // ======================================

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
      {/* WELCOME HEADER */}

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

      {/* HOME SEARCH BAR */}

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

      {/* CATEGORIES */}

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

      {/* BROWSE BY MEAL TYPE */}

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

      {/* RECIPE OF THE DAY */}

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

      {/* POPULAR RECIPES */}

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

      {/* RECOMMENDED FOR YOU */}

      {isSettingsLoaded && (
        <View style={styles.sectionContainer}>
          <View style={styles.sectionHeader}>
            <View style={{ flex: 1 }}>
              <Title style={styles.sectionTitle}>
                Recommended for You
              </Title>

              <Text
                style={{
                  fontSize: 12,
                  color: colors.onSurfaceVariant,
                  marginTop: 3,
                }}
              >
                {hasPreferences
                  ? 'Suggestions based on your saved preferences'
                  : 'Popular picks to help you discover recipes'}
              </Text>
            </View>

            <TouchableOpacity
              onPress={openSettings}
              style={styles.seeAll}
              accessibilityRole="button"
              accessibilityLabel="Update recommendation preferences"
            >
              <MaterialCommunityIcons
                name="tune-variant"
                size={19}
                color={colors.primary}
              />

              <Text style={styles.seeAllText}>
                Customize
              </Text>
            </TouchableOpacity>
          </View>

          {/* SHOW SELECTED PREFERENCES */}

          {hasPreferences && (
            <View
              style={{
                flexDirection: 'row',
                flexWrap: 'wrap',
                marginBottom: 10,
                gap: 6,
              }}
            >
              {preferredCuisines.map((cuisine) => (
                <Chip
                  key={`cuisine-${cuisine}`}
                  compact
                  style={{
                    backgroundColor: colors.primaryContainer,
                  }}
                  textStyle={{
                    color: colors.onPrimaryContainer,
                  }}
                >
                  {cuisine}
                </Chip>
              ))}

              {dietaryPreferences.map((preference) => (
                <Chip
                  key={`diet-${preference}`}
                  compact
                  style={{
                    backgroundColor: colors.secondaryContainer,
                  }}
                  textStyle={{
                    color: colors.onSecondaryContainer,
                  }}
                >
                  {preference}
                </Chip>
              ))}

              {cookingDifficulty !== 'Any' && (
                <Chip
                  compact
                  style={{
                    backgroundColor: colors.tertiaryContainer,
                  }}
                  textStyle={{
                    color: colors.onTertiaryContainer,
                  }}
                >
                  {cookingDifficulty}
                </Chip>
              )}
            </View>
          )}

          {/* DIETARY FILTER NOTICE */}

          {hasDietaryFilterPreference &&
            !hasDietaryMatches && (
              <Text
                style={{
                  color: colors.onSurfaceVariant,
                  fontSize: 12,
                  marginBottom: 10,
                  lineHeight: 18,
                }}
              >
                No recipes matched the selected dietary filters
                in the currently loaded recipes. Showing general
                recommendations instead.
              </Text>
            )}

          {/* HALAL INFORMATION NOTICE */}

          {hasHalalPreference && (
            <Text
              style={{
                color: colors.onSurfaceVariant,
                fontSize: 12,
                marginBottom: 10,
                lineHeight: 18,
              }}
            >
              Halal status cannot be verified from this recipe
              catalog. Please check ingredients and certification
              independently.
            </Text>
          )}

          {/* PERSONALIZATION PROMPT */}

          {!hasPreferences && (
            <TouchableOpacity
              onPress={openSettings}
              activeOpacity={0.8}
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                padding: 12,
                marginBottom: 10,
                borderRadius: 12,
                backgroundColor: colors.primaryContainer,
              }}
            >
              <MaterialCommunityIcons
                name="lightbulb-outline"
                size={21}
                color={colors.onPrimaryContainer}
              />

              <Text
                style={{
                  flex: 1,
                  marginLeft: 9,
                  fontSize: 12,
                  lineHeight: 18,
                  color: colors.onPrimaryContainer,
                }}
              >
                Set your favorite cuisines, dietary preferences,
                and cooking difficulty to personalize these recipes.
              </Text>

              <MaterialCommunityIcons
                name="chevron-right"
                size={20}
                color={colors.onPrimaryContainer}
              />
            </TouchableOpacity>
          )}

          <FlatList
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.featuredList}
            data={recommendedRecipes}
            renderItem={renderRecipe}
            keyExtractor={(item) => item.id.toString()}
            ItemSeparatorComponent={() => (
              <View style={styles.cardSeparator} />
            )}
            ListEmptyComponent={
              <View style={styles.emptyContainer}>
                <Text style={styles.emptyText}>
                  No recommendations available yet
                </Text>
              </View>
            }
          />
        </View>
      )}

      {/* RECENTLY VIEWED RECIPES */}

      {recentlyViewedRecipes.length > 0 && (
        <View style={styles.sectionContainer}>
          <View style={styles.sectionHeader}>
            <View>
              <Title style={styles.sectionTitle}>
                Recently Viewed
              </Title>

              <Text
                style={{
                  fontSize: 12,
                  color: colors.onSurfaceVariant,
                  marginTop: 3,
                }}
              >
                Pick up where you left off
              </Text>
            </View>

            <MaterialCommunityIcons
              name="history"
              size={23}
              color={colors.primary}
            />
          </View>

          <FlatList
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.featuredList}
            data={recentlyViewedRecipes}
            renderItem={renderRecipe}
            keyExtractor={(item) => item.id.toString()}
            ItemSeparatorComponent={() => (
              <View style={styles.cardSeparator} />
            )}
          />
        </View>
      )}

      {/* FEATURED RECIPES */}

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