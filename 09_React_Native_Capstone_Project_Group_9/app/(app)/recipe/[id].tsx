
import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  Animated,
  ActivityIndicator,
  Alert,
  Easing,
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  useWindowDimensions,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Button, Chip, Title } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { recipeApi } from '@/services/recipeApi';
import { Recipe } from '@/types/recipe';

const FAVORITES_KEY = 'favorite_recipe_ids';

async function getFavoriteIds(): Promise<number[]> {
  const stored = await AsyncStorage.getItem(FAVORITES_KEY);
  if (!stored) return [];

  const parsed: unknown = JSON.parse(stored);
  if (!Array.isArray(parsed) || !parsed.every((id) => Number.isInteger(id))) {
    throw new Error('Saved favorites are invalid. Clear app storage and try again.');
  }
  return parsed as number[];
}

export default function RecipeDetailScreen() {
  const router = useRouter();
  const { width: screenWidth } = useWindowDimensions();
  const isWide = screenWidth >= 760;
  const recommendationColumns = screenWidth >= 1100 ? 4 : screenWidth >= 760 ? 3 : screenWidth >= 520 ? 2 : 1;
  const recommendationContentWidth = Math.max(0, Math.min(screenWidth, 1200) - 40);
  const recommendationCardWidth = (
    recommendationContentWidth - (recommendationColumns - 1) * 14
  ) / recommendationColumns;
  const imageDrift = useRef(new Animated.Value(0)).current;
  const { id } = useLocalSearchParams<{ id: string | string[] }>();
  const recipeId = Number(Array.isArray(id) ? id[0] : id);
  const [recipe, setRecipe] = useState<Recipe | null>(null);
  const [isFavorite, setIsFavorite] = useState(false);
  const [loading, setLoading] = useState(true);
  const [savingFavorite, setSavingFavorite] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [recommendedRecipes, setRecommendedRecipes] = useState<Recipe[]>([]);
  const [recommendationsLoading, setRecommendationsLoading] = useState(false);
  const [recommendationsError, setRecommendationsError] = useState<string | null>(null);
  const [recommendationsRetry, setRecommendationsRetry] = useState(0);

  const loadRecipe = useCallback(async () => {
    if (!Number.isInteger(recipeId) || recipeId === 0) {
      setError('This recipe could not be found.');
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const [recipeData, favoriteIds] = await Promise.all([
        recipeApi.getRecipeById(recipeId),
        getFavoriteIds(),
      ]);
      setRecipe(recipeData);
      setIsFavorite(favoriteIds.includes(recipeId));
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : 'Failed to load this recipe.');
    } finally {
      setLoading(false);
    }
  }, [recipeId]);

  useEffect(() => {
    void loadRecipe();
  }, [loadRecipe]);

  useEffect(() => {
    if (!recipe) return;

    let active = true;
    setRecommendedRecipes([]);
    setRecommendationsLoading(true);
    setRecommendationsError(null);

    recipeApi.getRecipes({ limit: 30 })
      .then(({ recipes }) => {
        const recipeTags = new Set(recipe.tags.map((tag) => tag.toLowerCase()));
        const sorted = recipes
          .filter((candidate) => candidate.id !== recipe.id)
          .sort((first, second) => {
            const score = (candidate: Recipe) => (
              Number(candidate.cuisine.toLowerCase() === recipe.cuisine.toLowerCase()) * 3
              + candidate.tags.filter((tag) => recipeTags.has(tag.toLowerCase())).length
            );
            return score(second) - score(first) || second.rating - first.rating;
          })
          .slice(0, 4);
        if (active) setRecommendedRecipes(sorted);
      })
      .catch((recommendationError: unknown) => {
        if (active) {
          setRecommendationsError(
            recommendationError instanceof Error
              ? recommendationError.message
              : 'Could not load recommendations.'
          );
        }
      })
      .finally(() => {
        if (active) setRecommendationsLoading(false);
      });

    return () => {
      active = false;
    };
  }, [recipe, recommendationsRetry]);

  useEffect(() => {
    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(imageDrift, {
          toValue: 1,
          duration: 18000,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
          isInteraction: false,
        }),
        Animated.timing(imageDrift, {
          toValue: 0,
          duration: 18000,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
          isInteraction: false,
        }),
      ])
    );
    animation.start();
    return () => animation.stop();
  }, [imageDrift]);

  const toggleFavorite = async () => {
    if (savingFavorite) return;
    setSavingFavorite(true);
    try {
      const favoriteIds = await getFavoriteIds();
      const nextIds = isFavorite
        ? favoriteIds.filter((favoriteId) => favoriteId !== recipeId)
        : [...favoriteIds, recipeId];
      await AsyncStorage.setItem(FAVORITES_KEY, JSON.stringify(nextIds));
      setIsFavorite(!isFavorite);
    } catch (saveError) {
      Alert.alert(
        'Could not update favorites',
        saveError instanceof Error ? saveError.message : 'Please try again.'
      );
    } finally {
      setSavingFavorite(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#E85D04" />
        <Text style={styles.mutedText}>Loading recipe...</Text>
      </View>
    );
  }

  if (error || !recipe) {
    return (
      <View style={styles.center}>
        <Text style={styles.errorText}>{error ?? 'Recipe not found.'}</Text>
        <Button mode="contained" onPress={() => void loadRecipe()} buttonColor="#E85D04">
          Try again
        </Button>
        <Button onPress={() => router.back()} textColor="#8D6E63">
          Go back
        </Button>
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
    >
      <View style={[styles.recipeLayout, isWide && styles.recipeLayoutWide]}>
        <View style={[styles.overviewColumn, isWide && styles.overviewColumnWide]}>
          <View style={[styles.imageWrap, isWide && styles.imageWrapWide]}>
            <Animated.Image
              source={{ uri: recipe.image }}
              style={[
                styles.image,
                {
                  transform: [
                    {
                      scale: imageDrift.interpolate({
                        inputRange: [0, 1],
                        outputRange: [1, 1.06],
                      }),
                    },
                    {
                      translateX: imageDrift.interpolate({
                        inputRange: [0, 1],
                        outputRange: [-5, 5],
                      }),
                    },
                    {
                      translateY: imageDrift.interpolate({
                        inputRange: [0, 1],
                        outputRange: [2, -2],
                      }),
                    },
                  ],
                },
              ]}
              resizeMode="cover"
            />
            <TouchableOpacity
              style={styles.backButton}
              onPress={() => router.back()}
              accessibilityLabel="Go back"
            >
              <MaterialCommunityIcons name="arrow-left" size={24} color="#3E2723" />
            </TouchableOpacity>
          </View>

          <View style={styles.overviewBody}>
            <Text style={styles.cuisine}>{recipe.cuisine}</Text>
            <Title style={styles.title}>{recipe.name}</Title>
            <View style={styles.ratingRow}>
              {recipe.rating > 0 ? (
                <>
                  <MaterialCommunityIcons name="star" size={18} color="#F9A825" />
                  <Text style={styles.rating}>{recipe.rating.toFixed(1)}</Text>
                  <Text style={styles.mutedText}>({recipe.reviewCount} reviews)</Text>
                </>
              ) : (
                <Text style={styles.mutedText}>Community rating not available</Text>
              )}
            </View>

            <View style={styles.metadata}>
              {recipe.id < 0 ? (
                <>
                  <View style={styles.metadataItem}>
                    <MaterialCommunityIcons name="basket-outline" size={21} color="#E85D04" />
                    <Text style={styles.metadataValue}>{recipe.ingredients.length}</Text>
                    <Text style={styles.metadataLabel}>Ingredients</Text>
                  </View>
                  <View style={styles.metadataItem}>
                    <MaterialCommunityIcons name="format-list-numbered" size={21} color="#E85D04" />
                    <Text style={styles.metadataValue}>{recipe.instructions.length}</Text>
                    <Text style={styles.metadataLabel}>Steps</Text>
                  </View>
                  <View style={styles.metadataItem}>
                    <MaterialCommunityIcons name="earth" size={21} color="#E85D04" />
                    <Text style={styles.metadataValue} numberOfLines={1}>{recipe.cuisine}</Text>
                    <Text style={styles.metadataLabel}>Cuisine</Text>
                  </View>
                </>
              ) : (
                <>
                  <View style={styles.metadataItem}>
                    <MaterialCommunityIcons name="clock-outline" size={21} color="#E85D04" />
                    <Text style={styles.metadataValue}>
                      {recipe.prepTimeMinutes + recipe.cookTimeMinutes} min
                    </Text>
                    <Text style={styles.metadataLabel}>Total time</Text>
                  </View>
                  <View style={styles.metadataItem}>
                    <MaterialCommunityIcons name="account-group-outline" size={21} color="#E85D04" />
                    <Text style={styles.metadataValue}>{recipe.servings}</Text>
                    <Text style={styles.metadataLabel}>Servings</Text>
                  </View>
                  <View style={styles.metadataItem}>
                    <MaterialCommunityIcons name="fire" size={21} color="#E85D04" />
                    <Text style={styles.metadataValue}>{recipe.caloriesPerServing}</Text>
                    <Text style={styles.metadataLabel}>Cal / serving</Text>
                  </View>
                </>
              )}
            </View>

            <Button
              mode={isFavorite ? 'contained' : 'outlined'}
              icon={isFavorite ? 'heart' : 'heart-outline'}
              onPress={() => void toggleFavorite()}
              loading={savingFavorite}
              disabled={savingFavorite}
              buttonColor={isFavorite ? '#E85D04' : undefined}
              textColor={isFavorite ? '#FFFFFF' : '#E85D04'}
              style={styles.favoriteButton}
            >
              {isFavorite ? 'Saved to favorites' : 'Add to favorites'}
            </Button>
          </View>
        </View>

        <View style={[styles.detailsColumn, isWide && styles.detailsColumnWide]}>
          <View style={styles.detailCard}>
            <View style={styles.detailHeadingRow}>
              <MaterialCommunityIcons name="basket-outline" size={21} color="#E85D04" />
              <View>
                <Title style={styles.detailSectionTitle}>Ingredients</Title>
                <Text style={styles.detailCaption}>{recipe.ingredients.length} items</Text>
              </View>
            </View>
            {recipe.ingredients.map((ingredient, index) => (
              <View key={`${ingredient}-${index}`} style={styles.listRow}>
                <MaterialCommunityIcons name="checkbox-blank-circle-outline" size={17} color="#E85D04" />
                <Text style={styles.listText}>{ingredient}</Text>
              </View>
            ))}
          </View>

          <View style={[styles.detailCard, styles.instructionsCard]}>
            <View style={styles.detailHeadingRow}>
              <MaterialCommunityIcons name="format-list-numbered" size={21} color="#E85D04" />
              <View>
                <Title style={styles.detailSectionTitle}>Directions</Title>
                <Text style={styles.detailCaption}>{recipe.instructions.length} steps</Text>
              </View>
            </View>
            {recipe.instructions.map((instruction, index) => (
              <View key={`${index}-${instruction}`} style={styles.instructionRow}>
                <View style={styles.stepNumber}>
                  <Text style={styles.stepNumberText}>{index + 1}</Text>
                </View>
                <Text style={styles.listText}>{instruction}</Text>
              </View>
            ))}
          </View>

          {recipe.tags.length > 0 && (
            <View style={styles.tagsSection}>
              <Title style={styles.sectionTitle}>Tags</Title>
              <View style={styles.tags}>
                {recipe.tags.map((tag) => (
                  <Chip key={tag} style={styles.tag} textStyle={styles.tagText}>{tag}</Chip>
                ))}
              </View>
            </View>
          )}
        </View>
      </View>

      <View style={styles.recommendationSection}>
        <View style={styles.recommendationHeading}>
          <View>
            <Title style={styles.sectionTitle}>You might also like</Title>
            <Text style={styles.recommendationCaption}>More ideas for your next meal</Text>
          </View>
          <MaterialCommunityIcons name="lightbulb-on-outline" size={24} color="#E85D04" />
        </View>

        {recommendationsLoading ? (
          <ActivityIndicator size="small" color="#E85D04" style={styles.recommendationLoader} />
        ) : recommendationsError ? (
          <View style={styles.recommendationError}>
            <Text style={styles.recommendationCaption}>{recommendationsError}</Text>
            <Button
              compact
              onPress={() => setRecommendationsRetry((attempt) => attempt + 1)}
              textColor="#E85D04"
            >
              Retry
            </Button>
          </View>
        ) : recommendedRecipes.length > 0 ? (
          <View style={styles.recommendationGrid}>
            {recommendedRecipes.map((recommendedRecipe) => (
              <TouchableOpacity
                key={recommendedRecipe.id}
                style={[styles.recommendationCard, { width: recommendationCardWidth }]}
                onPress={() => router.push(`/(app)/recipe/${recommendedRecipe.id}`)}
                accessibilityRole="button"
                accessibilityLabel={`View recommended recipe ${recommendedRecipe.name}`}
              >
                <Image
                  source={{ uri: recommendedRecipe.image }}
                  style={styles.recommendationImage}
                  resizeMode="cover"
                />
                <View style={styles.recommendationInfo}>
                  <Text style={styles.recommendationName} numberOfLines={2}>
                    {recommendedRecipe.name}
                  </Text>
                  <View style={styles.recommendationMeta}>
                    <Text style={styles.recommendationCuisine} numberOfLines={1}>
                      {recommendedRecipe.cuisine}
                    </Text>
                    {recommendedRecipe.rating > 0 && (
                      <Text style={styles.recommendationRating}>
                        ★ {recommendedRecipe.rating.toFixed(1)}
                      </Text>
                    )}
                  </View>
                </View>
              </TouchableOpacity>
            ))}
          </View>
        ) : (
          <Text style={styles.recommendationCaption}>No recommendations are available right now.</Text>
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFFDF8' },
  content: { paddingBottom: 48, alignItems: 'stretch' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 24 },
  imageWrap: {
    width: '100%',
    maxWidth: 1120,
    aspectRatio: 1.55,
    alignSelf: 'center',
    position: 'relative',
    borderRadius: 22,
    overflow: 'hidden',
    marginTop: 16,
    backgroundColor: '#F1ECE7',
  },
  imageWrapWide: { aspectRatio: 1.55, marginTop: 0 },
  image: { width: '100%', height: '100%' },
  backButton: {
    position: 'absolute',
    top: 20,
    left: 16,
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  recipeLayout: {
    width: '100%',
    maxWidth: 1200,
    alignSelf: 'center',
    paddingHorizontal: 20,
    paddingTop: 20,
    gap: 20,
  },
  recipeLayoutWide: { flexDirection: 'row', alignItems: 'flex-start', gap: 24 },
  overviewColumn: { width: '100%' },
  overviewColumnWide: { flex: 1, minWidth: 0 },
  overviewBody: { paddingTop: 18 },
  detailsColumn: { width: '100%', gap: 14 },
  detailsColumnWide: { flex: 1, minWidth: 0 },
  cuisine: { color: '#E85D04', fontSize: 13, fontWeight: '700', textTransform: 'uppercase' },
  title: { color: '#3E2723', fontSize: 27, lineHeight: 34, fontWeight: '700', marginTop: 4 },
  ratingRow: { flexDirection: 'row', alignItems: 'center', gap: 5, marginTop: 8 },
  rating: { color: '#3E2723', fontSize: 15, fontWeight: '700' },
  mutedText: { color: '#8D6E63', marginTop: 12 },
  metadata: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    backgroundColor: '#FFF3E0',
    borderRadius: 16,
    marginVertical: 20,
    paddingVertical: 16,
  },
  metadataItem: { alignItems: 'center', gap: 4 },
  metadataValue: { color: '#3E2723', fontWeight: '700', fontSize: 14 },
  metadataLabel: { color: '#8D6E63', fontSize: 11 },
  favoriteButton: { marginBottom: 4, borderColor: '#E85D04' },
  sectionTitle: { color: '#3E2723', fontSize: 21, fontWeight: '700', marginBottom: 12 },
  detailCard: {
    minWidth: 0,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#EAE1DA',
    padding: 18,
    backgroundColor: '#F7F1EC',
  },
  instructionsCard: { backgroundColor: '#FFFFFF' },
  detailHeadingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 12,
  },
  detailSectionTitle: { color: '#3E2723', fontSize: 21, fontWeight: '700', marginVertical: 0 },
  detailCaption: { color: '#8D6E63', fontSize: 12, marginTop: -2 },
  listRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 10, paddingVertical: 7 },
  listText: { flex: 1, color: '#5D4037', fontSize: 15, lineHeight: 23 },
  divider: { marginVertical: 22 },
  instructionRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 12, marginBottom: 16 },
  stepNumber: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#FFF3E0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  stepNumberText: { color: '#E85D04', fontWeight: '700' },
  tagsSection: { marginTop: 6 },
  tags: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  tag: { backgroundColor: '#FFF3E0' },
  tagText: { color: '#8D6E63' },
  recommendationSection: {
    width: '100%',
    maxWidth: 1200,
    alignSelf: 'center',
    paddingHorizontal: 20,
    marginTop: 30,
    marginBottom: 36,
  },
  recommendationHeading: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
  },
  recommendationCaption: { color: '#8D6E63', fontSize: 13 },
  recommendationGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 14 },
  recommendationCard: {
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#EAE1DA',
    overflow: 'hidden',
    backgroundColor: '#FFFFFF',
  },
  recommendationImage: { width: '100%', height: 140, backgroundColor: '#F1ECE7' },
  recommendationInfo: { padding: 12 },
  recommendationName: { color: '#3E2723', fontSize: 14, lineHeight: 19, fontWeight: '700' },
  recommendationMeta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 8,
    marginTop: 8,
  },
  recommendationCuisine: { flex: 1, color: '#8D6E63', fontSize: 12 },
  recommendationRating: { color: '#A66D00', fontSize: 12, fontWeight: '700' },
  recommendationLoader: { paddingVertical: 24 },
  recommendationError: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FFF0EC',
    paddingHorizontal: 14,
    borderRadius: 12,
  },
  errorText: { color: '#C62828', textAlign: 'center', marginBottom: 18 },
});
