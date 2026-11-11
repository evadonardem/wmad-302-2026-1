import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Image,
  Platform,
  ScrollView,
  Share,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Button, IconButton, Snackbar, useTheme } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Recipe } from '@/types/recipe';
import { recipeApi } from '@/services/recipeApi';
import { useFavorites } from '@/context/FavoritesContext';

export default function RecipeDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { colors } = useTheme();
  const { favoriteIds, isLoading: favoritesLoading, toggleFavorite } = useFavorites();
  const [recipe, setRecipe] = useState<Recipe | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<string | null>(null);
  const isFavorite = recipe ? favoriteIds.includes(recipe.id) : false;

  const loadRecipe = useCallback(async () => {
    const recipeId = Number(id);
    if (!Number.isInteger(recipeId) || recipeId <= 0) {
      setError('This recipe could not be found.');
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);
    try {
      setRecipe(await recipeApi.getRecipeById(recipeId));
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : 'Failed to load this recipe.');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    void loadRecipe();
  }, [loadRecipe]);

  const handleFavorite = async () => {
    if (!recipe) return;
    try {
      await toggleFavorite(recipe.id);
    } catch (saveError) {
      setFeedback(saveError instanceof Error ? saveError.message : 'Could not update favorites. Please try again.');
    }
  };

  const handleShare = async () => {
    if (!recipe) return;

    const summary = `${recipe.name}\n${recipe.prepTimeMinutes + recipe.cookTimeMinutes} minutes · ${recipe.cuisine}`;
    try {
      if (Platform.OS === 'web') {
        const browser = globalThis as typeof globalThis & {
          navigator?: {
            share?: (data: { title: string; text: string; url?: string }) => Promise<void>;
            clipboard?: { writeText: (text: string) => Promise<void> };
          };
          location?: { href: string };
        };
        const url = browser.location?.href;

        if (browser.navigator?.share) {
          await browser.navigator.share({ title: recipe.name, text: summary, ...(url ? { url } : {}) });
        } else if (browser.navigator?.clipboard) {
          await browser.navigator.clipboard.writeText(`${summary}${url ? `\n${url}` : ''}`);
          setFeedback('Recipe details and link copied.');
        } else {
          throw new Error('Sharing and clipboard access are not available in this browser.');
        }
        return;
      }

      await Share.share({ message: summary });
    } catch (shareError) {
      if (
        typeof shareError === 'object'
        && shareError !== null
        && 'name' in shareError
        && shareError.name === 'AbortError'
      ) {
        return;
      }
      setFeedback(shareError instanceof Error ? `Could not share recipe: ${shareError.message}` : 'Could not share this recipe.');
    }
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#E85D04" />
        <Text style={styles.muted}>Getting this recipe ready...</Text>
      </View>
    );
  }

  if (error || !recipe) {
    return (
      <View style={styles.center}>
        <MaterialCommunityIcons name="food-off-outline" size={56} color="#BCAAA4" />
        <Text style={styles.errorTitle}>Recipe unavailable</Text>
        <Text style={styles.muted}>{error || 'This recipe could not be found.'}</Text>
        <Button mode="contained" onPress={() => { void loadRecipe(); }}>Try again</Button>
        <Button onPress={() => router.back()}>Go back</Button>
      </View>
    );
  }

  return (
    <>
    <ScrollView style={[styles.container, { backgroundColor: colors.background }]} contentContainerStyle={styles.content}>
      <View style={styles.imageWrap}>
        <Image source={{ uri: recipe.image }} style={styles.image} resizeMode="cover" />
        <IconButton
          icon="arrow-left"
          iconColor="#3E2723"
          containerColor="#FFFFFF"
          style={styles.backButton}
          onPress={() => router.back()}
          accessibilityLabel="Go back"
        />
        <IconButton
          icon={isFavorite ? 'heart' : 'heart-outline'}
          iconColor={isFavorite ? '#C62828' : '#3E2723'}
          containerColor="#FFFFFF"
          style={styles.favoriteButton}
          onPress={() => { void handleFavorite(); }}
          disabled={favoritesLoading}
          accessibilityLabel={isFavorite ? 'Remove from favorites' : 'Add to favorites'}
        />
      </View>

      <View style={styles.body}>
        <Text style={styles.kicker}>{recipe.cuisine} · {recipe.difficulty}</Text>
        {recipe.isCached && <Text style={[styles.muted, { color: colors.onSurfaceVariant }]}>Offline copy</Text>}
        <Text style={[styles.title, { color: colors.onBackground }]}>{recipe.name}</Text>
        <View style={styles.ratingRow}>
          <Text style={[styles.rating, { color: colors.primary }]}>★ {recipe.rating.toFixed(1)}</Text>
          <Text style={[styles.muted, { color: colors.onSurfaceVariant }]}>{recipe.reviewCount} reviews</Text>
        </View>

        <View style={[styles.stats, { backgroundColor: colors.surfaceVariant }]}>
          <Stat icon="clock-outline" value={`${recipe.prepTimeMinutes + recipe.cookTimeMinutes} min`} label="Total time" />
          <Stat icon="account-group-outline" value={`${recipe.servings}`} label="Servings" />
          <Stat icon="fire" value={`${recipe.caloriesPerServing}`} label="Cal / serving" />
        </View>

        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.onBackground }]}>Nutrition per serving</Text>
          <Text style={[styles.muted, { color: colors.onSurfaceVariant }]}>
            {recipe.caloriesPerServing} calories
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.onBackground }]}>Ingredients</Text>
          <Text style={[styles.muted, { color: colors.onSurfaceVariant }]}>Makes {recipe.servings} servings</Text>
          {recipe.ingredients.map((ingredient, index) => (
            <View style={styles.ingredientRow} key={`${index}-${ingredient}`}>
              <MaterialCommunityIcons name="checkbox-blank-circle-outline" size={19} color="#E85D04" />
              <Text style={[styles.ingredient, { color: colors.onSurface }]}>{ingredient}</Text>
            </View>
          ))}
        </View>

        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.onBackground }]}>Method</Text>
          {recipe.instructions.map((instruction, index) => (
            <View style={styles.stepRow} key={`${index}-${instruction}`}>
              <View style={styles.stepNumber}><Text style={styles.stepNumberText}>{index + 1}</Text></View>
              <Text style={[styles.stepText, { color: colors.onSurface }]}>{instruction}</Text>
            </View>
          ))}
        </View>

        {recipe.tags.length > 0 && (
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: colors.onBackground }]}>Good to know</Text>
            <View style={styles.tags}>
              {recipe.tags.map((tag) => <Text style={[styles.tag, { color: colors.onSurfaceVariant, backgroundColor: colors.surfaceVariant }]} key={tag}>#{tag}</Text>)}
            </View>
          </View>
        )}

        <TouchableOpacity
          style={styles.shareButton}
          onPress={() => { void handleShare(); }}
        >
          <MaterialCommunityIcons name="share-variant-outline" size={20} color="#E85D04" />
          <Text style={[styles.shareText, { color: colors.primary }]}>Share recipe</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
    <Snackbar visible={feedback !== null} onDismiss={() => setFeedback(null)} duration={3500}>
      {feedback}
    </Snackbar>
    </>
  );
}

function Stat({ icon, value, label }: { icon: 'clock-outline' | 'account-group-outline' | 'fire'; value: string; label: string }) {
  return (
    <View style={styles.stat}>
      <MaterialCommunityIcons name={icon} size={22} color="#E85D04" />
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

const styles = {
  container: { flex: 1, backgroundColor: '#FFFDF8' },
  content: { paddingTop: 0, paddingBottom: 48 },
  center: { flex: 1, justifyContent: 'center' as const, alignItems: 'center' as const, padding: 28, gap: 12 },
  imageWrap: { height: 300, position: 'relative' as const },
  image: { width: '100%' as const, height: '100%' as const },
  backButton: { position: 'absolute' as const, top: 16, left: 12 },
  favoriteButton: { position: 'absolute' as const, top: 16, right: 12 },
  body: { padding: 20 },
  kicker: { color: '#E85D04', fontSize: 13, fontWeight: '700' as const, textTransform: 'uppercase' as const, letterSpacing: 0.6 },
  title: { color: '#3E2723', fontSize: 30, lineHeight: 36, fontWeight: '700' as const, marginTop: 8 },
  ratingRow: { flexDirection: 'row' as const, alignItems: 'center' as const, gap: 10, marginTop: 8 },
  rating: { color: '#B76E00', fontSize: 15, fontWeight: '700' as const },
  muted: { color: '#8D6E63', fontSize: 14, marginTop: 4, textAlign: 'center' as const },
  errorTitle: { color: '#3E2723', fontSize: 22, fontWeight: '700' as const },
  stats: { flexDirection: 'row' as const, justifyContent: 'space-around' as const, backgroundColor: '#FFF3E0', borderRadius: 16, paddingVertical: 18, marginTop: 22 },
  stat: { alignItems: 'center' as const, gap: 4 },
  statValue: { color: '#3E2723', fontSize: 15, fontWeight: '700' as const },
  statLabel: { color: '#8D6E63', fontSize: 11 },
  section: { marginTop: 28 },
  sectionTitle: { color: '#3E2723', fontSize: 21, fontWeight: '700' as const, marginBottom: 10 },
  ingredientRow: { flexDirection: 'row' as const, alignItems: 'flex-start' as const, gap: 12, paddingVertical: 9, borderBottomWidth: 1, borderBottomColor: '#F1E8E2' },
  ingredient: { flex: 1, color: '#5D4037', fontSize: 15, lineHeight: 21 },
  stepRow: { flexDirection: 'row' as const, alignItems: 'flex-start' as const, gap: 12, marginTop: 12 },
  stepNumber: { width: 28, height: 28, borderRadius: 14, backgroundColor: '#E85D04', alignItems: 'center' as const, justifyContent: 'center' as const },
  stepNumberText: { color: '#FFFFFF', fontWeight: '700' as const },
  stepText: { flex: 1, color: '#5D4037', fontSize: 15, lineHeight: 23 },
  tags: { flexDirection: 'row' as const, flexWrap: 'wrap' as const, gap: 8 },
  tag: { color: '#8D6E63', backgroundColor: '#FFF3E0', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 14, overflow: 'hidden' as const },
  shareButton: { flexDirection: 'row' as const, justifyContent: 'center' as const, alignItems: 'center' as const, gap: 8, borderWidth: 1, borderColor: '#E85D04', padding: 14, borderRadius: 12, marginTop: 28 },
  shareText: { color: '#E85D04', fontWeight: '700' as const, fontSize: 15 },
};
