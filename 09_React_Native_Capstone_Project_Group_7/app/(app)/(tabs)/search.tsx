/**
 * Search Screen - Cookbook
 * Debounced query search, category/cuisine/difficulty filters, sort options, and pagination
 */
import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  TextInput,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  Image,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Card, Title, Chip, Button } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { recipeApi } from '@/services/recipeApi';
import { useDebounce } from '@/hooks';
import { Recipe, RecipesResponse } from '@/types/recipe';
import { styles } from './searchStyles';

type SortOption = 'default' | 'rating' | 'time' | 'calories';

const CATEGORIES = [
  'Chicken', 'Beef', 'Pasta', 'Seafood', 'Vegetarian', 'Dessert', 'Breakfast', 'Dinner',
];

const DIFFICULTIES: Array<'Easy' | 'Medium' | 'Hard'> = ['Easy', 'Medium', 'Hard'];

const CUISINES = ['Italian', 'Asian', 'American', 'Mexican', 'Indian', 'Mediterranean', 'Pakistani'];

export default function SearchScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ category?: string }>();

  const [query, setQuery] = useState('');
  const debouncedQuery = useDebounce(query, 350);

  const [rawResults, setRawResults] = useState<Recipe[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [selectedCategory, setSelectedCategory] = useState<string | null>(params.category ?? null);
  const [selectedDifficulty, setSelectedDifficulty] = useState<string | null>(null);
  const [selectedCuisine, setSelectedCuisine] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState<SortOption>('default');

  useEffect(() => {
    if (params.category) {
      setSelectedCategory(params.category);
    }
  }, [params.category]);

  const fetchResults = useCallback(
    async (skip = 0, append = false) => {
      if (append) {
        setLoadingMore(true);
      } else {
        setLoading(true);
      }
      setError(null);

      try {
        const trimmed = debouncedQuery.trim();
        let response: RecipesResponse;

        if (trimmed) {
          response = await recipeApi.searchRecipes(trimmed, { limit: 20, skip });
        } else if (selectedCategory) {
          response = await recipeApi.getRecipesByCategory(selectedCategory, { limit: 20, skip });
        } else {
          response = await recipeApi.getRecipes({ limit: 20, skip });
        }

        setTotal(response.total);
        setRawResults((prev) => (append ? [...prev, ...response.recipes] : response.recipes));
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch recipes');
      } finally {
        setLoading(false);
        setLoadingMore(false);
      }
    },
    [debouncedQuery, selectedCategory]
  );

  useEffect(() => {
    fetchResults(0, false);
  }, [fetchResults]);

  const filteredAndSortedResults = useMemo(() => {
    let list = [...rawResults];

    if (selectedCategory && debouncedQuery.trim()) {
      const cat = selectedCategory.toLowerCase();
      list = list.filter(
        (r) =>
          r.tags.some((t) => t.toLowerCase().includes(cat)) ||
          r.mealType.some((m) => m.toLowerCase().includes(cat)) ||
          r.name.toLowerCase().includes(cat)
      );
    }

    if (selectedDifficulty) {
      list = list.filter((r) => r.difficulty === selectedDifficulty);
    }

    if (selectedCuisine) {
      list = list.filter((r) => r.cuisine.toLowerCase() === selectedCuisine.toLowerCase());
    }

    if (sortBy === 'rating') {
      list.sort((a, b) => b.rating - a.rating);
    } else if (sortBy === 'time') {
      list.sort(
        (a, b) => a.prepTimeMinutes + a.cookTimeMinutes - (b.prepTimeMinutes + b.cookTimeMinutes)
      );
    } else if (sortBy === 'calories') {
      list.sort((a, b) => a.caloriesPerServing - b.caloriesPerServing);
    }

    return list;
  }, [rawResults, selectedCategory, debouncedQuery, selectedDifficulty, selectedCuisine, sortBy]);

  const resetFilters = () => {
    setQuery('');
    setSelectedCategory(null);
    setSelectedDifficulty(null);
    setSelectedCuisine(null);
    setSortBy('default');
  };

  const renderResult = ({ item }: { item: Recipe }) => (
    <TouchableOpacity
      style={styles.resultCard}
      onPress={() => router.push(`/(app)/recipe/${item.id}`)}
      activeOpacity={0.85}
    >
      <Card style={styles.card} elevation={1}>
        <View style={styles.resultContent}>
          <Image source={{ uri: item.image }} style={styles.resultImage} resizeMode="cover" />
          <View style={styles.resultInfo}>
            <Title style={styles.resultTitle} numberOfLines={1}>
              {item.name}
            </Title>
            <View style={styles.resultMeta}>
              <Chip style={styles.difficultyChip} textStyle={{ fontSize: 11 }}>
                {item.difficulty}
              </Chip>
              <Chip style={styles.cuisineChip} textStyle={{ fontSize: 11 }}>
                {item.cuisine}
              </Chip>
            </View>
            <Text style={styles.resultDetails}>
              ⏱️ {item.prepTimeMinutes + item.cookTimeMinutes}m · 🔥 {item.caloriesPerServing} cal · ⭐{' '}
              {item.rating.toFixed(1)}
            </Text>
          </View>
        </View>
      </Card>
    </TouchableOpacity>
  );

  const hasActiveFilters = Boolean(
    query.trim() || selectedCategory || selectedDifficulty || selectedCuisine || sortBy !== 'default'
  );

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View
        style={[
          styles.searchBarContainer,
          { flexDirection: 'row', alignItems: 'center', marginTop: 12 },
        ]}
      >
        <View
          style={{
            flex: 1,
            flexDirection: 'row',
            alignItems: 'center',
            backgroundColor: '#FFFFFF',
            borderRadius: 12,
            borderWidth: 1,
            borderColor: '#E0E0E0',
            paddingHorizontal: 12,
            height: 52,
          }}
        >
          <MaterialCommunityIcons name="magnify" size={22} color="#8D6E63" />
          <TextInput
            style={{ flex: 1, marginLeft: 8, fontSize: 16, color: '#3E2723' }}
            placeholder="Search recipes (e.g. chicken, pasta)..."
            placeholderTextColor="#A1887F"
            value={query}
            onChangeText={setQuery}
            returnKeyType="search"
          />
          {query.length > 0 && (
            <TouchableOpacity onPress={() => setQuery('')} style={styles.clearButton}>
              <MaterialCommunityIcons name="close-circle" size={20} color="#8D6E63" />
            </TouchableOpacity>
          )}
        </View>
      </View>

      <View style={styles.filterSection}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
          <Title style={styles.filterTitle}>Category</Title>
          {hasActiveFilters && (
            <TouchableOpacity onPress={resetFilters}>
              <Text style={{ color: '#E85D04', fontWeight: '600', fontSize: 13 }}>Reset All</Text>
            </TouchableOpacity>
          )}
        </View>
        <FlatList
          data={CATEGORIES}
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filterList}
          keyExtractor={(item) => item}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={[
                styles.filterChip,
                selectedCategory === item && styles.filterChipSelected,
              ]}
              onPress={() => setSelectedCategory(selectedCategory === item ? null : item)}
            >
              <Text
                style={[
                  styles.filterChipText,
                  selectedCategory === item && styles.filterChipTextSelected,
                ]}
              >
                {item}
              </Text>
            </TouchableOpacity>
          )}
        />
      </View>

      <View style={styles.filterSection}>
        <Title style={styles.filterTitle}>Difficulty & Cuisine</Title>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filterList}
        >
          {DIFFICULTIES.map((diff) => (
            <TouchableOpacity
              key={diff}
              style={[
                styles.filterChip,
                selectedDifficulty === diff && styles.filterChipSelected,
              ]}
              onPress={() => setSelectedDifficulty(selectedDifficulty === diff ? null : diff)}
            >
              <Text
                style={[
                  styles.filterChipText,
                  selectedDifficulty === diff && styles.filterChipTextSelected,
                ]}
              >
                {diff}
              </Text>
            </TouchableOpacity>
          ))}
          {CUISINES.map((cuisine) => (
            <TouchableOpacity
              key={cuisine}
              style={[
                styles.filterChip,
                selectedCuisine === cuisine && styles.filterChipSelected,
              ]}
              onPress={() => setSelectedCuisine(selectedCuisine === cuisine ? null : cuisine)}
            >
              <Text
                style={[
                  styles.filterChipText,
                  selectedCuisine === cuisine && styles.filterChipTextSelected,
                ]}
              >
                {cuisine}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      <View style={styles.sortSection}>
        <Title style={styles.filterTitle}>Sort By</Title>
        <View style={styles.sortOptions}>
          {(
            [
              { key: 'default', label: 'Default' },
              { key: 'rating', label: '⭐ Top Rated' },
              { key: 'time', label: '⏱️ Fastest' },
              { key: 'calories', label: '🔥 Lowest Cal' },
            ] as const
          ).map((option) => (
            <TouchableOpacity
              key={option.key}
              style={[styles.sortChip, sortBy === option.key && styles.sortChipSelected]}
              onPress={() => setSortBy(option.key)}
            >
              <Text
                style={[
                  styles.sortChipText,
                  sortBy === option.key && styles.sortChipTextSelected,
                ]}
              >
                {option.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      <View style={styles.resultsSection}>
        <Title style={styles.resultsTitle}>
          Results {debouncedQuery ? `for "${debouncedQuery}"` : ''} ({filteredAndSortedResults.length})
        </Title>

        {loading ? (
          <View style={styles.loadingCenter}>
            <ActivityIndicator size="large" color="#E85D04" />
          </View>
        ) : error ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyText}>{error}</Text>
            <Button mode="contained" onPress={() => fetchResults(0, false)} style={{ marginTop: 12 }}>
              Retry
            </Button>
          </View>
        ) : filteredAndSortedResults.length === 0 ? (
          <View style={styles.emptyState}>
            <MaterialCommunityIcons name="magnify" size={64} color="#BCAAA4" />
            <Text style={styles.emptyText}>No recipes found</Text>
            <Text style={styles.emptySubtext}>Try adjusting your search or filter criteria</Text>
            {hasActiveFilters && (
              <Button mode="outlined" onPress={resetFilters} style={{ marginTop: 12 }}>
                Clear Filters
              </Button>
            )}
          </View>
        ) : (
          <>
            <FlatList
              data={filteredAndSortedResults}
              renderItem={renderResult}
              keyExtractor={(item) => item.id.toString()}
              scrollEnabled={false}
              contentContainerStyle={styles.resultsList}
              ItemSeparatorComponent={() => <View style={styles.separator} />}
            />

            {rawResults.length < total && (
              <Button
                mode="outlined"
                onPress={() => fetchResults(rawResults.length, true)}
                loading={loadingMore}
                disabled={loadingMore}
                style={{ marginTop: 8, borderColor: '#E85D04' }}
                textColor="#E85D04"
              >
                {loadingMore ? 'Loading more...' : 'Load More Recipes'}
              </Button>
            )}
          </>
        )}
      </View>
    </ScrollView>
  );
}
