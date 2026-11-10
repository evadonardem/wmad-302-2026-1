
/**
 * Recipe Details Screen
 * Displays recipe information and manages Favorites.
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
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Card, Chip, Button } from 'react-native-paper';
import { favoritesStorage } from '@/utils/storage';

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
    loadRecipe();
  }, [loadRecipe]);

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

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#E85D04" />
        <Text style={styles.loadingText}>Loading recipe...</Text>
      </View>
    );
  }

  if (!recipe) {
    return (
      <View style={styles.centerContainer}>
        <MaterialCommunityIcons
          name="food-off"
          size={60}
          color="#999"
        />

        <Text style={styles.errorTitle}>
          Recipe Not Found
        </Text>

        <Button
          mode="contained"
          buttonColor="#E85D04"
          onPress={() => router.back()}
        >
          Go Back
        </Button>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={styles.imageContainer}>
          <Image
            source={{ uri: recipe.image }}
            style={styles.recipeImage}
            resizeMode="cover"
          />

          <TouchableOpacity
            style={styles.backButton}
            onPress={() => router.back()}
          >
            <MaterialCommunityIcons
              name="arrow-left"
              size={26}
              color="#FFFFFF"
            />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.favoriteButton}
            onPress={handleToggleFavorite}
            disabled={savingFavorite}
          >
            <MaterialCommunityIcons
              name={isFavorite ? 'heart' : 'heart-outline'}
              size={28}
              color={isFavorite ? '#E53935' : '#FFFFFF'}
            />
          </TouchableOpacity>
        </View>

        <View style={styles.content}>
          <Text style={styles.recipeName}>
            {recipe.name}
          </Text>

          <Text style={styles.cuisine}>
            {recipe.cuisine}
          </Text>

          <View style={styles.ratingContainer}>
            <MaterialCommunityIcons
              name="star"
              size={20}
              color="#FFB300"
            />

            <Text style={styles.ratingText}>
              {recipe.rating} ({recipe.reviewCount} reviews)
            </Text>
          </View>

          <View style={styles.chipContainer}>
            <Chip style={styles.chip}>
              {recipe.difficulty}
            </Chip>

            <Chip style={styles.chip}>
              {recipe.mealType?.[0] || 'Recipe'}
            </Chip>
          </View>

          <Card style={styles.infoCard}>
            <Card.Content>
              <View style={styles.infoRow}>
                <View style={styles.infoItem}>
                  <MaterialCommunityIcons
                    name="clock-outline"
                    size={25}
                    color="#E85D04"
                  />
                  <Text style={styles.infoValue}>
                    {recipe.prepTimeMinutes} min
                  </Text>
                  <Text style={styles.infoLabel}>
                    Preparation
                  </Text>
                </View>

                <View style={styles.infoItem}>
                  <MaterialCommunityIcons
                    name="stove"
                    size={25}
                    color="#E85D04"
                  />
                  <Text style={styles.infoValue}>
                    {recipe.cookTimeMinutes} min
                  </Text>
                  <Text style={styles.infoLabel}>
                    Cooking
                  </Text>
                </View>

                <View style={styles.infoItem}>
                  <MaterialCommunityIcons
                    name="account-group-outline"
                    size={25}
                    color="#E85D04"
                  />
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

          <Text style={styles.sectionTitle}>
            Ingredients
          </Text>

          {recipe.ingredients.map((ingredient, index) => (
            <View key={index} style={styles.ingredientRow}>
              <MaterialCommunityIcons
                name="checkbox-marked-circle-outline"
                size={21}
                color="#E85D04"
              />

              <Text style={styles.ingredientText}>
                {ingredient}
              </Text>
            </View>
          ))}

          <Text style={styles.sectionTitle}>
            Cooking Instructions
          </Text>

          {recipe.instructions.map((instruction, index) => (
            <View key={index} style={styles.instructionRow}>
              <View style={styles.stepNumber}>
                <Text style={styles.stepNumberText}>
                  {index + 1}
                </Text>
              </View>

              <Text style={styles.instructionText}>
                {instruction}
              </Text>
            </View>
          ))}

          <Text style={styles.sectionTitle}>
            Nutrition
          </Text>

          <Card style={styles.nutritionCard}>
            <Card.Content>
              <View style={styles.nutritionRow}>
                <Text style={styles.nutritionLabel}>
                  Calories per serving
                </Text>

                <Text style={styles.nutritionValue}>
                  {recipe.caloriesPerServing} kcal
                </Text>
              </View>
            </Card.Content>
          </Card>

          <Button
            mode="contained"
            buttonColor="#E85D04"
            textColor="#FFFFFF"
            icon={isFavorite ? 'heart' : 'heart-outline'}
            loading={savingFavorite}
            disabled={savingFavorite}
            onPress={handleToggleFavorite}
            style={styles.favoriteActionButton}
          >
            {isFavorite
              ? 'Remove from Favorites'
              : 'Add to Favorites'}
          </Button>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = {
  container: {
    flex: 1,
    backgroundColor: '#FFFDF9',
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center' as const,
    alignItems: 'center' as const,
    backgroundColor: '#FFFDF9',
    padding: 24,
    gap: 15,
  },
  loadingText: {
    color: '#666666',
    fontSize: 16,
  },
  errorTitle: {
    fontSize: 22,
    fontWeight: 'bold' as const,
    color: '#333333',
  },
  imageContainer: {
    width: '100%' as const,
    height: 280,
    position: 'relative' as const,
  },
  recipeImage: {
    width: '100%' as const,
    height: '100%' as const,
  },
  backButton: {
    position: 'absolute' as const,
    top: 45,
    left: 18,
    backgroundColor: 'rgba(0,0,0,0.55)',
    borderRadius: 25,
    padding: 10,
  },
  favoriteButton: {
    position: 'absolute' as const,
    top: 45,
    right: 18,
    backgroundColor: 'rgba(0,0,0,0.55)',
    borderRadius: 25,
    padding: 10,
  },
  content: {
    padding: 20,
  },
  recipeName: {
    fontSize: 27,
    fontWeight: 'bold' as const,
    color: '#333333',
  },
  cuisine: {
    fontSize: 15,
    color: '#888888',
    marginTop: 5,
  },
  ratingContainer: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    marginTop: 12,
  },
  ratingText: {
    marginLeft: 5,
    fontSize: 14,
    color: '#666666',
  },
  chipContainer: {
    flexDirection: 'row' as const,
    gap: 8,
    marginTop: 15,
    marginBottom: 15,
  },
  chip: {
    backgroundColor: '#FFF0E5',
  },
  infoCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    marginBottom: 25,
  },
  infoRow: {
    flexDirection: 'row' as const,
    justifyContent: 'space-around' as const,
  },
  infoItem: {
    alignItems: 'center' as const,
    gap: 5,
  },
  infoValue: {
    fontSize: 16,
    fontWeight: 'bold' as const,
    color: '#333333',
  },
  infoLabel: {
    fontSize: 11,
    color: '#888888',
  },
  sectionTitle: {
    fontSize: 21,
    fontWeight: 'bold' as const,
    color: '#333333',
    marginTop: 18,
    marginBottom: 15,
  },
  ingredientRow: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    marginBottom: 12,
    gap: 10,
  },
  ingredientText: {
    flex: 1,
    fontSize: 15,
    color: '#555555',
  },
  instructionRow: {
    flexDirection: 'row' as const,
    alignItems: 'flex-start' as const,
    marginBottom: 18,
    gap: 12,
  },
  stepNumber: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: '#E85D04',
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
  },
  stepNumberText: {
    color: '#FFFFFF',
    fontWeight: 'bold' as const,
  },
  instructionText: {
    flex: 1,
    fontSize: 15,
    lineHeight: 23,
    color: '#555555',
  },
  nutritionCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
  },
  nutritionRow: {
    flexDirection: 'row' as const,
    justifyContent: 'space-between' as const,
  },
  nutritionLabel: {
    fontSize: 14,
    color: '#666666',
  },
  nutritionValue: {
    fontSize: 15,
    fontWeight: 'bold' as const,
    color: '#E85D04',
  },
  favoriteActionButton: {
    marginTop: 25,
    marginBottom: 30,
    borderRadius: 8,
  },
};
