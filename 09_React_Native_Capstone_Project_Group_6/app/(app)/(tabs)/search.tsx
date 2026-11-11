import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Image,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Button, Card, Chip, IconButton, Title, useTheme } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { recipeApi } from '@/services/recipeApi';
import { Recipe } from '@/types/recipe';
import { useFavorites } from '@/context/FavoritesContext';
import { useDebounce } from '@/hooks';
import { matchesRecipeCategory } from '@/utils/recipeCategories';
import { styles } from './searchStyles';

type SortOption = 'Recommended' | 'Highest rated' | 'Quickest' | 'Lowest calories';

const mealTypes = ['Breakfast', 'Lunch', 'Dinner', 'Snack', 'Appetizer', 'Dessert', 'Drink'];
const sortOptions: SortOption[] = ['Recommended', 'Highest rated', 'Quickest', 'Lowest calories'];
const pageSize = 20;

function matchesCategory(recipe: Recipe, category: string | null) {
  if (!category) return true;
  return matchesRecipeCategory(recipe, category);
}

export default function SearchScreen() {
  const router = useRouter();
  const { colors } = useTheme();
  const { category: categoryParam, userId: userIdParam } = useLocalSearchParams<{ category?: string; userId?: string }>();
  const { favoriteIds, isLoading: favoritesLoading, toggleFavorite } = useFavorites();
  const [query, setQuery] = useState('');
  const debouncedQuery = useDebounce(query.trim(), 350);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedCuisine, setSelectedCuisine] = useState<string | null>(null);
  const [selectedDifficulty, setSelectedDifficulty] = useState<string | null>(null);
  const [selectedMealType, setSelectedMealType] = useState<string | null>(null);
  const [maxPrepTime, setMaxPrepTime] = useState<number | null>(null);
  const [sortBy, setSortBy] = useState<SortOption>('Recommended');
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isOffline, setIsOffline] = useState(false);
  const skipRef = useRef(0);
  const totalRef = useRef(0);
  const loadingMoreRef = useRef(false);
  const requestIdRef = useRef(0);

  useEffect(() => {
    setSelectedCategory(typeof categoryParam === 'string' ? categoryParam : null);
  }, [categoryParam]);

  const loadPage = useCallback(async (reset: boolean) => {
    const requestId = reset ? ++requestIdRef.current : requestIdRef.current;
    if (reset) {
      loadingMoreRef.current = false;
      setLoadingMore(false);
      setLoading(true);
      setError(null);
    } else {
      if (loadingMoreRef.current || skipRef.current >= totalRef.current) return;
      loadingMoreRef.current = true;
      setLoadingMore(true);
    }

    try {
      const offset = reset ? 0 : skipRef.current;
      const response = debouncedQuery
        ? await recipeApi.searchRecipes(debouncedQuery, { limit: pageSize, skip: offset })
        : await recipeApi.getRecipes({ limit: pageSize, skip: offset });
      if (requestId !== requestIdRef.current) return;
      setIsOffline(Boolean(response.isCached));
      setRecipes((current) => reset
        ? response.recipes
        : [...current, ...response.recipes.filter((recipe) => !current.some((item) => item.id === recipe.id))]);
      totalRef.current = response.total;
      skipRef.current = response.skip + response.recipes.length;
    } catch (loadError) {
      if (requestId !== requestIdRef.current) return;
      setError(loadError instanceof Error ? loadError.message : 'Failed to load recipes');
    } finally {
      if (requestId === requestIdRef.current) {
        setLoading(false);
        loadingMoreRef.current = false;
        setLoadingMore(false);
      }
    }
  }, [debouncedQuery]);

  useEffect(() => {
    setRecipes([]);
    skipRef.current = 0;
    totalRef.current = 0;
    void loadPage(true);
  }, [loadPage]);

  const selectedUserId = typeof userIdParam === 'string' ? Number(userIdParam) : null;
  const categoryOptions = useMemo(
    () => [...new Set(recipes.flatMap((recipe) => recipe.tags)
      .filter((tag) => !mealTypes.some((meal) => meal.toLowerCase() === tag.toLowerCase())))].sort(),
    [recipes]
  );
  const cuisineOptions = useMemo(
    () => [...new Set(recipes.map((recipe) => recipe.cuisine))].sort(),
    [recipes]
  );

  const filteredRecipes = useMemo(() => {
    const filtered = recipes.filter((recipe) => (
      matchesCategory(recipe, selectedCategory)
      && (!selectedUserId || recipe.userId === selectedUserId)
      && (!selectedCuisine || recipe.cuisine === selectedCuisine)
      && (!selectedDifficulty || recipe.difficulty === selectedDifficulty)
      && (!selectedMealType || recipe.mealType.includes(selectedMealType))
      && (maxPrepTime === null || recipe.prepTimeMinutes + recipe.cookTimeMinutes <= maxPrepTime)
    ));

    if (sortBy === 'Highest rated') return filtered.sort((a, b) => b.rating - a.rating);
    if (sortBy === 'Quickest') {
      return filtered.sort((a, b) => a.prepTimeMinutes + a.cookTimeMinutes - b.prepTimeMinutes - b.cookTimeMinutes);
    }
    if (sortBy === 'Lowest calories') return filtered.sort((a, b) => a.caloriesPerServing - b.caloriesPerServing);
    return filtered;
  }, [recipes, selectedCategory, selectedUserId, selectedCuisine, selectedDifficulty, selectedMealType, maxPrepTime, sortBy]);

  const clearFilters = () => {
    setQuery('');
    setSelectedCategory(null);
    setSelectedCuisine(null);
    setSelectedDifficulty(null);
    setSelectedMealType(null);
    setMaxPrepTime(null);
    setSortBy('Recommended');
  };

  const handleToggleFavorite = async (id: number) => {
    try {
      await toggleFavorite(id);
    } catch (saveError) {
      Alert.alert('Could not update favorites', saveError instanceof Error ? saveError.message : 'Please try again.');
    }
  };

  const renderResult = ({ item }: { item: Recipe }) => (
    <TouchableOpacity
      style={styles.resultCard}
      onPress={() => router.push(`/(app)/recipe/${item.id}`)}
      activeOpacity={0.85}
    >
      <Card style={[styles.card, { backgroundColor: colors.surface }]} elevation={1}>
        <View style={styles.resultContent}>
          <Image source={{ uri: item.image }} style={styles.resultImage} resizeMode="cover" />
          <View style={styles.resultInfo}>
            <Title style={[styles.resultTitle, { color: colors.onSurface }]} numberOfLines={2}>{item.name}</Title>
            <Text style={[styles.resultCategory, { color: colors.primary }]}>{item.cuisine}</Text>
            <Text style={[styles.resultDetails, { color: colors.onSurfaceVariant }]}>
              {item.difficulty} · {item.prepTimeMinutes + item.cookTimeMinutes} min · ⭐ {item.rating.toFixed(1)}
            </Text>
          </View>
          <IconButton
            icon={favoriteIds.includes(item.id) ? 'heart' : 'heart-outline'}
            iconColor={favoriteIds.includes(item.id) ? '#C62828' : '#8D6E63'}
            onPress={(event) => {
              event.stopPropagation();
              void handleToggleFavorite(item.id);
            }}
            disabled={favoritesLoading}
            accessibilityLabel={favoriteIds.includes(item.id) ? 'Remove from favorites' : 'Add to favorites'}
          />
        </View>
      </Card>
    </TouchableOpacity>
  );

  const header = (
    <View>
      <Text style={[styles.pageTitle, { color: colors.onBackground }]}>{selectedUserId ? 'My recipes' : 'Find your next favorite'}</Text>
      {isOffline && <Text style={{ color: colors.onSurfaceVariant }}>Offline mode · using saved search results</Text>}
      <Text style={[styles.pageSubtitle, { color: colors.onSurfaceVariant }]}>
        {selectedUserId ? 'Recipes you have shared with the community.' : 'Search thousands of recipes and make them yours.'}
      </Text>
      <View style={styles.searchBarContainer}>
        <MaterialCommunityIcons name="magnify" size={22} color="#8D6E63" />
        <TextInput
          style={[styles.searchInput, { color: colors.onSurface }]}
          placeholder="Search recipes or ingredients"
          placeholderTextColor="#A1887F"
          value={query}
          onChangeText={setQuery}
          returnKeyType="search"
          accessibilityLabel="Search recipes"
        />
        {!!query && (
          <IconButton icon="close-circle" size={20} onPress={() => setQuery('')} accessibilityLabel="Clear search" />
        )}
      </View>
      <FilterRow
        title="Categories"
        options={categoryOptions}
        selected={selectedCategory}
        onSelect={(value) => setSelectedCategory(selectedCategory === value ? null : value)}
      />
      <FilterRow
        title="Cuisine"
        options={cuisineOptions}
        selected={selectedCuisine}
        onSelect={(value) => setSelectedCuisine(selectedCuisine === value ? null : value)}
      />
      <FilterRow
        title="Difficulty"
        options={['Easy', 'Medium', 'Hard']}
        selected={selectedDifficulty}
        onSelect={(value) => setSelectedDifficulty(selectedDifficulty === value ? null : value)}
      />
      <FilterRow
        title="Meal type"
        options={mealTypes}
        selected={selectedMealType}
        onSelect={(value) => setSelectedMealType(selectedMealType === value ? null : value)}
      />
      <FilterRow
        title="Ready in"
        options={['30 min', '45 min', '60 min']}
        selected={maxPrepTime ? `${maxPrepTime} min` : null}
        onSelect={(value) => {
          const minutes = Number(value.split(' ')[0]);
          setMaxPrepTime(maxPrepTime === minutes ? null : minutes);
        }}
      />
      <Text style={styles.filterTitle}>Sort by</Text>
      <View style={styles.sortOptions}>
        {sortOptions.map((option) => (
          <Chip
            key={option}
            selected={sortBy === option}
            onPress={() => setSortBy(option)}
            style={styles.sortChip}
          >
            {option}
          </Chip>
        ))}
      </View>
      <View style={styles.resultsHeader}>
        <Title style={[styles.resultsTitle, { color: colors.onSurface }]}>{filteredRecipes.length} recipes</Title>
        {(selectedCategory || selectedCuisine || selectedDifficulty || selectedMealType || maxPrepTime || query) && (
          <Button compact onPress={clearFilters}>Clear filters</Button>
        )}
      </View>
    </View>
  );

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {loading && recipes.length === 0 ? (
        <View style={styles.loadingCenter}><ActivityIndicator size="large" color="#E85D04" /></View>
      ) : error && recipes.length === 0 ? (
        <View style={styles.emptyState}>
          <Text style={[styles.emptyText, { color: colors.onSurface }]}>We couldn’t load recipes</Text>
          <Text style={styles.emptySubtext}>{error}</Text>
          <Button mode="contained" onPress={() => { void loadPage(true); }}>Try again</Button>
        </View>
      ) : (
        <FlatList
          data={filteredRecipes}
          renderItem={renderResult}
          keyExtractor={(item) => item.id.toString()}
          ListHeaderComponent={header}
          contentContainerStyle={styles.content}
          ItemSeparatorComponent={() => <View style={styles.separator} />}
          onEndReached={() => { void loadPage(false); }}
          onEndReachedThreshold={0.5}
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <MaterialCommunityIcons name="book-search-outline" size={56} color="#BCAAA4" />
              <Text style={[styles.emptyText, { color: colors.onSurface }]}>No recipes match those filters</Text>
              <Text style={[styles.emptySubtext, { color: colors.onSurfaceVariant }]}>Try another search or clear some filters.</Text>
            </View>
          }
          ListFooterComponent={loadingMore ? <ActivityIndicator color="#E85D04" /> : null}
        />
      )}
    </View>
  );
}

function FilterRow({
  title,
  options,
  selected,
  onSelect,
}: {
  title: string;
  options: string[];
  selected: string | null;
  onSelect: (value: string) => void;
}) {
  return (
    <View style={styles.filterSection}>
      <Text style={styles.filterTitle}>{title}</Text>
      <FlatList
        data={options}
        horizontal
        showsHorizontalScrollIndicator={false}
        keyExtractor={(item) => item}
        contentContainerStyle={styles.filterList}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={[styles.filterChip, selected === item && styles.filterChipSelected]}
            onPress={() => onSelect(item)}
          >
            <Text style={[styles.filterChipText, selected === item && styles.filterChipTextSelected]}>
              {item}
            </Text>
          </TouchableOpacity>
        )}
      />
    </View>
  );
}
