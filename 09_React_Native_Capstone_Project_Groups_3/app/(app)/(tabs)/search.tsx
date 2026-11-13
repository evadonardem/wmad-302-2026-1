/**
 * Search Screen - Cookbook
 *
 * - Query search: GET /recipes/search?q=  (debounced while typing)
 * - Filters: category (meal type), cuisine, difficulty
 * - Sort: rating, total time, calories, name
 * - Opened from Categories / Home with ?category=Dinner to show a filtered list
 *
 * DummyJSON has only ~50 recipes and its API can't filter by cuisine or
 * difficulty, so the app loads them once (limit=0) and filters on the device.
 */
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { View, Text, FlatList, ScrollView, TouchableOpacity, Image } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { ActivityIndicator, Button, Card, Chip, Searchbar, Title } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { recipeApi } from '@/services/recipeApi';
import { Recipe } from '@/types/recipe';
import { useDebounce } from '@/hooks';
import { styles } from './searchStyles';

type Difficulty = Recipe['difficulty'];
type SortOption = 'rating' | 'time' | 'calories' | 'name';

const DIFFICULTIES: Difficulty[] = ['Easy', 'Medium', 'Hard'];
const SORT_OPTIONS: { value: SortOption; label: string }[] = [
  { value: 'rating', label: 'Top rated' },
  { value: 'time', label: 'Quickest' },
  { value: 'calories', label: 'Lowest calories' },
  { value: 'name', label: 'A–Z' },
];

const totalTime = (recipe: Recipe) => recipe.prepTimeMinutes + recipe.cookTimeMinutes;

export default function SearchScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ category?: string }>();

  const [allRecipes, setAllRecipes] = useState<Recipe[]>([]);
  const [searchResults, setSearchResults] = useState<Recipe[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [searching, setSearching] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [query, setQuery] = useState('');
  const debouncedQuery = useDebounce(query.trim(), 400);
  const [category, setCategory] = useState<string | null>(params.category ?? null);
  const [cuisine, setCuisine] = useState<string | null>(null);
  const [difficulty, setDifficulty] = useState<Difficulty | null>(null);
  const [sort, setSort] = useState<SortOption>('rating');

  // Opening Search from Categories/Home sets the category filter
  useEffect(() => {
    if (params.category) setCategory(params.category);
  }, [params.category]);

  const loadAll = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await recipeApi.getRecipes({ limit: 0 });
      setAllRecipes(data.recipes);
    } catch {
      setError('Could not load recipes. Check your connection and try again.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadAll();
  }, [loadAll]);

  // Server-side text search, run after the user stops typing
  useEffect(() => {
    if (!debouncedQuery) {
      setSearchResults(null);
      return;
    }
    let cancelled = false;
    setSearching(true);
    recipeApi
      .searchRecipes(debouncedQuery, { limit: 0 })
      .then((data) => {
        if (!cancelled) setSearchResults(data.recipes);
      })
      .catch(() => {
        if (!cancelled) setError('Search failed. Please try again.');
      })
      .finally(() => {
        if (!cancelled) setSearching(false);
      });
    return () => {
      cancelled = true;
    };
  }, [debouncedQuery]);

  // Filter options come from the data itself
  const categories = useMemo(
    () => Array.from(new Set(allRecipes.flatMap((r) => r.mealType))).sort(),
    [allRecipes]
  );
  const cuisines = useMemo(
    () => Array.from(new Set(allRecipes.map((r) => r.cuisine))).sort(),
    [allRecipes]
  );

  const results = useMemo(() => {
    const base = searchResults ?? allRecipes;
    const filtered = base.filter(
      (r) =>
        (!category || r.mealType.includes(category)) &&
        (!cuisine || r.cuisine === cuisine) &&
        (!difficulty || r.difficulty === difficulty)
    );
    const sorted = [...filtered];
    switch (sort) {
      case 'rating':
        sorted.sort((a, b) => b.rating - a.rating);
        break;
      case 'time':
        sorted.sort((a, b) => totalTime(a) - totalTime(b));
        break;
      case 'calories':
        sorted.sort((a, b) => a.caloriesPerServing - b.caloriesPerServing);
        break;
      case 'name':
        sorted.sort((a, b) => a.name.localeCompare(b.name));
        break;
    }
    return sorted;
  }, [searchResults, allRecipes, category, cuisine, difficulty, sort]);

  const hasFilters = !!(query || category || cuisine || difficulty);
  const clearAll = () => {
    setQuery('');
    setCategory(null);
    setCuisine(null);
    setDifficulty(null);
    router.setParams({ category: '' });
  };

  const renderResult = ({ item }: { item: Recipe }) => (
    <TouchableOpacity
      style={styles.resultCard}
      onPress={() => router.push(`/recipe/${item.id}`)}
    >
      <Card style={styles.card} elevation={1}>
        <View style={styles.resultContent}>
          <Image source={{ uri: item.image }} style={styles.resultImage} resizeMode="cover" />
          <View style={styles.resultInfo}>
            <Title style={styles.resultTitle} numberOfLines={1}>
              {item.name}
            </Title>
            <View style={styles.resultMeta}>
              <Chip compact style={styles.difficultyChip}>
                {item.difficulty}
              </Chip>
              <Chip compact style={styles.cuisineChip}>
                {item.cuisine}
              </Chip>
            </View>
            <Text style={styles.resultDetails}>
              ⏱️ {totalTime(item)}min · 🔥 {item.caloriesPerServing} cal · ⭐ {item.rating.toFixed(1)}
            </Text>
          </View>
        </View>
      </Card>
    </TouchableOpacity>
  );

  // One horizontal row of filter chips
  const chipRow = <T extends string>(
    title: string,
    options: readonly T[],
    selected: T | null,
    onSelect: (value: T | null) => void,
    label: (value: T) => string = (v) => v
  ) => (
    <View style={styles.filterSection}>
      <Text style={styles.filterTitle}>{title}</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterList}>
        {options.map((option) => (
          <Chip
            key={option}
            selected={selected === option}
            showSelectedOverlay
            onPress={() => onSelect(selected === option ? null : option)}
          >
            {label(option)}
          </Chip>
        ))}
      </ScrollView>
    </View>
  );

  const header = (
    <View>
      <View style={styles.searchBarContainer}>
        <Searchbar
          placeholder="Search recipes, ingredients, tags..."
          value={query}
          onChangeText={setQuery}
          onClearIconPress={() => setQuery('')}
          loading={searching}
        />
      </View>

      {chipRow('Category', categories, category, setCategory)}
      {chipRow('Cuisine', cuisines, cuisine, setCuisine)}
      {chipRow('Difficulty', DIFFICULTIES, difficulty, setDifficulty)}
      {chipRow(
        'Sort by',
        SORT_OPTIONS.map((o) => o.value),
        sort,
        (value) => setSort(value ?? 'rating'),
        (value) => SORT_OPTIONS.find((o) => o.value === value)?.label ?? value
      )}

      <View style={styles.resultsHeader}>
        <Title style={styles.resultsTitle}>
          {results.length} recipe{results.length === 1 ? '' : 's'}
        </Title>
        {hasFilters && (
          <Button compact onPress={clearAll}>
            Clear all
          </Button>
        )}
      </View>
    </View>
  );

  if (loading) {
    return (
      <View style={[styles.container, styles.loadingCenter]}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  if (error && allRecipes.length === 0) {
    return (
      <View style={[styles.container, styles.emptyState]}>
        <MaterialCommunityIcons name="wifi-off" size={64} color="#BCAAA4" />
        <Text style={styles.emptyText}>{error}</Text>
        <Button mode="contained" onPress={loadAll} style={styles.retryButton}>
          Try Again
        </Button>
      </View>
    );
  }

  return (
    <FlatList
      style={styles.container}
      contentContainerStyle={styles.content}
      data={results}
      renderItem={renderResult}
      keyExtractor={(item) => item.id.toString()}
      ItemSeparatorComponent={() => <View style={styles.separator} />}
      keyboardShouldPersistTaps="handled"
      ListHeaderComponent={header}
      ListEmptyComponent={
        <View style={styles.emptyState}>
          <MaterialCommunityIcons name="magnify" size={64} color="#BCAAA4" />
          <Text style={styles.emptyText}>No recipes found</Text>
          <Text style={styles.emptySubtext}>Try a different search or clear the filters</Text>
          {hasFilters && (
            <Button mode="contained" onPress={clearAll} style={styles.retryButton}>
              Clear filters
            </Button>
          )}
        </View>
      }
    />
  );
}
