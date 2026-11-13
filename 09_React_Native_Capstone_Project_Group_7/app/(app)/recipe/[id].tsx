/**
 * Recipe Detail Screen
 * Full recipe: image, metadata, nutrition, checkable ingredients, instructions, tags, reviews, and favorite toggle
 */
import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  Image,
  StyleSheet,
  ActivityIndicator,
  TouchableOpacity,
  Share,
} from 'react-native';
import { useLocalSearchParams, useRouter, Stack } from 'expo-router';
import { Card, Title, Chip, Button, Divider, Checkbox, IconButton } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { recipeApi } from '@/services/recipeApi';
import { favoritesStorage } from '@/utils/storage';
import { Recipe } from '@/types/recipe';

export default function RecipeDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();

  const [recipe, setRecipe] = useState<Recipe | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isFavorite, setIsFavorite] = useState(false);
  const [checkedIngredients, setCheckedIngredients] = useState<Record<number, boolean>>({});

  const recipeId = Number(id);

  const loadRecipe = useCallback(async () => {
    if (!recipeId || Number.isNaN(recipeId)) {
      setError('Invalid recipe ID');
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const [data, favIds] = await Promise.all([
        recipeApi.getRecipeById(recipeId),
        favoritesStorage.getIds(),
      ]);
      setRecipe(data);
      setIsFavorite(Array.isArray(favIds) && favIds.includes(recipeId));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load recipe details');
    } finally {
      setLoading(false);
    }
  }, [recipeId]);

  useEffect(() => {
    loadRecipe();
  }, [loadRecipe]);

  const handleToggleFavorite = async () => {
    if (!recipe) return;
    const nextState = await favoritesStorage.toggleId(recipe.id);
    setIsFavorite(nextState);
  };

  const handleShare = async () => {
    if (!recipe) return;
    try {
      await Share.share({
        title: recipe.name,
        message: `Check out this ${recipe.cuisine} recipe: ${recipe.name} (${recipe.prepTimeMinutes + recipe.cookTimeMinutes} mins, ${recipe.caloriesPerServing} cal/serving)!`,
      });
    } catch {
      // User dismissed share sheet
    }
  };

  const toggleIngredient = (index: number) => {
    setCheckedIngredients((prev) => ({
      ...prev,
      [index]: !prev[index],
    }));
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
        <MaterialCommunityIcons name="alert-circle-outline" size={48} color="#D32F2F" />
        <Text style={styles.errorText}>{error || 'Recipe not found'}</Text>
        <Button mode="contained" onPress={loadRecipe} style={{ marginTop: 12, backgroundColor: '#E85D04' }}>
          Retry
        </Button>
        <Button mode="text" onPress={() => router.back()} style={{ marginTop: 8 }}>
          Go Back
        </Button>
      </View>
    );
  }

  const totalTime = recipe.prepTimeMinutes + recipe.cookTimeMinutes;

  return (
    <>
      <Stack.Screen
        options={{
          headerShown: true,
          title: recipe.name,
          headerStyle: { backgroundColor: '#FFFDF8' },
          headerTintColor: '#3E2723',
          headerRight: () => (
            <View style={{ flexDirection: 'row' }}>
              <IconButton
                icon={isFavorite ? 'heart' : 'heart-outline'}
                iconColor={isFavorite ? '#E53935' : '#3E2723'}
                onPress={handleToggleFavorite}
              />
              <IconButton icon="share-variant" iconColor="#3E2723" onPress={handleShare} />
            </View>
          ),
        }}
      />

      <ScrollView style={styles.container} contentContainerStyle={styles.content}>
        <View style={styles.heroContainer}>
          <Image source={{ uri: recipe.image }} style={styles.heroImage} resizeMode="cover" />
          <TouchableOpacity
            style={styles.fabFavorite}
            onPress={handleToggleFavorite}
            activeOpacity={0.85}
          >
            <MaterialCommunityIcons
              name={isFavorite ? 'heart' : 'heart-outline'}
              size={26}
              color={isFavorite ? '#E53935' : '#3E2723'}
            />
          </TouchableOpacity>
        </View>

        <View style={styles.headerSection}>
          <Title style={styles.title}>{recipe.name}</Title>
          <View style={styles.badgeRow}>
            <Chip style={styles.cuisineChip}>{recipe.cuisine}</Chip>
            <Chip style={styles.difficultyChip}>{recipe.difficulty}</Chip>
            {recipe.mealType.map((m) => (
              <Chip key={m} style={styles.mealChip}>
                {m}
              </Chip>
            ))}
          </View>

          <View style={styles.ratingBox}>
            <MaterialCommunityIcons name="star" size={20} color="#FFB300" />
            <Text style={styles.ratingScore}>{recipe.rating.toFixed(1)}</Text>
            <Text style={styles.reviewCount}>({recipe.reviewCount} verified reviews)</Text>
          </View>
        </View>

        <Card style={styles.statsCard} elevation={1}>
          <Card.Content style={styles.statsGrid}>
            <View style={styles.statItem}>
              <MaterialCommunityIcons name="clock-outline" size={22} color="#E85D04" />
              <Text style={styles.statValue}>{recipe.prepTimeMinutes}m</Text>
              <Text style={styles.statLabel}>Prep</Text>
            </View>
            <View style={styles.statItem}>
              <MaterialCommunityIcons name="fire" size={22} color="#E85D04" />
              <Text style={styles.statValue}>{recipe.cookTimeMinutes}m</Text>
              <Text style={styles.statLabel}>Cook</Text>
            </View>
            <View style={styles.statItem}>
              <MaterialCommunityIcons name="timer-sand" size={22} color="#E85D04" />
              <Text style={styles.statValue}>{totalTime}m</Text>
              <Text style={styles.statLabel}>Total</Text>
            </View>
            <View style={styles.statItem}>
              <MaterialCommunityIcons name="account-group-outline" size={22} color="#E85D04" />
              <Text style={styles.statValue}>{recipe.servings}</Text>
              <Text style={styles.statLabel}>Servings</Text>
            </View>
            <View style={styles.statItem}>
              <MaterialCommunityIcons name="lightning-bolt-outline" size={22} color="#E85D04" />
              <Text style={styles.statValue}>{recipe.caloriesPerServing}</Text>
              <Text style={styles.statLabel}>Cal/Serv</Text>
            </View>
          </Card.Content>
        </Card>

        <Card style={styles.sectionCard} elevation={1}>
          <Card.Content>
            <Title style={styles.sectionTitle}>
              Ingredients ({recipe.ingredients.length})
            </Title>
            <Text style={styles.helperSubtext}>Tap an ingredient to check it off</Text>
            <Divider style={styles.divider} />
            {recipe.ingredients.map((ingredient, index) => {
              const checked = Boolean(checkedIngredients[index]);
              return (
                <TouchableOpacity
                  key={`${ingredient}-${index}`}
                  style={styles.ingredientRow}
                  onPress={() => toggleIngredient(index)}
                  activeOpacity={0.7}
                >
                  <Checkbox
                    status={checked ? 'checked' : 'unchecked'}
                    onPress={() => toggleIngredient(index)}
                    color="#E85D04"
                  />
                  <Text
                    style={[
                      styles.ingredientText,
                      checked && styles.ingredientChecked,
                    ]}
                  >
                    {ingredient}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </Card.Content>
        </Card>

        <Card style={styles.sectionCard} elevation={1}>
          <Card.Content>
            <Title style={styles.sectionTitle}>
              Instructions ({recipe.instructions.length} steps)
            </Title>
            <Divider style={styles.divider} />
            {recipe.instructions.map((step, index) => (
              <View key={`step-${index}`} style={styles.stepRow}>
                <View style={styles.stepBadge}>
                  <Text style={styles.stepNumber}>{index + 1}</Text>
                </View>
                <Text style={styles.stepText}>{step}</Text>
              </View>
            ))}
          </Card.Content>
        </Card>

        {recipe.tags.length > 0 && (
          <View style={styles.tagsSection}>
            <Title style={styles.sectionTitle}>Tags</Title>
            <View style={styles.tagsWrap}>
              {recipe.tags.map((tag) => (
                <Chip
                  key={tag}
                  style={styles.tagChip}
                  onPress={() => router.push(`/(app)/(tabs)/search?category=${encodeURIComponent(tag)}`)}
                >
                  #{tag}
                </Chip>
              ))}
            </View>
          </View>
        )}
      </ScrollView>
    </>
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
    fontSize: 15,
    color: '#8D6E63',
  },
  errorText: {
    marginTop: 12,
    fontSize: 16,
    color: '#D32F2F',
    textAlign: 'center',
  },
  heroContainer: {
    position: 'relative',
    width: '100%',
    height: 260,
  },
  heroImage: {
    width: '100%',
    height: '100%',
  },
  fabFavorite: {
    position: 'absolute',
    bottom: 16,
    right: 16,
    backgroundColor: '#FFFFFF',
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 4,
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
  },
  headerSection: {
    padding: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: '#3E2723',
    marginBottom: 10,
  },
  badgeRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 12,
  },
  cuisineChip: {
    backgroundColor: '#E8F5E9',
  },
  difficultyChip: {
    backgroundColor: '#FFF3E0',
  },
  mealChip: {
    backgroundColor: '#F3E5F5',
  },
  ratingBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  ratingScore: {
    fontSize: 16,
    fontWeight: '700',
    color: '#3E2723',
  },
  reviewCount: {
    fontSize: 14,
    color: '#8D6E63',
  },
  statsCard: {
    marginHorizontal: 16,
    marginBottom: 16,
    borderRadius: 12,
    backgroundColor: '#FFFFFF',
  },
  statsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 12,
  },
  statItem: {
    alignItems: 'center',
    flex: 1,
  },
  statValue: {
    fontSize: 15,
    fontWeight: '700',
    color: '#3E2723',
    marginTop: 4,
  },
  statLabel: {
    fontSize: 11,
    color: '#8D6E63',
    marginTop: 2,
  },
  sectionCard: {
    marginHorizontal: 16,
    marginBottom: 16,
    borderRadius: 12,
    backgroundColor: '#FFFFFF',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#3E2723',
  },
  helperSubtext: {
    fontSize: 12,
    color: '#8D6E63',
    marginTop: 2,
  },
  divider: {
    marginVertical: 10,
  },
  ingredientRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 4,
  },
  ingredientText: {
    fontSize: 15,
    color: '#3E2723',
    flex: 1,
  },
  ingredientChecked: {
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
  stepNumber: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 13,
  },
  stepText: {
    flex: 1,
    fontSize: 15,
    lineHeight: 22,
    color: '#3E2723',
  },
  tagsSection: {
    paddingHorizontal: 16,
  },
  tagsWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 8,
  },
  tagChip: {
    backgroundColor: '#FFF3E0',
  },
});
