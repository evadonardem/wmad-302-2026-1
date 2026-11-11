import React, { useCallback, useEffect, useState } from 'react';
import { FlatList, Image, Text, TouchableOpacity, View } from 'react-native';
import { useRouter } from 'expo-router';
import { Button, Card, Dialog, IconButton, Portal, Snackbar, Title, useTheme } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Recipe } from '@/types/recipe';
import { recipeApi } from '@/services/recipeApi';
import { useFavorites } from '@/context/FavoritesContext';
import { styles } from './favoritesStyles';

export default function FavoritesScreen() {
  const router = useRouter();
  const { colors } = useTheme();
  const {
    favoriteIds,
    isLoading: favoritesLoading,
    error: favoritesStorageError,
    reloadFavorites,
    toggleFavorite,
  } = useFavorites();
  const [favorites, setFavorites] = useState<Recipe[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pendingRemoval, setPendingRemoval] = useState<Recipe | null>(null);
  const [feedback, setFeedback] = useState<string | null>(null);

  const loadFavorites = useCallback(async () => {
    if (favoritesLoading) return;
    setLoading(true);
    setError(null);
    try {
      const recipes = await Promise.all(favoriteIds.map((id) => recipeApi.getRecipeById(id)));
      setFavorites(recipes);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : 'Failed to load saved recipes');
    } finally {
      setLoading(false);
    }
  }, [favoriteIds, favoritesLoading]);

  useEffect(() => {
    void loadFavorites();
  }, [loadFavorites]);

  const handleRemove = (recipe: Recipe) => {
    setPendingRemoval(recipe);
  };

  const confirmRemove = async () => {
    if (!pendingRemoval) return;
    try {
      await toggleFavorite(pendingRemoval.id);
      setPendingRemoval(null);
    } catch (saveError) {
      setFeedback(saveError instanceof Error ? saveError.message : 'Could not update favorites. Please try again.');
    }
  };

  const renderFavorite = ({ item }: { item: Recipe }) => (
    <TouchableOpacity
      style={styles.favoriteCard}
      onPress={() => router.push(`/(app)/recipe/${item.id}`)}
      activeOpacity={0.85}
    >
      <Card style={[styles.card, { backgroundColor: colors.surface }]} elevation={1}>
        <View style={styles.cardContent}>
          <Image source={{ uri: item.image }} style={styles.recipeImage} resizeMode="cover" />
          <View style={styles.info}>
            <Title style={[styles.title, { color: colors.onSurface }]} numberOfLines={2}>{item.name}</Title>
            <Text style={[styles.details, { color: colors.onSurfaceVariant }]}>
              {item.cuisine} · {item.prepTimeMinutes + item.cookTimeMinutes} min · ⭐ {item.rating.toFixed(1)}
            </Text>
          </View>
          <IconButton
            icon="heart"
            iconColor="#C62828"
            onPress={(event) => {
              event.stopPropagation();
              handleRemove(item);
            }}
            accessibilityLabel="Remove from favorites"
          />
        </View>
      </Card>
    </TouchableOpacity>
  );

  if (favoritesLoading || loading) {
    return (
      <View style={styles.loadingContainer}>
        <MaterialCommunityIcons name="heart" size={32} color="#E85D04" />
        <Text style={styles.loadingText}>Loading your favorites...</Text>
      </View>
    );
  }

  if (favoritesStorageError) {
    return (
      <View style={[styles.emptyState, { backgroundColor: colors.background }]}>
        <Text style={[styles.emptyTitle, { color: colors.onBackground }]}>Couldn’t load your saved recipes</Text>
        <Text style={[styles.emptyText, { color: colors.onSurfaceVariant }]}>{favoritesStorageError}</Text>
        <Button mode="contained" onPress={() => { void reloadFavorites(); }}>Try again</Button>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.emptyState}>
        <Text style={styles.emptyTitle}>Couldn’t load your favorites</Text>
        <Text style={styles.emptyText}>{error}</Text>
        <Button mode="contained" onPress={() => { void loadFavorites(); }}>Try again</Button>
      </View>
    );
  }

  return (
    <>
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {favorites.length === 0 ? (
        <View style={styles.emptyState}>
          <MaterialCommunityIcons name="heart-outline" size={76} color="#BCAAA4" />
          <Text style={styles.emptyTitle}>Your cookbook starts here</Text>
          <Text style={styles.emptyText}>Save recipes you love and find them here anytime.</Text>
          <Button
            mode="contained"
            onPress={() => router.push('/(app)/(tabs)/search')}
            style={styles.browseButton}
            contentStyle={styles.buttonContent}
          >
            Explore recipes
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
              <Title style={[styles.headerTitle, { color: colors.onBackground }]}>Saved recipes</Title>
              <Text style={[styles.emptyText, { color: colors.onSurfaceVariant }]}>{favorites.length} recipes in your cookbook</Text>
            </View>
          }
        />
      )}
    </View>
    <Portal>
      <Dialog
        visible={pendingRemoval !== null}
        style={{ borderRadius: 12, width: '90%', maxWidth: 400, alignSelf: 'center' }}
        onDismiss={() => setPendingRemoval(null)}
      >
        <Dialog.Title>Remove favorite?</Dialog.Title>
        <Dialog.Content>
          <Text>{pendingRemoval ? `${pendingRemoval.name} will be removed from your saved recipes.` : ''}</Text>
        </Dialog.Content>
        <Dialog.Actions>
          <Button onPress={() => setPendingRemoval(null)}>Cancel</Button>
          <Button onPress={() => { void confirmRemove(); }}>Remove</Button>
        </Dialog.Actions>
      </Dialog>
      <Snackbar visible={feedback !== null} onDismiss={() => setFeedback(null)}>{feedback}</Snackbar>
    </Portal>
    </>
  );
}
