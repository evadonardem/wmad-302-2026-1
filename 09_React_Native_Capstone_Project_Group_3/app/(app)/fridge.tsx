/**
 * What's in my fridge? - Cookbook
 * Route: /fridge
 *
 * Pick the ingredients you have; recipes are ranked by how many of their
 * ingredients you already have, with the missing ones listed.
 */
import React, { useMemo, useState } from 'react';
import { FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { Button, Searchbar } from 'react-native-paper';
import { useAllRecipes } from '@/hooks/useRecipes';
import { RecipeTile } from '@/components/RecipeTile';
import { EmptyState, Skeleton } from '@/components/CommonComponents';
import { Recipe } from '@/types/recipe';
import { fontFamily, makeStyles, radius, spacing } from '@/constants/theme';
import { displayName, ingredientKey } from '@/utils/ingredients';

interface Match {
  recipe: Recipe;
  have: number;
  total: number;
  missing: string[];
}

/** "chicken" matches "chicken breasts", "olive oil" matches "extra virgin olive oil" */
const matches = (recipeKey: string, picked: string) => recipeKey.includes(picked) || picked.includes(recipeKey);

export default function FridgeScreen() {
  const styles = useStyles();
  const router = useRouter();
  const { recipes, loading } = useAllRecipes();
  const [selected, setSelected] = useState<string[]>([]);
  const [query, setQuery] = useState('');

  // Every ingredient name used in the recipes, most common first
  const allIngredients = useMemo(() => {
    const counts = new Map<string, number>();
    recipes.forEach((recipe) =>
      new Set<string>(recipe.ingredients.map(ingredientKey)).forEach((key) => {
        if (key && key.length <= 28) counts.set(key, (counts.get(key) ?? 0) + 1);
      })
    );
    return Array.from(counts.entries())
      .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
      .map(([key]) => key);
  }, [recipes]);

  const visibleIngredients = useMemo(() => {
    const q = query.trim().toLowerCase();
    const list = allIngredients.filter((key) => !selected.includes(key) && (!q || key.includes(q)));
    return q ? list : list.slice(0, 40);
  }, [allIngredients, selected, query]);

  const results = useMemo<Match[]>(() => {
    if (selected.length === 0) return [];
    return recipes
      .map((recipe) => {
        const keys = recipe.ingredients.map(ingredientKey).filter(Boolean);
        const haveKeys = keys.filter((key) => selected.some((picked) => matches(key, picked)));
        return {
          recipe,
          have: haveKeys.length,
          total: keys.length,
          missing: keys.filter((key) => !haveKeys.includes(key)),
        };
      })
      .filter((m) => m.have > 0)
      .sort((a, b) => b.have / b.total - a.have / a.total || b.have - a.have);
  }, [recipes, selected]);

  const toggle = (key: string) =>
    setSelected((prev) => (prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key]));

  const header = (
    <View>
      <Text style={styles.intro}>Pick what you have and we'll find recipes you can make.</Text>
      <Searchbar
        placeholder="Find an ingredient"
        value={query}
        onChangeText={setQuery}
        style={styles.search}
      />

      {selected.length > 0 && (
        <View style={styles.selectedBox}>
          <View style={styles.selectedHeader}>
            <Text style={styles.label}>In your kitchen ({selected.length})</Text>
            <Button compact onPress={() => setSelected([])}>
              Clear
            </Button>
          </View>
          <View style={styles.chips}>
            {selected.map((key) => (
              <Pressable key={key} style={[styles.chip, styles.chipSelected]} onPress={() => toggle(key)}>
                <Text style={[styles.chipText, styles.chipTextSelected]}>✓ {displayName(key)}</Text>
              </Pressable>
            ))}
          </View>
        </View>
      )}

      <View style={styles.chips}>
        {loading
            ? Array.from({ length: 10 }, (_, i) => <Skeleton key={i} width={90} height={34} borderRadius={17} />)
            : visibleIngredients.map((key) => (
                <Pressable key={key} style={styles.chip} onPress={() => toggle(key)}>
                  <Text style={styles.chipText}>+ {displayName(key)}</Text>
                </Pressable>
              ))}
      </View>

      {selected.length > 0 && (
        <Text style={styles.resultsTitle}>
          {results.length} recipe{results.length === 1 ? '' : 's'} you can make
        </Text>
      )}
    </View>
  );

  return (
    <View style={styles.screen}>
      <Stack.Screen options={{ headerShown: true, title: "What's in my fridge?" }} />
      <FlatList
        data={results}
        keyExtractor={(item) => item.recipe.id.toString()}
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
        ListHeaderComponent={header}
        renderItem={({ item }) => (
          <View style={styles.result}>
            <RecipeTile
              recipe={item.recipe}
              size="wide"
              badge={`You have ${item.have} of ${item.total}`}
              onPress={() => router.push(`/recipe/${item.recipe.id}`)}
            />
            {item.missing.length > 0 && (
              <Text style={styles.missing} numberOfLines={2}>
                Missing: {item.missing.slice(0, 5).map(displayName).join(', ')}
                {item.missing.length > 5 ? ` +${item.missing.length - 5} more` : ''}
              </Text>
            )}
          </View>
        )}
        ListEmptyComponent={
          selected.length > 0 ? (
            <EmptyState emoji="🤔" title="No matches yet" message="Try adding a few more ingredients." />
          ) : (
            <EmptyState emoji="🥕" title="Open the fridge" message="Tap ingredients above to see what you can cook." />
          )
        }
      />
    </View>
  );
}

const useStyles = makeStyles((c) =>
  StyleSheet.create({
    screen: {
      flex: 1,
      backgroundColor: c.background,
    },
    content: {
      padding: spacing.md,
      paddingBottom: 40,
    },
    intro: {
      fontFamily: fontFamily.regular,
      fontSize: 15,
      color: c.muted,
      marginBottom: spacing.md,
    },
    search: {
      marginBottom: spacing.md,
    },
    selectedBox: {
      padding: spacing.md,
      marginBottom: spacing.md,
      borderRadius: radius.lg,
      backgroundColor: c.primaryContainer,
    },
    selectedHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginBottom: 6,
    },
    label: {
      fontFamily: fontFamily.semibold,
      fontSize: 14,
      color: c.onPrimaryContainer,
    },
    chips: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 8,
    },
    chip: {
      paddingHorizontal: 14,
      paddingVertical: 8,
      borderRadius: radius.pill,
      backgroundColor: c.surface,
      borderWidth: 1,
      borderColor: c.border,
    },
    chipSelected: {
      backgroundColor: c.primary,
      borderColor: c.primary,
    },
    chipText: {
      fontFamily: fontFamily.medium,
      fontSize: 13,
      color: c.onSurface,
    },
    chipTextSelected: {
      color: c.onPrimary,
    },
    resultsTitle: {
      fontFamily: fontFamily.display,
      fontSize: 21,
      color: c.onSurface,
      marginTop: spacing.lg,
      marginBottom: spacing.md,
    },
    result: {
      marginBottom: spacing.md,
    },
    missing: {
      fontFamily: fontFamily.regular,
      fontSize: 13,
      color: c.muted,
      marginTop: 6,
      marginHorizontal: 4,
    },
  })
);
