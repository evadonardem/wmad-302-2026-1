
/**
 * Search Screen - Cookbook
 * Global Light/Dark Mode Support
 */

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  TextInput,
  FlatList,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  StyleSheet,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Chip, Button } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useThemeMode } from '@/context/ThemeContext';

import type { Recipe, RecipesResponse } from '@/types/recipe';

const API_URL = 'https://dummyjson.com/recipes';
const LIMIT = 20;

const categories = [
  'Beef',
  'Chicken',
  'Dessert',
  'Lamb',
  'Pasta',
  'Pork',
  'Seafood',
  'Vegetarian',
];

const difficulties = ['Easy', 'Medium', 'Hard'];
const mealTypes = ['Breakfast', 'Lunch', 'Dinner', 'Snack'];

const prepTimes = [
  { label: 'Any time', value: 0 },
  { label: '15 min or less', value: 15 },
  { label: '30 min or less', value: 30 },
  { label: '60 min or less', value: 60 },
];

const sortOptions = [
  { label: 'Rating', value: 'rating' },
  { label: 'Cooking time', value: 'time' },
  { label: 'Calories', value: 'calories' },
];

export default function SearchScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ q?: string; category?: string }>();
  const { isDark } = useThemeMode();

  const colors = {
    background: isDark ? '#101C18' : '#F8F6EF',
    surface: isDark ? '#1B2B24' : '#FFFFFF',
    primary: isDark ? '#78C6A3' : '#315C43',
    heading: isDark ? '#F3F7F2' : '#294B36',
    text: isDark ? '#E5EDE6' : '#52634F',
    muted: isDark ? '#A8B5AA' : '#858B7F',
    border: isDark ? '#35483D' : '#E3E5D9',
    searchBorder: isDark ? '#35483D' : '#E8E7DC',
    selectedText: '#FFFFFF',
    accent: isDark ? '#E4B77D' : '#D97736',
    imageBackground: isDark ? '#293B32' : '#E9E8DE',
  };

  const [query, setQuery] = useState(params.q ?? '');
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState('');

  const [skip, setSkip] = useState(0);
  const [hasMore, setHasMore] = useState(true);

  const [selectedCategory, setSelectedCategory] = useState<string | null>(
    params.category ?? null
  );
  const [selectedCuisine, setSelectedCuisine] = useState<string | null>(null);
  const [selectedDifficulty, setSelectedDifficulty] = useState<string | null>(null);
  const [selectedMeal, setSelectedMeal] = useState<string | null>(null);
  const [selectedPrepTime, setSelectedPrepTime] = useState(0);
  const [sortBy, setSortBy] = useState('rating');

  const fetchRecipes = useCallback(
    async (searchTerm: string, offset: number, append: boolean) => {
      if (append) {
        setLoadingMore(true);
      } else {
        setLoading(true);
        setError('');
      }

      try {
        const endpoint = searchTerm.trim()
          ? `${API_URL}/search?q=${encodeURIComponent(searchTerm.trim())}&limit=${LIMIT}&skip=${offset}`
          : `${API_URL}?limit=${LIMIT}&skip=${offset}`;

        const response = await fetch(endpoint);

        if (!response.ok) {
          throw new Error('Unable to load recipes.');
        }

        const data: RecipesResponse = await response.json();

        setRecipes((previous) =>
          append ? [...previous, ...data.recipes] : data.recipes
        );

        const nextSkip = data.skip + data.recipes.length;
        setSkip(nextSkip);
        setHasMore(nextSkip < data.total);
      } catch (err) {
        setError(
          err instanceof Error ? err.message : 'Something went wrong.'
        );
      } finally {
        setLoading(false);
        setLoadingMore(false);
      }
    },
    []
  );

  // Read search keyword and category passed through the URL.
  useEffect(() => {
    setQuery(params.q ?? '');
    setSelectedCategory(params.category ?? null);
  }, [params.q, params.category]);

  // Search after a short delay.
  useEffect(() => {
    const timer = setTimeout(() => {
      setSkip(0);
      setHasMore(true);
      fetchRecipes(query, 0, false);
    }, 400);

    return () => clearTimeout(timer);
  }, [query, fetchRecipes]);

  // Get available cuisines from loaded recipes.
  const cuisines = useMemo(() => {
    return Array.from(
      new Set(recipes.map((recipe) => recipe.cuisine).filter(Boolean))
    ).sort();
  }, [recipes]);

  // Apply filters and sorting.
  const filteredRecipes = useMemo(() => {
    let filtered = [...recipes];

    if (selectedCategory) {
      filtered = filtered.filter((recipe) =>
        recipe.tags?.some(
          (tag) => tag.toLowerCase() === selectedCategory.toLowerCase()
        )
      );
    }

    if (selectedCuisine) {
      filtered = filtered.filter(
        (recipe) => recipe.cuisine === selectedCuisine
      );
    }

    if (selectedDifficulty) {
      filtered = filtered.filter(
        (recipe) => recipe.difficulty === selectedDifficulty
      );
    }

    if (selectedMeal) {
      filtered = filtered.filter((recipe) =>
        recipe.mealType?.some(
          (meal) => meal.toLowerCase() === selectedMeal.toLowerCase()
        )
      );
    }

    if (selectedPrepTime > 0) {
      filtered = filtered.filter(
        (recipe) => recipe.prepTimeMinutes <= selectedPrepTime
      );
    }

    if (sortBy === 'rating') {
      filtered.sort((a, b) => b.rating - a.rating);
    } else if (sortBy === 'time') {
      filtered.sort(
        (a, b) =>
          a.prepTimeMinutes + a.cookTimeMinutes -
          (b.prepTimeMinutes + b.cookTimeMinutes)
      );
    } else if (sortBy === 'calories') {
      filtered.sort(
        (a, b) => a.caloriesPerServing - b.caloriesPerServing
      );
    }

    return filtered;
  }, [
    recipes,
    selectedCategory,
    selectedCuisine,
    selectedDifficulty,
    selectedMeal,
    selectedPrepTime,
    sortBy,
  ]);

  const loadMore = () => {
    if (!loading && !loadingMore && hasMore) {
      fetchRecipes(query, skip, true);
    }
  };

  const clearFilters = useCallback(() => {
    setSelectedCategory(null);
    setSelectedCuisine(null);
    setSelectedDifficulty(null);
    setSelectedMeal(null);
    setSelectedPrepTime(0);
    setSortBy('rating');
  }, []);

  // RECIPE CARD
  const renderRecipe = ({ item }: { item: Recipe }) => {
    const totalTime = item.prepTimeMinutes + item.cookTimeMinutes;

    return (
      <TouchableOpacity
        activeOpacity={0.85}
        style={[
          styles.recipeCard,
          {
            backgroundColor: colors.surface,
            borderColor: colors.border,
          },
        ]}
        onPress={() =>
          router.push(`/(app)/recipe/${item.id}` as any)
        }
      >
        <Image
          source={{ uri: item.image }}
          style={[
            styles.recipeImage,
            { backgroundColor: colors.imageBackground },
          ]}
        />

        <View style={styles.recipeInfo}>
          <Text
            style={[styles.recipeName, { color: colors.heading }]}
            numberOfLines={2}
          >
            {item.name}
          </Text>

          <Text style={[styles.recipeCuisine, { color: colors.muted }]}>
            {item.cuisine} · {item.difficulty}
          </Text>

          <View style={styles.recipeMeta}>
            <Text style={[styles.metaText, { color: colors.text }]}>
              <MaterialCommunityIcons
                name="clock-outline"
                size={14}
                color={colors.text}
              />
              {' '}{totalTime} min
            </Text>

            <Text style={[styles.metaText, { color: colors.text }]}>
              <MaterialCommunityIcons
                name="star"
                size={14}
                color="#E99A35"
              />
              {' '}{item.rating}
            </Text>
          </View>

          <Text style={[styles.caloriesText, { color: colors.muted }]}>
            {item.caloriesPerServing} calories per serving
          </Text>
        </View>

        <MaterialCommunityIcons
          name="chevron-right"
          size={24}
          color={colors.muted}
        />
      </TouchableOpacity>
    );
  };

  // SEARCH AND FILTER HEADER
  const renderHeader = () => (
    <View>
      <Text style={[styles.heading, { color: colors.heading }]}>
        Find a Recipe
      </Text>

      <Text style={[styles.subtitle, { color: colors.muted }]}>
        Discover something delicious to cook today.
      </Text>

      {/* SEARCH BAR */}
      <View
        style={[
          styles.searchBar,
          {
            backgroundColor: colors.surface,
            borderColor: colors.searchBorder,
          },
        ]}
      >
        <MaterialCommunityIcons
          name="magnify"
          size={23}
          color={colors.muted}
        />

        <TextInput
          style={[styles.searchInput, { color: colors.heading }]}
          placeholder="Search recipes..."
          placeholderTextColor={colors.muted}
          value={query}
          onChangeText={setQuery}
          returnKeyType="search"
        />

        {query.length > 0 && (
          <TouchableOpacity onPress={() => setQuery('')}>
            <MaterialCommunityIcons
              name="close-circle"
              size={21}
              color={colors.muted}
            />
          </TouchableOpacity>
        )}
      </View>

      {/* CATEGORIES */}
      <View style={styles.sectionHeader}>
        <Text style={[styles.sectionTitle, { color: colors.heading }]}>
          Categories
        </Text>

        {selectedCategory && (
          <TouchableOpacity onPress={() => setSelectedCategory(null)}>
            <Text style={[styles.clearText, { color: colors.accent }]}>
              Clear
            </Text>
          </TouchableOpacity>
        )}
      </View>

      <FlatList
        horizontal
        data={categories}
        keyExtractor={(item) => item}
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.horizontalList}
        renderItem={({ item }) => (
          <Chip
            selected={selectedCategory === item}
            onPress={() =>
              setSelectedCategory(selectedCategory === item ? null : item)
            }
            style={[
              styles.filterChip,
              {
                backgroundColor:
                  selectedCategory === item
                    ? colors.primary
                    : colors.surface,
                borderColor: colors.border,
              },
            ]}
            textStyle={{
              color:
                selectedCategory === item
                  ? colors.selectedText
                  : colors.text,
            }}
          >
            {item}
          </Chip>
        )}
      />

      {/* CUISINE */}
      <Text style={[styles.sectionTitle, { color: colors.heading }]}>
        Cuisine
      </Text>

      <View style={styles.wrapFilters}>
        {cuisines.map((cuisine) => (
          <Chip
            key={cuisine}
            selected={selectedCuisine === cuisine}
            onPress={() =>
              setSelectedCuisine(
                selectedCuisine === cuisine ? null : cuisine
              )
            }
            style={[
              styles.filterChip,
              {
                backgroundColor:
                  selectedCuisine === cuisine
                    ? colors.primary
                    : colors.surface,
                borderColor: colors.border,
              },
            ]}
            textStyle={{
              color:
                selectedCuisine === cuisine
                  ? colors.selectedText
                  : colors.text,
            }}
          >
            {cuisine}
          </Chip>
        ))}
      </View>

      {/* DIFFICULTY */}
      <Text style={[styles.sectionTitle, { color: colors.heading }]}>
        Difficulty
      </Text>

      <View style={styles.wrapFilters}>
        {difficulties.map((difficulty) => (
          <Chip
            key={difficulty}
            selected={selectedDifficulty === difficulty}
            onPress={() =>
              setSelectedDifficulty(
                selectedDifficulty === difficulty ? null : difficulty
              )
            }
            style={[
              styles.filterChip,
              {
                backgroundColor:
                  selectedDifficulty === difficulty
                    ? colors.primary
                    : colors.surface,
                borderColor: colors.border,
              },
            ]}
            textStyle={{
              color:
                selectedDifficulty === difficulty
                  ? colors.selectedText
                  : colors.text,
            }}
          >
            {difficulty}
          </Chip>
        ))}
      </View>

      {/* MEAL TYPE */}
      <Text style={[styles.sectionTitle, { color: colors.heading }]}>
        Meal Type
      </Text>

      <View style={styles.wrapFilters}>
        {mealTypes.map((meal) => (
          <Chip
            key={meal}
            selected={selectedMeal === meal}
            onPress={() =>
              setSelectedMeal(selectedMeal === meal ? null : meal)
            }
            style={[
              styles.filterChip,
              {
                backgroundColor:
                  selectedMeal === meal
                    ? colors.primary
                    : colors.surface,
                borderColor: colors.border,
              },
            ]}
            textStyle={{
              color:
                selectedMeal === meal
                  ? colors.selectedText
                  : colors.text,
            }}
          >
            {meal}
          </Chip>
        ))}
      </View>

      {/* PREPARATION TIME */}
      <Text style={[styles.sectionTitle, { color: colors.heading }]}>
        Preparation Time
      </Text>

      <View style={styles.wrapFilters}>
        {prepTimes.map((time) => (
          <Chip
            key={time.value}
            selected={selectedPrepTime === time.value}
            onPress={() => setSelectedPrepTime(time.value)}
            style={[
              styles.filterChip,
              {
                backgroundColor:
                  selectedPrepTime === time.value
                    ? colors.primary
                    : colors.surface,
                borderColor: colors.border,
              },
            ]}
            textStyle={{
              color:
                selectedPrepTime === time.value
                  ? colors.selectedText
                  : colors.text,
            }}
          >
            {time.label}
          </Chip>
        ))}
      </View>

      {/* SORTING */}
      <Text style={[styles.sectionTitle, { color: colors.heading }]}>
        Sort By
      </Text>

      <View style={styles.wrapFilters}>
        {sortOptions.map((option) => (
          <Chip
            key={option.value}
            selected={sortBy === option.value}
            onPress={() => setSortBy(option.value)}
            style={[
              styles.filterChip,
              {
                backgroundColor:
                  sortBy === option.value
                    ? colors.primary
                    : colors.surface,
                borderColor: colors.border,
              },
            ]}
            textStyle={{
              color:
                sortBy === option.value
                  ? colors.selectedText
                  : colors.text,
            }}
          >
            {option.label}
          </Chip>
        ))}
      </View>

      {/* RESULTS HEADER */}
      <View style={styles.resultsHeader}>
        <View>
          <Text style={[styles.sectionTitle, { color: colors.heading }]}>
            Recipes
          </Text>

          <Text style={[styles.resultCount, { color: colors.muted }]}>
            {filteredRecipes.length} recipes shown
          </Text>
        </View>

        <TouchableOpacity onPress={clearFilters}>
          <Text style={[styles.clearText, { color: colors.accent }]}>
            Clear filters
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <FlatList
      style={[
        styles.container,
        { backgroundColor: colors.background },
      ]}
      contentContainerStyle={styles.content}
      data={filteredRecipes}
      renderItem={renderRecipe}
      keyExtractor={(item) => item.id.toString()}
      ListHeaderComponent={renderHeader()}
      ListEmptyComponent={
        loading ? (
          <View style={styles.emptyState}>
            <ActivityIndicator size="large" color={colors.primary} />
            <Text style={[styles.loadingText, { color: colors.muted }]}>
              Finding delicious recipes...
            </Text>
          </View>
        ) : (
          <View style={styles.emptyState}>
            <MaterialCommunityIcons
              name="food-off"
              size={55}
              color={colors.muted}
            />

            <Text style={[styles.emptyTitle, { color: colors.heading }]}>
              {error ? 'Something went wrong' : 'No recipes found'}
            </Text>

            <Text style={[styles.emptySubtitle, { color: colors.muted }]}>
              {error || 'Try another search or change your filters.'}
            </Text>

            {error && (
              <Button
                mode="contained"
                buttonColor={colors.primary}
                textColor={isDark ? '#101C18' : '#FFFFFF'}
                onPress={() => fetchRecipes(query, 0, false)}
              >
                Try Again
              </Button>
            )}
          </View>
        )
      }
      ListFooterComponent={
        loadingMore ? (
          <ActivityIndicator
            style={styles.footerLoader}
            size="large"
            color={colors.primary}
          />
        ) : hasMore && recipes.length > 0 ? (
          <TouchableOpacity
            style={[
              styles.loadMoreButton,
              { backgroundColor: colors.primary },
            ]}
            onPress={loadMore}
          >
            <Text style={styles.loadMoreText}>
              Load More Recipes
            </Text>
          </TouchableOpacity>
        ) : recipes.length > 0 ? (
          <Text style={[styles.endText, { color: colors.muted }]}>
            You have reached the end.
          </Text>
        ) : null
      }
      onEndReached={loadMore}
      onEndReachedThreshold={0.4}
      keyboardShouldPersistTaps="handled"
    />
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    padding: 20,
    paddingBottom: 35,
  },
  heading: {
    fontSize: 29,
    fontWeight: '800',
    marginTop: 12,
  },
  subtitle: {
    fontSize: 14,
    marginTop: 5,
    marginBottom: 22,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 15,
    paddingHorizontal: 15,
    height: 54,
    borderWidth: 1,
    marginBottom: 25,
  },
  searchInput: {
    flex: 1,
    marginLeft: 10,
    fontSize: 15,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  sectionTitle: {
    fontSize: 17,
    fontWeight: '700',
    marginBottom: 12,
    marginTop: 18,
  },
  horizontalList: {
    paddingBottom: 5,
  },
  wrapFilters: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 4,
  },
  filterChip: {
    borderWidth: 1,
    marginRight: 7,
    marginBottom: 5,
  },
  resultsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 10,
    marginBottom: 8,
  },
  resultCount: {
    fontSize: 12,
    marginTop: -7,
  },
  clearText: {
    fontWeight: '700',
    fontSize: 13,
  },
  recipeCard: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 16,
    padding: 10,
    marginBottom: 12,
    borderWidth: 1,
  },
  recipeImage: {
    width: 100,
    height: 105,
    borderRadius: 12,
  },
  recipeInfo: {
    flex: 1,
    paddingHorizontal: 12,
  },
  recipeName: {
    fontSize: 15,
    fontWeight: '700',
    marginBottom: 5,
  },
  recipeCuisine: {
    fontSize: 12,
    marginBottom: 10,
  },
  recipeMeta: {
    flexDirection: 'row',
    gap: 12,
  },
  metaText: {
    fontSize: 12,
  },
  caloriesText: {
    fontSize: 11,
    marginTop: 7,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 45,
    paddingHorizontal: 20,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginTop: 12,
  },
  emptySubtitle: {
    textAlign: 'center',
    marginTop: 6,
    marginBottom: 15,
  },
  loadingText: {
    marginTop: 12,
  },
  footerLoader: {
    padding: 20,
  },
  loadMoreButton: {
    padding: 14,
    borderRadius: 12,
    alignItems: 'center',
    marginVertical: 15,
  },
  loadMoreText: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  endText: {
    textAlign: 'center',
    padding: 20,
  },
});
