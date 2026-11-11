
/**
 * Favorites Screen - Cookbook
 * Green and white design.
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
import {
  Card,
  Title,
  Chip,
  Button,
  IconButton,
} from 'react-native-paper';
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

      const favoriteIds = await favoritesStorage.getIds();

      if (favoriteIds.length === 0) {
        setFavorites([]);
        return;
      }

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
              await favoritesStorage.removeId(recipeId);

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

  // Display an individual favorite recipe.
  const renderFavorite = ({ item }: { item: Recipe }) => (
    <Card style={styles.card} elevation={3}>
      <View style={styles.cardContent}>
        <TouchableOpacity
          style={styles.recipeContent}
          onPress={() => router.push(`/(app)/recipe/${item.id}`)}
          activeOpacity={0.8}
        >
          <Image
            source={{ uri: item.image }}
            style={styles.recipeImage}
            resizeMode="cover"
          />

          <View style={styles.info}>
            <Title style={styles.title} numberOfLines={2}>
              {item.name}
            </Title>

            <View style={styles.meta}>
              <Chip
                compact
                style={styles.difficultyChip}
                textStyle={styles.chipText}
              >
                {item.difficulty}
              </Chip>

              <Chip
                compact
                style={styles.cuisineChip}
                textStyle={styles.chipText}
              >
                {item.cuisine}
              </Chip>
            </View>

            <View style={styles.detailsRow}>
              <MaterialCommunityIcons
                name="clock-outline"
                size={15}
                color="#43A52F"
              />

              <Text style={styles.details}>
                {item.prepTimeMinutes + item.cookTimeMinutes} min
              </Text>

              <MaterialCommunityIcons
                name="account-group-outline"
                size={15}
                color="#43A52F"
              />

              <Text style={styles.details}>
                {item.servings}
              </Text>
            </View>

            <View style={styles.ratingRow}>
              <MaterialCommunityIcons
                name="star"
                size={16}
                color="#F9A825"
              />

              <Text style={styles.ratingText}>
                {item.rating.toFixed(1)}
              </Text>
            </View>
          </View>
        </TouchableOpacity>

        <View style={styles.favoriteAction}>
          <IconButton
            icon="heart"
            size={25}
            iconColor="#E53935"
            onPress={() => removeFavorite(item.id)}
            accessibilityLabel="Remove from favorites"
          />
        </View>
      </View>
    </Card>
  );

  // Loading screen.
  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#FFFFFF" />

        <Text style={styles.loadingText}>
          Loading your favorites...
        </Text>
      </View>
    );
  }

  // Empty Favorites screen.
  if (favorites.length === 0) {
    return (
      <View style={styles.container}>
        <View style={styles.emptyState}>
          <View style={styles.emptyIconContainer}>
            <MaterialCommunityIcons
              name="heart-outline"
              size={64}
              color="#43A52F"
            />
          </View>

          <Text style={styles.emptyTitle}>
            No Favorites Yet
          </Text>

          <Text style={styles.emptyText}>
            Save the recipes you love and they will appear here.
          </Text>

          <Button
            mode="contained"
            onPress={() => router.push('/(app)/(tabs)/search')}
            style={styles.browseButton}
            contentStyle={styles.buttonContent}
            buttonColor="#43A52F"
            textColor="#FFFFFF"
          >
            Browse Recipes
          </Button>
        </View>
      </View>
    );
  }

  // Main Favorites screen.
  return (
    <View style={styles.container}>
      <FlatList
        data={favorites}
        renderItem={renderFavorite}
        keyExtractor={(item) => item.id.toString()}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        ItemSeparatorComponent={() => (
          <View style={styles.separator} />
        )}
        ListHeaderComponent={
          <View style={styles.header}>
            <Text style={styles.headerOverline}>
              YOUR COOKBOOK
            </Text>

            <Title style={styles.headerTitle}>
              My Favorites
            </Title>

            <Text style={styles.headerSubtitle}>
              Your favorite recipes, all in one place.
            </Text>

            <View style={styles.countContainer}>
              <MaterialCommunityIcons
                name="heart"
                size={18}
                color="#FFFFFF"
              />

              <Text style={styles.countText}>
                {favorites.length}{' '}
                {favorites.length === 1 ? 'Recipe' : 'Recipes'} Saved
              </Text>
            </View>
          </View>
        }
      />
    </View>
  );
}
