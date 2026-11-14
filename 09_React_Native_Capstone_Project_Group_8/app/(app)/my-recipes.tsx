
/**
 * My Recipes Screen - Cookbook
 * Displays recipes associated with the logged-in user.
 * Supports Light Mode and Dark Mode.
 */

import React, { useCallback, useState } from 'react';

import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  StyleSheet,
} from 'react-native';

import { useFocusEffect, useRouter } from 'expo-router';

import {
  Button,
  Card,
  Chip,
  useTheme,
} from 'react-native-paper';

import type { MD3Theme } from 'react-native-paper';

import { useAuth } from '@/context/AuthContext';
import { recipeApi } from '@/services/recipeApi';
import type { Recipe } from '@/types/recipe';

export default function MyRecipesScreen() {
  const router = useRouter();
  const { user } = useAuth();

  const theme = useTheme<MD3Theme>();
  const colors = theme.colors;
  const styles = createStyles(colors);

  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const loadRecipes = useCallback(async () => {
    if (!user) {
      setRecipes([]);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError('');

      const response = await recipeApi.getRecipes({
        limit: 100,
      });

      const userRecipes = response.recipes.filter(
        (recipe) => recipe.userId === user.id
      );

      setRecipes(userRecipes);
    } catch (err) {
      console.error('Failed to load user recipes:', err);
      setError('Unable to load your recipes. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [user]);

  useFocusEffect(
    useCallback(() => {
      void loadRecipes();
    }, [loadRecipes])
  );

  const openRecipe = (recipeId: number) => {
    router.push(`/(app)/recipe/${recipeId}`);
  };

  const renderRecipe = ({ item }: { item: Recipe }) => (
    <TouchableOpacity
      activeOpacity={0.85}
      onPress={() => openRecipe(item.id)}
    >
      <Card style={styles.card} elevation={2}>
        <Image
          source={{ uri: item.image }}
          style={styles.image}
          resizeMode="cover"
        />

        <View style={styles.cardContent}>
          <Text style={styles.recipeName} numberOfLines={2}>
            {item.name}
          </Text>

          <Text style={styles.cuisine}>
            {item.cuisine}
          </Text>

          <View style={styles.chipContainer}>
            <Chip
              compact
              style={styles.difficultyChip}
              textStyle={{
                color: colors.onSecondaryContainer,
              }}
            >
              {item.difficulty}
            </Chip>

            <Chip
              compact
              style={styles.ratingChip}
              textStyle={{
                color: colors.onTertiaryContainer,
              }}
            >
              ⭐ {item.rating}
            </Chip>
          </View>

          <Text style={styles.details}>
            ⏱️ {item.prepTimeMinutes + item.cookTimeMinutes} min
            {'  ·  '}
            👥 {item.servings} servings
          </Text>
        </View>
      </Card>
    </TouchableOpacity>
  );

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator
          size="large"
          color={colors.primary}
        />

        <Text style={styles.message}>
          Loading your recipes...
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.heading}>
          My Recipes
        </Text>

        <Text style={styles.subtitle}>
          Recipes associated with your account
        </Text>
      </View>

      {error ? (
        <View style={styles.center}>
          <Text style={styles.errorText}>
            {error}
          </Text>

          <Button
            mode="contained"
            onPress={() => void loadRecipes()}
            buttonColor={colors.primary}
            textColor={colors.onPrimary}
          >
            Try Again
          </Button>
        </View>
      ) : recipes.length === 0 ? (
        <View style={styles.emptyState}>
          <Text style={styles.emptyIcon}>
            🍳
          </Text>

          <Text style={styles.emptyTitle}>
            No Recipes Found
          </Text>

          <Text style={styles.emptyText}>
            There are currently no recipes associated with your account.
          </Text>

          <Button
            mode="contained"
            onPress={() =>
              router.push('/(app)/(tabs)/search')
            }
            buttonColor={colors.primary}
            textColor={colors.onPrimary}
            style={styles.button}
          >
            Explore Recipes
          </Button>
        </View>
      ) : (
        <FlatList
          data={recipes}
          renderItem={renderRecipe}
          keyExtractor={(item) => item.id.toString()}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
          ListHeaderComponent={
            <Text style={styles.count}>
              {recipes.length} recipe(s) found
            </Text>
          }
        />
      )}
    </View>
  );
}

const createStyles = (colors: MD3Theme['colors']) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },

    header: {
      paddingHorizontal: 20,
      paddingTop: 24,
      paddingBottom: 12,
    },

    heading: {
      fontSize: 26,
      fontWeight: 'bold',
      color: colors.onSurface,
    },

    subtitle: {
      fontSize: 14,
      color: colors.onSurfaceVariant,
      marginTop: 5,
    },

    count: {
      fontSize: 14,
      color: colors.onSurfaceVariant,
      marginBottom: 12,
    },

    list: {
      paddingHorizontal: 16,
      paddingBottom: 30,
    },

    card: {
      marginBottom: 16,
      backgroundColor: colors.surface,
      borderRadius: 12,
      overflow: 'hidden',
    },

    image: {
      width: '100%',
      height: 180,
    },

    cardContent: {
      padding: 14,
    },

    recipeName: {
      fontSize: 18,
      fontWeight: 'bold',
      color: colors.onSurface,
    },

    cuisine: {
      fontSize: 13,
      color: colors.onSurfaceVariant,
      marginTop: 5,
    },

    chipContainer: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      marginTop: 10,
      gap: 8,
    },

    difficultyChip: {
      backgroundColor: colors.secondaryContainer,
    },

    ratingChip: {
      backgroundColor: colors.tertiaryContainer,
    },

    details: {
      fontSize: 13,
      color: colors.onSurfaceVariant,
      marginTop: 10,
    },

    center: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      padding: 24,
      backgroundColor: colors.background,
    },

    message: {
      marginTop: 12,
      color: colors.onSurfaceVariant,
    },

    errorText: {
      color: colors.error,
      textAlign: 'center',
      marginBottom: 16,
    },

    emptyState: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      paddingHorizontal: 32,
    },

    emptyIcon: {
      fontSize: 64,
      marginBottom: 16,
    },

    emptyTitle: {
      fontSize: 21,
      fontWeight: 'bold',
      color: colors.onSurface,
    },

    emptyText: {
      fontSize: 14,
      color: colors.onSurfaceVariant,
      textAlign: 'center',
      lineHeight: 21,
      marginTop: 10,
    },

    button: {
      marginTop: 20,
    },
  });
