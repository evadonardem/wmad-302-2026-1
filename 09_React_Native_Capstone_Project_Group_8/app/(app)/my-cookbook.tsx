
/**
 * My Cookbook Screen
 * Displays favorite recipes and recipes added to the Meal Planner.
 * Supports Light Mode and Dark Mode.
 */

import React, { useCallback, useState } from 'react';

import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  StyleSheet,
} from 'react-native';

import { useFocusEffect, useRouter } from 'expo-router';

import {
  Card,
  Chip,
  useTheme,
  MD3Theme,
} from 'react-native-paper';

import { favoritesStorage, mealPlanStorage } from '@/utils/storage';
import { recipeApi } from '@/services/recipeApi';
import { Recipe } from '@/types/recipe';
import { MealPlanEntry } from '@/utils/storage';

interface PlannedRecipe {
  recipe: Recipe;
  entry: MealPlanEntry;
}

export default function MyCookbookScreen() {
  const router = useRouter();

  const theme = useTheme<MD3Theme>();
  const colors = theme.colors;
  const styles = createStyles(colors);

  const [favorites, setFavorites] = useState<Recipe[]>([]);
  const [plannedRecipes, setPlannedRecipes] = useState<PlannedRecipe[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const loadCookbook = useCallback(async () => {
    try {
      setLoading(true);
      setError('');

      const [favoriteIds, mealEntries] = await Promise.all([
        favoritesStorage.getIds(),
        mealPlanStorage.getEntries(),
      ]);

      const allIds = Array.from(
        new Set([
          ...favoriteIds,
          ...mealEntries.map((entry) => entry.recipeId),
        ])
      );

      const results = await Promise.allSettled(
        allIds.map((id) => recipeApi.getRecipeById(id))
      );

      const recipeMap = new Map<number, Recipe>();

      results.forEach((result) => {
        if (result.status === 'fulfilled') {
          recipeMap.set(result.value.id, result.value);
        }
      });

      const favoriteRecipes = favoriteIds
        .map((id) => recipeMap.get(id))
        .filter((recipe): recipe is Recipe => recipe !== undefined);

      const planned = mealEntries
        .map((entry) => {
          const recipe = recipeMap.get(entry.recipeId);

          if (!recipe) {
            return null;
          }

          return {
            recipe,
            entry,
          };
        })
        .filter(
          (item): item is PlannedRecipe => item !== null
        )
        .sort((a, b) =>
          a.entry.date.localeCompare(b.entry.date)
        );

      setFavorites(favoriteRecipes);
      setPlannedRecipes(planned);
    } catch (err) {
      console.error('Failed to load cookbook:', err);
      setError('Unable to load your cookbook. Please try again.');
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      void loadCookbook();
    }, [loadCookbook])
  );

  const openRecipe = (recipeId: number) => {
    router.push(`/(app)/recipe/${recipeId}`);
  };

  const renderRecipeCard = (
    recipe: Recipe,
    subtitle: string,
    key: string
  ) => (
    <TouchableOpacity
      key={key}
      activeOpacity={0.85}
      onPress={() => openRecipe(recipe.id)}
    >
      <Card style={styles.card} elevation={1}>
        <View style={styles.cardContent}>
          <Image
            source={{ uri: recipe.image }}
            style={styles.image}
            resizeMode="cover"
          />

          <View style={styles.info}>
            <Text style={styles.recipeName} numberOfLines={2}>
              {recipe.name}
            </Text>

            <Text style={styles.subtitle}>
              {subtitle}
            </Text>

            <View style={styles.chips}>
              <Chip
                compact
                style={styles.difficultyChip}
                textStyle={styles.difficultyChipText}
              >
                {recipe.difficulty}
              </Chip>

              <Chip
                compact
                style={styles.ratingChip}
                textStyle={styles.ratingChipText}
              >
                ⭐ {recipe.rating}
              </Chip>
            </View>

            <Text style={styles.details}>
              ⏱️ {recipe.prepTimeMinutes + recipe.cookTimeMinutes} min
            </Text>
          </View>
        </View>
      </Card>
    </TouchableOpacity>
  );

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={colors.primary} />

        <Text style={styles.loadingText}>
          Loading your cookbook...
        </Text>
      </View>
    );
  }

  return (
    <FlatList
      style={styles.container}
      contentContainerStyle={styles.list}
      showsVerticalScrollIndicator={false}
      data={[{ id: 'cookbook-content' }]}
      keyExtractor={(item) => item.id}
      renderItem={() => (
        <View>
          <View style={styles.header}>
            <Text style={styles.heading}>
              My Cookbook
            </Text>

            <Text style={styles.headerSubtitle}>
              Your favorite recipes and planned meals in one place
            </Text>
          </View>

          {error ? (
            <Text style={styles.errorText}>{error}</Text>
          ) : (
            <>
              {/* Favorite Recipes */}
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>
                  ❤️ Favorite Recipes ({favorites.length})
                </Text>

                {favorites.length === 0 ? (
                  <Text style={styles.emptyText}>
                    You haven't saved any favorite recipes yet.
                  </Text>
                ) : (
                  favorites.map((recipe) =>
                    renderRecipeCard(
                      recipe,
                      recipe.cuisine,
                      `favorite-${recipe.id}`
                    )
                  )
                )}
              </View>

              {/* Planned Recipes */}
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>
                  📅 Planned Meals ({plannedRecipes.length})
                </Text>

                {plannedRecipes.length === 0 ? (
                  <Text style={styles.emptyText}>
                    You haven't added any meals to your planner yet.
                  </Text>
                ) : (
                  plannedRecipes.map(({ recipe, entry }, index) =>
                    renderRecipeCard(
                      recipe,
                      `${entry.date} · ${entry.mealType}`,
                      `planned-${recipe.id}-${entry.date}-${entry.mealType}-${index}`
                    )
                  )
                )}
              </View>
            </>
          )}
        </View>
      )}
    />
  );
}

/**
 * Dynamic styles based on the active app theme.
 */
const createStyles = (colors: MD3Theme['colors']) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },

    list: {
      paddingBottom: 30,
    },

    header: {
      paddingHorizontal: 20,
      paddingTop: 24,
      paddingBottom: 18,
    },

    heading: {
      fontSize: 26,
      fontWeight: 'bold',
      color: colors.onSurface,
    },

    headerSubtitle: {
      fontSize: 14,
      color: colors.onSurfaceVariant,
      marginTop: 5,
      lineHeight: 20,
    },

    section: {
      paddingHorizontal: 16,
      marginBottom: 24,
    },

    sectionTitle: {
      fontSize: 18,
      fontWeight: 'bold',
      color: colors.onSurface,
      marginBottom: 14,
    },

    card: {
      backgroundColor: colors.surface,
      borderRadius: 12,
      marginBottom: 12,
      overflow: 'hidden',
    },

    cardContent: {
      flexDirection: 'row',
      padding: 10,
      alignItems: 'center',
    },

    image: {
      width: 105,
      height: 105,
      borderRadius: 9,
    },

    info: {
      flex: 1,
      marginLeft: 12,
    },

    recipeName: {
      fontSize: 15,
      fontWeight: 'bold',
      color: colors.onSurface,
    },

    subtitle: {
      fontSize: 12,
      color: colors.onSurfaceVariant,
      marginTop: 5,
    },

    chips: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      marginTop: 7,
      gap: 6,
    },

    difficultyChip: {
      backgroundColor: colors.secondaryContainer,
    },

    difficultyChipText: {
      color: colors.onSecondaryContainer,
    },

    ratingChip: {
      backgroundColor: colors.tertiaryContainer,
    },

    ratingChipText: {
      color: colors.onTertiaryContainer,
    },

    details: {
      fontSize: 12,
      color: colors.onSurfaceVariant,
      marginTop: 6,
    },

    emptyText: {
      fontSize: 14,
      color: colors.onSurfaceVariant,
      paddingVertical: 12,
      lineHeight: 21,
    },

    errorText: {
      color: colors.error,
      padding: 20,
    },

    center: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      backgroundColor: colors.background,
    },

    loadingText: {
      marginTop: 12,
      color: colors.onSurfaceVariant,
    },
  });
