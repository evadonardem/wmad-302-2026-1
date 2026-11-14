import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Image,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Button, Card, Dialog, IconButton, Portal, TextInput as PaperTextInput, Title, useTheme } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { recipeApi } from '@/services/recipeApi';
import type { Recipe } from '@/types/recipe';
import { useFavorites } from '@/context/FavoritesContext';
import { useAuth } from '@/context/AuthContext';
import { useDebounce } from '@/hooks';
import { matchesRecipeCategory, recipeCategories } from '@/utils/recipeCategories';
import { userRecipesStorage } from '@/utils/storage';
import { styles } from './searchStyles';

type SortOption = 'Recommended' | 'Highest rated' | 'Quickest' | 'Lowest calories';
type RecipeDraft = {
  name: string;
  cuisine: string;
  ingredients: string;
  instructions: string;
  prepTimeMinutes: string;
  cookTimeMinutes: string;
  servings: string;
  caloriesPerServing: string;
  difficulty: Recipe['difficulty'];
  mealType: string;
};

const mealTypes = ['Breakfast', 'Lunch', 'Dinner', 'Snack', 'Appetizer', 'Dessert'];
const sortOptions: SortOption[] = ['Recommended', 'Highest rated', 'Quickest', 'Lowest calories'];
const pageSize = 20;
const emptyRecipeDraft: RecipeDraft = {
  name: '',
  cuisine: '',
  ingredients: '',
  instructions: '',
  prepTimeMinutes: '15',
  cookTimeMinutes: '20',
  servings: '2',
  caloriesPerServing: '0',
  difficulty: 'Easy',
  mealType: 'Dinner',
};

function matchesCategory(recipe: Recipe, category: string | null) {
  if (!category) return true;
  return matchesRecipeCategory(recipe, category);
}

export default function SearchScreen() {
  const router = useRouter();
  const { colors } = useTheme();
  const { category: categoryParam, userId: userIdParam } = useLocalSearchParams<{ category?: string; userId?: string }>();
  const { favoriteIds, isLoading: favoritesLoading, toggleFavorite } = useFavorites();
  const { user } = useAuth();
  const selectedUserId = typeof userIdParam === 'string' && Number.isFinite(Number(userIdParam))
    ? Number(userIdParam)
    : null;
  const isMyRecipesPage = selectedUserId !== null && selectedUserId === user?.id;
  const [query, setQuery] = useState('');
  const debouncedQuery = useDebounce(query.trim(), 350);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedCuisine, setSelectedCuisine] = useState<string | null>(null);
  const [selectedDifficulty, setSelectedDifficulty] = useState<string | null>(null);
  const [selectedMealType, setSelectedMealType] = useState<string | null>(null);
  const [availableCuisines, setAvailableCuisines] = useState<string[]>([]);
  const [cuisineOptionsError, setCuisineOptionsError] = useState<string | null>(null);
  const [maxPrepTime, setMaxPrepTime] = useState<number | null>(null);
  const [sortBy, setSortBy] = useState<SortOption>('Recommended');
  const [filtersExpanded, setFiltersExpanded] = useState(false);
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [hasLoadedRecipes, setHasLoadedRecipes] = useState(false);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isOffline, setIsOffline] = useState(false);
  const [recipeFormVisible, setRecipeFormVisible] = useState(false);
  const [recipeSaving, setRecipeSaving] = useState(false);
  const [recipeFormError, setRecipeFormError] = useState<string | null>(null);
  const [recipeDraft, setRecipeDraft] = useState<RecipeDraft>(emptyRecipeDraft);
  const [pendingRecipeRemoval, setPendingRecipeRemoval] = useState<Recipe | null>(null);
  const [deletingRecipe, setDeletingRecipe] = useState(false);
  const [recipeDeleteError, setRecipeDeleteError] = useState<string | null>(null);
  const skipRef = useRef(0);
  const totalRef = useRef(0);
  const loadingMoreRef = useRef(false);
  const requestIdRef = useRef(0);

  useEffect(() => {
    setSelectedCategory(typeof categoryParam === 'string' ? categoryParam : null);
  }, [categoryParam]);

  useEffect(() => {
    let active = true;
    recipeApi.getCategories()
      .then((cuisines) => {
        if (active) {
          setAvailableCuisines(cuisines);
          setCuisineOptionsError(null);
        }
      })
      .catch((loadError: unknown) => {
        if (active) {
          setCuisineOptionsError(loadError instanceof Error ? loadError.message : 'Could not load cuisines.');
        }
      });
    return () => {
      active = false;
    };
  }, []);

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
      if (isMyRecipesPage && selectedUserId !== null) {
        const savedRecipes = await userRecipesStorage.getRecipes(selectedUserId);
        if (requestId !== requestIdRef.current) return;
        const searchTerm = debouncedQuery.toLocaleLowerCase();
        const matchingRecipes = searchTerm
          ? savedRecipes.filter((recipe) => (
            recipe.name.toLocaleLowerCase().includes(searchTerm)
            || recipe.cuisine.toLocaleLowerCase().includes(searchTerm)
            || recipe.ingredients.some((ingredient) => ingredient.toLocaleLowerCase().includes(searchTerm))
          ))
          : savedRecipes;
        setHasLoadedRecipes(true);
        setIsOffline(false);
        setRecipes(matchingRecipes);
        totalRef.current = savedRecipes.length;
        skipRef.current = savedRecipes.length;
        return;
      }

      const offset = reset ? 0 : skipRef.current;
      const response = debouncedQuery
        ? await recipeApi.searchRecipes(debouncedQuery, { limit: pageSize, skip: offset })
        : await recipeApi.getRecipes({ limit: pageSize, skip: offset });
      if (requestId !== requestIdRef.current) return;
      setHasLoadedRecipes(true);
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
  }, [debouncedQuery, isMyRecipesPage, selectedUserId]);

  useEffect(() => {
    skipRef.current = 0;
    totalRef.current = 0;
    void loadPage(true);
  }, [loadPage]);

  const activeFilterCount = [selectedCategory, selectedCuisine, selectedDifficulty, selectedMealType, maxPrepTime]
    .filter((filter) => filter !== null).length;
  const categoryOptions = recipeCategories.filter(
    (category) => !mealTypes.some((mealType) => mealType.toLowerCase() === category.toLowerCase())
  );
  const cuisineOptions = useMemo(
    () => [...new Set([...availableCuisines, ...recipes.map((recipe) => recipe.cuisine)])].sort(),
    [availableCuisines, recipes]
  );

  const filteredRecipes = useMemo(() => {
    const filtered = recipes.filter((recipe) => (
      matchesCategory(recipe, selectedCategory)
      && (selectedUserId === null || recipe.userId === selectedUserId)
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

  const saveRecipe = async () => {
    if (!user || !isMyRecipesPage) {
      setRecipeFormError('Sign in to add a recipe to your account.');
      return;
    }

    const ingredients = recipeDraft.ingredients.split(/\r?\n/).map((item) => item.trim()).filter(Boolean);
    const instructions = recipeDraft.instructions.split(/\r?\n/).map((item) => item.trim()).filter(Boolean);
    const prepTimeMinutes = Number(recipeDraft.prepTimeMinutes);
    const cookTimeMinutes = Number(recipeDraft.cookTimeMinutes);
    const servings = Number(recipeDraft.servings);
    const caloriesPerServing = Number(recipeDraft.caloriesPerServing);

    if (!recipeDraft.name.trim() || !recipeDraft.cuisine.trim() || ingredients.length === 0 || instructions.length === 0) {
      setRecipeFormError('Enter a recipe name, cuisine, at least one ingredient, and at least one instruction.');
      return;
    }
    if (
      !Number.isInteger(prepTimeMinutes) || prepTimeMinutes < 0
      || !Number.isInteger(cookTimeMinutes) || cookTimeMinutes < 0
      || !Number.isInteger(servings) || servings < 1
      || !Number.isFinite(caloriesPerServing) || caloriesPerServing < 0
    ) {
      setRecipeFormError('Enter valid times, servings, and calories. Times and calories can’t be negative.');
      return;
    }

    setRecipeSaving(true);
    setRecipeFormError(null);
    try {
      const savedRecipes = await userRecipesStorage.getRecipes(user.id);
      const nextId = -Math.max(Date.now(), ...savedRecipes.map((recipe) => Math.abs(recipe.id) + 1));
      const recipe: Recipe = {
        id: nextId,
        name: recipeDraft.name.trim(),
        ingredients,
        instructions,
        prepTimeMinutes,
        cookTimeMinutes,
        servings,
        difficulty: recipeDraft.difficulty,
        cuisine: recipeDraft.cuisine.trim(),
        caloriesPerServing,
        tags: [recipeDraft.mealType],
        userId: user.id,
        image: '',
        rating: 0,
        reviewCount: 0,
        mealType: [recipeDraft.mealType],
      };
      await userRecipesStorage.addRecipe(user.id, recipe);
      setRecipeDraft({ ...emptyRecipeDraft });
      setRecipeFormVisible(false);
      await loadPage(true);
    } catch (saveError) {
      setRecipeFormError(saveError instanceof Error ? saveError.message : 'Could not save this recipe. Please try again.');
    } finally {
      setRecipeSaving(false);
    }
  };

  const deleteRecipe = async () => {
    if (!user || !isMyRecipesPage || !pendingRecipeRemoval) return;

    setDeletingRecipe(true);
    setRecipeDeleteError(null);
    const wasFavorite = favoriteIds.includes(pendingRecipeRemoval.id);
    let favoriteRemoved = false;
    try {
      if (wasFavorite) {
        await toggleFavorite(pendingRecipeRemoval.id);
        favoriteRemoved = true;
      }

      const removed = await userRecipesStorage.removeRecipe(user.id, pendingRecipeRemoval.id);
      if (!removed) throw new Error('This recipe no longer exists in your collection.');

      setRecipes((current) => current.filter((recipe) => recipe.id !== pendingRecipeRemoval.id));
      setPendingRecipeRemoval(null);
      await loadPage(true);
    } catch (deleteError) {
      let message = deleteError instanceof Error ? deleteError.message : 'Could not remove this recipe.';
      if (favoriteRemoved) {
        try {
          await toggleFavorite(pendingRecipeRemoval.id);
        } catch (restoreError) {
          const restoreMessage = restoreError instanceof Error ? restoreError.message : 'Could not restore the favorite.';
          message = `${message} The favorite could not be restored: ${restoreMessage}`;
        }
      }
      setRecipeDeleteError(message);
    } finally {
      setDeletingRecipe(false);
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
          {item.image ? (
            <Image source={{ uri: item.image }} style={styles.resultImage} resizeMode="cover" />
          ) : (
            <View style={[styles.resultImage, styles.recipeImagePlaceholder, { backgroundColor: colors.primaryContainer }]}>
              <MaterialCommunityIcons name="food-outline" size={30} color={colors.primary} />
            </View>
          )}
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
            containerColor="#FFF3E0"
            style={styles.resultFavoriteButton}
            onPress={(event) => {
              event.stopPropagation();
              void handleToggleFavorite(item.id);
            }}
            disabled={favoritesLoading}
            accessibilityLabel={favoriteIds.includes(item.id) ? 'Remove from favorites' : 'Add to favorites'}
          />
          {isMyRecipesPage && item.id < 0 && (
            <IconButton
              icon="delete-outline"
              iconColor={colors.error}
              style={styles.resultFavoriteButton}
              onPress={(event) => {
                event.stopPropagation();
                setRecipeDeleteError(null);
                setPendingRecipeRemoval(item);
              }}
              disabled={favoritesLoading || deletingRecipe}
              accessibilityLabel={`Remove ${item.name}`}
            />
          )}
        </View>
      </Card>
    </TouchableOpacity>
  );

  const header = (
    <View>
      <View style={[styles.searchHeader, { backgroundColor: colors.primaryContainer }]}>
        <View style={styles.searchHeaderTop}>
          <View style={styles.searchHeaderCopy}>
            <Text style={[styles.pageTitle, { color: colors.onPrimaryContainer }]}>{selectedUserId !== null ? 'My recipes' : 'Find your next favorite'}</Text>
            {isOffline && <Text style={[styles.offlineText, { color: colors.onPrimaryContainer }]}>Offline mode · using saved search results</Text>}
            <Text style={[styles.pageSubtitle, { color: colors.onPrimaryContainer }]}>
              {selectedUserId !== null ? 'Add and manage recipes saved on this device.' : 'Search thousands of recipes and make them yours.'}
            </Text>
          </View>
          <View style={styles.searchHeaderIcon}>
            <MaterialCommunityIcons name="magnify" size={26} color="#FFFFFF" />
          </View>
        </View>
        <View
          style={[
            styles.searchBarContainer,
            { backgroundColor: colors.surface, borderColor: colors.outlineVariant },
          ]}
        >
          <MaterialCommunityIcons name="magnify" size={22} color={colors.primary} />
          <TextInput
            style={[styles.searchInput, { color: colors.onSurface }]}
            placeholder="Search recipes or ingredients"
            placeholderTextColor={colors.onSurfaceVariant}
            value={query}
            onChangeText={setQuery}
            returnKeyType="search"
            accessibilityLabel="Search recipes"
          />
          {!!query && (
            <IconButton icon="close-circle" size={20} onPress={() => setQuery('')} accessibilityLabel="Clear search" />
          )}
        </View>
      </View>
      <TouchableOpacity
        style={[
          styles.filtersToggle,
          { backgroundColor: colors.surface, borderColor: colors.outlineVariant },
          filtersExpanded && { backgroundColor: colors.primaryContainer, borderColor: colors.primary },
        ]}
        onPress={() => setFiltersExpanded((expanded) => !expanded)}
        accessibilityRole="button"
        accessibilityState={{ expanded: filtersExpanded }}
      >
        <MaterialCommunityIcons name="tune-variant" size={19} color={filtersExpanded ? colors.onPrimaryContainer : colors.primary} />
        <Text style={[styles.filtersToggleText, { color: filtersExpanded ? colors.onPrimaryContainer : colors.onSurface }]}>Filters</Text>
        {activeFilterCount > 0 && (
          <View style={styles.filterCountBadge}>
            <Text style={styles.filterCountText}>{activeFilterCount}</Text>
          </View>
        )}
        <MaterialCommunityIcons
          name={filtersExpanded ? 'chevron-up' : 'chevron-down'}
          size={20}
          color={filtersExpanded ? colors.onPrimaryContainer : colors.onSurfaceVariant}
        />
      </TouchableOpacity>
      <FilterRow title="Sort by" options={sortOptions} selected={sortBy} onSelect={(value) => setSortBy(value as SortOption)} />
      {filtersExpanded && (
        <View
          style={[
            styles.filtersPanel,
            { backgroundColor: colors.surfaceVariant, borderColor: colors.outlineVariant },
          ]}
        >
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
          {cuisineOptionsError && (
            <Text style={[styles.emptySubtext, { color: colors.error }]}>{cuisineOptionsError}</Text>
          )}
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
        </View>
      )}
      {isMyRecipesPage && (
        <Button
          mode="contained"
          icon="plus"
          style={styles.addRecipeButton}
          onPress={() => {
            setRecipeFormError(null);
            setRecipeFormVisible(true);
          }}
        >
          Add a recipe
        </Button>
      )}
      <View style={[styles.resultsHeader, { borderTopColor: colors.outlineVariant }]}>
        <Title style={[styles.resultsTitle, { color: colors.onSurface }]}>{filteredRecipes.length} recipes</Title>
        {(selectedCategory || selectedCuisine || selectedDifficulty || selectedMealType || maxPrepTime || query) && (
          <Button compact onPress={clearFilters}>Clear filters</Button>
        )}
      </View>
      {error && filteredRecipes.length > 0 && (
        <Text style={[styles.emptySubtext, { color: colors.error }]}>{error}</Text>
      )}
    </View>
  );

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {loading && !hasLoadedRecipes ? (
        <View style={styles.loadingCenter}><ActivityIndicator size="large" color="#E85D04" /></View>
      ) : error && !hasLoadedRecipes ? (
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
            loading ? (
              <View style={styles.loadingCenter}>
                <ActivityIndicator color="#E85D04" />
              </View>
            ) : error ? (
              <View style={styles.emptyState}>
                <Text style={[styles.emptySubtext, { color: colors.error }]}>{error}</Text>
                <Button mode="contained" onPress={() => { void loadPage(true); }}>Try again</Button>
              </View>
            ) : (
              <View style={styles.emptyState}>
                <MaterialCommunityIcons name="book-search-outline" size={56} color="#BCAAA4" />
                <Text style={[styles.emptyText, { color: colors.onSurface }]}>No recipes match those filters</Text>
                <Text style={[styles.emptySubtext, { color: colors.onSurfaceVariant }]}>Try another search or clear some filters.</Text>
              </View>
            )
          }
          ListFooterComponent={loadingMore ? <ActivityIndicator color="#E85D04" /> : null}
        />
      )}
      <Portal>
        <Dialog
          visible={pendingRecipeRemoval !== null}
          onDismiss={() => {
            if (!deletingRecipe) setPendingRecipeRemoval(null);
          }}
        >
          <Dialog.Title>Remove recipe?</Dialog.Title>
          <Dialog.Content>
            <Text style={{ color: colors.onSurface }}>
              {pendingRecipeRemoval
                ? `Remove “${pendingRecipeRemoval.name}” from your recipes${favoriteIds.includes(pendingRecipeRemoval.id) ? ' and favorites' : ''}?`
                : ''}
            </Text>
            {recipeDeleteError && (
              <Text style={[styles.recipeFormError, { color: colors.error }]}>{recipeDeleteError}</Text>
            )}
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={() => setPendingRecipeRemoval(null)} disabled={deletingRecipe}>Cancel</Button>
            <Button mode="contained" onPress={() => { void deleteRecipe(); }} loading={deletingRecipe} disabled={deletingRecipe}>
              Remove
            </Button>
          </Dialog.Actions>
        </Dialog>
        <Dialog
          visible={recipeFormVisible}
          onDismiss={() => {
            if (!recipeSaving) setRecipeFormVisible(false);
          }}
        >
          <Dialog.Title>Add a recipe</Dialog.Title>
          <Dialog.Content>
            <ScrollView style={styles.recipeForm} keyboardShouldPersistTaps="handled">
              <PaperTextInput
                label="Recipe name"
                mode="outlined"
                value={recipeDraft.name}
                onChangeText={(name) => setRecipeDraft((draft) => ({ ...draft, name }))}
                style={styles.recipeFormInput}
              />
              <PaperTextInput
                label="Cuisine"
                mode="outlined"
                value={recipeDraft.cuisine}
                onChangeText={(cuisine) => setRecipeDraft((draft) => ({ ...draft, cuisine }))}
                style={styles.recipeFormInput}
              />
              <PaperTextInput
                label="Ingredients (one per line)"
                mode="outlined"
                multiline
                value={recipeDraft.ingredients}
                onChangeText={(ingredients) => setRecipeDraft((draft) => ({ ...draft, ingredients }))}
                style={styles.recipeFormInput}
              />
              <PaperTextInput
                label="Instructions (one per line)"
                mode="outlined"
                multiline
                value={recipeDraft.instructions}
                onChangeText={(instructions) => setRecipeDraft((draft) => ({ ...draft, instructions }))}
                style={styles.recipeFormInput}
              />
              <View style={styles.recipeNumberFields}>
                <PaperTextInput
                  label="Prep min"
                  mode="outlined"
                  keyboardType="number-pad"
                  value={recipeDraft.prepTimeMinutes}
                  onChangeText={(prepTimeMinutes) => setRecipeDraft((draft) => ({ ...draft, prepTimeMinutes }))}
                  style={styles.recipeNumberInput}
                />
                <PaperTextInput
                  label="Cook min"
                  mode="outlined"
                  keyboardType="number-pad"
                  value={recipeDraft.cookTimeMinutes}
                  onChangeText={(cookTimeMinutes) => setRecipeDraft((draft) => ({ ...draft, cookTimeMinutes }))}
                  style={styles.recipeNumberInput}
                />
                <PaperTextInput
                  label="Servings"
                  mode="outlined"
                  keyboardType="number-pad"
                  value={recipeDraft.servings}
                  onChangeText={(servings) => setRecipeDraft((draft) => ({ ...draft, servings }))}
                  style={styles.recipeNumberInput}
                />
                <PaperTextInput
                  label="Calories"
                  mode="outlined"
                  keyboardType="number-pad"
                  value={recipeDraft.caloriesPerServing}
                  onChangeText={(caloriesPerServing) => setRecipeDraft((draft) => ({ ...draft, caloriesPerServing }))}
                  style={styles.recipeNumberInput}
                />
              </View>
              <Text style={[styles.formLabel, { color: colors.onSurface }]}>Difficulty</Text>
              <View style={styles.recipeOptionRow}>
                {(['Easy', 'Medium', 'Hard'] as const).map((difficulty) => (
                  <Button
                    key={difficulty}
                    compact
                    mode={recipeDraft.difficulty === difficulty ? 'contained' : 'outlined'}
                    onPress={() => setRecipeDraft((draft) => ({ ...draft, difficulty }))}
                  >
                    {difficulty}
                  </Button>
                ))}
              </View>
              <Text style={[styles.formLabel, { color: colors.onSurface }]}>Meal type</Text>
              <View style={styles.recipeOptionRow}>
                {mealTypes.map((mealType) => (
                  <Button
                    key={mealType}
                    compact
                    mode={recipeDraft.mealType === mealType ? 'contained' : 'outlined'}
                    onPress={() => setRecipeDraft((draft) => ({ ...draft, mealType }))}
                  >
                    {mealType}
                  </Button>
                ))}
              </View>
            </ScrollView>
            {recipeFormError && <Text style={[styles.recipeFormError, { color: colors.error }]}>{recipeFormError}</Text>}
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={() => setRecipeFormVisible(false)} disabled={recipeSaving}>Cancel</Button>
            <Button mode="contained" onPress={() => { void saveRecipe(); }} loading={recipeSaving} disabled={recipeSaving}>
              Save recipe
            </Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>
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
  const { colors } = useTheme();

  return (
    <View style={styles.filterSection}>
      <Text style={[styles.filterTitle, { color: colors.onSurface }]}>{title}</Text>
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
