
/**
 * Favorites Screen - Cookbook
 * Loads and manages favorite recipes using AsyncStorage.
 */

import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Image,
} from 'react-native';

import { useRouter, useFocusEffect } from 'expo-router';
import { Card, Title, Chip, Button, IconButton } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';

import { favoritesStorage } from '@/utils/storage';
import { styles } from './favoritesStyles';

interface Recipe {
  id: number;
  name: string;
  image: string;
  difficulty: string;
  cuisine: string;
  prepTimeMinutes: number;
  cookTimeMinutes: number;
  servings: number;
  rating: number;
}

export default function FavoritesScreen() {
  const router = useRouter();

  const [favorites, setFavorites] = useState<Recipe[]>([]);
  const [loading, setLoading] = useState(true);

  // Load favorite recipes from AsyncStorage.
  const loadFavorites = useCallback(async () => {
    try {
      setLoading(true);

      // Get saved favorite recipe IDs.
      const favoriteIds = await favoritesStorage.getIds();

      // Display empty state if there are no favorites.
      if (favoriteIds.length === 0) {
        setFavorites([]);
        return;
      }

      // Fetch each favorite recipe from DummyJSON.
      const recipeResults = await Promise.all(
        favoriteIds.map(async (id) => {
          try {
            const response = await fetch(
              `https://dummyjson.com/recipes/${id}`
            );

            if (!response.ok) {
              return null;
            }

            const recipe: Recipe = await response.json();

            return recipe;
          } catch (error) {
            console.error(`Failed to load recipe ${id}:`, error);
            return null;
          }
        })
      );

      // Remove recipes that failed to load.
      const loadedRecipes = recipeResults.filter(
        (recipe): recipe is Recipe => recipe !== null
      );

      setFavorites(loadedRecipes);
    } catch (error) {
      console.error('Failed to load favorites:', error);

      Alert.alert(
        'Error',
        'Unable to load your favorite recipes. Please try again.'
      );
    } finally {
      setLoading(false);
    }
  }, []);

  // Reload favorites whenever this tab becomes active.
  useFocusEffect(
    useCallback(() => {
      loadFavorites();
    }, [loadFavorites])
  );

  // Remove a recipe from favorites.
  const removeFavorite = (recipeId: number) => {
    Alert.alert(
      'Remove from Favorites',
      'Are you sure you want to remove this recipe?',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: async () => {
            try {
              // Remove the recipe ID from AsyncStorage.
              await favoritesStorage.removeId(recipeId);

              // Update the Favorites screen.
              setFavorites((previousFavorites) =>
                previousFavorites.filter(
                  (recipe) => recipe.id !== recipeId
                )
              );
            } catch (error) {
              console.error('Failed to remove favorite:', error);

              Alert.alert(
                'Error',
                'Unable to remove this recipe from favorites.'
              );
            }
          },
        },
      ]
    );
  };

  // Display each favorite recipe.
  const renderFavorite = ({ item }: { item: Recipe }) => (
    <TouchableOpacity
      style={styles.favoriteCard}
      onPress={() => router.push(`/(app)/recipe/${item.id}`)}
      activeOpacity={0.8}
    >
      <Card style={styles.card} elevation={1}>
        <View style={styles.cardContent}>
          <Image
            source={{ uri: item.image }}
            style={styles.recipeImage}
            resizeMode="cover"
          />

          <View style={styles.info}>
            <Title style={styles.title} numberOfLines={1}>
              {item.name}
            </Title>

            <View style={styles.meta}>
              <Chip style={styles.difficultyChip}>
                {item.difficulty}
              </Chip>

              <Chip style={styles.cuisineChip}>
                {item.cuisine}
              </Chip>
            </View>

            <Text style={styles.details}>
              ⏱️ {item.prepTimeMinutes + item.cookTimeMinutes} min
              {' · '}👥 {item.servings}
              {' · '}⭐ {item.rating}
            </Text>
          </View>

          <IconButton
            icon="heart"
            size={24}
            iconColor="#C62828"
            onPress={() => removeFavorite(item.id)}
            accessibilityLabel="Remove from favorites"
          />
        </View>
      </Card>
    </TouchableOpacity>
  );

  // Loading screen.
  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#E85D04" />

        <Text style={styles.loadingText}>
          Loading favorites...
        </Text>
      </View>
    );
  }

  // Main Favorites screen.
  return (
    <View style={styles.container}>
      {favorites.length === 0 ? (
        <View style={styles.emptyState}>
          <MaterialCommunityIcons
            name="heart-outline"
            size={80}
            color="#BCAAA4"
          />

          <Text style={styles.emptyTitle}>
            No Favorites Yet
          </Text>

          <Text style={styles.emptyText}>
            Recipes you love will appear here
          </Text>

          <Button
            mode="contained"
            onPress={() => router.push('/(app)/(tabs)/search')}
            style={styles.browseButton}
            contentStyle={styles.buttonContent}
          >
            <Text style={styles.buttonText}>
              Browse Recipes
            </Text>
          </Button>
        </View>
      ) : (
        <FlatList
          data={favorites}
          renderItem={renderFavorite}
          keyExtractor={(item) => item.id.toString()}
          contentContainerStyle={styles.listContent}
          ItemSeparatorComponent={() => (
            <View style={styles.separator} />
          )}
          ListHeaderComponent={
            <View style={styles.header}>
              <Title style={styles.headerTitle}>
                Your Favorites ({favorites.length})
              </Title>
            </View>
          }
        />
      )}
    </View>
  );
}
