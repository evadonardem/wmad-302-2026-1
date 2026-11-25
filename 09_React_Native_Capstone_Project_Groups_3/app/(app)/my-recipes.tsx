/**
 * My Recipes Screen - Cookbook
 * Route: /my-recipes  (opened from Profile)
 *
 * Lists the DummyJSON recipes whose userId matches the logged-in user.
 */
import React, { useCallback, useEffect, useState } from 'react';
import { FlatList, StyleSheet, View } from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { ActivityIndicator, Button, Text, useTheme } from 'react-native-paper';
import { useAuth } from '@/context/AuthContext';
import { recipeApi } from '@/services/recipeApi';
import { Recipe } from '@/types/recipe';
import { RecipeCard, EmptyState } from '@/components/CommonComponents';
import { fontFamily } from '@/constants/theme';

export default function MyRecipesScreen() {
  const router = useRouter();
  const theme = useTheme();
  const { user } = useAuth();

  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadRecipes = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    setError(null);
    try {
      // limit=0 returns every recipe (there are only ~50), then keep the user's own
      const data = await recipeApi.getRecipes({ limit: 0 });
      setRecipes(data.recipes.filter((recipe) => recipe.userId === user.id));
    } catch {
      setError('Could not load your recipes. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    loadRecipes();
  }, [loadRecipes]);

  const header = <Stack.Screen options={{ headerShown: true, title: 'My Recipes' }} />;

  if (loading) {
    return (
      <View style={[styles.center, { backgroundColor: theme.colors.background }]}>
        {header}
        <ActivityIndicator size="large" />
      </View>
    );
  }

  if (error) {
    return (
      <View style={[styles.center, { backgroundColor: theme.colors.background }]}>
        {header}
        <Text style={styles.errorText}>{error}</Text>
        <Button mode="contained" onPress={loadRecipes}>
          Try Again
        </Button>
      </View>
    );
  }

  return (
    <View style={[styles.flex, { backgroundColor: theme.colors.background }]}>
      {header}
      <FlatList
        data={recipes}
        keyExtractor={(item) => item.id.toString()}
        contentContainerStyle={recipes.length === 0 ? styles.emptyContent : styles.listContent}
        ListHeaderComponent={
          recipes.length > 0 ? (
            <Text variant="titleMedium" style={styles.count}>
              {recipes.length} recipe{recipes.length === 1 ? '' : 's'}
            </Text>
          ) : null
        }
        renderItem={({ item }) => (
          <RecipeCard recipe={item} onPress={() => router.push(`/recipe/${item.id}`)} />
        )}
        ListEmptyComponent={
          <EmptyState
            icon="book-edit"
            title="No recipes yet"
            message="Recipes you have created will show up here. Browse recipes for inspiration in the meantime."
            actionLabel="Browse Recipes"
            onAction={() => router.push('/search')}
          />
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  errorText: {
    marginBottom: 16,
    textAlign: 'center',
  },
  listContent: {
    padding: 16,
  },
  emptyContent: {
    flexGrow: 1,
  },
  count: {
    marginBottom: 12,
    fontFamily: fontFamily.display,
  },
});
