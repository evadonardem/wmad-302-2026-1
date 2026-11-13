/**
 * Search Screen - Cookbook
 * Features: Debounced query search, category/cuisine/difficulty filters, sort options + animations
 */
import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  Image,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Card, Title, Chip, TextInput as PaperTextInput } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { recipeApi } from '@/services/recipeApi';
import { Recipe } from '@/types/recipe';
import { useDebounce } from '@/hooks';
import { useFavorites } from '@/context/FavoritesContext';
import {
  AnimatedCardWrapper,
  AnimatedHeartButton,
  ScalePressable,
} from '@/components/AnimatedComponents';
import { styles } from './searchStyles';

type SortOption = 'default' | 'rating' | 'time' | 'calories';

const CATEGORIES = [
  'All',
  'Dinner',
  'Lunch',
  'Breakfast',
  'Dessert',
  'Snack',
  'Appetizer',
  'Chicken',
  'Beef',
  'Pasta',
  'Salad',
];

const CUISINES = ['All', 'Italian', 'Asian', 'American', 'Mexican', 'Mediterranean', 'Indian'];
const DIFFICULTIES = ['All', 'Easy', 'Medium', 'Hard'] as const;

export default function SearchScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ category?: string }>();
  const { isFavorite, toggleFavorite } = useFavorites();

  const [query, setQuery] = useState('');
  const debouncedQuery = useDebounce(query, 350);

  const [allRecipes, setAllRecipes] = useState<Recipe[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [selectedCuisine, setSelectedCuisine] = useState<string>('All');
  const [selectedDifficulty, setSelectedDifficulty] = useState<string>('All');
  const [sortBy, setSortBy] = useState<SortOption>('default');

  // Sync category param when navigating from Categories screen
  useEffect(() => {
    if (params.category) {
      setSelectedCategory(params.category);
    }
  }, [params.category]);

  const fetchRecipes = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      if (debouncedQuery.trim()) {
        const res = await recipeApi.searchRecipes(debouncedQuery.trim(), { limit: 50 });
        setAllRecipes(res.recipes || []);
      } else if (selectedCategory !== 'All') {
        try {
          const tagRes = await recipeApi.getRecipesByTag(selectedCategory, { limit: 50 });
          if (tagRes.recipes && tagRes.recipes.length > 0) {
            setAllRecipes(tagRes.recipes);
          } else {
            const catRes = await recipeApi.getRecipesByCategory(selectedCategory, { limit: 50 });
            setAllRecipes(catRes.recipes || []);
          }
        } catch {
          const allRes = await recipeApi.getRecipes({ limit: 50 });
          setAllRecipes(allRes.recipes || []);
        }
      } else {
        const res = await recipeApi.getRecipes({ limit: 50 });
        setAllRecipes(res.recipes || []);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch recipes');
      setAllRecipes([]);
    } finally {
      setLoading(false);
    }
  }, [debouncedQuery, selectedCategory]);

  useEffect(() => {
    fetchRecipes();
  }, [fetchRecipes]);

  // Client-side combined filtering (category + cuisine + difficulty) and sorting
  const filteredAndSortedResults = useMemo(() => {
    let filtered = [...allRecipes];

    if (selectedCategory !== 'All') {
      const target = selectedCategory.toLowerCase();
      filtered = filtered.filter(
        (r) =>
          r.tags?.some((t) => t.toLowerCase() === target) ||
          r.mealType?.some((m) => m.toLowerCase() === target) ||
          r.name.toLowerCase().includes(target)
      );
    }

    if (selectedCuisine !== 'All') {
      filtered = filtered.filter(
        (r) => r.cuisine?.toLowerCase() === selectedCuisine.toLowerCase()
      );
    }

    if (selectedDifficulty !== 'All') {
      filtered = filtered.filter(
        (r) => r.difficulty?.toLowerCase() === selectedDifficulty.toLowerCase()
      );
    }

    switch (sortBy) {
      case 'rating':
        filtered.sort((a, b) => b.rating - a.rating);
        break;
      case 'time':
        filtered.sort(
          (a, b) =>
            a.prepTimeMinutes + a.cookTimeMinutes - (b.prepTimeMinutes + b.cookTimeMinutes)
        );
        break;
      case 'calories':
        filtered.sort((a, b) => a.caloriesPerServing - b.caloriesPerServing);
        break;
      default:
        break;
    }

    return filtered;
  }, [allRecipes, selectedCategory, selectedCuisine, selectedDifficulty, sortBy]);

  const resetFilters = () => {
    setQuery('');
    setSelectedCategory('All');
    setSelectedCuisine('All');
    setSelectedDifficulty('All');
    setSortBy('default');
  };

  const renderResult = ({ item, index }: { item: Recipe; index: number }) => {
    const favorited = isFavorite(item.id);

    return (
      <AnimatedCardWrapper index={index}>
        <ScalePressable
          style={styles.resultCard}
          onPress={() => router.push(`/(app)/(tabs)/recipe/${item.id}`)}
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
                  ⏱️ {item.prepTimeMinutes + item.cookTimeMinutes}m · 🔥 {item.caloriesPerServing}{' '}
                  cal · ⭐ {item.rating}
                </Text>
              </View>
              <AnimatedHeartButton
                isFavorite={favorited}
                onPress={() => toggleFavorite(item)}
                size={22}
              />
            </View>
          </Card>
        </ScalePressable>
      </AnimatedCardWrapper>
    );
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Search Bar */}
      <View style={styles.searchBarContainer}>
        <PaperTextInput
          mode="outlined"
          placeholder="Search recipes, ingredients..."
          value={query}
          onChangeText={setQuery}
          onSubmitEditing={fetchRecipes}
          returnKeyType="search"
          style={{ backgroundColor: '#FFFFFF', flex: 1 }}
          outlineColor="#E0D6CC"
          activeOutlineColor="#E85D04"
          left={<PaperTextInput.Icon icon="magnify" color="#8D6E63" />}
          right={
            query ? (
              <PaperTextInput.Icon icon="close" color="#8D6E63" onPress={() => setQuery('')} />
            ) : undefined
          }
        />
      </View>

      {/* Category / Meal Type Filters */}
      <View style={styles.filterSection}>
        <Title style={styles.filterTitle}>Category / Meal Type</Title>
        <FlatList
          data={CATEGORIES}
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filterList}
          keyExtractor={(item) => `cat-${item}`}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={[
                styles.filterChip,
                selectedCategory === item && styles.filterChipSelected,
              ]}
              onPress={() => setSelectedCategory(item)}
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

      {/* Cuisine Filters */}
      <View style={styles.filterSection}>
        <Title style={styles.filterTitle}>Cuisine</Title>
        <FlatList
          data={CUISINES}
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filterList}
          keyExtractor={(item) => `cuisine-${item}`}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={[
                styles.filterChip,
                selectedCuisine === item && styles.filterChipSelected,
              ]}
              onPress={() => setSelectedCuisine(item)}
            >
              <Text
                style={[
                  styles.filterChipText,
                  selectedCuisine === item && styles.filterChipTextSelected,
                ]}
              >
                {item}
              </Text>
            </TouchableOpacity>
          )}
        />
      </View>

      {/* Difficulty & Sort Row */}
      <View style={styles.filterSection}>
        <Title style={styles.filterTitle}>Difficulty</Title>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 12 }}>
          {DIFFICULTIES.map((diff) => (
            <TouchableOpacity
              key={diff}
              style={[
                styles.filterChip,
                selectedDifficulty === diff && styles.filterChipSelected,
              ]}
              onPress={() => setSelectedDifficulty(diff)}
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
        </View>

        <Title style={styles.filterTitle}>Sort By</Title>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
          {(
            [
              { key: 'default', label: 'Default' },
              { key: 'rating', label: '⭐ Top Rated' },
              { key: 'time', label: '⏱️ Fastest' },
              { key: 'calories', label: '🔥 Lowest Cal' },
            ] as const
          ).map((opt) => (
            <TouchableOpacity
              key={opt.key}
              style={[styles.filterChip, sortBy === opt.key && styles.filterChipSelected]}
              onPress={() => setSortBy(opt.key)}
            >
              <Text
                style={[
                  styles.filterChipText,
                  sortBy === opt.key && styles.filterChipTextSelected,
                ]}
              >
                {opt.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Results */}
      <View style={styles.resultsSection}>
        <View
          style={{
            flexDirection: 'row',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: 8,
          }}
        >
          <Title style={styles.resultsTitle}>
            Results {query ? `for "${query}"` : ''} ({filteredAndSortedResults.length})
          </Title>
          {(query ||
            selectedCategory !== 'All' ||
            selectedCuisine !== 'All' ||
            selectedDifficulty !== 'All' ||
            sortBy !== 'default') && (
            <TouchableOpacity onPress={resetFilters}>
              <Text style={{ color: '#E85D04', fontWeight: '600', fontSize: 13 }}>Reset</Text>
            </TouchableOpacity>
          )}
        </View>

        {loading ? (
          <View style={styles.loadingCenter}>
            <ActivityIndicator size="large" color="#E85D04" />
          </View>
        ) : error ? (
          <View style={styles.emptyState}>
            <MaterialCommunityIcons name="alert-circle-outline" size={48} color="#C62828" />
            <Text style={styles.emptyText}>{error}</Text>
          </View>
        ) : filteredAndSortedResults.length === 0 ? (
          <View style={styles.emptyState}>
            <MaterialCommunityIcons name="magnify" size={64} color="#BCAAA4" />
            <Text style={styles.emptyText}>No recipes found</Text>
            <Text style={styles.emptySubtext}>Try adjusting your search or filters</Text>
          </View>
        ) : (
          <FlatList
            data={filteredAndSortedResults}
            renderItem={renderResult}
            keyExtractor={(item) => item.id.toString()}
            scrollEnabled={false}
            contentContainerStyle={styles.resultsList}
            ItemSeparatorComponent={() => <View style={styles.separator} />}
          />
        )}
      </View>
    </ScrollView>
  );
}