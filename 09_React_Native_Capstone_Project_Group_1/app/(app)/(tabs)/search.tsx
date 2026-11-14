/**
 * Search Screen - Cookbook
 * TODO: Students implement
 * - Search recipes by query (GET /recipes/search?q=)
 * - Filter by category, cuisine, difficulty
 * - Filter by meal type, prep time
 * - Sort by rating, time, calories
 * - Infinite scroll pagination
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
import { useRouter, useLocalSearchParams } from 'expo-router';import { Chip, Button } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';

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
  const params = useLocalSearchParams<{ q?: string }>();
  const [query, setQuery] = useState(params.q ?? '');
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState('');

  const [skip, setSkip] = useState(0);
  const [hasMore, setHasMore] = useState(true);

  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
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

        const nextSkip = data.skip + data.limit;
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
// Read search keyword passed through the URL.
useEffect(() => {
  setQuery(params.q ?? '');
}, [params.q]);

  // Load recipes and search after a short delay.
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

  const renderRecipe = ({ item }: { item: Recipe }) => {
    const totalTime = item.prepTimeMinutes + item.cookTimeMinutes;

    return (
      <TouchableOpacity
        activeOpacity={0.85}
        style={styles.recipeCard}
        onPress={() =>
          router.push(`/(app)/recipe/${item.id}` as any)
        }
      >
        <Image source={{ uri: item.image }} style={styles.recipeImage} />

        <View style={styles.recipeInfo}>
          <Text style={styles.recipeName} numberOfLines={2}>
            {item.name}
          </Text>

          <Text style={styles.recipeCuisine}>
            {item.cuisine} · {item.difficulty}
          </Text>

          <View style={styles.recipeMeta}>
            <Text style={styles.metaText}>
              <MaterialCommunityIcons name="clock-outline" size={14} />
              {' '}{totalTime} min
            </Text>

            <Text style={styles.metaText}>
              <MaterialCommunityIcons name="star" size={14} color="#E99A35" />
              {' '}{item.rating}
            </Text>
          </View>

          <Text style={styles.caloriesText}>
            {item.caloriesPerServing} calories per serving
          </Text>
        </View>

        <MaterialCommunityIcons
          name="chevron-right"
          size={24}
          color="#7B8D78"
        />
      </TouchableOpacity>
    );
  };

const renderHeader = () => (<View>

      <Text style={styles.heading}>Find a Recipe</Text>
      <Text style={styles.subtitle}>
        Discover something delicious to cook today.
      </Text>

      {/* Search bar */}
      <View style={styles.searchBar}>
        <MaterialCommunityIcons name="magnify" size={23} color="#71816D" />

        <TextInput
          style={styles.searchInput}
          placeholder="Search recipes..."
          placeholderTextColor="#9A9A8E"
          value={query}
          onChangeText={setQuery}
          returnKeyType="search"
        />

        {query.length > 0 && (
          <TouchableOpacity onPress={() => setQuery('')}>
            <MaterialCommunityIcons
              name="close-circle"
              size={21}
              color="#9A9A8E"
            />
          </TouchableOpacity>
        )}
          </View>

      {/* Categories */}
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Categories</Text>
        {selectedCategory && (
          <TouchableOpacity onPress={() => setSelectedCategory(null)}>
            <Text style={styles.clearText}>Clear</Text>
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
              selectedCategory === item && styles.selectedChip,
            ]}
            textStyle={[
              styles.chipText,
              selectedCategory === item && styles.selectedChipText,
            ]}
          >
            {item}
          </Chip>
        )}
      />

      {/* Cuisine */}
      <Text style={styles.sectionTitle}>Cuisine</Text>
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
              selectedCuisine === cuisine && styles.selectedChip,
            ]}
            textStyle={[
              styles.chipText,
              selectedCuisine === cuisine && styles.selectedChipText,
            ]}
          >
            {cuisine}
          </Chip>
        ))}
      </View>

      {/* Difficulty */}
      <Text style={styles.sectionTitle}>Difficulty</Text>
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
              selectedDifficulty === difficulty && styles.selectedChip,
            ]}
            textStyle={[
              styles.chipText,
              selectedDifficulty === difficulty && styles.selectedChipText,
            ]}
          >
            {difficulty}
          </Chip>
        ))}
      </View>

      {/* Meal type */}
      <Text style={styles.sectionTitle}>Meal Type</Text>
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
              selectedMeal === meal && styles.selectedChip,
            ]}
            textStyle={[
              styles.chipText,
              selectedMeal === meal && styles.selectedChipText,
            ]}
          >
            {meal}
          </Chip>
        ))}
      </View>

      {/* Preparation time */}
      <Text style={styles.sectionTitle}>Preparation Time</Text>
      <View style={styles.wrapFilters}>
        {prepTimes.map((time) => (
          <Chip
            key={time.value}
            selected={selectedPrepTime === time.value}
            onPress={() => setSelectedPrepTime(time.value)}
            style={[
              styles.filterChip,
              selectedPrepTime === time.value && styles.selectedChip,
            ]}
            textStyle={[
              styles.chipText,
              selectedPrepTime === time.value && styles.selectedChipText,
            ]}
          >
            {time.label}
          </Chip>
        ))}
      </View>

      {/* Sorting */}
      <Text style={styles.sectionTitle}>Sort By</Text>
      <View style={styles.wrapFilters}>
        {sortOptions.map((option) => (
          <Chip
            key={option.value}
            selected={sortBy === option.value}
            onPress={() => setSortBy(option.value)}
            style={[
              styles.filterChip,
              sortBy === option.value && styles.selectedChip,
            ]}
            textStyle={[
              styles.chipText,
              sortBy === option.value && styles.selectedChipText,
            ]}
          >
            {option.label}
          </Chip>
        ))}
      </View>

      <View style={styles.resultsHeader}>
        <View>
          <Text style={styles.sectionTitle}>Recipes</Text>
          <Text style={styles.resultCount}>
            {filteredRecipes.length} recipes shown
          </Text>
        </View>

        <TouchableOpacity onPress={clearFilters}>
          <Text style={styles.clearText}>Clear filters</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <FlatList
      style={styles.container}
      contentContainerStyle={styles.content}
      data={filteredRecipes}
      renderItem={renderRecipe}
      keyExtractor={(item) => item.id.toString()}
      ListHeaderComponent={renderHeader()}
      ListEmptyComponent={
      loading ? (
      <View style={styles.emptyState}>
      <ActivityIndicator size="large" color="#D97736" />
      <Text style={styles.loadingText}>
        Finding delicious recipes...
      </Text>
    </View>
     ) : (
    <View style={styles.emptyState}>
      <MaterialCommunityIcons
        name="food-off"
        size={55}
        color="#A6B09F"
      />
      <Text style={styles.emptyTitle}>
        {error ? 'Something went wrong' : 'No recipes found'}
      </Text>
      <Text style={styles.emptySubtitle}>
        {error || 'Try another search or change your filters.'}
      </Text>
      {error && (
        <Button
          mode="contained"
          buttonColor="#315C43"
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
            color="#D97736"
          />
        ) : hasMore && recipes.length > 0 ? (
          <TouchableOpacity style={styles.loadMoreButton} onPress={loadMore}>
            <Text style={styles.loadMoreText}>Load More Recipes</Text>
          </TouchableOpacity>
        ) : recipes.length > 0 ? (
          <Text style={styles.endText}>You have reached the end.</Text>
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
    backgroundColor: '#F8F6EF',
  },
  content: {
    padding: 20,
    paddingBottom: 35,
  },
  heading: {
    fontSize: 29,
    fontWeight: '800',
    color: '#294B36',
    marginTop: 12,
  },
  subtitle: {
    fontSize: 14,
    color: '#7B8175',
    marginTop: 5,
    marginBottom: 22,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 15,
    paddingHorizontal: 15,
    height: 54,
    borderWidth: 1,
    borderColor: '#E8E7DC',
    marginBottom: 25,
  },
  searchInput: {
    flex: 1,
    marginLeft: 10,
    color: '#294B36',
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
    color: '#294B36',
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
    backgroundColor: '#FFFFFF',
    borderColor: '#E3E5D9',
    borderWidth: 1,
    marginRight: 7,
    marginBottom: 5,
  },
  selectedChip: {
    backgroundColor: '#315C43',
  },
  chipText: {
    color: '#52634F',
    fontSize: 12,
  },
  selectedChipText: {
    color: '#FFFFFF',
  },
  resultsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 10,
    marginBottom: 8,
  },
  resultCount: {
    color: '#858B7F',
    fontSize: 12,
    marginTop: -7,
  },
  clearText: {
    color: '#D97736',
    fontWeight: '700',
    fontSize: 13,
  },
  recipeCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 10,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#ECECE3',
  },
  recipeImage: {
    width: 100,
    height: 105,
    borderRadius: 12,
    backgroundColor: '#E9E8DE',
  },
  recipeInfo: {
    flex: 1,
    paddingHorizontal: 12,
  },
  recipeName: {
    fontSize: 15,
    fontWeight: '700',
    color: '#294B36',
    marginBottom: 5,
  },
  recipeCuisine: {
    color: '#858B7F',
    fontSize: 12,
    marginBottom: 10,
  },
  recipeMeta: {
    flexDirection: 'row',
    gap: 12,
  },
  metaText: {
    fontSize: 12,
    color: '#657260',
  },
  caloriesText: {
    fontSize: 11,
    color: '#92968C',
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
    color: '#294B36',
    marginTop: 12,
  },
  emptySubtitle: {
    color: '#858B7F',
    textAlign: 'center',
    marginTop: 6,
    marginBottom: 15,
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F8F6EF',
  },
  loadingText: {
    color: '#657260',
    marginTop: 12,
  },
  footerLoader: {
    padding: 20,
  },
  loadMoreButton: {
    backgroundColor: '#315C43',
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
    color: '#92968C',
    padding: 20,
  },
});
