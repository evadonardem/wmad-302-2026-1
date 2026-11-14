import React, { useCallback, useEffect, useState } from 'react';
import { FlatList, Image, Text, TouchableOpacity, View } from 'react-native';
import { useRouter } from 'expo-router';
import { Button, Card, Dialog, IconButton, Portal, Snackbar, Title, useTheme } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Recipe } from '@/types/recipe';
import { recipeApi } from '@/services/recipeApi';
import { useFavorites } from '@/context/FavoritesContext';
import { useAuth } from '@/context/AuthContext';
import { styles } from './favoritesStyles';

export default function FavoritesScreen() {
  const router = useRouter();
  const { colors } = useTheme();
  const { user } = useAuth();
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
      const recipes = await Promise.all(favoriteIds.map((id) => recipeApi.getRecipeById(id, user?.id)));
      setFavorites(recipes);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : 'Failed to load saved recipes');
    } finally {
      setLoading(false);
    }
  }, [favoriteIds, favoritesLoading, user?.id]);

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
      <Card
        style={[
          styles.card,
          {
            backgroundColor: colors.surface,
            borderColor: colors.outline,
            borderWidth: 2,
          },
        ]}
        elevation={1}
      >
        <Card.Content style={styles.cardContent}>
          {item.image ? (
            <Image source={{ uri: item.image }} style={styles.recipeImage} resizeMode="cover" />
          ) : (
            <View style={[styles.recipeImage, { backgroundColor: colors.primaryContainer, alignItems: 'center', justifyContent: 'center' }]}>
              <MaterialCommunityIcons name="food-outline" size={30} color={colors.primary} />
            </View>
          )}
          <View style={styles.info}>
            <Title style={[styles.title, { color: colors.onSurface }]} numberOfLines={2}>{item.name}</Title>
            <View style={styles.detailsRow}>
              <View style={styles.cuisineBadge}>
                <Text style={styles.cuisineLabel}>{item.cuisine}</Text>
              </View>
              <View style={styles.detailItem}>
                <MaterialCommunityIcons name="clock-outline" size={15} color={colors.primary} />
                <Text style={[styles.details, { color: colors.onSurfaceVariant }]}>
                  {item.prepTimeMinutes + item.cookTimeMinutes} min
                </Text>
              </View>
              <View style={styles.detailItem}>
                <MaterialCommunityIcons name="star" size={15} color="#E9A400" />
                <Text style={[styles.details, { color: colors.onSurfaceVariant }]}>{item.rating.toFixed(1)}</Text>
              </View>
            </View>
          </View>
          <IconButton
            icon="heart"
            iconColor="#C62828"
            containerColor="#FFF3E0"
            style={styles.favoriteButton}
            onPress={(event) => {
              event.stopPropagation();
              handleRemove(item);
            }}
            accessibilityLabel="Remove from favorites"
          />
        </Card.Content>
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
      <View style={[styles.emptyState, { backgroundColor: colors.background }]}>
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
          ListHeaderComponent={
            <View style={[styles.header, { backgroundColor: colors.primaryContainer }]}>
              <View style={styles.headerCopy}>
                <Title style={[styles.headerTitle, { color: colors.onPrimaryContainer }]}>Saved recipes</Title>
                <Text style={[styles.headerSubtitle, { color: colors.onPrimaryContainer }]}>
                  {favorites.length} saved {favorites.length === 1 ? 'recipe' : 'recipes'} in your cookbook
                </Text>
              </View>
              <View style={styles.countBadge}>
                <MaterialCommunityIcons name="heart" size={18} color="#FFFFFF" />
                <Text style={styles.countText}>{favorites.length}</Text>
              </View>
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
          <Text style={{ color: colors.onSurface }}>
            {pendingRemoval ? `${pendingRemoval.name} will be removed from your saved recipes.` : ''}
          </Text>
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
