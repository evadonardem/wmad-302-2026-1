
/**
 * Meal Planner Screen - Cookbook App
 * Supports Light Mode, Dark Mode, and System Default.
 * Manages daily meal plans using local storage.
 */

import React, { useCallback, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  Image,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Platform,
  StyleSheet,
} from 'react-native';

import { useFocusEffect, useRouter } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Button, Card, useTheme } from 'react-native-paper';
import type { MD3Theme } from 'react-native-paper';

import { mealPlanStorage } from '@/utils/storage';
import type { MealType, MealPlanEntry } from '@/utils/storage';

interface Recipe {
  id: number;
  name: string;
  image: string;
  difficulty: string;
  cuisine: string;
  prepTimeMinutes: number;
  cookTimeMinutes: number;
}

interface PlannedRecipe {
  recipe: Recipe;
  entry: MealPlanEntry;
}

const MEALS: {
  type: MealType;
  icon: keyof typeof MaterialCommunityIcons.glyphMap;
  colorKey: 'primary' | 'secondary' | 'tertiary';
}[] = [
  {
    type: 'Breakfast',
    icon: 'weather-sunny',
    colorKey: 'primary',
  },
  {
    type: 'Lunch',
    icon: 'white-balance-sunny',
    colorKey: 'secondary',
  },
  {
    type: 'Dinner',
    icon: 'weather-night',
    colorKey: 'tertiary',
  },
];

function getDateKey(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');

  return `${year}-${month}-${day}`;
}

function formatDate(dateKey: string): string {
  const [year, month, day] = dateKey.split('-').map(Number);

  return new Date(year, month - 1, day).toLocaleDateString(
    'en-US',
    {
      weekday: 'long',
      month: 'long',
      day: 'numeric',
      year: 'numeric',
    }
  );
}

export default function MealPlannerScreen() {
  const router = useRouter();

  const theme = useTheme<MD3Theme>();
  const colors = theme.colors;
  const styles = createStyles(colors);

  const [selectedDate, setSelectedDate] = useState(
    () => getDateKey(new Date())
  );

  const [plannedRecipes, setPlannedRecipes] = useState<PlannedRecipe[]>([]);
  const [loading, setLoading] = useState(true);
  const [removingId, setRemovingId] = useState<number | null>(null);

  const loadMealPlan = useCallback(async () => {
    try {
      setLoading(true);

      const entries = await mealPlanStorage.getEntries(selectedDate);

      const results = await Promise.all(
        entries.map(async (entry) => {
          try {
            const response = await fetch(
              `https://dummyjson.com/recipes/${entry.recipeId}`
            );

            if (!response.ok) {
              return null;
            }

            const recipe: Recipe = await response.json();

            return {
              recipe,
              entry,
            };
          } catch (error) {
            console.error(
              `Failed to load planned recipe ${entry.recipeId}:`,
              error
            );

            return null;
          }
        })
      );

      setPlannedRecipes(
        results.filter(
          (item): item is PlannedRecipe => item !== null
        )
      );
    } catch (error) {
      console.error('Failed to load meal plan:', error);

      Alert.alert(
        'Error',
        'Unable to load your meal plan. Please try again.'
      );
    } finally {
      setLoading(false);
    }
  }, [selectedDate]);

  useFocusEffect(
    useCallback(() => {
      void loadMealPlan();
    }, [loadMealPlan])
  );

  const changeDate = (days: number) => {
    const [year, month, day] = selectedDate.split('-').map(Number);
    const date = new Date(year, month - 1, day);

    date.setDate(date.getDate() + days);

    setSelectedDate(getDateKey(date));
  };

  // Remove the recipe from storage and update the screen.
  const performRemoval = async (entry: MealPlanEntry) => {
    try {
      setRemovingId(entry.recipeId);

      await mealPlanStorage.removeEntry(
        entry.date,
        entry.mealType,
        entry.recipeId
      );

      setPlannedRecipes((previous) =>
        previous.filter(
          (item) =>
            !(
              item.entry.date === entry.date &&
              item.entry.mealType === entry.mealType &&
              item.entry.recipeId === entry.recipeId
            )
        )
      );
    } catch (error) {
      console.error('Failed to remove planned recipe:', error);

      Alert.alert(
        'Error',
        'Unable to remove this recipe from your meal plan.'
      );
    } finally {
      setRemovingId(null);
    }
  };

  // Use browser confirmation on web and native confirmation on mobile.
  const removeMeal = (entry: MealPlanEntry) => {
    if (Platform.OS === 'web') {
      const browserWindow = (
        globalThis as unknown as {
          window?: {
            confirm: (message: string) => boolean;
          };
        }
      ).window;

      const confirmed =
        browserWindow?.confirm(
          'Are you sure you want to remove this recipe from your meal plan?'
        ) ?? false;

      if (confirmed) {
        void performRemoval(entry);
      }

      return;
    }

    Alert.alert(
      'Remove Planned Recipe',
      'Are you sure you want to remove this recipe from your meal plan?',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: () => {
            void performRemoval(entry);
          },
        },
      ]
    );
  };

  const getMealRecipes = (mealType: MealType) =>
    plannedRecipes.filter(
      (item) => item.entry.mealType === mealType
    );

  const isToday = selectedDate === getDateKey(new Date());

  return (
    <View style={styles.container}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.headerSubtitle}>
              ORGANIZE YOUR MEALS
            </Text>

            <Text style={styles.headerTitle}>
              Meal Planner
            </Text>

            <Text style={styles.headerDescription}>
              Plan your daily meals and keep your recipes organized.
            </Text>
          </View>

          <MaterialCommunityIcons
            name="calendar-check"
            size={48}
            color={colors.primary}
          />
        </View>

        {/* Date Navigation */}
        <Card style={styles.dateCard} elevation={1}>
          <View style={styles.dateNavigation}>
            <TouchableOpacity
              style={styles.dateArrow}
              onPress={() => changeDate(-1)}
              accessibilityLabel="Previous day"
            >
              <MaterialCommunityIcons
                name="chevron-left"
                size={28}
                color={colors.primary}
              />
            </TouchableOpacity>

            <View style={styles.dateTextContainer}>
              <Text style={styles.dateLabel}>
                {isToday ? 'TODAY' : 'SELECTED DATE'}
              </Text>

              <Text style={styles.dateText}>
                {formatDate(selectedDate)}
              </Text>
            </View>

            <TouchableOpacity
              style={styles.dateArrow}
              onPress={() => changeDate(1)}
              accessibilityLabel="Next day"
            >
              <MaterialCommunityIcons
                name="chevron-right"
                size={28}
                color={colors.primary}
              />
            </TouchableOpacity>
          </View>

          {!isToday && (
            <Button
              mode="text"
              textColor={colors.primary}
              onPress={() => setSelectedDate(getDateKey(new Date()))}
            >
              Return to Today
            </Button>
          )}
        </Card>

        {/* Meal Sections */}
        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator
              size="large"
              color={colors.primary}
            />

            <Text style={styles.loadingText}>
              Loading your meal plan...
            </Text>
          </View>
        ) : (
          <>
            {MEALS.map((meal) => {
              const recipes = getMealRecipes(meal.type);

              return (
                <View key={meal.type} style={styles.mealSection}>
                  <View style={styles.mealHeader}>
                    <View style={styles.mealTitleContainer}>
                      <MaterialCommunityIcons
                        name={meal.icon}
                        size={26}
                        color={colors[meal.colorKey]}
                      />

                      <Text style={styles.mealTitle}>
                        {meal.type}
                      </Text>

                      <View style={styles.countBadge}>
                        <Text style={styles.countText}>
                          {recipes.length}
                        </Text>
                      </View>
                    </View>
                  </View>

                  {recipes.length === 0 ? (
                    <View style={styles.emptyMeal}>
                      <MaterialCommunityIcons
                        name="food-outline"
                        size={35}
                        color={colors.primary}
                      />

                      <Text style={styles.emptyMealText}>
                        No {meal.type.toLowerCase()} recipes planned.
                      </Text>

                      <TouchableOpacity
                        onPress={() =>
                          router.push('/(app)/(tabs)/search')
                        }
                      >
                        <Text style={styles.addRecipeText}>
                          + Browse recipes
                        </Text>
                      </TouchableOpacity>
                    </View>
                  ) : (
                    recipes.map(({ recipe, entry }) => (
                      <Card
                        key={`${entry.date}-${entry.mealType}-${recipe.id}`}
                        style={styles.recipeCard}
                        elevation={1}
                      >
                        <View style={styles.recipeRow}>
                          <TouchableOpacity
                            style={styles.recipeDetailsButton}
                            activeOpacity={0.85}
                            onPress={() =>
                              router.push(`/(app)/recipe/${recipe.id}`)
                            }
                          >
                            <Image
                              source={{ uri: recipe.image }}
                              style={styles.recipeImage}
                            />

                            <View style={styles.recipeInfo}>
                              <Text
                                style={styles.recipeName}
                                numberOfLines={2}
                              >
                                {recipe.name}
                              </Text>

                              <Text style={styles.recipeMeta}>
                                {recipe.cuisine}
                              </Text>

                              <Text style={styles.recipeMeta}>
                                {recipe.difficulty} ·{' '}
                                {recipe.prepTimeMinutes +
                                  recipe.cookTimeMinutes} min
                              </Text>
                            </View>
                          </TouchableOpacity>

                          <TouchableOpacity
                            style={styles.removeButton}
                            disabled={removingId === recipe.id}
                            onPress={() => removeMeal(entry)}
                            accessibilityLabel="Remove planned recipe"
                            accessibilityRole="button"
                          >
                            {removingId === recipe.id ? (
                              <ActivityIndicator
                                size="small"
                                color={colors.error}
                              />
                            ) : (
                              <MaterialCommunityIcons
                                name="close-circle-outline"
                                size={25}
                                color={colors.error}
                              />
                            )}
                          </TouchableOpacity>
                        </View>
                      </Card>
                    ))
                  )}
                </View>
              );
            })}

            {/* Browse Recipes */}
            <Button
              mode="contained"
              buttonColor={colors.primary}
              textColor={colors.onPrimary}
              icon="plus"
              style={styles.browseButton}
              contentStyle={styles.browseButtonContent}
              onPress={() =>
                router.push('/(app)/(tabs)/search')
              }
            >
              Browse Recipes
            </Button>
          </>
        )}
      </ScrollView>
    </View>
  );
}

const createStyles = (colors: MD3Theme['colors']) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },

    scrollContent: {
      padding: 20,
      paddingBottom: 35,
    },

    header: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginTop: 35,
      marginBottom: 20,
    },

    headerSubtitle: {
      color: colors.primary,
      fontSize: 11,
      fontWeight: 'bold',
      letterSpacing: 1.5,
    },

    headerTitle: {
      fontSize: 29,
      fontWeight: 'bold',
      color: colors.onSurface,
      marginTop: 5,
    },

    headerDescription: {
      fontSize: 13,
      color: colors.onSurfaceVariant,
      marginTop: 6,
      maxWidth: 260,
      lineHeight: 19,
    },

    dateCard: {
      backgroundColor: colors.surface,
      borderRadius: 14,
      padding: 12,
      marginBottom: 25,
    },

    dateNavigation: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
    },

    dateArrow: {
      padding: 5,
    },

    dateTextContainer: {
      alignItems: 'center',
      flex: 1,
    },

    dateLabel: {
      fontSize: 10,
      fontWeight: 'bold',
      color: colors.primary,
      letterSpacing: 1,
    },

    dateText: {
      fontSize: 15,
      fontWeight: 'bold',
      color: colors.onSurface,
      marginTop: 4,
      textAlign: 'center',
    },

    loadingContainer: {
      padding: 50,
      alignItems: 'center',
    },

    loadingText: {
      marginTop: 12,
      color: colors.onSurfaceVariant,
    },

    mealSection: {
      marginBottom: 25,
    },

    mealHeader: {
      marginBottom: 12,
    },

    mealTitleContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 9,
    },

    mealTitle: {
      fontSize: 21,
      fontWeight: 'bold',
      color: colors.onSurface,
    },

    countBadge: {
      backgroundColor: colors.primaryContainer,
      minWidth: 25,
      height: 25,
      borderRadius: 13,
      alignItems: 'center',
      justifyContent: 'center',
    },

    countText: {
      color: colors.onPrimaryContainer,
      fontSize: 12,
      fontWeight: 'bold',
    },

    emptyMeal: {
      backgroundColor: colors.surface,
      borderRadius: 12,
      padding: 22,
      alignItems: 'center',
      borderWidth: 1,
      borderColor: colors.outlineVariant,
      borderStyle: 'dashed',
    },

    emptyMealText: {
      color: colors.onSurfaceVariant,
      fontSize: 13,
      marginTop: 8,
    },

    addRecipeText: {
      color: colors.primary,
      fontWeight: 'bold',
      marginTop: 10,
    },

    recipeCard: {
      backgroundColor: colors.surface,
      borderRadius: 12,
      marginBottom: 10,
      overflow: 'hidden',
    },

    recipeRow: {
      flexDirection: 'row',
      alignItems: 'center',
      padding: 10,
    },

    recipeDetailsButton: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
    },

    recipeImage: {
      width: 85,
      height: 85,
      borderRadius: 9,
    },

    recipeInfo: {
      flex: 1,
      marginLeft: 12,
    },

    recipeName: {
      color: colors.onSurface,
      fontSize: 15,
      fontWeight: 'bold',
    },

    recipeMeta: {
      color: colors.onSurfaceVariant,
      fontSize: 12,
      marginTop: 5,
    },

    removeButton: {
      padding: 5,
    },

    browseButton: {
      marginTop: 5,
      borderRadius: 9,
    },

    browseButtonContent: {
      paddingVertical: 6,
    },
  });
