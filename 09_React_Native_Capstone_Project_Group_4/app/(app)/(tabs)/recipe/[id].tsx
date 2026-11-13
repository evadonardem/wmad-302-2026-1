/**
 * Recipe Detail Screen - Cookbook App
 * Displays full recipe: image, prep/cook time, servings, calories/nutrition,
 * tags, rating/reviews, interactive ingredients checklist, step-by-step instructions, and Favorite toggle.
 */
import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  Image,
  ActivityIndicator,
  TouchableOpacity,
  Share,
  StyleSheet,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Card, Title, Chip, Button, Divider, IconButton } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { recipeApi } from '@/services/recipeApi';
import { Recipe } from '@/types/recipe';
import { useFavorites } from '@/context/FavoritesContext';

export default function RecipeDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { isFavorite, toggleFavorite } = useFavorites();

  const [recipe, setRecipe] = useState<Recipe | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [checkedIngredients, setCheckedIngredients] = useState<Record<number, boolean>>({});

  const fetchRecipe = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    setError(null);
    try {
      const numericId = Number(id);
      if (isNaN(numericId)) {
        throw new Error('Invalid recipe ID');
      }
      const data = await recipeApi.getRecipeById(numericId);
      setRecipe(data);
      setCheckedIngredients({});
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load recipe details');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchRecipe();
  }, [fetchRecipe]);

  const toggleIngredientCheck = (index: number) => {
    setCheckedIngredients((prev) => ({
      ...prev,
      [index]: !prev[index],
    }));
  };

  const handleShare = async () => {
    if (!recipe) return;
    try {
      await Share.share({
        title: recipe.name,
        message: `Check out this ${recipe.cuisine} recipe: ${recipe.name} (${
          recipe.prepTimeMinutes + recipe.cookTimeMinutes
        } mins, ${recipe.caloriesPerServing} kcal/serving)!`,
      });
    } catch {
      // User dismissed share sheet
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

  if (error || !recipe) {
    return (
      <View style={styles.centerContainer}>
        <MaterialCommunityIcons name="alert-circle-outline" size={56} color="#C62828" />
        <Text style={styles.errorText}>{error || 'Recipe not found'}</Text>
        <View style={{ flexDirection: 'row', gap: 12, marginTop: 16 }}>
          <Button mode="outlined" onPress={() => router.back()}>
            Go Back
          </Button>
          <Button mode="contained" onPress={fetchRecipe}>
            Retry
          </Button>
        </View>
      </View>
    );
  }

  const favorited = isFavorite(recipe.id);
  const totalTime = recipe.prepTimeMinutes + recipe.cookTimeMinutes;

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Hero Image + Floating Action Bar */}
      <View style={styles.heroContainer}>
        <Image source={{ uri: recipe.image }} style={styles.heroImage} resizeMode="cover" />
        <View style={styles.topActions}>
          <IconButton
            icon="arrow-left"
            size={24}
            iconColor="#3E2723"
            style={styles.actionCircle}
            onPress={() => router.back()}
            accessibilityLabel="Go back"
          />
          <View style={styles.rightActions}>
            <IconButton
              icon="share-variant"
              size={22}
              iconColor="#3E2723"
              style={styles.actionCircle}
              onPress={handleShare}
              accessibilityLabel="Share recipe"
            />
            <IconButton
              icon={favorited ? 'heart' : 'heart-outline'}
              size={24}
              iconColor={favorited ? '#C62828' : '#3E2723'}
              style={styles.actionCircle}
              onPress={() => toggleFavorite(recipe)}
              accessibilityLabel="Toggle favorite"
            />
          </View>
        </View>
      </View>

      <View style={styles.body}>
        {/* Title & Rating */}
        <Title style={styles.title}>{recipe.name}</Title>

        <View style={styles.ratingRow}>
          <MaterialCommunityIcons name="star" size={20} color="#F59E0B" />
          <Text style={styles.ratingValue}>{recipe.rating.toFixed(1)}</Text>
          <Text style={styles.reviewCount}>({recipe.reviewCount} reviews)</Text>
          <Text style={styles.dot}>•</Text>
          <Text style={styles.cuisineLabel}>{recipe.cuisine} Cuisine</Text>
        </View>

        {/* Chips: Difficulty & Meal Types */}
        <View style={styles.chipRow}>
          <Chip style={styles.difficultyChip} textStyle={styles.difficultyChipText}>
            {recipe.difficulty}
          </Chip>
          {recipe.mealType?.map((meal) => (
            <Chip key={meal} style={styles.mealChip} textStyle={styles.mealChipText}>
              {meal}
            </Chip>
          ))}
        </View>

        {/* Nutrition & Quick Stats Card */}
        <Card style={styles.statsCard} elevation={1}>
          <Card.Content style={styles.statsGrid}>
            <View style={styles.statBox}>
              <MaterialCommunityIcons name="clock-outline" size={22} color="#E85D04" />
              <Text style={styles.statNumber}>{totalTime}m</Text>
              <Text style={styles.statSub}>
                Prep {recipe.prepTimeMinutes}m · Cook {recipe.cookTimeMinutes}m
              </Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statBox}>
              <MaterialCommunityIcons name="account-group-outline" size={22} color="#E85D04" />
              <Text style={styles.statNumber}>{recipe.servings}</Text>
              <Text style={styles.statSub}>Servings</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statBox}>
              <MaterialCommunityIcons name="fire" size={22} color="#E85D04" />
              <Text style={styles.statNumber}>{recipe.caloriesPerServing}</Text>
              <Text style={styles.statSub}>kcal / serving</Text>
            </View>
          </Card.Content>
        </Card>

        {/* Save to Favorites CTA */}
        <Button
          mode={favorited ? 'outlined' : 'contained'}
          icon={favorited ? 'heart' : 'heart-outline'}
          onPress={() => toggleFavorite(recipe)}
          style={styles.favoriteButton}
          textColor={favorited ? '#C62828' : '#FFFFFF'}
          buttonColor={favorited ? '#FFF5F5' : '#E85D04'}
        >
          {favorited ? 'Saved in Favorites' : 'Add to Favorites'}
        </Button>

        {/* Ingredients Section */}
        <Card style={styles.sectionCard} elevation={1}>
          <Card.Content>
            <Title style={styles.sectionTitle}>
              Ingredients ({recipe.ingredients.length})
            </Title>
            <Text style={styles.sectionHint}>Tap an ingredient to check it off</Text>
            <Divider style={styles.divider} />
            {recipe.ingredients.map((ingredient, idx) => {
              const checked = !!checkedIngredients[idx];
              return (
                <TouchableOpacity
                  key={`${idx}-${ingredient}`}
                  style={styles.ingredientRow}
                  onPress={() => toggleIngredientCheck(idx)}
                  activeOpacity={0.7}
                >
                  <MaterialCommunityIcons
                    name={checked ? 'checkbox-marked' : 'checkbox-blank-outline'}
                    size={22}
                    color={checked ? '#2E7D32' : '#E85D04'}
                  />
                  <Text
                    style={[
                      styles.ingredientText,
                      checked && styles.ingredientTextChecked,
                    ]}
                  >
                    {ingredient}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </Card.Content>
        </Card>

        {/* Instructions Section */}
        <Card style={styles.sectionCard} elevation={1}>
          <Card.Content>
            <Title style={styles.sectionTitle}>
              Instructions ({recipe.instructions.length} steps)
            </Title>
            <Divider style={styles.divider} />
            {recipe.instructions.map((step, idx) => (
              <View key={`${idx}-${step.slice(0, 12)}`} style={styles.stepRow}>
                <View style={styles.stepBadge}>
                  <Text style={styles.stepBadgeText}>{idx + 1}</Text>
                </View>
                <Text style={styles.stepText}>{step}</Text>
              </View>
            ))}
          </Card.Content>
        </Card>

        {/* Tags Section */}
        {recipe.tags && recipe.tags.length > 0 && (
          <View style={styles.tagsSection}>
            <Text style={styles.tagsHeading}>Tags</Text>
            <View style={styles.tagsWrapper}>
              {recipe.tags.map((tag) => (
                <Chip
                  key={tag}
                  style={styles.tagChip}
                  textStyle={styles.tagChipText}
                  onPress={() =>
                    router.push(`/(app)/(tabs)/search?category=${encodeURIComponent(tag)}`)
                  }
                >
                  #{tag}
                </Chip>
              ))}
            </View>
          </View>
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFDF8',
  },
  content: {
    paddingBottom: 40,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
    backgroundColor: '#FFFDF8',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#8D6E63',
  },
  errorText: {
    marginTop: 12,
    fontSize: 16,
    color: '#C62828',
    textAlign: 'center',
  },
  heroContainer: {
    position: 'relative',
    width: '100%',
    height: 280,
  },
  heroImage: {
    width: '100%',
    height: '100%',
  },
  topActions: {
    position: 'absolute',
    top: 16,
    left: 16,
    right: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  rightActions: {
    flexDirection: 'row',
    gap: 8,
  },
  actionCircle: {
    backgroundColor: 'rgba(255, 255, 255, 0.92)',
    margin: 0,
  },
  body: {
    padding: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: '#3E2723',
    marginBottom: 6,
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    flexWrap: 'wrap',
  },
  ratingValue: {
    fontSize: 15,
    fontWeight: '700',
    color: '#3E2723',
    marginLeft: 4,
  },
  reviewCount: {
    fontSize: 14,
    color: '#8D6E63',
    marginLeft: 4,
  },
  dot: {
    marginHorizontal: 8,
    color: '#8D6E63',
  },
  cuisineLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#E85D04',
  },
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 16,
  },
  difficultyChip: {
    backgroundColor: '#FFF3E0',
  },
  difficultyChipText: {
    color: '#E85D04',
    fontWeight: '600',
  },
  mealChip: {
    backgroundColor: '#E8F5E9',
  },
  mealChipText: {
    color: '#2E7D32',
  },
  statsCard: {
    borderRadius: 14,
    backgroundColor: '#FFFFFF',
    marginBottom: 16,
  },
  statsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    paddingVertical: 12,
  },
  statBox: {
    alignItems: 'center',
    flex: 1,
  },
  statNumber: {
    fontSize: 17,
    fontWeight: '700',
    color: '#3E2723',
    marginTop: 4,
  },
  statSub: {
    fontSize: 11,
    color: '#8D6E63',
    textAlign: 'center',
    marginTop: 2,
  },
  statDivider: {
    width: 1,
    height: 40,
    backgroundColor: '#EFEBE9',
  },
  favoriteButton: {
    borderRadius: 12,
    marginBottom: 16,
    borderColor: '#C62828',
  },
  sectionCard: {
    borderRadius: 14,
    backgroundColor: '#FFFFFF',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#3E2723',
  },
  sectionHint: {
    fontSize: 12,
    color: '#8D6E63',
    marginTop: 2,
  },
  divider: {
    marginVertical: 12,
  },
  ingredientRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    gap: 10,
  },
  ingredientText: {
    fontSize: 15,
    color: '#3E2723',
    flex: 1,
  },
  ingredientTextChecked: {
    textDecorationLine: 'line-through',
    color: '#9E9E9E',
  },
  stepRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 14,
    gap: 12,
  },
  stepBadge: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#E85D04',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 2,
  },
  stepBadgeText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 13,
  },
  stepText: {
    fontSize: 15,
    color: '#3E2723',
    lineHeight: 22,
    flex: 1,
  },
  tagsSection: {
    marginTop: 4,
  },
  tagsHeading: {
    fontSize: 15,
    fontWeight: '700',
    color: '#3E2723',
    marginBottom: 8,
  },
  tagsWrapper: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  tagChip: {
    backgroundColor: '#FFF3E0',
  },
  tagChipText: {
    color: '#5D4037',
    fontSize: 12,
  },
});