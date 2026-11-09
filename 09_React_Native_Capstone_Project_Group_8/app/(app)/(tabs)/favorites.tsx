
/**
 * Favorites Screen - Cookbook
 * TODO: Students implement
 * - Store favorite recipe IDs in AsyncStorage or context
 * - Fetch favorite recipes by IDs (GET /recipes/{id})
 * - Remove from favorites
 * - Add notes to favorites
 * - Create collections/folders
 */
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Image,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Card, Title, Chip, Button, IconButton } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
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

  // TODO: Student implementation
  // 1. Load favorite IDs from AsyncStorage on mount
  // 2. Fetch each recipe by ID (or batch if API supports)
  // 3. Implement remove from favorites
  // 4. Persist changes to AsyncStorage

  useEffect(() => {
    loadFavorites();
  }, []);

  const loadFavorites = async () => {
    try {
      // TODO: Get favorite IDs from AsyncStorage
      // const favoriteIds = await AsyncStorage.getItem('favoriteRecipeIds');
      // const ids = favoriteIds ? JSON.parse(favoriteIds) : [];
      //
      // if (ids.length > 0) {
      //   const recipes = await Promise.all(
      //     ids.map((id: number) => fetch(`https://dummyjson.com/recipes/${id}`).then(r => r.json()))
      //   );
      //   setFavorites(recipes);
      // }

      // Mock data for demo
      setFavorites([]);
    } catch (error) {
      console.error('Failed to load favorites:', error);
    } finally {
      setLoading(false);
    }
  };

  const removeFavorite = (recipeId: number) => {
    Alert.alert(
      'Remove from Favorites',
      'Are you sure you want to remove this recipe?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: () => {
            // TODO: Remove from AsyncStorage and update state
            setFavorites((prev) => prev.filter((r) => r.id !== recipeId));
          },
        },
      ]
    );
  };

  const renderFavorite = ({ item }: { item: Recipe }) => (
    <TouchableOpacity
      style={styles.favoriteCard}
      onPress={() => router.push(`/(app)/(tabs)/recipe/${item.id}`)}
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
              <Chip style={styles.difficultyChip}>{item.difficulty}</Chip>
              <Chip style={styles.cuisineChip}>{item.cuisine}</Chip>
            </View>
            <Text style={styles.details}>
              ⏱️ {item.prepTimeMinutes + item.cookTimeMinutes}min · 👥 {item.servings} · ⭐ {item.rating}
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

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#E85D04" />
        <Text style={styles.loadingText}>Loading favorites...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {favorites.length === 0 ? (
        <View style={styles.emptyState}>
          <MaterialCommunityIcons
            name="heart-outline"
            size={80}
            color="#BCAAA4"
          />
          <Text style={styles.emptyTitle}>No Favorites Yet</Text>
          <Text style={styles.emptyText}>
            Recipes you love will appear here
          </Text>
          <Button
            mode="contained"
            onPress={() => router.push('/(app)/(tabs)/search')}
            style={styles.browseButton}
            contentStyle={styles.buttonContent}
          >
            <Text style={styles.buttonText}>Browse Recipes</Text>
          </Button>
        </View>
      ) : (
        <FlatList
          data={favorites}
          renderItem={renderFavorite}
          keyExtractor={(item) => item.id.toString()}
          contentContainerStyle={styles.listContent}
          ItemSeparatorComponent={() => <View style={styles.separator} />}
          ListHeaderComponent={
            <View style={styles.header}>
              <Title style={styles.headerTitle}>
                Your Favorites ({favorites.length})
              </Title>
            </View>
          }
        />
      )}

      {/* Student Guide */}
      <View style={styles.guideContainer}>
        <Text style={styles.guideTitle}>
          📝 Student Implementation Guide
        </Text>
        <Text style={styles.guideText}>
          Complete the favorites functionality:{'\n'}
          1. Store favorite IDs in AsyncStorage{'\n'}
          2. Fetch recipes by ID on load{'\n'}
          3. Add/remove with persistence{'\n'}
          4. Add "Add to Favorites" on recipe detail{'\n'}
          5. Create collections (Breakfast, Dinner, etc.)
        </Text>
      </View>
    </View>
  );
}
