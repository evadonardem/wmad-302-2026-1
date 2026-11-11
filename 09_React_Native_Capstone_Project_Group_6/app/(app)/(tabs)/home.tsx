/**
 * Home Screen - Cookbook Discover Tab
 * API: https://dummyjson.com/docs/recipes
 */
import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '@/context/AuthContext';
import { Card, Title, Chip, Avatar, Button, IconButton, Snackbar, useTheme } from 'react-native-paper';
import { Recipe } from '@/types/recipe';
import { recipeApi } from '@/services/recipeApi';
import { useFavorites } from '@/context/FavoritesContext';
import { styles } from './homeStyles';

export default function HomeScreen() {
  const router = useRouter();
  const { colors } = useTheme();
  const { user } = useAuth();
  const { favoriteIds, isLoading: favoritesLoading, toggleFavorite } = useFavorites();
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [moreError, setMoreError] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [isOffline, setIsOffline] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const nextSkipRef = useRef(0);
  const totalRef = useRef(0);
  const loadingMoreRef = useRef(false);

  const fetchRecipes = useCallback(async (mode: 'initial' | 'refresh' | 'more' = 'initial') => {
    if (mode === 'more' && (loadingMoreRef.current || nextSkipRef.current >= totalRef.current)) return;
    if (mode === 'more') {
      loadingMoreRef.current = true;
      setLoadingMore(true);
      setMoreError(null);
    }
    try {
      if (mode === 'refresh') setRefreshing(true);
      else if (mode === 'initial') setLoading(true);
      if (mode !== 'more') setError(null);

      const skip = mode === 'more' ? nextSkipRef.current : 0;
      const data = await recipeApi.getRecipes({ limit: 20, skip });
      setRecipes((current) => mode === 'more'
        ? [...current, ...data.recipes.filter((recipe) => !current.some((item) => item.id === recipe.id))]
        : data.recipes);
      nextSkipRef.current = data.skip + data.recipes.length;
      totalRef.current = data.total;
      setHasMore(nextSkipRef.current < totalRef.current);
      setIsOffline(Boolean(data.isCached));
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to load recipes';
      if (mode === 'more') setMoreError(message);
      else setError(message);
    } finally {
      if (mode === 'initial') setLoading(false);
      if (mode === 'refresh') setRefreshing(false);
      if (mode === 'more') {
        loadingMoreRef.current = false;
        setLoadingMore(false);
      }
    }
  }, []);

  useEffect(() => {
    void fetchRecipes('initial');
  }, [fetchRecipes]);

  const onRefresh = () => { void fetchRecipes('refresh'); };
  const handleToggleFavorite = async (id: number) => {
    try {
      await toggleFavorite(id);
    } catch (saveError) {
      setFeedback(saveError instanceof Error ? saveError.message : 'Could not update favorites. Please try again.');
    }
  };

  const renderRecipe = ({ item }: { item: Recipe }) => (
    <TouchableOpacity
      style={styles.recipeCard}
      onPress={() => router.push(`/(app)/recipe/${item.id}`)}
      activeOpacity={0.8}
    >
      <Card style={[styles.card, { backgroundColor: colors.surface }]} elevation={2}>
        <View style={styles.imageContainer}>
          <Image
            source={{ uri: item.image }}
            style={styles.recipeImage}
            resizeMode="cover"
          />
          <View style={[styles.difficultyBadge, { left: 12, right: undefined }]}>
            <Chip
              style={[
                styles.difficultyChip,
                item.difficulty === 'Easy' && styles.easy,
                item.difficulty === 'Medium' && styles.medium,
                item.difficulty === 'Hard' && styles.hard,
              ]}
            >
              {item.difficulty}
            </Chip>
          </View>
          <IconButton
            icon={favoriteIds.includes(item.id) ? 'heart' : 'heart-outline'}
            iconColor={favoriteIds.includes(item.id) ? '#C62828' : '#3E2723'}
            containerColor="#FFFFFF"
            style={styles.favoriteButton}
            onPress={(event) => {
              event.stopPropagation();
              void handleToggleFavorite(item.id);
            }}
            disabled={favoritesLoading}
            accessibilityLabel={favoriteIds.includes(item.id) ? 'Remove from favorites' : 'Add to favorites'}
          />
        </View>
        <Card.Content style={styles.cardContent}>
          <Title style={[styles.recipeTitle, { color: colors.onSurface }]} numberOfLines={1}>
            {item.name}
          </Title>
          <View style={styles.metaRow}>
            <Text style={[styles.metaText, { color: colors.onSurfaceVariant }]}>
              ⏱️ {item.prepTimeMinutes + item.cookTimeMinutes} min
            </Text>
            <Text style={[styles.metaText, { color: colors.onSurfaceVariant }]}>👥 {item.servings}</Text>
            <Text style={[styles.metaText, { color: colors.onSurfaceVariant }]}>🔥 {item.caloriesPerServing} cal</Text>
          </View>
          <View style={styles.cuisineRow}>
            <Chip style={styles.cuisineChip}>{item.cuisine}</Chip>
            {item.mealType.slice(0, 2).map((meal) => (
              <Chip key={meal} style={styles.mealChip}>{meal}</Chip>
            ))}
          </View>
          <View style={styles.ratingRow}>
            <Text style={[styles.ratingText, { color: colors.primary }]}>
              ⭐ {item.rating.toFixed(1)} ({item.reviewCount} reviews)
            </Text>
          </View>
        </Card.Content>
      </Card>
    </TouchableOpacity>
  );

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#E85D04" />
        <Text style={styles.loadingText}>Loading recipes...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.errorContainer}>
        <Text style={[styles.errorText, { color: colors.error }]}>{error}</Text>
        <Button mode="contained" onPress={() => { void fetchRecipes('initial'); }} style={styles.retryButton}>
          Retry
        </Button>
      </View>
    );
  }

  const header = (
    <View>
      <View style={styles.welcomeContainer}>
        <View style={styles.welcomeTextContainer}>
          <Text style={[styles.welcomeGreeting, { color: colors.onBackground }]}>
            {user ? `Welcome back, ${user.firstName}!` : 'Welcome to Cookbook!'}
          </Text>
          <Text style={[styles.welcomeSubtitle, { color: colors.onSurfaceVariant }]}>Discover delicious recipes</Text>
        </View>
        <Avatar.Icon size={56} icon="chef-hat" style={styles.welcomeAvatar} />
      </View>

      {/* Categories */}
      <View style={styles.sectionContainer}>
        <View style={styles.categoryHeader}>
          <Title style={[styles.sectionTitle, { color: colors.onSurface }]}>Categories</Title>
        </View>
        <FlatList
          data={[...new Set(recipes.map((recipe) => recipe.cuisine))]}
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.categoryList}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={[styles.categoryChip, { backgroundColor: colors.surfaceVariant }]}
              onPress={() => router.push(`/(app)/(tabs)/search?category=${encodeURIComponent(item)}`)}
            >
              <Text style={[styles.categoryChipText, { color: colors.onSurface }]}>{item}</Text>
            </TouchableOpacity>
          )}
          keyExtractor={(item) => item}
        />
      </View>

      {/* Featured Recipes */}
      <View style={styles.sectionContainer}>
        <View style={styles.featuredHeader}>
          <Title style={[styles.sectionTitle, { color: colors.onSurface }]}>Featured Recipes</Title>
        </View>
      </View>
      {isOffline && <Text style={[styles.loadingText, { color: colors.onSurfaceVariant }]}>Offline mode · showing saved recipes</Text>}
    </View>
  );
  const footer = (
    <View style={styles.sectionContainer}>
      {moreError ? <Text style={styles.errorText}>{moreError}</Text> : null}
      {hasMore ? (
        <Button
          mode="outlined"
          loading={loadingMore}
          disabled={loadingMore}
          onPress={() => { void fetchRecipes('more'); }}
        >
          Load more recipes
        </Button>
      ) : <Text style={styles.loadingText}>You’re all caught up.</Text>}
    </View>
  );

  return (
    <>
      <FlatList
        style={[styles.scrollView, { backgroundColor: colors.background }]}
        contentContainerStyle={styles.scrollContent}
        data={recipes}
        renderItem={renderRecipe}
        keyExtractor={(item) => item.id.toString()}
        numColumns={2}
        columnWrapperStyle={{ justifyContent: 'space-between', paddingHorizontal: 8 }}
        ListHeaderComponent={header}
        ListFooterComponent={footer}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>No recipes found</Text>
          </View>
        }
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#E85D04']} />}
        onEndReached={() => { void fetchRecipes('more'); }}
        onEndReachedThreshold={0.4}
      />
      <Snackbar visible={feedback !== null} onDismiss={() => setFeedback(null)}>{feedback}</Snackbar>
    </>
  );
}