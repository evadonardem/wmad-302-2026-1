/**
 * Recipe Details Screen - Cookbook
 * Supports Light Mode and Dark Mode.
 * Manages Favorites, Meal Planning, and Recently Viewed Recipes.
 */

import React, { useEffect, useState, useCallback } from 'react';

import {
  View,
  Text,
  ScrollView,
  Image,
  ActivityIndicator,
  TouchableOpacity,
  Alert,
  StyleSheet,
} from 'react-native';

import { useLocalSearchParams, useRouter } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';

import {
  Card,
  Chip,
  Button,
  useTheme,
  type MD3Theme,
} from 'react-native-paper';

import {
  favoritesStorage,
  mealPlanStorage,
  recentlyViewedStorage,
} from '@/utils/storage';

import type { MealType } from '@/utils/storage';

interface Recipe {
  id: number;
  name: string;
  ingredients: string[];
  instructions: string[];
  prepTimeMinutes: number;
  cookTimeMinutes: number;
  servings: number;
  difficulty: string;
  cuisine: string;
  caloriesPerServing: number;
  tags: string[];
  image: string;
  rating: number;
  reviewCount: number;
  mealType: string[];
}

export default function RecipeDetailsScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();

  const theme = useTheme<MD3Theme>();
  const styles = createStyles(theme);

  const [recipe, setRecipe] = useState<Recipe | null>(null);
  const [loading, setLoading] = useState(true);

  const [isFavorite, setIsFavorite] = useState(false);
  const [savingFavorite, setSavingFavorite] = useState(false);

  const [showMealOptions, setShowMealOptions] = useState(false);
  const [savingMeal, setSavingMeal] = useState(false);

  // ======================================
  // LOAD RECIPE
  // ======================================

  const loadRecipe = useCallback(async () => {
    if (!id) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);

      const response = await fetch(
        `https://dummyjson.com/recipes/${id}`
      );

      if (!response.ok) {
        throw new Error('Recipe not found.');
      }

      const data: Recipe = await response.json();

      setRecipe(data);

      // Save this recipe to Recently Viewed.
      // A storage error will not prevent the recipe from loading.
      try {
        await recentlyViewedStorage.addId(data.id);
      } catch (storageError) {
        console.error(
          'Failed to save recently viewed recipe:',
          storageError
        );
      }

      const favoriteIds = await favoritesStorage.getIds();

      setIsFavorite(favoriteIds.includes(data.id));
    } catch (error) {
      console.error('Failed to load recipe:', error);

      Alert.alert(
        'Error',
        'Unable to load this recipe. Please try again.'
      );
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    void loadRecipe();
  }, [loadRecipe]);

  // ======================================
  // TOGGLE FAVORITES
  // ======================================

  const handleToggleFavorite = async () => {
    if (!recipe || savingFavorite) {
      return;
    }

    try {
      setSavingFavorite(true);

      const updatedFavoriteStatus =
        await favoritesStorage.toggleId(recipe.id);

      setIsFavorite(updatedFavoriteStatus);
    } catch (error) {
      console.error('Failed to update favorite:', error);

      Alert.alert(
        'Error',
        'Unable to update your Favorites. Please try again.'
      );
    } finally {
      setSavingFavorite(false);
    }
  };

  // ======================================
  // ADD RECIPE TO MEAL PLAN
  // ======================================

  const handleAddToMealPlan = async (mealType: MealType) => {
    if (!recipe || savingMeal) {
      return;
    }

    try {
      setSavingMeal(true);

      const now = new Date();

      const year = now.getFullYear();
      const month = String(now.getMonth() + 1).padStart(2, '0');
      const day = String(now.getDate()).padStart(2, '0');

      const today = `${year}-${month}-${day}`;

      const wasAdded = await mealPlanStorage.addEntry(
        today,
        mealType,
        recipe.id
      );

      setShowMealOptions(false);

      Alert.alert(
        wasAdded ? 'Meal Planned!' : 'Already Planned',
        wasAdded
          ? `${recipe.name} has been added to your ${mealType} plan for today.`
          : `${recipe.name} is already in your ${mealType} plan for today.`
      );
    } catch (error) {
      console.error('Failed to add recipe to meal plan:', error);

      Alert.alert(
        'Error',
        'Unable to add this recipe to your meal plan. Please try again.'
      );
    } finally {
      setSavingMeal(false);
    }
  };

  // ======================================
  // LOADING SCREEN
  // ======================================

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator
          size="large"
          color={theme.colors.primary}
        />

        <Text style={styles.loadingText}>
          Preparing your recipe...
        </Text>
      </View>
    );
  }

  // ======================================
  // RECIPE NOT FOUND
  // ======================================

  if (!recipe) {
    return (
      <View style={styles.centerContainer}>
        <MaterialCommunityIcons
          name="food-off"
          size={65}
          color={theme.colors.onSurfaceVariant}
        />

        <Text style={styles.errorTitle}>
          Recipe Not Found
        </Text>

        <Text style={styles.errorText}>
          We could not find this recipe. Please try another one.
        </Text>

        <Button
          mode="contained"
          buttonColor={theme.colors.primary}
          onPress={() => router.back()}
          style={styles.backActionButton}
        >
          Go Back
        </Button>
      </View>
    );
  }

  // ======================================
  // MAIN RECIPE DETAILS SCREEN
  // ======================================

  return (
    <View style={styles.container}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* RECIPE IMAGE */}

        <View style={styles.imageContainer}>
          <Image
            source={{ uri: recipe.image }}
            style={styles.recipeImage}
            resizeMode="cover"
          />

          <View style={styles.imageOverlay} />

          <TouchableOpacity
            style={styles.backButton}
            onPress={() => router.back()}
            activeOpacity={0.8}
            accessibilityLabel="Go back"
          >
            <MaterialCommunityIcons
              name="arrow-left"
              size={25}
              color="#FFFFFF"
            />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.favoriteButton}
            onPress={handleToggleFavorite}
            disabled={savingFavorite}
            activeOpacity={0.8}
            accessibilityLabel={
              isFavorite ? 'Remove from favorites' : 'Add to favorites'
            }
          >
            <MaterialCommunityIcons
              name={isFavorite ? 'heart' : 'heart-outline'}
              size={27}
              color={isFavorite ? '#FF5252' : '#FFFFFF'}
            />
          </TouchableOpacity>

          <View style={styles.imageLabel}>
            <MaterialCommunityIcons
              name="food"
              size={15}
              color="#FFFFFF"
            />

            <Text style={styles.imageLabelText}>
              RECIPE DETAILS
            </Text>
          </View>
        </View>

        {/* MAIN CONTENT */}

        <View style={styles.content}>
          <Text style={styles.recipeName}>
            {recipe.name}
          </Text>

          <View style={styles.cuisineRow}>
            <MaterialCommunityIcons
              name="silverware-fork-knife"
              size={17}
              color={theme.colors.primary}
            />

            <Text style={styles.cuisine}>
              {recipe.cuisine}
            </Text>
          </View>

          <View style={styles.ratingContainer}>
            <MaterialCommunityIcons
              name="star"
              size={21}
              color="#F9A825"
            />

            <Text style={styles.ratingValue}>
              {recipe.rating.toFixed(1)}
            </Text>

            <Text style={styles.ratingText}>
              ({recipe.reviewCount} reviews)
            </Text>
          </View>

          {/* RECIPE CHIPS */}

          <View style={styles.chipContainer}>
            <Chip
              icon="chef-hat"
              style={styles.difficultyChip}
              textStyle={styles.chipText}
            >
              {recipe.difficulty}
            </Chip>

            <Chip
              icon="food"
              style={styles.mealChip}
              textStyle={styles.chipText}
            >
              {recipe.mealType?.[0] || 'Recipe'}
            </Chip>
          </View>

          {/* TIME AND SERVINGS */}

          <Text style={styles.sectionTitle}>
            Cooking Information
          </Text>

          <Card style={styles.infoCard} elevation={1}>
            <Card.Content>
              <View style={styles.infoRow}>
                <View style={styles.infoItem}>
                  <View style={styles.infoIconContainer}>
                    <MaterialCommunityIcons
                      name="clock-outline"
                      size={24}
                      color={theme.colors.primary}
                    />
                  </View>

                  <Text style={styles.infoValue}>
                    {recipe.prepTimeMinutes} min
                  </Text>

                  <Text style={styles.infoLabel}>
                    Preparation
                  </Text>
                </View>

                <View style={styles.infoDivider} />

                <View style={styles.infoItem}>
                  <View style={styles.infoIconContainer}>
                    <MaterialCommunityIcons
                      name="stove"
                      size={24}
                      color={theme.colors.primary}
                    />
                  </View>

                  <Text style={styles.infoValue}>
                    {recipe.cookTimeMinutes} min
                  </Text>

                  <Text style={styles.infoLabel}>
                    Cooking
                  </Text>
                </View>

                <View style={styles.infoDivider} />

                <View style={styles.infoItem}>
                  <View style={styles.infoIconContainer}>
                    <MaterialCommunityIcons
                      name="account-group-outline"
                      size={24}
                      color={theme.colors.primary}
                    />
                  </View>

                  <Text style={styles.infoValue}>
                    {recipe.servings}
                  </Text>

                  <Text style={styles.infoLabel}>
                    Servings
                  </Text>
                </View>
              </View>
            </Card.Content>
          </Card>

          {/* INGREDIENTS */}

          <View style={styles.sectionHeader}>
            <View>
              <Text style={styles.sectionTitle}>
                Ingredients
              </Text>

              <Text style={styles.sectionSubtitle}>
                Everything you need for this recipe
              </Text>
            </View>

            <View style={styles.sectionIcon}>
              <MaterialCommunityIcons
                name="basket-outline"
                size={23}
                color={theme.colors.primary}
              />
            </View>
          </View>

          <Card style={styles.ingredientsCard} elevation={1}>
            <Card.Content>
              {recipe.ingredients.map((ingredient, index) => (
                <View
                  key={index}
                  style={[
                    styles.ingredientRow,
                    index !== recipe.ingredients.length - 1 &&
                      styles.ingredientBorder,
                  ]}
                >
                  <MaterialCommunityIcons
                    name="check-circle-outline"
                    size={21}
                    color={theme.colors.primary}
                  />

                  <Text style={styles.ingredientText}>
                    {ingredient}
                  </Text>
                </View>
              ))}
            </Card.Content>
          </Card>

          {/* COOKING INSTRUCTIONS */}

          <View style={styles.sectionHeader}>
            <View>
              <Text style={styles.sectionTitle}>
                Cooking Instructions
              </Text>

              <Text style={styles.sectionSubtitle}>
                Follow these steps to prepare your dish
              </Text>
            </View>

            <View style={styles.sectionIcon}>
              <MaterialCommunityIcons
                name="chef-hat"
                size={23}
                color={theme.colors.primary}
              />
            </View>
          </View>

          {recipe.instructions.map((instruction, index) => (
            <View
              key={index}
              style={styles.instructionRow}
            >
              <View style={styles.stepNumber}>
                <Text style={styles.stepNumberText}>
                  {index + 1}
                </Text>
              </View>

              <View style={styles.instructionContent}>
                <Text style={styles.stepLabel}>
                  STEP {index + 1}
                </Text>

                <Text style={styles.instructionText}>
                  {instruction}
                </Text>
              </View>
            </View>
          ))}

          {/* NUTRITION */}

          <View style={styles.sectionHeader}>
            <View>
              <Text style={styles.sectionTitle}>
                Nutrition Information
              </Text>

              <Text style={styles.sectionSubtitle}>
                Nutritional value per serving
              </Text>
            </View>

            <View style={styles.sectionIcon}>
              <MaterialCommunityIcons
                name="leaf"
                size={23}
                color={theme.colors.primary}
              />
            </View>
          </View>

          <Card style={styles.nutritionCard} elevation={1}>
            <Card.Content>
              <View style={styles.nutritionContent}>
                <View style={styles.calorieIcon}>
                  <MaterialCommunityIcons
                    name="fire"
                    size={28}
                    color={theme.colors.primary}
                  />
                </View>

                <View style={styles.calorieInfo}>
                  <Text style={styles.nutritionLabel}>
                    Calories per serving
                  </Text>

                  <Text style={styles.nutritionDescription}>
                    Estimated energy content
                  </Text>
                </View>

                <View style={styles.calorieValueContainer}>
                  <Text style={styles.nutritionValue}>
                    {recipe.caloriesPerServing}
                  </Text>

                  <Text style={styles.kcalText}>
                    kcal
                  </Text>
                </View>
              </View>
            </Card.Content>
          </Card>

          {/* ADD TO MEAL PLAN */}

          <View style={styles.actionsContainer}>
            <Text style={styles.actionsTitle}>
              Ready to cook?
            </Text>

            <Text style={styles.actionsSubtitle}>
              Add this recipe to your daily meal plan or save it for later.
            </Text>

            <Button
              mode="contained"
              buttonColor={theme.colors.primary}
              textColor={theme.colors.onPrimary}
              icon="calendar-plus"
              loading={savingMeal}
              disabled={savingMeal}
              onPress={() =>
                setShowMealOptions(!showMealOptions)
              }
              style={styles.actionButton}
              contentStyle={styles.actionButtonContent}
              labelStyle={styles.actionButtonLabel}
            >
              Add to Meal Plan
            </Button>

            {showMealOptions && (
              <View style={styles.mealOptionsContainer}>
                <Text style={styles.mealOptionsTitle}>
                  Select a Meal
                </Text>

                {(
                  ['Breakfast', 'Lunch', 'Dinner'] as MealType[]
                ).map((mealType) => (
                  <TouchableOpacity
                    key={mealType}
                    disabled={savingMeal}
                    onPress={() => handleAddToMealPlan(mealType)}
                    style={styles.mealOption}
                    activeOpacity={0.7}
                  >
                    <MaterialCommunityIcons
                      name={
                        mealType === 'Breakfast'
                          ? 'weather-sunny'
                          : mealType === 'Lunch'
                            ? 'white-balance-sunny'
                            : 'weather-night'
                      }
                      size={23}
                      color={theme.colors.primary}
                    />

                    <Text style={styles.mealOptionText}>
                      {mealType}
                    </Text>

                    <MaterialCommunityIcons
                      name="chevron-right"
                      size={21}
                      color={theme.colors.onSurfaceVariant}
                    />
                  </TouchableOpacity>
                ))}
              </View>
            )}

            {/* FAVORITES BUTTON */}

            <Button
              mode="outlined"
              buttonColor={theme.colors.surface}
              textColor={theme.colors.primary}
              icon={isFavorite ? 'heart' : 'heart-outline'}
              loading={savingFavorite}
              disabled={savingFavorite}
              onPress={handleToggleFavorite}
              style={styles.favoriteActionButton}
              contentStyle={styles.actionButtonContent}
              labelStyle={styles.favoriteButtonLabel}
            >
              {isFavorite
                ? 'Remove from Favorites'
                : 'Add to Favorites'}
            </Button>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

// ======================================
// THEME-AWARE STYLES
// ======================================

function createStyles(theme: MD3Theme) {
  const colors = theme.colors;

  return StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },

    scrollContent: {
      paddingBottom: 35,
    },

    centerContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      backgroundColor: colors.background,
      padding: 24,
      gap: 15,
    },

    loadingText: {
      color: colors.onSurfaceVariant,
      fontSize: 16,
      fontWeight: '500',
    },

    errorTitle: {
      fontSize: 23,
      fontWeight: '700',
      color: colors.onSurface,
    },

    errorText: {
      fontSize: 14,
      color: colors.onSurfaceVariant,
      textAlign: 'center',
      lineHeight: 21,
    },

    backActionButton: {
      marginTop: 10,
      borderRadius: 12,
    },

    imageContainer: {
      width: '100%',
      height: 300,
      position: 'relative',
      backgroundColor: colors.surfaceVariant,
    },

    recipeImage: {
      width: '100%',
      height: '100%',
    },

    imageOverlay: {
      ...StyleSheet.absoluteFillObject,
      backgroundColor: 'rgba(0, 0, 0, 0.12)',
    },

    backButton: {
      position: 'absolute',
      top: 48,
      left: 18,
      width: 46,
      height: 46,
      backgroundColor: 'rgba(27, 94, 32, 0.85)',
      borderRadius: 25,
      justifyContent: 'center',
      alignItems: 'center',
    },

    favoriteButton: {
      position: 'absolute',
      top: 48,
      right: 18,
      width: 46,
      height: 46,
      backgroundColor: 'rgba(27, 94, 32, 0.85)',
      borderRadius: 25,
      justifyContent: 'center',
      alignItems: 'center',
    },

    imageLabel: {
      position: 'absolute',
      bottom: 18,
      left: 18,
      flexDirection: 'row',
      alignItems: 'center',
      gap: 7,
      backgroundColor: 'rgba(27, 94, 32, 0.85)',
      paddingHorizontal: 13,
      paddingVertical: 8,
      borderRadius: 20,
    },

    imageLabelText: {
      color: '#FFFFFF',
      fontSize: 11,
      fontWeight: '700',
      letterSpacing: 1,
    },

    content: {
      paddingHorizontal: 18,
      paddingTop: 23,
    },

    recipeName: {
      fontSize: 27,
      lineHeight: 35,
      fontWeight: '700',
      color: colors.onSurface,
    },

    cuisineRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 7,
      marginTop: 9,
    },

    cuisine: {
      fontSize: 15,
      color: colors.onSurfaceVariant,
      fontWeight: '500',
    },

    ratingContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      marginTop: 13,
      gap: 5,
    },

    ratingValue: {
      fontSize: 15,
      fontWeight: '700',
      color: colors.onSurface,
    },

    ratingText: {
      fontSize: 13,
      color: colors.onSurfaceVariant,
    },

    chipContainer: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 9,
      marginTop: 16,
      marginBottom: 12,
    },

    difficultyChip: {
      backgroundColor: colors.secondaryContainer,
    },

    mealChip: {
      backgroundColor: colors.primaryContainer,
    },

    chipText: {
      color: colors.onSecondaryContainer,
      fontSize: 12,
      fontWeight: '600',
    },

    sectionHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginTop: 25,
      marginBottom: 13,
    },

    sectionTitle: {
      fontSize: 20,
      fontWeight: '700',
      color: colors.onSurface,
    },

    sectionSubtitle: {
      fontSize: 12,
      color: colors.onSurfaceVariant,
      marginTop: 4,
    },

    sectionIcon: {
      width: 42,
      height: 42,
      borderRadius: 14,
      backgroundColor: colors.primaryContainer,
      justifyContent: 'center',
      alignItems: 'center',
    },

    infoCard: {
      backgroundColor: colors.surface,
      borderRadius: 16,
      marginTop: 3,
      borderWidth: 1,
      borderColor: colors.outlineVariant,
    },

    infoRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-around',
    },

    infoItem: {
      flex: 1,
      alignItems: 'center',
      gap: 5,
    },

    infoIconContainer: {
      width: 44,
      height: 44,
      borderRadius: 14,
      backgroundColor: colors.primaryContainer,
      justifyContent: 'center',
      alignItems: 'center',
      marginBottom: 3,
    },

    infoValue: {
      fontSize: 15,
      fontWeight: '700',
      color: colors.onSurface,
    },

    infoLabel: {
      fontSize: 11,
      color: colors.onSurfaceVariant,
      textAlign: 'center',
    },

    infoDivider: {
      width: 1,
      height: 65,
      backgroundColor: colors.outlineVariant,
    },

    ingredientsCard: {
      backgroundColor: colors.surface,
      borderRadius: 16,
      borderWidth: 1,
      borderColor: colors.outlineVariant,
    },

    ingredientRow: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingVertical: 13,
      gap: 12,
    },

    ingredientBorder: {
      borderBottomWidth: 1,
      borderBottomColor: colors.outlineVariant,
    },

    ingredientText: {
      flex: 1,
      fontSize: 14,
      lineHeight: 21,
      color: colors.onSurface,
    },

    instructionRow: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      marginBottom: 16,
      gap: 13,
    },

    stepNumber: {
      width: 36,
      height: 36,
      borderRadius: 13,
      backgroundColor: colors.primary,
      justifyContent: 'center',
      alignItems: 'center',
    },

    stepNumberText: {
      color: colors.onPrimary,
      fontSize: 15,
      fontWeight: '700',
    },

    instructionContent: {
      flex: 1,
      backgroundColor: colors.surface,
      borderRadius: 13,
      padding: 14,
      borderWidth: 1,
      borderColor: colors.outlineVariant,
    },

    stepLabel: {
      fontSize: 10,
      fontWeight: '700',
      color: colors.primary,
      letterSpacing: 1,
      marginBottom: 6,
    },

    instructionText: {
      fontSize: 14,
      lineHeight: 22,
      color: colors.onSurface,
    },

    nutritionCard: {
      backgroundColor: colors.surface,
      borderRadius: 16,
      borderWidth: 1,
      borderColor: colors.outlineVariant,
    },

    nutritionContent: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
    },

    calorieIcon: {
      width: 48,
      height: 48,
      borderRadius: 15,
      backgroundColor: colors.primaryContainer,
      justifyContent: 'center',
      alignItems: 'center',
    },

    calorieInfo: {
      flex: 1,
    },

    nutritionLabel: {
      fontSize: 14,
      fontWeight: '700',
      color: colors.onSurface,
    },

    nutritionDescription: {
      fontSize: 11,
      color: colors.onSurfaceVariant,
      marginTop: 4,
    },

    calorieValueContainer: {
      alignItems: 'flex-end',
    },

    nutritionValue: {
      fontSize: 23,
      fontWeight: '700',
      color: colors.primary,
    },

    kcalText: {
      fontSize: 11,
      color: colors.onSurfaceVariant,
    },

    actionsContainer: {
      backgroundColor: colors.primaryContainer,
      borderRadius: 18,
      padding: 17,
      marginTop: 28,
    },

    actionsTitle: {
      fontSize: 20,
      fontWeight: '700',
      color: colors.onPrimaryContainer,
    },

    actionsSubtitle: {
      fontSize: 13,
      lineHeight: 20,
      color: colors.onPrimaryContainer,
      marginTop: 5,
      marginBottom: 16,
    },

    actionButton: {
      borderRadius: 12,
      marginBottom: 10,
    },

    actionButtonContent: {
      height: 49,
    },

    actionButtonLabel: {
      fontSize: 14,
      fontWeight: '700',
    },

    favoriteActionButton: {
      borderColor: colors.primary,
      borderWidth: 1.5,
      borderRadius: 12,
    },

    favoriteButtonLabel: {
      fontSize: 14,
      fontWeight: '700',
    },

    mealOptionsContainer: {
      backgroundColor: colors.surface,
      padding: 13,
      borderRadius: 14,
      marginBottom: 12,
      borderWidth: 1,
      borderColor: colors.outlineVariant,
    },

    mealOptionsTitle: {
      fontSize: 15,
      fontWeight: '700',
      color: colors.onSurface,
      marginBottom: 9,
    },

    mealOption: {
      backgroundColor: colors.surfaceVariant,
      paddingHorizontal: 13,
      paddingVertical: 13,
      borderRadius: 10,
      marginBottom: 8,
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
    },

    mealOptionText: {
      flex: 1,
      fontSize: 14,
      fontWeight: '600',
      color: colors.onSurface,
    },
  });
}