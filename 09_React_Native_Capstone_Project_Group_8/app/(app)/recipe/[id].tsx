
/**
 * Recipe Details Screen - Cookbook
 * Green and white food-inspired design.
 * Manages Favorites and Meal Planning.
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
import { Card, Chip, Button } from 'react-native-paper';

import {
  favoritesStorage,
  mealPlanStorage,
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
        <ActivityIndicator size="large" color="#43A52F" />

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
          color="#8A9687"
        />

        <Text style={styles.errorTitle}>
          Recipe Not Found
        </Text>

        <Text style={styles.errorText}>
          We could not find this recipe. Please try another one.
        </Text>

        <Button
          mode="contained"
          buttonColor="#43A52F"
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
          {/* RECIPE INFORMATION */}

          <Text style={styles.recipeName}>
            {recipe.name}
          </Text>

          <View style={styles.cuisineRow}>
            <MaterialCommunityIcons
              name="silverware-fork-knife"
              size={17}
              color="#43A52F"
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
                      color="#43A52F"
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
                      color="#43A52F"
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
                      color="#43A52F"
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
                color="#43A52F"
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
                    color="#43A52F"
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
                color="#43A52F"
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
                color="#43A52F"
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
                    color="#43A52F"
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
              buttonColor="#43A52F"
              textColor="#FFFFFF"
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
                      color="#43A52F"
                    />

                    <Text style={styles.mealOptionText}>
                      {mealType}
                    </Text>

                    <MaterialCommunityIcons
                      name="chevron-right"
                      size={21}
                      color="#8A9687"
                    />
                  </TouchableOpacity>
                ))}
              </View>
            )}

            {/* FAVORITES BUTTON */}

            <Button
              mode="outlined"
              buttonColor="#FFFFFF"
              textColor="#43A52F"
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
// STYLES
// ======================================

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5FAF3',
  },

  scrollContent: {
    paddingBottom: 35,
  },

  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F5FAF3',
    padding: 24,
    gap: 15,
  },

  loadingText: {
    color: '#52634F',
    fontSize: 16,
    fontWeight: '500',
  },

  errorTitle: {
    fontSize: 23,
    fontWeight: '700',
    color: '#1B5E20',
  },

  errorText: {
    fontSize: 14,
    color: '#687868',
    textAlign: 'center',
    lineHeight: 21,
  },

  backActionButton: {
    marginTop: 10,
    borderRadius: 12,
  },

  // Hero image

  imageContainer: {
    width: '100%',
    height: 300,
    position: 'relative',
    backgroundColor: '#DDEBDD',
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

  // Main content

  content: {
    paddingHorizontal: 18,
    paddingTop: 23,
  },

  recipeName: {
    fontSize: 27,
    lineHeight: 35,
    fontWeight: '700',
    color: '#1B5E20',
  },

  cuisineRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    marginTop: 9,
  },

  cuisine: {
    fontSize: 15,
    color: '#687868',
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
    color: '#344534',
  },

  ratingText: {
    fontSize: 13,
    color: '#849083',
  },

  chipContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 9,
    marginTop: 16,
    marginBottom: 12,
  },

  difficultyChip: {
    backgroundColor: '#E8F5E9',
  },

  mealChip: {
    backgroundColor: '#F1F8E9',
  },

  chipText: {
    color: '#2E7D32',
    fontSize: 12,
    fontWeight: '600',
  },

  // Section headings

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
    color: '#1B5E20',
  },

  sectionSubtitle: {
    fontSize: 12,
    color: '#81907E',
    marginTop: 4,
  },

  sectionIcon: {
    width: 42,
    height: 42,
    borderRadius: 14,
    backgroundColor: '#E8F5E9',
    justifyContent: 'center',
    alignItems: 'center',
  },

  // Cooking information

  infoCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    marginTop: 3,
    borderWidth: 1,
    borderColor: '#E3EDE0',
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
    backgroundColor: '#E8F5E9',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 3,
  },

  infoValue: {
    fontSize: 15,
    fontWeight: '700',
    color: '#1B5E20',
  },

  infoLabel: {
    fontSize: 11,
    color: '#81907E',
    textAlign: 'center',
  },

  infoDivider: {
    width: 1,
    height: 65,
    backgroundColor: '#E3EDE0',
  },

  // Ingredients

  ingredientsCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E3EDE0',
  },

  ingredientRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 13,
    gap: 12,
  },

  ingredientBorder: {
    borderBottomWidth: 1,
    borderBottomColor: '#EDF3EA',
  },

  ingredientText: {
    flex: 1,
    fontSize: 14,
    lineHeight: 21,
    color: '#405040',
  },

  // Cooking instructions

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
    backgroundColor: '#43A52F',
    justifyContent: 'center',
    alignItems: 'center',
  },

  stepNumberText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
  },

  instructionContent: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 13,
    padding: 14,
    borderWidth: 1,
    borderColor: '#E3EDE0',
  },

  stepLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: '#43A52F',
    letterSpacing: 1,
    marginBottom: 6,
  },

  instructionText: {
    fontSize: 14,
    lineHeight: 22,
    color: '#405040',
  },

  // Nutrition

  nutritionCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E3EDE0',
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
    backgroundColor: '#E8F5E9',
    justifyContent: 'center',
    alignItems: 'center',
  },

  calorieInfo: {
    flex: 1,
  },

  nutritionLabel: {
    fontSize: 14,
    fontWeight: '700',
    color: '#344534',
  },

  nutritionDescription: {
    fontSize: 11,
    color: '#849083',
    marginTop: 4,
  },

  calorieValueContainer: {
    alignItems: 'flex-end',
  },

  nutritionValue: {
    fontSize: 23,
    fontWeight: '700',
    color: '#2E7D32',
  },

  kcalText: {
    fontSize: 11,
    color: '#81907E',
  },

  // Actions

  actionsContainer: {
    backgroundColor: '#E8F5E9',
    borderRadius: 18,
    padding: 17,
    marginTop: 28,
  },

  actionsTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1B5E20',
  },

  actionsSubtitle: {
    fontSize: 13,
    lineHeight: 20,
    color: '#52634F',
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
    borderColor: '#43A52F',
    borderWidth: 1.5,
    borderRadius: 12,
  },

  favoriteButtonLabel: {
    fontSize: 14,
    fontWeight: '700',
  },

  // Meal selection

  mealOptionsContainer: {
    backgroundColor: '#FFFFFF',
    padding: 13,
    borderRadius: 14,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#D5E8D0',
  },

  mealOptionsTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#1B5E20',
    marginBottom: 9,
  },

  mealOption: {
    backgroundColor: '#F5FAF3',
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
    color: '#344534',
  },
});
