
import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  Animated,
  ActivityIndicator,
  FlatList,
  Image,
  Easing,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  useWindowDimensions,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Card, Chip, Title } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { FloatingRecipePhotos } from '@/components/FloatingRecipePhotos';
import { recipeApi } from '@/services/recipeApi';
import { RecipeCountry } from '@/services/recipeApi';
import { Recipe } from '@/types/recipe';
import { getRecipeCategories, matchesRecipeCategory } from '@/services/recipeCategories';
import { useAppTheme, useThemedStyles } from '@/context/AppThemeContext';
import { styles as baseStyles } from './searchStyles';

export default function SearchScreen() {
  const router = useRouter();
  const { colors, isDark } = useAppTheme();
  const styles = useThemedStyles(baseStyles);
  const { width: screenWidth } = useWindowDimensions();
  const backgroundDrift = useRef(new Animated.Value(0)).current;
  const isWide = screenWidth >= 760;
  const isHeroWide = screenWidth >= 900;
  const horizontalPadding = screenWidth >= 900 ? 28 : screenWidth >= 600 ? 24 : 16;
  const contentWidth = Math.min(screenWidth, 1200) - horizontalPadding * 2;
  const columns = screenWidth >= 1050 ? 3 : screenWidth >= 620 ? 2 : 1;
  const resultCardWidth = (contentWidth - (columns - 1) * 16) / columns;
  const params = useLocalSearchParams<{ tag?: string | string[]; category?: string | string[] }>();
  const routeTag = Array.isArray(params.tag)
    ? params.tag[0]
    : params.tag ?? (Array.isArray(params.category) ? params.category[0] : params.category);
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<Recipe[]>([]);
  const [allRecipes, setAllRecipes] = useState<Recipe[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [countries, setCountries] = useState<RecipeCountry[]>([]);
  const [countryQuery, setCountryQuery] = useState('');
  const [selectedCountry, setSelectedCountry] = useState<RecipeCountry | null>(null);
  const [loading, setLoading] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(routeTag ?? null);
  const [showCountrySuggestions, setShowCountrySuggestions] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [heroImageIndex, setHeroImageIndex] = useState(0);
  const [nextHeroImageIndex, setNextHeroImageIndex] = useState<number | null>(null);
  const heroImageOpacity = useRef(new Animated.Value(0)).current;
  const heroImageCount = Math.max(0, allRecipes.length - 1);
  const heroImage = heroImageCount > 0
    ? allRecipes[(heroImageIndex % heroImageCount) + 1]
    : allRecipes[0];
  const nextHeroImage = nextHeroImageIndex === null || heroImageCount === 0
    ? null
    : allRecipes[(nextHeroImageIndex % heroImageCount) + 1];

  useEffect(() => {
    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(backgroundDrift, {
          toValue: 1,
          duration: 18000,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
          isInteraction: false,
        }),
        Animated.timing(backgroundDrift, {
          toValue: 0,
          duration: 18000,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
          isInteraction: false,
        }),
      ])
    );
    animation.start();
    return () => animation.stop();
  }, [backgroundDrift]);

  useEffect(() => {
    if (heroImageCount < 2) return;

    let active = true;
    const timer = setTimeout(() => {
      const nextIndex = (heroImageIndex + 1) % heroImageCount;
      setNextHeroImageIndex(nextIndex);
      heroImageOpacity.setValue(0);
      Animated.timing(heroImageOpacity, {
        toValue: 1,
        duration: 1400,
        useNativeDriver: true,
      }).start(({ finished }) => {
        if (!active || !finished) return;
        setHeroImageIndex(nextIndex);
        setNextHeroImageIndex(null);
      });
    }, 6500);

    return () => {
      active = false;
      clearTimeout(timer);
      heroImageOpacity.stopAnimation();
    };
  }, [heroImageCount, heroImageIndex, heroImageOpacity]);

  useEffect(() => {
    let active = true;
    setLoading(true);
    Promise.all([
      recipeApi.getWorldRecipes({ limit: 100 }),
      recipeApi.getRecipeCountries(),
    ])
      .then(([response, countryOptions]) => {
        if (!active) return;
        setAllRecipes(response.recipes);
        setResults(response.recipes);
        setCategories(getRecipeCategories(response.recipes).map(({ name }) => name));
        setCountries(countryOptions);
        setError(null);
      })
      .catch((loadError: unknown) => {
        if (active) setError(loadError instanceof Error ? loadError.message : 'Failed to load recipes');
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, []);

  const runSearch = useCallback(async (
    searchText: string,
    category: string | null,
    country: RecipeCountry | null
  ) => {
    setLoading(true);
    setError(null);
    setShowCountrySuggestions(false);
    try {
      const sourceRecipes = country
        ? (await recipeApi.getRecipesByCountry(country.area)).recipes
        : allRecipes;
      const countryHasNoRecipes = country !== null && sourceRecipes.length === 0;
      const searchRecipes = countryHasNoRecipes
        ? allRecipes
        : sourceRecipes;
      const searchTerm = searchText.trim().toLowerCase();
      const matchingRecipes = searchRecipes.filter((recipe) => {
        const matchesText = !searchTerm
          || recipe.name.toLowerCase().includes(searchTerm)
          || recipe.cuisine.toLowerCase().includes(searchTerm)
          || recipe.tags.some((tag) => tag.toLowerCase().includes(searchTerm));
        return matchesText && (!category || matchesRecipeCategory(recipe, category));
      });
      setResults(matchingRecipes);
      setShowCountrySuggestions(countryHasNoRecipes);
    } catch (searchError) {
      setError(searchError instanceof Error ? searchError.message : 'Unable to search recipes');
      setResults([]);
      setShowCountrySuggestions(false);
    } finally {
      setLoading(false);
    }
  }, [allRecipes]);

  useEffect(() => {
    setSelectedCategory(routeTag ?? null);
    if (allRecipes.length > 0) {
      void runSearch('', routeTag ?? null, null);
    }
  }, [routeTag, allRecipes, runSearch]);

  const renderResult = (item: Recipe) => (
    <TouchableOpacity
      key={item.id}
      style={[styles.resultCard, { width: resultCardWidth }]}
      onPress={() => router.push(`/(app)/recipe/${item.id}`)}
      accessibilityRole="button"
      accessibilityLabel={`View ${item.name} recipe`}
    >
      <Card style={styles.card} elevation={1}>
        <View style={[styles.resultContent, isWide && styles.resultContentWide]}>
          <Image
            source={{ uri: item.image }}
            style={[styles.resultImage, isWide && styles.resultImageWide]}
            resizeMode="cover"
          />
          <View style={styles.resultInfo}>
            <Title style={styles.resultTitle} numberOfLines={1}>{item.name}</Title>
            <View style={styles.resultMeta}>
              {item.id > 0 && <Chip style={styles.difficultyChip}>{item.difficulty}</Chip>}
              <Chip style={styles.cuisineChip}>{item.cuisine}</Chip>
            </View>
            <Text style={styles.resultDetails}>
              {item.prepTimeMinutes + item.cookTimeMinutes > 0
                ? `⏱️ ${item.prepTimeMinutes + item.cookTimeMinutes} min`
                : 'Traditional recipe'}
              {item.rating > 0 ? ` · ⭐ ${item.rating.toFixed(1)}` : ''}
            </Text>
          </View>
        </View>
      </Card>
    </TouchableOpacity>
  );

  const handleSearch = () => {
    void runSearch(query, selectedCategory, selectedCountry);
  };

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={[styles.content, { paddingHorizontal: horizontalPadding }]}
      keyboardShouldPersistTaps="handled"
      showsVerticalScrollIndicator={false}
    >
      <View style={styles.pageContent}>
        <View
          style={[styles.searchHero, isHeroWide && styles.searchHeroWide]}
        >
          <Animated.Image
            source={heroImage ? { uri: heroImage.image } : undefined}
            resizeMode="cover"
            style={[
              styles.searchHeroBackgroundImage,
              {
                transform: [
                  {
                    scale: backgroundDrift.interpolate({
                      inputRange: [0, 1],
                      outputRange: [1, 1.06],
                    }),
                  },
                  {
                    translateX: backgroundDrift.interpolate({
                      inputRange: [0, 1],
                      outputRange: [-5, 5],
                    }),
                  },
                  {
                    translateY: backgroundDrift.interpolate({
                      inputRange: [0, 1],
                      outputRange: [2, -2],
                    }),
                  },
                ],
              },
            ]}
          />
          {nextHeroImage && (
            <Animated.Image
              source={{ uri: nextHeroImage.image }}
              resizeMode="cover"
              style={[
                styles.searchHeroBackgroundImage,
                {
                  opacity: heroImageOpacity,
                  transform: [
                    {
                      scale: backgroundDrift.interpolate({
                        inputRange: [0, 1],
                        outputRange: [1, 1.06],
                      }),
                    },
                    {
                      translateX: backgroundDrift.interpolate({
                        inputRange: [0, 1],
                        outputRange: [-5, 5],
                      }),
                    },
                    {
                      translateY: backgroundDrift.interpolate({
                        inputRange: [0, 1],
                        outputRange: [2, -2],
                      }),
                    },
                  ],
                },
              ]}
            />
          )}
          <LinearGradient
            colors={['rgba(20,30,27,0.42)', 'rgba(20,30,27,0.58)']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.searchHeroImageOverlay}
            pointerEvents="none"
          />
          <View
            style={[
              styles.searchHeroCopy,
              isHeroWide ? styles.searchHeroCopyWide : styles.searchHeroCopyCompact,
            ]}
          >
            <Text style={styles.searchHeroEyebrow}>COOKBOOK · RECIPE FINDER</Text>
            <Text style={styles.searchHeroTitle}>Find your next favorite</Text>
            <Text style={styles.searchHeroSubtitle}>
              Search recipes by name, cuisine, or category and save a little inspiration for later.
            </Text>
          </View>
          <FloatingRecipePhotos recipes={allRecipes} compact={!isHeroWide} />
        </View>

        <View style={styles.searchBarContainer}>
          <View style={styles.searchInputRow}>
            <MaterialCommunityIcons name="magnify" size={23} color={colors.muted} style={styles.searchIcon} />
            <TextInput
              style={styles.searchInput}
              placeholder="Search recipes, cuisines, ingredients..."
              value={query}
              onChangeText={setQuery}
              onSubmitEditing={handleSearch}
              returnKeyType="search"
              accessibilityLabel="Search recipes"
            />
            {query ? (
              <TouchableOpacity
                onPress={() => {
                  setQuery('');
                  void runSearch('', selectedCategory, selectedCountry);
                }}
                style={styles.clearButton}
                accessibilityLabel="Clear search"
              >
                <MaterialCommunityIcons name="close" size={20} color={colors.muted} />
              </TouchableOpacity>
            ) : null}
            <TouchableOpacity
              onPress={handleSearch}
              disabled={loading}
              style={styles.searchButton}
              accessibilityLabel="Search recipes"
            >
              {loading
                ? <ActivityIndicator size="small" color={isDark ? '#2D1608' : '#FFFFFF'} />
                : <MaterialCommunityIcons name="magnify" size={20} color={isDark ? '#2D1608' : '#FFFFFF'} />}
            </TouchableOpacity>
          </View>
        </View>

        <View style={[styles.filtersGrid, isWide && styles.filtersGridWide]}>
          <View style={[styles.filterSection, styles.filterPanel]}>
            <Title style={styles.filterTitle}>Explore by country ({countries.length})</Title>
            <TextInput
              style={styles.countrySearchInput}
              placeholder="Find a country or cuisine..."
              value={countryQuery}
              onChangeText={setCountryQuery}
              autoCapitalize="words"
            />
            <FlatList
              data={countries.filter((country) =>
                `${country.country} ${country.area}`.toLowerCase().includes(countryQuery.trim().toLowerCase())
              )}
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.filterList}
              keyExtractor={(item) => item.area}
              renderItem={({ item }) => {
                const label = item.country === item.area
                  ? item.country
                  : `${item.country} (${item.area})`;
                const selected = selectedCountry?.area === item.area;
                return (
                  <TouchableOpacity
                    style={[styles.filterChip, selected && styles.filterChipSelected]}
                    onPress={() => {
                      const nextCountry = selected ? null : item;
                      setSelectedCountry(nextCountry);
                      setSelectedCategory(null);
                      void runSearch(query, null, nextCountry);
                    }}
                  >
                    <Text style={[styles.filterChipText, selected && styles.filterChipTextSelected]}>
                      {label}
                    </Text>
                  </TouchableOpacity>
                );
              }}
            />
            {selectedCountry && (
              <TouchableOpacity
                style={styles.clearCountry}
                onPress={() => {
                  setSelectedCountry(null);
                  void runSearch(query, selectedCategory, null);
                }}
              >
                <Text style={styles.countryActionText}>Show recipes from all countries</Text>
              </TouchableOpacity>
            )}
          </View>

          <View style={[styles.filterSection, styles.filterPanel]}>
            <Title style={styles.filterTitle}>Browse categories</Title>
            <FlatList
              data={categories}
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.filterList}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={[styles.filterChip, selectedCategory === item && styles.filterChipSelected]}
                  onPress={() => {
                    const nextCategory = selectedCategory === item ? null : item;
                    setSelectedCategory(nextCategory);
                    void runSearch(query, nextCategory, selectedCountry);
                  }}
                >
                  <Text style={[styles.filterChipText, selectedCategory === item && styles.filterChipTextSelected]}>
                    {item}
                  </Text>
                </TouchableOpacity>
              )}
              keyExtractor={(item) => item}
            />
          </View>
        </View>

        <View style={styles.resultsSection}>
          <LinearGradient
            colors={isDark ? ['#A94713', '#8A3500'] : ['#F98961', '#E85D04']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.resultsBanner}
          >
            <Text style={styles.resultsBannerText}>RECIPES TO INSPIRE YOU</Text>
          </LinearGradient>
          <Title style={styles.resultsTitle}>
            {selectedCountry && showCountrySuggestions
              ? `Suggestions for ${selectedCountry.country}`
              : selectedCountry
                ? `${selectedCountry.country} recipes`
                : selectedCategory
                  ? `${selectedCategory} recipes`
                  : query.trim()
                    ? 'Search results'
                    : 'Explore recipes'}
            {!loading ? ` (${results.length})` : ''}
          </Title>
          {selectedCountry && showCountrySuggestions && !loading && (
            <Text style={styles.countrySuggestionNotice}>
              No recipes are available for this country yet. Showing the full international recipe collection instead.
            </Text>
          )}
          {loading ? (
            <View style={styles.loadingCenter}>
              <ActivityIndicator size="large" color={colors.accent} />
            </View>
          ) : error ? (
            <View style={styles.emptyState}>
              <Text style={styles.emptyText}>{error}</Text>
              <TouchableOpacity onPress={handleSearch}>
                <Text style={styles.emptySubtext}>Tap to try again</Text>
              </TouchableOpacity>
            </View>
          ) : results.length > 0 ? (
            <View style={[styles.resultsList, { columnGap: 16 }]}>
              {results.map(renderResult)}
            </View>
          ) : query || selectedCategory || selectedCountry ? (
            <View style={styles.emptyState}>
              <MaterialCommunityIcons name="magnify" size={64} color={colors.muted} />
              <Text style={styles.emptyText}>No recipes found</Text>
              <Text style={styles.emptySubtext}>Try another category or search term.</Text>
            </View>
          ) : (
            <View style={styles.emptyState}>
              <MaterialCommunityIcons name="magnify" size={64} color={colors.muted} />
              <Text style={styles.emptyText}>Find your next favorite recipe</Text>
              <Text style={styles.emptySubtext}>Search by name, category, or country above.</Text>
            </View>
          )}
        </View>
      </View>
    </ScrollView>
  );
}
