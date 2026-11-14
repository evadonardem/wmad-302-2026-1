/**
 * Favorites Screen - Cookbook
 * Loads and removes favorite recipes using AsyncStorage.
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
  Alert,
  RefreshControl,
} from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Card, Chip, IconButton, Button } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';

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

const COLORS = {
  background: '#FFFDF7',
  primary: '#24543D',
  text: '#26372C',
  muted: '#858B80',
  white: '#FFFFFF',
  border: '#EEECE4',
  lightGreen: '#EAF2E9',
  lightGold: '#F5ECD9',
  red: '#D84343',
};

const STORAGE_KEY = 'favoriteRecipeIds';

export default function FavoritesScreen() {
  const router = useRouter();

  const [favorites, setFavorites] = useState<Recipe[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // LOAD FAVORITE RECIPES FROM ASYNC STORAGE
  const loadFavorites = useCallback(async () => {
    try {
      const savedIds = await AsyncStorage.getItem(STORAGE_KEY);
      const ids: number[] = savedIds ? JSON.parse(savedIds) : [];

      if (ids.length === 0) {
        setFavorites([]);
        return;
      }

      const results = await Promise.all(
        ids.map(async (id) => {
          try {
            const response = await fetch(
              `https://dummyjson.com/recipes/${id}`
            );

            if (!response.ok) {
              return null;
            }

            return (await response.json()) as Recipe;
          } catch (error) {
            console.error(`Failed to fetch recipe ${id}:`, error);
            return null;
          }
        })
      );

      const validRecipes = results.filter(
        (recipe): recipe is Recipe => recipe !== null
      );

      setFavorites(validRecipes);
    } catch (error) {
      console.error('Failed to load favorites:', error);
      Alert.alert(
        'Error',
        'Unable to load your favorite recipes.'
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  // REFRESH EVERY TIME FAVORITES TAB IS OPENED
  useFocusEffect(
    useCallback(() => {
      loadFavorites();
    }, [loadFavorites])
  );

  // REMOVE FAVORITE
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
              const savedIds = await AsyncStorage.getItem(STORAGE_KEY);
              const ids: number[] = savedIds
                ? JSON.parse(savedIds)
                : [];

              const updatedIds = ids.filter(
                (id) => id !== recipeId
              );

              await AsyncStorage.setItem(
                STORAGE_KEY,
                JSON.stringify(updatedIds)
              );

              setFavorites((previous) =>
                previous.filter(
                  (recipe) => recipe.id !== recipeId
                )
              );
            } catch (error) {
              console.error('Failed to remove favorite:', error);

              Alert.alert(
                'Error',
                'Could not remove this recipe from Favorites.'
              );
            }
          },
        },
      ]
    );
  };

  // OPEN RECIPE DETAILS
  const openRecipe = (id: number) => {
    router.push(`/(app)/recipe/${id}` as any);
  };

  // FAVORITE RECIPE CARD
  const renderFavorite = ({ item }: { item: Recipe }) => (
    <TouchableOpacity
      activeOpacity={0.85}
      style={styles.favoriteCard}
      onPress={() => openRecipe(item.id)}
    >
      <Card style={styles.card} mode="elevated">
        <View style={styles.cardContent}>
          <Image
            source={{ uri: item.image }}
            style={styles.recipeImage}
            resizeMode="cover"
          />

          <View style={styles.info}>
            <Text style={styles.title} numberOfLines={2}>
              {item.name}
            </Text>

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

            <Text style={styles.details}>
              ⏱ {item.prepTimeMinutes + item.cookTimeMinutes} min
              {'  '}·{'  '}
              👥 {item.servings}
              {'  '}·{'  '}
              ⭐ {item.rating}
            </Text>
          </View>

          <TouchableOpacity
            activeOpacity={0.7}
            style={styles.removeButton}
            onPress={(event) => {
              event.stopPropagation();
              removeFavorite(item.id);
            }}
            accessibilityRole="button"
            accessibilityLabel="Remove from favorites"
          >
            <MaterialCommunityIcons
              name="heart"
              size={25}
              color={COLORS.red}
            />
          </TouchableOpacity>
        </View>
      </Card>
    </TouchableOpacity>
  );

  // LOADING SCREEN
  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator
          size="large"
          color={COLORS.primary}
        />

        <Text style={styles.loadingText}>
          Loading favorites...
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {favorites.length === 0 ? (
        // EMPTY FAVORITES
        <View style={styles.emptyState}>
          <MaterialCommunityIcons
            name="heart-outline"
            size={76}
            color={COLORS.muted}
          />

          <Text style={styles.emptyTitle}>
            No Favorites Yet
          </Text>

          <Text style={styles.emptyText}>
            Save recipes you love by tapping the heart icon.
            {'\n'}
            They will appear here.
          </Text>

          <Button
            mode="contained"
            buttonColor={COLORS.primary}
            textColor={COLORS.white}
            onPress={() =>
              router.push('/(app)/(tabs)/search')
            }
            style={styles.browseButton}
            contentStyle={styles.buttonContent}
          >
            Browse Recipes
          </Button>
        </View>
      ) : (
        // FAVORITES LIST
        <FlatList
          data={favorites}
          renderItem={renderFavorite}
          keyExtractor={(item) => item.id.toString()}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => {
                setRefreshing(true);
                loadFavorites();
              }}
              tintColor={COLORS.primary}
              colors={[COLORS.primary]}
            />
          }
          ListHeaderComponent={
            <View style={styles.header}>
              <Text style={styles.headerTitle}>
                My Favorites
              </Text>

              <Text style={styles.headerSubtitle}>
                {favorites.length} saved{' '}
                {favorites.length === 1 ? 'recipe' : 'recipes'}
              </Text>
            </View>
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.background,
  },
  loadingText: {
    marginTop: 12,
    color: COLORS.muted,
    fontSize: 13,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 30,
    backgroundColor: COLORS.background,
  },
  emptyTitle: {
    fontSize: 21,
    fontWeight: '800',
    color: COLORS.text,
    marginTop: 18,
  },
  emptyText: {
    color: COLORS.muted,
    fontSize: 13,
    textAlign: 'center',
    lineHeight: 21,
    marginTop: 8,
  },
  browseButton: {
    marginTop: 22,
    borderRadius: 10,
  },
  buttonContent: {
    minHeight: 44,
    paddingHorizontal: 12,
  },
  listContent: {
    paddingHorizontal: 16,
    paddingBottom: 25,
  },
  header: {
    paddingTop: 35,
    paddingBottom: 20,
  },
  headerTitle: {
    fontSize: 25,
    fontWeight: '800',
    color: COLORS.text,
  },
  headerSubtitle: {
    fontSize: 13,
    color: COLORS.muted,
    marginTop: 5,
  },
  favoriteCard: {
    marginBottom: 13,
  },
  card: {
    backgroundColor: COLORS.white,
    borderRadius: 14,
    overflow: 'hidden',
  },
  cardContent: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
  },
  recipeImage: {
    width: 105,
    height: 105,
    borderRadius: 10,
    backgroundColor: COLORS.border,
  },
  info: {
    flex: 1,
    paddingHorizontal: 11,
  },
  title: {
    fontSize: 14,
    fontWeight: '800',
    color: COLORS.text,
  },
  meta: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 7,
    gap: 5,
  },
  difficultyChip: {
    backgroundColor: COLORS.lightGreen,
  },
  cuisineChip: {
    backgroundColor: COLORS.lightGold,
  },
  chipText: {
    fontSize: 10,
    color: COLORS.text,
  },
  details: {
    color: COLORS.muted,
    fontSize: 10,
    marginTop: 8,
  },
  removeButton: {
    width: 38,
    height: 38,
    justifyContent: 'center',
    alignItems: 'center',
  },
});