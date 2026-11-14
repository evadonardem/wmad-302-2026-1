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
  Platform,
  useWindowDimensions,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Avatar, Card, Title, Button, IconButton, Snackbar, useTheme } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Recipe } from '@/types/recipe';
import { recipeApi } from '@/services/recipeApi';
import { useAuth } from '@/context/AuthContext';
import { useFavorites } from '@/context/FavoritesContext';
import { styles } from './homeStyles';

export default function HomeScreen() {
  const router = useRouter();
  const { colors } = useTheme();
  const { width } = useWindowDimensions();
  const { user } = useAuth();
  const { favoriteIds, isLoading: favoritesLoading, toggleFavorite } = useFavorites();
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const isMobileLayout = width < 768;
  const isWebLayout = Platform.OS === 'web';
  const isFourColumnWebLayout = isWebLayout && width >= 1024;
  const isThreeColumnLayout = !isWebLayout && width >= 1024;
  const mobileImageHeight = Math.max(56, Math.round((width - 54) / 4));
  const numColumns = isMobileLayout
    ? 2
    : isFourColumnWebLayout
      ? 4
      : isThreeColumnLayout
        ? 3
        : 2;
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
      style={[
        styles.recipeCard,
        isMobileLayout && { width: '46%', aspectRatio: 1, minHeight: 0 },
        isFourColumnWebLayout && { minHeight: 300 },
        isFourColumnWebLayout && { width: '23.5%' },
        !isMobileLayout && isThreeColumnLayout && { width: '31.5%' },
        !isMobileLayout && !isFourColumnWebLayout && !isThreeColumnLayout && { width: '48%' },
      ]}
      onPress={() => router.push(`/(app)/recipe/${item.id}`)}
      activeOpacity={0.8}
    >
      <Card
        style={[
          styles.card,
          { backgroundColor: colors.surface },
          isMobileLayout && { minHeight: 0 },
          isFourColumnWebLayout && { minHeight: 300 },
        ]}
        elevation={2}
      >
        <View
          style={[
            styles.imageContainer,
            isMobileLayout && { height: mobileImageHeight },
            isFourColumnWebLayout && { height: 140 },
          ]}
        >
          <Image
            source={{ uri: item.image }}
            style={styles.recipeImage}
            resizeMode="cover"
          />
          <View style={[styles.difficultyBadge, { left: 12, right: undefined }]}>
            <View
              style={[
                styles.difficultyChip,
                item.difficulty === 'Easy' && styles.easy,
                item.difficulty === 'Medium' && styles.medium,
                item.difficulty === 'Hard' && styles.hard,
              ]}
            >
              <Text style={styles.difficultyText}>{item.difficulty}</Text>
            </View>
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
        <Card.Content
          style={[
            styles.cardContent,
            isMobileLayout && { paddingHorizontal: 7, paddingTop: 6, paddingBottom: 6 },
          ]}
        >
          <Title
            style={[
              styles.recipeTitle,
              { color: colors.onSurface },
              isMobileLayout && { fontSize: 11, lineHeight: 14, marginBottom: 2 },
            ]}
            numberOfLines={1}
          >
            {item.name}
          </Title>
          {!isMobileLayout && (
            <View style={styles.metaRow}>
              <Text style={[styles.metaText, { color: colors.onSurfaceVariant }]}>
                ⏱️ {item.prepTimeMinutes + item.cookTimeMinutes} min
              </Text>
              <Text style={[styles.metaText, { color: colors.onSurfaceVariant }]}>👥 {item.servings}</Text>
              <Text style={[styles.metaText, { color: colors.onSurfaceVariant }]}>🔥 {item.caloriesPerServing} cal</Text>
            </View>
          )}
          <View style={[styles.cuisineRow, isMobileLayout && { gap: 3, marginBottom: 2, paddingHorizontal: 0 }]}>
            <View style={[styles.cuisineChip, isMobileLayout && { paddingHorizontal: 6, paddingVertical: 2 }]}>
              <Text style={[styles.cuisineChipText, isMobileLayout && { fontSize: 9 }]}>{item.cuisine}</Text>
            </View>
            {item.mealType.slice(0, isMobileLayout ? 1 : 2).map((meal) => (
              <View key={meal} style={[styles.mealChip, isMobileLayout && { paddingHorizontal: 6, paddingVertical: 2 }]}>
                <Text style={[styles.mealChipText, isMobileLayout && { fontSize: 9 }]}>{meal}</Text>
              </View>
            ))}
          </View>
          <View style={[styles.ratingRow, isMobileLayout && { marginTop: 1, paddingTop: 4 }]}>
            <View style={[styles.ratingBadge, isMobileLayout && { gap: 3, paddingHorizontal: 6, paddingVertical: 2 }]}>
              <MaterialCommunityIcons name="star" size={isMobileLayout ? 12 : 15} color="#E9A400" />
              <Text style={[styles.ratingText, isMobileLayout && { fontSize: 10 }]}>{item.rating.toFixed(1)}</Text>
            </View>
            {!isMobileLayout && <Text style={styles.reviewCount}>{item.reviewCount} reviews</Text>}
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
      <View style={[styles.welcomeContainer, { backgroundColor: colors.primaryContainer }]}>
        <View style={styles.welcomeTextContainer}>
          <Text style={[styles.welcomeGreeting, { color: colors.onPrimaryContainer }]} numberOfLines={2}>
            {user?.firstName ? `Welcome back, ${user.firstName}!` : 'Welcome back!'}
          </Text>
          <Text style={[styles.welcomeSubtitle, { color: colors.onPrimaryContainer }]}>Discover delicious recipes</Text>
        </View>
        <View style={styles.welcomeImageContainer}>
          <Avatar.Icon size={88} icon="chef-hat" style={styles.chefHatAvatar} color="#FFFFFF" />
        </View>
      </View>

      <View style={styles.sectionContainer}>
        <View style={styles.categoryHeader}>
          <View style={styles.sectionHeadingIcon}>
            <MaterialCommunityIcons name="silverware-fork-knife" size={17} color="#E85D04" />
          </View>
          <Text style={[styles.sectionTitle, { color: colors.onSurface }]}>Categories</Text>
        </View>
        <FlatList
          data={[...new Set(recipes.map((recipe) => recipe.cuisine))]}
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.categoryList}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={styles.categoryChip}
              onPress={() => router.push(`/(app)/(tabs)/search?category=${encodeURIComponent(item)}`)}
            >
              <View style={styles.categoryMarker} />
              <Text style={styles.categoryChipText}>{item}</Text>
            </TouchableOpacity>
          )}
          keyExtractor={(item) => item}
        />
      </View>

      {/* Featured Recipes */}
      <View style={styles.sectionContainer}>
        <View style={styles.featuredHeader}>
          <View style={styles.featuredHeadingGroup}>
            <View style={styles.sectionHeadingIcon}>
              <MaterialCommunityIcons name="star-four-points" size={18} color="#E85D04" />
            </View>
            <View>
              <Text style={styles.featuredEyebrow}>TODAY&apos;S PICKS</Text>
              <Title style={[styles.sectionTitle, { color: colors.onSurface }]}>Featured Recipes</Title>
            </View>
          </View>
          <TouchableOpacity style={styles.seeAll} onPress={() => router.push('/(app)/(tabs)/search')}>
            <Text style={styles.seeAllText}>See all</Text>
            <MaterialCommunityIcons name="arrow-right" size={16} color="#E85D04" />
          </TouchableOpacity>
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
        key={`recipes-${numColumns}`}
        style={[styles.scrollView, { backgroundColor: colors.background }]}
        contentContainerStyle={[styles.scrollContent, { paddingHorizontal: 16 }]}
        data={recipes}
        renderItem={renderRecipe}
        keyExtractor={(item) => item.id.toString()}
        numColumns={numColumns}
        columnWrapperStyle={{ justifyContent: 'space-between', paddingHorizontal: 6, gap: 10 }}
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