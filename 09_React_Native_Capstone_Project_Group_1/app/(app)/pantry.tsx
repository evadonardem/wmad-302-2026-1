
import React, { useEffect, useMemo, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Image,
  ActivityIndicator,
  StyleSheet,
} from 'react-native';
import { useRouter } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import type { Recipe, RecipesResponse } from '@/types/recipe';

const API_URL = 'https://dummyjson.com/recipes?limit=0';

const COLORS = {
  background: '#FFFDF7',
  primary: '#24543D',
  text: '#26372C',
  muted: '#858B80',
  white: '#FFFFFF',
  border: '#EEECE4',
  lightGreen: '#EAF2E9',
  gold: '#E4C68E',
  orange: '#D97736',
};

const SUGGESTIONS = [
  'Eggs',
  'Chicken',
  'Garlic',
  'Rice',
  'Tomato',
  'Onion',
  'Potato',
  'Cheese',
];

const normalize = (value: string) =>
  value.toLowerCase().trim().replace(/[^a-z0-9 ]/g, '');

export default function PantryScreen() {
  const router = useRouter();

  const [allRecipes, setAllRecipes] = useState<Recipe[]>([]);
  const [ingredients, setIngredients] = useState<string[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const loadRecipes = async () => {
      try {
        setLoading(true);
        setError('');

        const response = await fetch(API_URL);

        if (!response.ok) {
          throw new Error('Unable to load recipes.');
        }

        const data: RecipesResponse = await response.json();
        setAllRecipes(data.recipes);
      } catch (err) {
        setError(
          err instanceof Error ? err.message : 'Something went wrong.'
        );
      } finally {
        setLoading(false);
      }
    };

    loadRecipes();
  }, []);

  const addIngredients = (value: string) => {
    const newItems = value
      .split(',')
      .map((item) => item.trim())
      .filter(Boolean);

    setIngredients((previous) => {
      const combined = [...previous];

      newItems.forEach((item) => {
        const exists = combined.some(
          (saved) => normalize(saved) === normalize(item)
        );

        if (!exists) combined.push(item);
      });

      return combined;
    });

    setInput('');
  };

  const removeIngredient = (item: string) => {
    setIngredients((previous) =>
      previous.filter((ingredient) => ingredient !== item)
    );
  };

  const matchingRecipes = useMemo(() => {
    if (ingredients.length === 0) return [];

    const selected = ingredients.map(normalize);

    return allRecipes
      .map((recipe) => {
        const matched = recipe.ingredients.filter((recipeIngredient) => {
          const recipeText = normalize(recipeIngredient);

          return selected.some(
            (ingredient) =>
              recipeText.includes(ingredient) ||
              ingredient.includes(recipeText)
          );
        });

        const missing = recipe.ingredients.filter(
          (recipeIngredient) => !matched.includes(recipeIngredient)
        );

        const percentage =
          recipe.ingredients.length > 0
            ? Math.round(
                (matched.length / recipe.ingredients.length) * 100
              )
            : 0;

        return {
          recipe,
          matched,
          missing,
          percentage,
        };
      })
      .filter((item) => item.matched.length > 0)
      .sort(
        (a, b) =>
          b.percentage - a.percentage ||
          b.matched.length - a.matched.length
      );
  }, [allRecipes, ingredients]);

  const openRecipe = (id: number) => {
    router.push(`/(app)/recipe/${id}` as any);
  };

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      keyboardShouldPersistTaps="handled"
      showsVerticalScrollIndicator={false}
    >
      <TouchableOpacity
        style={styles.backButton}
        onPress={() => router.back()}
      >
        <MaterialCommunityIcons
          name="arrow-left"
          size={21}
          color={COLORS.primary}
        />
        <Text style={styles.backText}>Back</Text>
      </TouchableOpacity>

      <View style={styles.headingArea}>
        <View style={styles.headingIcon}>
          <MaterialCommunityIcons
            name="fridge-outline"
            size={30}
            color={COLORS.primary}
          />
        </View>

        <Text style={styles.heading}>Smart Pantry Match</Text>

        <Text style={styles.subtitle}>
          What's in your kitchen today? Find recipes you can make
          with the ingredients you already have.
        </Text>
      </View>

      <View style={styles.inputCard}>
        <Text style={styles.label}>YOUR AVAILABLE INGREDIENTS</Text>

        <View style={styles.inputRow}>
          <TextInput
            style={styles.input}
            placeholder="e.g. eggs, chicken, garlic"
            placeholderTextColor="#9A9A90"
            value={input}
            onChangeText={setInput}
            onSubmitEditing={() => addIngredients(input)}
            returnKeyType="done"
          />

          <TouchableOpacity
            style={styles.addButton}
            onPress={() => addIngredients(input)}
          >
            <MaterialCommunityIcons
              name="plus"
              size={23}
              color={COLORS.white}
            />
          </TouchableOpacity>
        </View>

        <Text style={styles.helperText}>
          Separate multiple ingredients with commas.
        </Text>

        <Text style={styles.label}>QUICK ADD</Text>

        <View style={styles.suggestions}>
          {SUGGESTIONS.map((item) => {
            const selected = ingredients.some(
              (saved) => normalize(saved) === normalize(item)
            );

            return (
              <TouchableOpacity
                key={item}
                disabled={selected}
                onPress={() => addIngredients(item)}
                style={[
                  styles.suggestionChip,
                  selected && styles.selectedSuggestion,
                ]}
              >
                <Text
                  style={[
                    styles.suggestionText,
                    selected && styles.selectedSuggestionText,
                  ]}
                >
                  {selected ? '✓ ' : '+ '}
                  {item}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {ingredients.length > 0 && (
          <>
            <View style={styles.ingredientHeader}>
              <Text style={styles.label}>
                MY INGREDIENTS ({ingredients.length})
              </Text>

              <TouchableOpacity onPress={() => setIngredients([])}>
                <Text style={styles.clearText}>Clear all</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.ingredientList}>
              {ingredients.map((item) => (
                <TouchableOpacity
                  key={item}
                  style={styles.ingredientChip}
                  onPress={() => removeIngredient(item)}
                >
                  <Text style={styles.ingredientText}>{item}</Text>
                  <MaterialCommunityIcons
                    name="close-circle"
                    size={16}
                    color={COLORS.primary}
                  />
                </TouchableOpacity>
              ))}
            </View>
          </>
        )}
      </View>

      <View style={styles.resultsHeading}>
        <View>
          <Text style={styles.resultsTitle}>Recipes for your pantry</Text>
          <Text style={styles.resultsSubtitle}>
            {ingredients.length === 0
              ? 'Add ingredients to discover recipes.'
              : `${matchingRecipes.length} matching recipes found`}
          </Text>
        </View>

        <MaterialCommunityIcons
          name="silverware-fork-knife"
          size={25}
          color={COLORS.primary}
        />
      </View>

      {loading ? (
        <View style={styles.emptyState}>
          <ActivityIndicator size="large" color={COLORS.primary} />
          <Text style={styles.emptyText}>Finding recipes...</Text>
        </View>
      ) : error ? (
        <View style={styles.emptyState}>
          <Text style={styles.emptyTitle}>Unable to find recipes</Text>
          <Text style={styles.emptyText}>{error}</Text>
        </View>
      ) : ingredients.length === 0 ? (
        <View style={styles.emptyState}>
          <Text style={styles.emptyEmoji}>🥕</Text>
          <Text style={styles.emptyTitle}>Start with your ingredients</Text>
          <Text style={styles.emptyText}>
            Add at least one ingredient to see what you can cook.
          </Text>
        </View>
      ) : matchingRecipes.length === 0 ? (
        <View style={styles.emptyState}>
          <Text style={styles.emptyEmoji}>🍽️</Text>
          <Text style={styles.emptyTitle}>No matches yet</Text>
          <Text style={styles.emptyText}>
            Try adding more ingredients to discover recipes.
          </Text>
        </View>
      ) : (
        matchingRecipes.map((item) => (
          <TouchableOpacity
            key={item.recipe.id}
            activeOpacity={0.85}
            style={styles.recipeCard}
            onPress={() => openRecipe(item.recipe.id)}
          >
            <Image
              source={{ uri: item.recipe.image }}
              style={styles.recipeImage}
            />

            <View style={styles.recipeInfo}>
              <View style={styles.matchRow}>
                <Text style={styles.matchPercentage}>
                  {item.percentage}% match
                </Text>
                <Text style={styles.matchCount}>
                  {item.matched.length}/{item.recipe.ingredients.length} items
                </Text>
              </View>

              <Text style={styles.recipeName} numberOfLines={2}>
                {item.recipe.name}
              </Text>

              <Text style={styles.recipeMeta}>
                {item.recipe.cuisine} ·{' '}
                {item.recipe.prepTimeMinutes +
                  item.recipe.cookTimeMinutes} min
              </Text>

              <Text style={styles.missingText} numberOfLines={2}>
                {item.missing.length === 0
                  ? 'You have all the listed ingredients!'
                  : `Still need: ${item.missing.join(', ')}`}
              </Text>
            </View>

            <MaterialCommunityIcons
              name="chevron-right"
              size={23}
              color={COLORS.muted}
            />
          </TouchableOpacity>
        ))
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  content: {
    padding: 20,
    paddingBottom: 40,
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    marginTop: 12,
    marginBottom: 20,
  },
  backText: {
    color: COLORS.primary,
    fontWeight: '700',
    marginLeft: 5,
  },
  headingArea: {
    alignItems: 'center',
    marginBottom: 24,
  },
  headingIcon: {
    width: 62,
    height: 62,
    borderRadius: 20,
    backgroundColor: COLORS.lightGreen,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 13,
  },
  heading: {
    fontSize: 25,
    fontWeight: '800',
    color: COLORS.text,
    textAlign: 'center',
  },
  subtitle: {
    color: COLORS.muted,
    fontSize: 13,
    lineHeight: 20,
    textAlign: 'center',
    marginTop: 8,
    maxWidth: 380,
  },
  inputCard: {
    backgroundColor: COLORS.white,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: 17,
  },
  label: {
    color: COLORS.muted,
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1,
    marginBottom: 10,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  input: {
    flex: 1,
    height: 48,
    backgroundColor: '#F8F8F2',
    borderRadius: 11,
    paddingHorizontal: 13,
    color: COLORS.text,
    fontSize: 13,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  addButton: {
    width: 48,
    height: 48,
    borderRadius: 11,
    backgroundColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 9,
  },
  helperText: {
    color: COLORS.muted,
    fontSize: 11,
    marginTop: 8,
    marginBottom: 20,
  },
  suggestions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 15,
  },
  suggestionChip: {
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: '#FAFAF5',
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  selectedSuggestion: {
    backgroundColor: COLORS.lightGreen,
    borderColor: COLORS.primary,
  },
  suggestionText: {
    fontSize: 12,
    color: COLORS.text,
    fontWeight: '600',
  },
  selectedSuggestionText: {
    color: COLORS.primary,
  },
  ingredientHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 8,
  },
  clearText: {
    color: COLORS.orange,
    fontSize: 12,
    fontWeight: '700',
  },
  ingredientList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  ingredientChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.lightGreen,
    borderRadius: 20,
    paddingHorizontal: 11,
    paddingVertical: 8,
    gap: 6,
  },
  ingredientText: {
    color: COLORS.primary,
    fontSize: 12,
    fontWeight: '700',
  },
  resultsHeading: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 28,
    marginBottom: 15,
  },
  resultsTitle: {
    color: COLORS.text,
    fontSize: 18,
    fontWeight: '800',
  },
  resultsSubtitle: {
    color: COLORS.muted,
    fontSize: 12,
    marginTop: 4,
  },
  emptyState: {
    alignItems: 'center',
    backgroundColor: COLORS.white,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: 28,
    marginTop: 5,
  },
  emptyEmoji: {
    fontSize: 38,
    marginBottom: 10,
  },
  emptyTitle: {
    color: COLORS.text,
    fontSize: 16,
    fontWeight: '800',
    textAlign: 'center',
  },
  emptyText: {
    color: COLORS.muted,
    fontSize: 12,
    textAlign: 'center',
    marginTop: 7,
    lineHeight: 18,
  },
  recipeCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.white,
    borderRadius: 15,
    padding: 10,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  recipeImage: {
    width: 92,
    height: 100,
    borderRadius: 11,
    backgroundColor: COLORS.border,
  },
  recipeInfo: {
    flex: 1,
    paddingHorizontal: 11,
  },
  matchRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  matchPercentage: {
    color: COLORS.primary,
    fontSize: 11,
    fontWeight: '800',
  },
  matchCount: {
    color: COLORS.muted,
    fontSize: 10,
  },
  recipeName: {
    color: COLORS.text,
    fontSize: 14,
    fontWeight: '800',
  },
  recipeMeta: {
    color: COLORS.muted,
    fontSize: 11,
    marginTop: 5,
  },
  missingText: {
    color: COLORS.orange,
    fontSize: 10,
    marginTop: 7,
    lineHeight: 15,
  },
});
