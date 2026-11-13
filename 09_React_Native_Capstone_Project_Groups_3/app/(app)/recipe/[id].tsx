/**
 * Recipe Detail Screen - Cookbook
 * Route: /recipe/[id]  (opened from Home, Search, Favorites)
 *
 * Shows the full recipe: image, rating & reviews, difficulty/cuisine/meal type,
 * prep/cook time, servings, nutrition (calories), ingredients, instructions, tags.
 * The heart button adds/removes the recipe from favorites (saved in AsyncStorage).
 *
 * Note: DummyJSON only provides calories for nutrition, and only a rating +
 * review count (no review text), so that is what this screen shows.
 */
import React, { useCallback, useEffect, useState } from 'react';
import { View, Image, ScrollView, StyleSheet } from 'react-native';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import {
  ActivityIndicator,
  Button,
  Card,
  Chip,
  Divider,
  IconButton,
  Text,
  useTheme,
} from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { recipeApi } from '@/services/recipeApi';
import { favoritesStorage } from '@/utils/storage';
import { Recipe } from '@/types/recipe';

type IconName = keyof typeof MaterialCommunityIcons.glyphMap;

interface StatProps {
  icon: IconName;
  value: string;
  label: string;
}

function Stat({ icon, value, label }: StatProps) {
  const theme = useTheme();
  return (
    <View style={styles.stat}>
      <MaterialCommunityIcons name={icon} size={22} color={theme.colors.primary} />
      <Text variant="titleMedium" style={styles.statValue}>
        {value}
      </Text>
      <Text variant="labelSmall" style={{ color: theme.colors.onSurfaceVariant }}>
        {label}
      </Text>
    </View>
  );
}

export default function RecipeDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const theme = useTheme();

  const [recipe, setRecipe] = useState<Recipe | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isFavorite, setIsFavorite] = useState(false);

  const recipeId = Number(id);

  const loadRecipe = useCallback(async () => {
    if (!Number.isInteger(recipeId) || recipeId <= 0) {
      setError('This recipe link is not valid.');
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      // Load the recipe and the saved favorites at the same time
      const [data, favoriteIds] = await Promise.all([
        recipeApi.getRecipeById(recipeId),
        favoritesStorage.getIds(),
      ]);
      setRecipe(data);
      setIsFavorite(favoriteIds.includes(recipeId));
    } catch {
      setError('Could not load this recipe. Check your connection and try again.');
    } finally {
      setLoading(false);
    }
  }, [recipeId]);

  useEffect(() => {
    loadRecipe();
  }, [loadRecipe]);

  const toggleFavorite = useCallback(async () => {
    try {
      const nowFavorite = await favoritesStorage.toggleId(recipeId);
      setIsFavorite(nowFavorite);
    } catch (err) {
      console.error('Failed to update favorite:', err);
    }
  }, [recipeId]);

  // Header: title + favorite button (back button comes from the Stack)
  const header = (
    <Stack.Screen
      options={{
        headerShown: true,
        title: recipe?.name ?? 'Recipe',
        headerTintColor: theme.colors.primary,
        headerRight: () =>
          recipe ? (
            <IconButton
              icon={isFavorite ? 'heart' : 'heart-outline'}
              iconColor={theme.colors.error}
              onPress={toggleFavorite}
              accessibilityLabel={isFavorite ? 'Remove from favorites' : 'Add to favorites'}
            />
          ) : null,
      }}
    />
  );

  if (loading) {
    return (
      <View style={[styles.center, { backgroundColor: theme.colors.background }]}>
        {header}
        <ActivityIndicator size="large" />
        <Text style={styles.centerText}>Loading recipe...</Text>
      </View>
    );
  }

  if (error || !recipe) {
    return (
      <View style={[styles.center, { backgroundColor: theme.colors.background }]}>
        {header}
        <MaterialCommunityIcons name="alert-circle-outline" size={64} color={theme.colors.error} />
        <Text style={styles.centerText}>{error ?? 'Recipe not found.'}</Text>
        <Button mode="contained" onPress={loadRecipe} style={styles.centerButton}>
          Try Again
        </Button>
        <Button onPress={() => router.back()}>Go Back</Button>
      </View>
    );
  }

  const totalMinutes = recipe.prepTimeMinutes + recipe.cookTimeMinutes;
  const totalCalories = recipe.caloriesPerServing * recipe.servings;

  return (
    <ScrollView
      style={{ backgroundColor: theme.colors.background }}
      contentContainerStyle={styles.scrollContent}
    >
      {header}

      <Image source={{ uri: recipe.image }} style={styles.image} resizeMode="cover" />

      <View style={styles.body}>
        {/* Title & rating */}
        <Text variant="headlineSmall" style={styles.title}>
          {recipe.name}
        </Text>
        <View style={styles.ratingRow}>
          <MaterialCommunityIcons name="star" size={18} color="#F9A825" />
          <Text variant="bodyMedium" style={styles.ratingText}>
            {recipe.rating.toFixed(1)}
          </Text>
          <Text variant="bodyMedium" style={{ color: theme.colors.onSurfaceVariant }}>
            ({recipe.reviewCount} reviews)
          </Text>
        </View>

        {/* Difficulty, cuisine, meal types */}
        <View style={styles.chipRow}>
          <Chip icon="chef-hat" compact>
            {recipe.difficulty}
          </Chip>
          <Chip icon="earth" compact>
            {recipe.cuisine}
          </Chip>
          {recipe.mealType.map((meal) => (
            <Chip key={meal} compact>
              {meal}
            </Chip>
          ))}
        </View>

        {/* Quick stats */}
        <Card style={styles.statsCard} mode="contained">
          <View style={styles.statsRow}>
            <Stat icon="clock-outline" value={`${recipe.prepTimeMinutes}m`} label="Prep" />
            <Stat icon="stove" value={`${recipe.cookTimeMinutes}m`} label="Cook" />
            <Stat icon="account-group" value={`${recipe.servings}`} label="Servings" />
            <Stat icon="fire" value={`${recipe.caloriesPerServing}`} label="kcal/serving" />
          </View>
        </Card>

        {/* Nutrition */}
        <Text variant="titleMedium" style={styles.sectionTitle}>
          Nutrition
        </Text>
        <Text variant="bodyMedium">
          {recipe.caloriesPerServing} kcal per serving · {totalCalories} kcal for the whole recipe
          ({recipe.servings} servings) · ready in {totalMinutes} min
        </Text>

        <Divider style={styles.divider} />

        {/* Ingredients */}
        <Text variant="titleMedium" style={styles.sectionTitle}>
          Ingredients ({recipe.ingredients.length})
        </Text>
        {recipe.ingredients.map((ingredient, index) => (
          <View key={`${index}-${ingredient}`} style={styles.ingredientRow}>
            <MaterialCommunityIcons name="circle-small" size={22} color={theme.colors.primary} />
            <Text variant="bodyMedium" style={styles.flexText}>
              {ingredient}
            </Text>
          </View>
        ))}

        <Divider style={styles.divider} />

        {/* Instructions */}
        <Text variant="titleMedium" style={styles.sectionTitle}>
          Instructions
        </Text>
        {recipe.instructions.map((step, index) => (
          <View key={`${index}-${step}`} style={styles.stepRow}>
            <View style={[styles.stepNumber, { backgroundColor: theme.colors.primary }]}>
              <Text style={[styles.stepNumberText, { color: theme.colors.onPrimary }]}>
                {index + 1}
              </Text>
            </View>
            <Text variant="bodyMedium" style={styles.flexText}>
              {step}
            </Text>
          </View>
        ))}

        {/* Tags */}
        {recipe.tags.length > 0 && (
          <>
            <Divider style={styles.divider} />
            <Text variant="titleMedium" style={styles.sectionTitle}>
              Tags
            </Text>
            <View style={styles.chipRow}>
              {recipe.tags.map((tag) => (
                <Chip key={tag} compact mode="outlined">
                  #{tag}
                </Chip>
              ))}
            </View>
          </>
        )}

        {/* Favorite button (same action as the heart in the header) */}
        <Button
          mode={isFavorite ? 'outlined' : 'contained'}
          icon={isFavorite ? 'heart' : 'heart-outline'}
          onPress={toggleFavorite}
          style={styles.favoriteButton}
        >
          {isFavorite ? 'Remove from Favorites' : 'Add to Favorites'}
        </Button>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scrollContent: {
    paddingBottom: 40,
  },
  image: {
    width: '100%',
    height: 260,
  },
  body: {
    padding: 16,
  },
  title: {
    fontWeight: '700',
    marginBottom: 6,
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: 12,
  },
  ratingText: {
    fontWeight: '600',
  },
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 16,
  },
  statsCard: {
    marginBottom: 16,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: 14,
  },
  stat: {
    alignItems: 'center',
    gap: 2,
  },
  statValue: {
    fontWeight: '700',
  },
  sectionTitle: {
    fontWeight: '700',
    marginBottom: 8,
  },
  divider: {
    marginVertical: 16,
  },
  ingredientRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 4,
  },
  stepRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    marginBottom: 12,
  },
  stepNumber: {
    width: 26,
    height: 26,
    borderRadius: 13,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepNumberText: {
    fontSize: 13,
    fontWeight: '700',
  },
  flexText: {
    flex: 1,
    lineHeight: 22,
  },
  favoriteButton: {
    marginTop: 24,
  },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  centerText: {
    marginTop: 12,
    textAlign: 'center',
  },
  centerButton: {
    marginTop: 16,
    marginBottom: 4,
  },
});
