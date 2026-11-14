/**
 * Discover / Home Screen - Cookbook
 * Responsive multi-column grid (boxes) showcasing food photography
 */
import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  Image,
  StyleSheet,
  useWindowDimensions,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Card, Title, Chip, Button } from 'react-native-paper';
import { recipeApi } from '@/services/recipeApi';
import { Recipe } from '@/types/recipe';

const PAGE_SIZE = 12;

export default function HomeScreen() {
  const router = useRouter();
  const { width } = useWindowDimensions();
  const numColumns = width >= 960 ? 3 : width >= 360 ? 2 : 1;

  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [total, setTotal] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const fetchRecipes = useCallback(async (skip = 0, append = false) => {
    try {
      setError(null);
      const data = await recipeApi.getRecipes({ limit: PAGE_SIZE, skip });
      setTotal(data.total);
      setRecipes((prev) => (append ? [...prev, ...data.recipes] : data.recipes));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load recipes');
    } finally {
      setLoading(false);
      setLoadingMore(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchRecipes(0, false);
  }, [fetchRecipes]);

  const handleRefresh = () => {
    setRefreshing(true);
    fetchRecipes(0, false);
  };

  const handleLoadMore = () => {
    if (loadingMore || loading || recipes.length >= total) return;
    setLoadingMore(true);
    fetchRecipes(recipes.length, true);
  };

  const renderRecipe = ({ item }: { item: Recipe }) => (
    <TouchableOpacity
      style={ui.gridItem}
      onPress={() => router.push(`/(app)/recipe/${item.id}`)}
      activeOpacity={0.88}
    >
      <Card style={ui.card} elevation={2}>
        <View style={ui.imageBox}>
          <Image source={{ uri: item.image }} style={ui.heroImage} resizeMode="cover" />
          <View style={ui.topOverlay}>
            <Chip
              style={[
                ui.difficultyBadge,
                item.difficulty === 'Easy' && ui.easyBg,
                item.difficulty === 'Medium' && ui.medBg,
                item.difficulty === 'Hard' && ui.hardBg,
              ]}
              textStyle={ui.badgeText}
            >
              {item.difficulty}
            </Chip>
            <View style={ui.ratingPill}>
              <Text style={ui.ratingPillText}>⭐ {item.rating.toFixed(1)}</Text>
            </View>
          </View>
        </View>

        <Card.Content style={ui.cardBody}>
          <Text style={ui.cuisineLabel}>{item.cuisine.toUpperCase()}</Text>
          <Title style={ui.recipeTitle} numberOfLines={2}>
            {item.name}
          </Title>

          <View style={ui.metaRow}>
            <Text style={ui.metaItem}>⏱️ {item.prepTimeMinutes + item.cookTimeMinutes}m</Text>
            <Text style={ui.metaItem}>👥 {item.servings}</Text>
            <Text style={ui.metaItem}>🔥 {item.caloriesPerServing} cal</Text>
          </View>
        </Card.Content>
      </Card>
    </TouchableOpacity>
  );

  if (loading) {
    return (
      <View style={ui.centerBox}>
        <ActivityIndicator size="large" color="#E85D04" />
        <Text style={ui.statusText}>Preparing delicious recipes...</Text>
      </View>
    );
  }

  if (error && recipes.length === 0) {
    return (
      <View style={ui.centerBox}>
        <Text style={ui.errorTitle}>Unable to load recipes</Text>
        <Text style={ui.statusText}>{error}</Text>
        <Button mode="contained" onPress={() => fetchRecipes(0, false)} style={ui.retryBtn}>
          Retry
        </Button>
      </View>
    );
  }

  return (
    <View style={ui.screen}>
      <FlatList
        key={`grid-${numColumns}`}
        data={recipes}
        renderItem={renderRecipe}
        numColumns={numColumns}
        keyExtractor={(item) => item.id.toString()}
        columnWrapperStyle={numColumns > 1 ? ui.columnRow : undefined}
        contentContainerStyle={ui.listContainer}
        onEndReached={handleLoadMore}
        onEndReachedThreshold={0.4}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor="#E85D04" />
        }
        ListHeaderComponent={
          <View style={ui.header}>
            <Text style={ui.kicker}>COOKBOOK COLLECTION</Text>
            <Title style={ui.headerTitle}>Discover Recipes</Title>
            <Text style={ui.headerSubtitle}>
              Showing {recipes.length} of {total} curated dishes
            </Text>
          </View>
        }
        ListFooterComponent={
          loadingMore ? (
            <ActivityIndicator size="small" color="#E85D04" style={{ marginVertical: 20 }} />
          ) : null
        }
      />
    </View>
  );
}

const ui = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#FAF6F0',
  },
  listContainer: {
    width: '100%',
    maxWidth: 1120,
    alignSelf: 'center',
    paddingHorizontal: 12,
    paddingTop: 20,
    paddingBottom: 32,
  },
  columnRow: {
    gap: 10,
    marginBottom: 10,
  },
  gridItem: {
    flex: 1,
    marginBottom: 10,
  },
  header: {
    marginBottom: 18,
  },
  kicker: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 1.2,
    color: '#E85D04',
    marginBottom: 4,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '800',
    color: '#2D1B14',
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#7A6258',
    marginTop: 2,
  },
  card: {
    flex: 1,
    borderRadius: 18,
    overflow: 'hidden',
    backgroundColor: '#FFFFFF',
  },
  imageBox: {
    position: 'relative',
    width: '100%',
    height: 150,
    backgroundColor: '#EFE6DD',
  },
  heroImage: {
    width: '100%',
    height: '100%',
  },
  topOverlay: {
    position: 'absolute',
    top: 10,
    left: 10,
    right: 10,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  difficultyBadge: {
    borderRadius: 10,
  },
  easyBg: { backgroundColor: '#E8F5E9' },
  medBg: { backgroundColor: '#FFF3E0' },
  hardBg: { backgroundColor: '#FFEBEE' },
  badgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#3E2723',
  },
  ratingPill: {
    backgroundColor: 'rgba(33, 21, 16, 0.78)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  ratingPillText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
  },
  cardBody: {
    padding: 10,
  },
  cuisineLabel: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.8,
    color: '#E85D04',
    marginBottom: 4,
  },
  recipeTitle: {
    fontSize: 14,
    lineHeight: 19,
    fontWeight: '700',
    color: '#2D1B14',
    marginBottom: 10,
  },
  metaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#F3ECE4',
  },
  metaItem: {
    fontSize: 12,
    color: '#6D564C',
    fontWeight: '600',
  },
  centerBox: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FAF6F0',
    padding: 24,
  },
  errorTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#2D1B14',
    marginBottom: 6,
  },
  statusText: {
    marginTop: 10,
    fontSize: 14,
    color: '#7A6258',
  },
  retryBtn: {
    marginTop: 16,
    backgroundColor: '#E85D04',
    borderRadius: 10,
  },
});
