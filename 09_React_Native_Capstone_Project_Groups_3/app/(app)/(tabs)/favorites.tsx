/**
 * Favorites Screen - Cookbook
 * Your saved recipes as a photo grid. Tap the heart on a card to remove it
 * (with an Undo option). Favorites are saved on the device by CookbookContext.
 */
import React, { useMemo, useState } from 'react';
import { View, FlatList, useWindowDimensions } from 'react-native';
import { useRouter } from 'expo-router';
import { Snackbar, Text } from 'react-native-paper';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useCookbook } from '@/context/CookbookContext';
import { useAllRecipes } from '@/hooks/useRecipes';
import { RecipeTile } from '@/components/RecipeTile';
import { EmptyState, Skeleton } from '@/components/CommonComponents';
import { useFavoritesStyles } from './favoritesStyles';

export default function FavoritesScreen() {
  const styles = useFavoritesStyles();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const numColumns = width >= 700 ? 3 : 2;
  const { favorites, hydrated, toggleFavorite } = useCookbook();
  const { pick, loading } = useAllRecipes();
  const [lastRemoved, setLastRemoved] = useState<number | null>(null);
  const [previous, setPrevious] = useState<number[]>(favorites);

  const recipes = useMemo(() => pick(favorites), [pick, favorites]);

  // Show "Removed · Undo" when a heart is tapped on this screen
  if (previous !== favorites) {
    const removed = previous.find((id) => !favorites.includes(id));
    setPrevious(favorites);
    if (removed !== undefined) setLastRemoved(removed);
  }

  if (!hydrated || (loading && favorites.length > 0)) {
    return (
      <View style={[styles.container, { paddingTop: insets.top + 16 }]}>
        <Text style={styles.headerTitle}>Your favorites</Text>
        <View style={styles.skeletonGrid}>
          {[0, 1, 2, 3].map((i) => (
            <Skeleton key={i} width="48%" height={230} borderRadius={22} />
          ))}
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.container, { paddingTop: insets.top + 16 }]}>
      {recipes.length === 0 ? (
        <EmptyState
          emoji="💛"
          title="Your cookbook is empty"
          message="Tap the heart on any recipe to save it here. Go find something tasty!"
          actionLabel="Explore recipes"
          onAction={() => router.push('/home')}
        />
      ) : (
        <FlatList
          key={`grid-${numColumns}`}
          data={recipes}
          numColumns={numColumns}
          keyExtractor={(item) => item.id.toString()}
          columnWrapperStyle={styles.columns}
          contentContainerStyle={styles.listContent}
          ListHeaderComponent={
            <View style={styles.header}>
              <Text style={styles.headerTitle}>Your favorites</Text>
              <Text style={styles.headerSubtitle}>
                {recipes.length} saved recipe{recipes.length === 1 ? '' : 's'}
              </Text>
            </View>
          }
          renderItem={({ item }) => (
            <View style={[styles.gridItem, { maxWidth: numColumns === 3 ? '31.5%' : '48%' }]}>
              <RecipeTile recipe={item} size="grid" onPress={() => router.push(`/recipe/${item.id}`)} />
            </View>
          )}
        />
      )}

      <Snackbar
        visible={lastRemoved !== null}
        onDismiss={() => setLastRemoved(null)}
        duration={3000}
        action={{
          label: 'Undo',
          onPress: () => {
            if (lastRemoved !== null) toggleFavorite(lastRemoved);
            setLastRemoved(null);
          },
        }}
      >
        Removed from favorites
      </Snackbar>
    </View>
  );
}
