
/**
 * Home Screen - Cookbook Discover Tab
 * API: https://dummyjson.com/docs/recipes
 * Favorites: AsyncStorage
 * Unique Feature: Smart Pantry Match
 * Supports Global Light/Dark Mode
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  RefreshControl,
  StyleSheet,
  FlatList,
  useWindowDimensions,
} from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import { useAuth } from '@/context/AuthContext';
import { useThemeMode } from '@/context/ThemeContext';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  Avatar,
  Button,
  Card,
  Chip,
  Searchbar,
} from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';

interface Recipe {
  id: number;
  name: string;
  ingredients: string[];
  instructions: string[];
  prepTimeMinutes: number;
  cookTimeMinutes: number;
  servings: number;
  difficulty: 'Easy' | 'Medium' | 'Hard';
  cuisine: string;
  caloriesPerServing: number;
  tags: string[];
  userId: number;
  image: string;
  rating: number;
  reviewCount: number;
  mealType: string[];
}

interface RecipesResponse {
  recipes: Recipe[];
  total: number;
  skip: number;
  limit: number;
}

const STORAGE_KEY = 'favoriteRecipeIds';
const LIMIT = 20;

const CATEGORIES = [
  { name: 'Breakfast', icon: '🍳' },
  { name: 'Lunch', icon: '🥗' },
  { name: 'Dinner', icon: '🍽️' },
  { name: 'Dessert', icon: '🍰' },
  { name: 'Chicken', icon: '🍗' },
  { name: 'Seafood', icon: '🐟' },
  { name: 'Vegetarian', icon: '🥦' },
  { name: 'Pasta', icon: '🍝' },
];

export default function HomeScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const { isDark } = useThemeMode();
  const { width: screenWidth } = useWindowDimensions();

  // GLOBAL THEME COLORS
  const themeColors = {
    background: isDark ? '#101C18' : '#FFFDF7',
    surface: isDark ? '#1B2B24' : '#FFFFFF',
    primary: isDark ? '#78C6A3' : '#24543D',
    banner: isDark ? '#203C30' : '#24543D',
    secondary: '#E4C68E',
    text: isDark ? '#F3F7F2' : '#26372C',
    muted: isDark ? '#A8B5AA' : '#858B80',
    border: isDark ? '#35483D' : '#EEECE4',
    lightGreen: isDark ? '#293B32' : '#EAF2E9',
    pantryIcon: isDark ? '#35483D' : '#FFFFFF',
    white: '#FFFFFF',
    red: '#D84343',
    searchPlaceholder: isDark ? '#A8B5AA' : '#858B80',
  };

  const isMobile = screenWidth < 600;

  const recipeCardWidth = isMobile
    ? Math.min(220, screenWidth * 0.68)
    : 280;

  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [total, setTotal] = useState(0);
  const [skip, setSkip] = useState(0);
  const [favoriteIds, setFavoriteIds] = useState<number[]>([]);

  // LOAD FAVORITE IDS WHEN HOME SCREEN IS OPENED
  const loadFavoriteIds = useCallback(async () => {
    try {
      const saved = await AsyncStorage.getItem(STORAGE_KEY);
      const ids: number[] = saved ? JSON.parse(saved) : [];

      setFavoriteIds(ids);
    } catch (error) {
      console.error('Failed to load favorite IDs:', error);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadFavoriteIds();
    }, [loadFavoriteIds])
  );

  // ADD OR REMOVE FAVORITE
  const toggleFavorite = async (recipeId: number) => {
    try {
      const saved = await AsyncStorage.getItem(STORAGE_KEY);
      const currentIds: number[] = saved ? JSON.parse(saved) : [];

      const isFavorite = currentIds.includes(recipeId);

      const updatedIds = isFavorite
        ? currentIds.filter((id) => id !== recipeId)
        : [...currentIds, recipeId];

      await AsyncStorage.setItem(
        STORAGE_KEY,
        JSON.stringify(updatedIds)
      );

      setFavoriteIds(updatedIds);
    } catch (error) {
      console.error('Failed to update favorites:', error);
    }
  };

  // FETCH RECIPES
  const fetchRecipes = useCallback(async (refresh = false) => {
    try {
      if (refresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      setError(null);

      const response = await fetch(
        `https://dummyjson.com/recipes?limit=${LIMIT}&skip=0`
      );

      if (!response.ok) {
        throw new Error('Unable to load recipes. Please try again.');
      }

      const data: RecipesResponse = await response.json();

      setRecipes(data.recipes);
      setTotal(data.total);
      setSkip(data.skip + data.recipes.length);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Something went wrong.'
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  // LOAD MORE RECIPES
  const loadMore = async () => {
    if (loadingMore || recipes.length >= total) return;

    try {
      setLoadingMore(true);

      const response = await fetch(
        `https://dummyjson.com/recipes?limit=${LIMIT}&skip=${skip}`
      );

      if (!response.ok) {
        throw new Error('Failed to load more recipes.');
      }

      const data: RecipesResponse = await response.json();

      setRecipes((previous) => [...previous, ...data.recipes]);
      setSkip(data.skip + data.recipes.length);
    } catch {
      setError('Could not load more recipes.');
    } finally {
      setLoadingMore(false);
    }
  };

  useEffect(() => {
    fetchRecipes();
  }, [fetchRecipes]);

  const openRecipe = (id: number) => {
    router.push(`/(app)/recipe/${id}` as any);
  };

  const searchRecipes = () => {
    router.push({
      pathname: '/(app)/(tabs)/search',
      params: { q: searchQuery },
    });
  };

  // RECIPE CARD
  const renderRecipe = ({ item }: { item: Recipe }) => {
    const isFavorite = favoriteIds.includes(item.id);

    return (
      <TouchableOpacity
        activeOpacity={0.85}
        onPress={() => openRecipe(item.id)}
        style={[
          styles.recipeWrapper,
          { width: recipeCardWidth },
        ]}
      >
        <Card
          style={[
            styles.recipeCard,
            { backgroundColor: themeColors.surface },
          ]}
          mode="elevated"
        >
          <View>
            <Image
              source={{ uri: item.image }}
              style={[
                styles.recipeImage,
                isMobile && styles.mobileRecipeImage,
                { backgroundColor: themeColors.border },
              ]}
              resizeMode="cover"
            />

            {/* DIFFICULTY */}
            <View style={styles.difficultyPosition}>
              <Chip
                compact
                style={[
                  styles.difficultyChip,
                  {
                    backgroundColor:
                      item.difficulty === 'Easy'
                        ? isDark ? '#294B38' : '#E3F2E5'
                        : item.difficulty === 'Medium'
                        ? isDark ? '#55452C' : '#FFF0D8'
                        : isDark ? '#542F32' : '#FCE4E4',
                  },
                ]}
                textStyle={[
                  styles.difficultyText,
                  { color: themeColors.text },
                ]}
              >
                {item.difficulty}
              </Chip>
            </View>

            {/* FAVORITE HEART BUTTON */}
            <TouchableOpacity
              activeOpacity={0.75}
              style={[
                styles.favoriteButton,
                { backgroundColor: themeColors.surface },
              ]}
              onPress={(event) => {
                event.stopPropagation();
                toggleFavorite(item.id);
              }}
              accessibilityRole="button"
              accessibilityLabel={
                isFavorite
                  ? 'Remove from favorites'
                  : 'Add to favorites'
              }
            >
              <MaterialCommunityIcons
                name={isFavorite ? 'heart' : 'heart-outline'}
                size={23}
                color={isFavorite ? themeColors.red : themeColors.primary}
              />
            </TouchableOpacity>
          </View>

          <Card.Content
            style={[
              styles.recipeContent,
              isMobile && styles.mobileRecipeContent,
            ]}
          >
            <Text
              numberOfLines={1}
              style={[
                styles.recipeName,
                { color: themeColors.text },
              ]}
            >
              {item.name}
            </Text>

            <Text
              style={[
                styles.cuisine,
                { color: themeColors.muted },
              ]}
            >
              {item.cuisine}
            </Text>

            <View style={styles.recipeMeta}>
              <Text
                style={[
                  styles.metaText,
                  { color: themeColors.text },
                ]}
              >
                ⭐ {item.rating.toFixed(1)}
              </Text>

              <Text
                style={[
                  styles.metaText,
                  { color: themeColors.text },
                ]}
              >
                ⏱ {item.prepTimeMinutes + item.cookTimeMinutes} min
              </Text>
            </View>
          </Card.Content>
        </Card>
      </TouchableOpacity>
    );
  };

  // LOADING SCREEN
  if (loading) {
    return (
      <View
        style={[
          styles.center,
          { backgroundColor: themeColors.background },
        ]}
      >
        <ActivityIndicator
          size="large"
          color={themeColors.primary}
        />

        <Text
          style={[
            styles.loadingText,
            { color: themeColors.muted },
          ]}
        >
          Preparing your recipes...
        </Text>
      </View>
    );
  }

  // ERROR SCREEN
  if (error && recipes.length === 0) {
    return (
      <View
        style={[
          styles.center,
          { backgroundColor: themeColors.background },
        ]}
      >
        <Text style={styles.errorIcon}>🍽️</Text>

        <Text
          style={[
            styles.errorTitle,
            { color: themeColors.text },
          ]}
        >
          Oops! Something went wrong.
        </Text>

        <Text
          style={[
            styles.loadingText,
            { color: themeColors.muted },
          ]}
        >
          {error}
        </Text>

        <Button
          mode="contained"
          buttonColor={themeColors.primary}
          textColor={isDark ? '#101C18' : '#FFFFFF'}
          onPress={() => fetchRecipes()}
          style={styles.retryButton}
        >
          Try Again
        </Button>
      </View>
    );
  }

  return (
    <ScrollView
      style={[
        styles.container,
        { backgroundColor: themeColors.background },
      ]}
      contentContainerStyle={styles.scrollContent}
      showsVerticalScrollIndicator={false}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={() => fetchRecipes(true)}
          tintColor={themeColors.primary}
          colors={[themeColors.primary]}
        />
      }
    >
      {/* HEADER */}
      <View
        style={[
          styles.header,
          isMobile && styles.mobileHeader,
        ]}
      >
        <View style={styles.headerTextContainer}>
          <Text
            style={[
              styles.hello,
              { color: themeColors.primary },
            ]}
          >
            HELLO, CHEF 👋
          </Text>

          <Text
            style={[
              styles.welcome,
              { color: themeColors.text },
            ]}
          >
            {user?.firstName
              ? `Hi, ${user.firstName}!`
              : 'Welcome to Cookbook!'}
          </Text>

          <Text
            style={[
              styles.subtitle,
              { color: themeColors.muted },
            ]}
          >
            What would you like to cook today?
          </Text>
        </View>

        <Avatar.Icon
          size={isMobile ? 46 : 54}
          icon="chef-hat"
          color={themeColors.white}
          style={{ backgroundColor: themeColors.primary }}
        />
      </View>

      {/* SEARCH */}
      <View style={styles.searchContainer}>
        <Searchbar
          placeholder="Search delicious recipes..."
          placeholderTextColor={themeColors.searchPlaceholder}
          value={searchQuery}
          onChangeText={setSearchQuery}
          onSubmitEditing={searchRecipes}
          style={[
            styles.searchbar,
            {
              backgroundColor: themeColors.surface,
              borderColor: themeColors.border,
            },
          ]}
          inputStyle={[
            styles.searchInput,
            { color: themeColors.text },
          ]}
          iconColor={themeColors.primary}
          elevation={0}
        />
      </View>

      {/* BANNER */}
      <View
        style={[
          styles.banner,
          isMobile && styles.mobileBanner,
          { backgroundColor: themeColors.banner },
        ]}
      >
        <View style={styles.bannerText}>
          <Text style={styles.bannerLabel}>
            COOK SOMETHING AMAZING
          </Text>

          <Text style={styles.bannerTitle}>
            Delicious meals,{'\n'}made with love.
          </Text>

          <TouchableOpacity
            style={styles.bannerButton}
            onPress={() =>
              router.push('/(app)/(tabs)/search')
            }
          >
            <Text
              style={[
                styles.bannerButtonText,
                { color: isDark ? '#203C30' : '#24543D' },
              ]}
            >
              Explore Recipes →
            </Text>
          </TouchableOpacity>
        </View>

        <Text style={styles.bannerEmoji}>
          🥘
        </Text>
      </View>

      {/* SMART PANTRY MATCH */}
      <TouchableOpacity
        activeOpacity={0.88}
        style={[
          styles.pantryBanner,
          isMobile && styles.mobilePantryBanner,
          {
            backgroundColor: themeColors.lightGreen,
            borderColor: themeColors.border,
          },
        ]}
        onPress={() => router.push('/(app)/pantry' as any)}
      >
        <View
          style={[
            styles.pantryIcon,
            { backgroundColor: themeColors.pantryIcon },
          ]}
        >
          <MaterialCommunityIcons
            name="fridge-outline"
            size={28}
            color={themeColors.primary}
          />
        </View>

        <View style={styles.pantryText}>
          <Text
            style={[
              styles.pantryLabel,
              { color: themeColors.muted },
            ]}
          >
            YOUR KITCHEN, YOUR RECIPES
          </Text>

          <Text
            style={[
              styles.pantryTitle,
              { color: themeColors.text },
            ]}
          >
            What's in your pantry?
          </Text>

          <Text
            style={[
              styles.pantrySubtitle,
              { color: themeColors.muted },
            ]}
          >
            Find meals using ingredients you already have.
          </Text>

          <Text
            style={[
              styles.pantryLink,
              { color: themeColors.primary },
            ]}
          >
            Find Recipes →
          </Text>
        </View>

        <MaterialCommunityIcons
          name="chevron-right"
          size={25}
          color={themeColors.primary}
        />
      </TouchableOpacity>

      {/* CATEGORIES */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <View>
            <Text
              style={[
                styles.sectionTitle,
                { color: themeColors.text },
              ]}
            >
              Categories
            </Text>

            <Text
              style={[
                styles.sectionSubtitle,
                { color: themeColors.muted },
              ]}
            >
              Find your favorite
            </Text>
          </View>
        </View>

        <View style={styles.categoryGrid}>
          {CATEGORIES.map((category) => (
            <TouchableOpacity
              key={category.name}
              style={styles.categoryItem}
              onPress={() =>
                router.push({
                  pathname: '/(app)/(tabs)/search',
                  params: { category: category.name },
                })
              }
            >
              <View
                style={[
                  styles.categoryIcon,
                  { backgroundColor: themeColors.lightGreen },
                ]}
              >
                <Text style={styles.categoryEmoji}>
                  {category.icon}
                </Text>
              </View>

              <Text
                style={[
                  styles.categoryName,
                  { color: themeColors.text },
                ]}
              >
                {category.name}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* FEATURED RECIPES */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <View style={styles.featuredHeading}>
            <Text
              style={[
                styles.sectionTitle,
                { color: themeColors.text },
              ]}
            >
              Featured Recipes
            </Text>

            <Text
              style={[
                styles.sectionSubtitle,
                { color: themeColors.muted },
              ]}
            >
              Delicious ideas for your next meal
            </Text>
          </View>

          <TouchableOpacity
            onPress={() =>
              router.push('/(app)/(tabs)/search')
            }
          >
            <Text
              style={[
                styles.seeAll,
                { color: themeColors.primary },
              ]}
            >
              See All →
            </Text>
          </TouchableOpacity>
        </View>

        <FlatList
          data={recipes}
          renderItem={renderRecipe}
          keyExtractor={(item) => item.id.toString()}
          horizontal
          nestedScrollEnabled
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.recipeList}
        />

        <Button
          mode="outlined"
          onPress={loadMore}
          loading={loadingMore}
          disabled={loadingMore || recipes.length >= total}
          textColor={themeColors.primary}
          style={[
            styles.loadMoreButton,
            { borderColor: themeColors.primary },
          ]}
          contentStyle={styles.loadMoreContent}
        >
          {recipes.length >= total
            ? 'All Recipes Loaded'
            : 'Load More Recipes'}
        </Button>

        {error && (
          <Text style={styles.errorMessage}>
            {error}
          </Text>
        )}
      </View>

      {/* FOOTER */}
      <View style={styles.footer}>
        <Text style={styles.footerEmoji}>❤️</Text>

        <Text
          style={[
            styles.footerText,
            { color: themeColors.text },
          ]}
        >
          Good food brings people together.
        </Text>

        <Text
          style={[
            styles.footerSmall,
            { color: themeColors.muted },
          ]}
        >
          Made with love in Cookbook
        </Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 24,
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  header: {
    paddingHorizontal: 28,
    paddingTop: 55,
    paddingBottom: 22,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  mobileHeader: {
    paddingHorizontal: 18,
    paddingTop: 35,
    paddingBottom: 18,
  },
  headerTextContainer: {
    flex: 1,
    paddingRight: 10,
  },
  hello: {
    fontSize: 11,
    letterSpacing: 2,
    fontWeight: '700',
  },
  welcome: {
    fontSize: 25,
    fontWeight: '800',
    marginTop: 5,
  },
  subtitle: {
    fontSize: 13,
    marginTop: 5,
  },
  searchContainer: {
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  searchbar: {
    borderRadius: 14,
    borderWidth: 1,
  },
  searchInput: {
    fontSize: 13,
  },
  banner: {
    marginHorizontal: 20,
    padding: 22,
    borderRadius: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    overflow: 'hidden',
  },
  mobileBanner: {
    marginHorizontal: 16,
    padding: 16,
    borderRadius: 17,
  },
  bannerText: {
    flex: 1,
  },
  bannerLabel: {
    fontSize: 9,
    color: '#E4C68E',
    fontWeight: '800',
    letterSpacing: 1.2,
  },
  bannerTitle: {
    color: '#FFFFFF',
    fontSize: 22,
    fontWeight: '800',
    lineHeight: 29,
    marginTop: 10,
  },
  bannerButton: {
    backgroundColor: '#E4C68E',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 9,
    alignSelf: 'flex-start',
    marginTop: 15,
  },
  bannerButtonText: {
    fontWeight: '800',
    fontSize: 11,
  },
  bannerEmoji: {
    fontSize: 55,
    marginLeft: 5,
  },

  // SMART PANTRY MATCH
  pantryBanner: {
    marginHorizontal: 20,
    marginTop: 22,
    padding: 16,
    borderRadius: 17,
    borderWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  mobilePantryBanner: {
    marginHorizontal: 16,
    padding: 13,
  },
  pantryIcon: {
    width: 52,
    height: 52,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 13,
  },
  pantryText: {
    flex: 1,
  },
  pantryLabel: {
    fontSize: 9,
    letterSpacing: 1,
    fontWeight: '800',
  },
  pantryTitle: {
    fontSize: 17,
    fontWeight: '800',
    marginTop: 4,
  },
  pantrySubtitle: {
    fontSize: 11,
    marginTop: 4,
    lineHeight: 16,
  },
  pantryLink: {
    fontSize: 12,
    fontWeight: '800',
    marginTop: 9,
  },

  section: {
    marginTop: 28,
  },
  sectionHeader: {
    paddingHorizontal: 20,
    marginBottom: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  featuredHeading: {
    flex: 1,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '800',
  },
  sectionSubtitle: {
    fontSize: 12,
    marginTop: 4,
  },
  categoryGrid: {
    paddingHorizontal: 16,
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  categoryItem: {
    width: '23%',
    alignItems: 'center',
    marginBottom: 17,
  },
  categoryIcon: {
    width: 55,
    height: 55,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  categoryEmoji: {
    fontSize: 25,
  },
  categoryName: {
    fontSize: 10,
    fontWeight: '600',
    marginTop: 8,
    textAlign: 'center',
  },
  seeAll: {
    fontSize: 12,
    fontWeight: '700',
    marginLeft: 8,
  },
  recipeList: {
    paddingHorizontal: 16,
    paddingBottom: 8,
  },
  recipeWrapper: {
    marginRight: 12,
  },
  recipeCard: {
    borderRadius: 14,
    overflow: 'hidden',
  },
  recipeImage: {
    width: '100%',
    height: 165,
  },
  mobileRecipeImage: {
    height: 120,
  },
  difficultyPosition: {
    position: 'absolute',
    top: 10,
    left: 10,
  },
  difficultyChip: {
    height: 26,
  },
  difficultyText: {
    fontSize: 10,
    fontWeight: '600',
  },
  favoriteButton: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 36,
    height: 36,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.15,
    shadowRadius: 3,
  },
  recipeContent: {
    padding: 13,
  },
  mobileRecipeContent: {
    padding: 10,
  },
  recipeName: {
    fontSize: 15,
    fontWeight: '800',
  },
  cuisine: {
    fontSize: 11,
    marginTop: 5,
  },
  recipeMeta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 13,
  },
  metaText: {
    fontSize: 11,
    fontWeight: '600',
  },
  loadMoreButton: {
    marginHorizontal: 20,
    marginTop: 12,
    borderRadius: 12,
  },
  loadMoreContent: {
    minHeight: 44,
  },
  loadingText: {
    marginTop: 12,
    textAlign: 'center',
  },
  errorIcon: {
    fontSize: 50,
  },
  errorTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginTop: 15,
    textAlign: 'center',
  },
  retryButton: {
    marginTop: 20,
  },
  errorMessage: {
    color: '#C0392B',
    textAlign: 'center',
    margin: 12,
  },
  footer: {
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 30,
  },
  footerEmoji: {
    fontSize: 24,
  },
  footerText: {
    fontWeight: '700',
    marginTop: 8,
    textAlign: 'center',
  },
  footerSmall: {
    fontSize: 11,
    marginTop: 5,
  },
});
