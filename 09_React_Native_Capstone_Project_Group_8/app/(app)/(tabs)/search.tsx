
/**
 * Search Screen - Cookbook
 * Searches and filters the complete DummyJSON recipe catalog.
 */

import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TextInput,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Image,
} from 'react-native';

import { useRouter, useLocalSearchParams } from 'expo-router';
import { Card, Title, Chip } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';

import { recipeApi } from '@/services/recipeApi';
import type { Recipe } from '@/types/recipe';
import { styles } from './searchStyles';

const PAGE_SIZE = 10;

const CATEGORIES = [
  'Beef',
  'Chicken',
  'Dessert',
  'Lamb',
  'Pasta',
  'Pork',
  'Seafood',
  'Vegetarian',
];

const CATEGORY_KEYWORDS: Record<string, string[]> = {
  Beef: ['beef', 'steak', 'brisket', 'veal'],
  Chicken: ['chicken'],
  Lamb: ['lamb', 'mutton'],
  Pork: ['pork', 'bacon', 'ham', 'prosciutto', 'pancetta'],
  Seafood: [
    'seafood',
    'fish',
    'shrimp',
    'prawn',
    'salmon',
    'tuna',
    'crab',
    'lobster',
    'squid',
    'octopus',
    'mussel',
    'clam',
    'oyster',
    'scallop',
    'anchovy',
    'sardine',
    'cod',
    'tilapia',
  ],
};

const MEAT_KEYWORDS = [
  'beef',
  'chicken',
  'pork',
  'bacon',
  'ham',
  'lamb',
  'mutton',
  'turkey',
  'duck',
  'goat',
  'veal',
  'sausage',
  'fish',
  'shrimp',
  'prawn',
  'salmon',
  'tuna',
  'crab',
  'lobster',
  'squid',
  'octopus',
  'mussel',
  'clam',
  'oyster',
  'scallop',
  'anchovy',
  'sardine',
  'cod',
  'tilapia',
];

// Check whether a recipe belongs to a selected category.
function matchesCategory(
  recipe: Recipe,
  category: string
): boolean {
  const searchableText = [
    recipe.name,
    recipe.cuisine,
    ...recipe.ingredients,
    ...recipe.tags,
  ]
    .join(' ')
    .toLowerCase();

  const tags = recipe.tags.map((tag) => tag.toLowerCase());

  if (category === 'Vegetarian') {
    const hasMeat = MEAT_KEYWORDS.some((keyword) =>
      new RegExp(`\\b${keyword}\\b`, 'i').test(searchableText)
    );

    return tags.includes('vegetarian') && !hasMeat;
  }

  if (category === 'Dessert') {
    return (
      tags.includes('dessert') ||
      recipe.mealType.some(
        (type) => type.toLowerCase() === 'dessert'
      )
    );
  }

  if (category === 'Pasta') {
    return (
      tags.includes('pasta') ||
      /\bpasta\b|\bspaghetti\b|\bpenne\b|\bmacaroni\b|\bfettuccine\b|\blasagna\b/i.test(
        searchableText
      )
    );
  }

  const keywords = CATEGORY_KEYWORDS[category];

  if (!keywords) {
    return false;
  }

  return keywords.some((keyword) =>
    new RegExp(`\\b${keyword}\\b`, 'i').test(searchableText)
  );
}

// Filter recipes using both keyword and category.
function getFilteredRecipes(
  recipes: Recipe[],
  searchQuery: string,
  category: string | null
): Recipe[] {
  let filteredRecipes = [...recipes];

  if (category) {
    filteredRecipes = filteredRecipes.filter((recipe) =>
      matchesCategory(recipe, category)
    );
  }

  if (searchQuery.trim()) {
    const searchTerm = searchQuery.trim().toLowerCase();

    filteredRecipes = filteredRecipes.filter((recipe) => {
      const searchableText = [
        recipe.name,
        recipe.cuisine,
        recipe.difficulty,
        ...recipe.ingredients,
        ...recipe.tags,
        ...recipe.mealType,
      ]
        .join(' ')
        .toLowerCase();

      return searchableText.includes(searchTerm);
    });
  }

  return filteredRecipes;
}

export default function SearchScreen() {
  const router = useRouter();

  // Read a category passed from the Categories Screen.
  const { category: categoryParam } = useLocalSearchParams<{
    category?: string;
  }>();

  const incomingCategory =
    typeof categoryParam === 'string' &&
    CATEGORIES.includes(categoryParam)
      ? categoryParam
      : null;

  const [query, setQuery] = useState('');
  const [allRecipes, setAllRecipes] = useState<Recipe[]>([]);
  const [results, setResults] = useState<Recipe[]>([]);

  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);

  const [selectedCategory, setSelectedCategory] =
    useState<string | null>(null);

  const [hasLoadedCatalog, setHasLoadedCatalog] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const [totalResults, setTotalResults] = useState(0);
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);

  // Load all recipes from DummyJSON.
  const loadCatalog = async (): Promise<Recipe[]> => {
    if (hasLoadedCatalog && allRecipes.length > 0) {
      return allRecipes;
    }

    const response = await recipeApi.getRecipes({ limit: 0 });
    const recipes = response.recipes || [];

    setAllRecipes(recipes);
    setHasLoadedCatalog(true);

    return recipes;
  };

  // Display matching recipes.
  const applyFilters = (
    recipes: Recipe[],
    searchQuery: string,
    category: string | null
  ) => {
    const filteredRecipes = getFilteredRecipes(
      recipes,
      searchQuery,
      category
    );

    setResults(filteredRecipes.slice(0, PAGE_SIZE));
    setTotalResults(filteredRecipes.length);
    setVisibleCount(Math.min(PAGE_SIZE, filteredRecipes.length));
    setHasSearched(true);
  };

  // Search using the complete recipe catalog.
  const handleSearch = async () => {
    if (!query.trim() && !selectedCategory) {
      handleClear();
      return;
    }

    setLoading(true);

    try {
      const recipes = await loadCatalog();

      applyFilters(recipes, query, selectedCategory);
    } catch (error) {
      console.error('Recipe search error:', error);

      Alert.alert(
        'Search Error',
        'Unable to load recipes. Please check your internet connection and try again.'
      );

      setResults([]);
      setTotalResults(0);
      setHasSearched(true);
    } finally {
      setLoading(false);
    }
  };

  // Select or deselect a category.
  const handleCategoryPress = async (category: string) => {
    const newCategory =
      selectedCategory === category ? null : category;

    setSelectedCategory(newCategory);

    if (!newCategory && !query.trim()) {
      setResults([]);
      setTotalResults(0);
      setVisibleCount(PAGE_SIZE);
      setHasSearched(false);
      return;
    }

    setLoading(true);

    try {
      const recipes = await loadCatalog();

      applyFilters(recipes, query, newCategory);
    } catch (error) {
      console.error('Category filter error:', error);

      Alert.alert(
        'Error',
        'Unable to filter recipes. Please try again.'
      );

      setResults([]);
      setTotalResults(0);
      setHasSearched(true);
    } finally {
      setLoading(false);
    }
  };

  // Display the next 10 matching recipes.
  const handleLoadMore = () => {
    if (loadingMore || visibleCount >= totalResults) {
      return;
    }

    setLoadingMore(true);

    const filteredRecipes = getFilteredRecipes(
      allRecipes,
      query,
      selectedCategory
    );

    const nextCount = Math.min(
      visibleCount + PAGE_SIZE,
      totalResults
    );

    setResults(filteredRecipes.slice(0, nextCount));
    setVisibleCount(nextCount);

    setLoadingMore(false);
  };

  // Clear search and category filters.
  const handleClear = () => {
    setQuery('');
    setSelectedCategory(null);
    setResults([]);
    setTotalResults(0);
    setVisibleCount(PAGE_SIZE);
    setHasSearched(false);
  };

  // Automatically load a category sent by the Categories Screen.
  useEffect(() => {
    if (!incomingCategory) {
      return;
    }

    let cancelled = false;

    const loadSelectedCategory = async () => {
      setSelectedCategory(incomingCategory);
      setLoading(true);

      try {
        const response = await recipeApi.getRecipes({ limit: 0 });

        if (cancelled) {
          return;
        }

        const recipes = response.recipes || [];

        setAllRecipes(recipes);
        setHasLoadedCatalog(true);

        const filteredRecipes = getFilteredRecipes(
          recipes,
          '',
          incomingCategory
        );

        setResults(filteredRecipes.slice(0, PAGE_SIZE));
        setTotalResults(filteredRecipes.length);
        setVisibleCount(
          Math.min(PAGE_SIZE, filteredRecipes.length)
        );
        setHasSearched(true);
      } catch (error) {
        if (!cancelled) {
          console.error('Category loading error:', error);

          Alert.alert(
            'Search Error',
            'Unable to load this category. Please try again.'
          );

          setResults([]);
          setTotalResults(0);
          setHasSearched(true);
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    void loadSelectedCategory();

    return () => {
      cancelled = true;
    };
  }, [incomingCategory]);

  // Display a recipe card.
  const renderResult = ({ item }: { item: Recipe }) => (
    <TouchableOpacity
      style={styles.resultCard}
      activeOpacity={0.8}
      onPress={() => router.push(`/(app)/recipe/${item.id}`)}
    >
      <Card style={styles.card} elevation={1}>
        <View style={styles.resultContent}>
          <Image
            source={{ uri: item.image }}
            style={styles.resultImage}
            resizeMode="cover"
          />

          <View style={styles.resultInfo}>
            <Title style={styles.resultTitle} numberOfLines={1}>
              {item.name}
            </Title>

            <View style={styles.resultMeta}>
              <Chip style={styles.difficultyChip}>
                {item.difficulty}
              </Chip>

              <Chip style={styles.cuisineChip}>
                {item.cuisine}
              </Chip>
            </View>

            <Text style={styles.resultDetails}>
              ⏱️ {item.prepTimeMinutes + item.cookTimeMinutes} min
              {' · '}👥 {item.servings}
              {' · '}⭐ {item.rating}
            </Text>
          </View>
        </View>
      </Card>
    </TouchableOpacity>
  );

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      keyboardShouldPersistTaps="handled"
    >
      {/* Search Bar */}
      <View style={styles.searchBarContainer}>
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            height: 52,
            backgroundColor: '#FFFFFF',
            borderRadius: 14,
            borderWidth: 1,
            borderColor: '#DCEBD8',
            paddingLeft: 12,
            paddingRight: 4,
          }}
        >
          <MaterialCommunityIcons
            name="magnify"
            size={24}
            color="#43A52F"
          />

          <TextInput
            style={[
              styles.searchInput,
              {
                flex: 1,
                borderWidth: 0,
                height: 50,
                paddingHorizontal: 12,
              },
            ]}
            placeholder="Search recipes or ingredients..."
            placeholderTextColor="#8AA187"
            value={query}
            onChangeText={setQuery}
            onSubmitEditing={handleSearch}
            returnKeyType="search"
          />

          <TouchableOpacity
            onPress={handleSearch}
            disabled={loading}
            style={styles.searchButton}
          >
            {loading ? (
              <ActivityIndicator size="small" color="#FFFFFF" />
            ) : (
              <MaterialCommunityIcons
                name="magnify"
                size={24}
                color="#FFFFFF"
              />
            )}
          </TouchableOpacity>
        </View>
      </View>

      {/* Category Filters */}
      <View style={styles.filterSection}>
        <Title style={styles.filterTitle}>Categories</Title>

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
                selectedCategory === item &&
                  styles.filterChipSelected,
              ]}
              onPress={() => handleCategoryPress(item)}
              disabled={loading}
            >
              <Text
                style={[
                  styles.filterChipText,
                  selectedCategory === item &&
                    styles.filterChipTextSelected,
                ]}
              >
                {item}
              </Text>
            </TouchableOpacity>
          )}
        />
      </View>

      {/* Results */}
      <View style={styles.resultsSection}>
        <Title style={styles.resultsTitle}>
          Results
          {selectedCategory ? ` - ${selectedCategory}` : ''}
          {query.trim() ? ` for "${query.trim()}"` : ''}
          {hasSearched ? ` (${totalResults})` : ''}
        </Title>

        {loading ? (
          <View style={styles.loadingCenter}>
            <ActivityIndicator size="large" color="#43A52F" />

            <Text
              style={{
                marginTop: 10,
                color: '#668064',
              }}
            >
              Loading recipes...
            </Text>
          </View>
        ) : results.length > 0 ? (
          <>
            <FlatList
              data={results}
              renderItem={renderResult}
              keyExtractor={(item) => item.id.toString()}
              contentContainerStyle={styles.resultsList}
              scrollEnabled={false}
              ItemSeparatorComponent={() => (
                <View style={styles.separator} />
              )}
            />

            {visibleCount < totalResults && (
              <TouchableOpacity
                onPress={handleLoadMore}
                disabled={loadingMore}
                style={{
                  backgroundColor: '#43A52F',
                  paddingVertical: 12,
                  paddingHorizontal: 20,
                  borderRadius: 12,
                  alignItems: 'center',
                  marginVertical: 16,
                }}
              >
                {loadingMore ? (
                  <ActivityIndicator color="#FFFFFF" />
                ) : (
                  <Text
                    style={{
                      color: '#FFFFFF',
                      fontWeight: 'bold',
                    }}
                  >
                    Load More Recipes
                  </Text>
                )}
              </TouchableOpacity>
            )}

            <Text
              style={{
                textAlign: 'center',
                color: '#668064',
                marginVertical: 10,
              }}
            >
              Showing {results.length} of {totalResults} recipes
            </Text>
          </>
        ) : hasSearched ? (
          <View style={styles.emptyState}>
            <MaterialCommunityIcons
              name="magnify"
              size={64}
              color="#A5C59E"
            />

            <Text style={styles.emptyText}>
              No recipes found
            </Text>

            <Text style={styles.emptySubtext}>
              Try another keyword or category.
            </Text>
          </View>
        ) : (
          <View style={styles.emptyState}>
            <MaterialCommunityIcons
              name="magnify"
              size={64}
              color="#A5C59E"
            />

            <Text style={styles.emptyText}>
              Find Your Next Favorite Recipe
            </Text>

            <Text style={styles.emptySubtext}>
              Search by recipe name or ingredient, or select a category.
            </Text>
          </View>
        )}
      </View>
    </ScrollView>
  );
}
