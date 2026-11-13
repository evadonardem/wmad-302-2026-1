/**
 * Home Screen - Cookbook Discover Tab
 * Features: 25-per-page square grid layout (Page 1 & Page 2), full-screen responsive columns, quick favorite toggle
 */
import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  FlatList,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  RefreshControl,
  useWindowDimensions,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '@/context/AuthContext';
import { useFavorites } from '@/context/FavoritesContext';
import { recipeApi } from '@/services/recipeApi';
import { Recipe } from '@/types/recipe';
import { Card, Title, Chip, Avatar, Button } from 'react-native-paper';
import {
  AnimatedCardWrapper,
  AnimatedHeartButton,
  ScalePressable,
} from '@/components/AnimatedComponents';
import { styles } from './homeStyles';

const PAGE_SIZE = 25;

export default function HomeScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const { isFavorite, toggleFavorite } = useFavorites();
  const { width } = useWindowDimensions();

  // Responsive square columns: 5 cols on wide desktop (5x5 = 25 squares!), 3 on tablet, 2 on mobile
  const numColumns = width >= 1200 ? 5 : width >= 768 ? 3 : 2;
  const gridGap = 12;
  const horizontalPadding = 32; // 16 left + 16 right
  const cardWidth = Math.floor((width - horizontalPadding - gridGap * (numColumns - 1)) / numColumns);

  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [totalRecipes, setTotalRecipes] = useState<number>(50);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchRecipesByPage = useCallback(async (page: number, isRefresh = false) => {
    try {
      if (!isRefresh) setLoading(true);
      setError(null);

      const skip = (page - 1) * PAGE_SIZE;
      const data = await recipeApi.getRecipes({ limit: PAGE_SIZE, skip });
      setRecipes(data.recipes);
      setTotalRecipes(data.total || 50);
      setCurrentPage(page);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load recipes');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchRecipesByPage(1);
  }, [fetchRecipesByPage]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchRecipesByPage(currentPage, true);
  };

  const totalPages = Math.max(1, Math.ceil(totalRecipes / PAGE_SIZE));

  const renderRecipe = ({ item, index }: { item: Recipe; index: number }) => {
    const favorited = isFavorite(item.id);

    return (
      <AnimatedCardWrapper
        index={index}
        style={{
          width: cardWidth,
          marginBottom: gridGap,
          marginRight: (index + 1) % numColumns === 0 ? 0 : gridGap,
        }}
      >
        <ScalePressable
          style={styles.recipeCard}
          onPress={() => router.push(`/(app)/(tabs)/recipe/${item.id}`)}
        >
          <Card style={styles.card} elevation={2}>
            {/* Square Image Container */}
            <View style={[styles.imageContainer, { width: '100%', aspectRatio: 1 }]}>
              <Image
                source={{ uri: item.image }}
                style={{ width: '100%', height: '100%' }}
                resizeMode="cover"
              />
              <View style={styles.difficultyBadge}>
                <Chip
                  compact
                  textStyle={{ fontSize: 11, fontWeight: '700' }}
                  style={[
                    styles.difficultyChip,
                    item.difficulty === 'Easy' && styles.easy,
                    item.difficulty === 'Medium' && styles.medium,
                    item.difficulty === 'Hard' && styles.hard,
                  ]}
                >
                  {item.difficulty}
                </Chip>
              </View>
              <View
                style={{
                  position: 'absolute',
                  top: 8,
                  right: 8,
                  backgroundColor: 'rgba(255, 255, 255, 0.92)',
                  borderRadius: 20,
                }}
              >
                <AnimatedHeartButton
                  isFavorite={favorited}
                  onPress={() => toggleFavorite(item)}
                  size={18}
                />
              </View>
            </View>

            {/* Card Info */}
            <Card.Content style={{ padding: 10 }}>
              <Title
                style={[styles.recipeTitle, { fontSize: 14, lineHeight: 19, marginBottom: 4 }]}
                numberOfLines={1}
              >
                {item.name}
              </Title>
              <View style={[styles.metaRow, { marginBottom: 6, flexWrap: 'wrap', gap: 4 }]}>
                <Text style={[styles.metaText, { fontSize: 11 }]}>
                  ⏱️ {item.prepTimeMinutes + item.cookTimeMinutes}m
                </Text>
                <Text style={[styles.metaText, { fontSize: 11 }]}>
                  🔥 {item.caloriesPerServing} cal
                </Text>
              </View>
              <View style={styles.ratingRow}>
                <Text style={[styles.ratingText, { fontSize: 12 }]}>
                  ⭐ {item.rating.toFixed(1)} · {item.cuisine}
                </Text>
              </View>
            </Card.Content>
          </Card>
        </ScalePressable>
      </AnimatedCardWrapper>
    );
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#E85D04" />
        <Text style={styles.loadingText}>Loading Page {currentPage} recipes...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>{error}</Text>
        <Button
          mode="contained"
          onPress={() => fetchRecipesByPage(currentPage, false)}
          style={styles.retryButton}
        >
          Retry
        </Button>
      </View>
    );
  }

  const startItem = (currentPage - 1) * PAGE_SIZE + 1;
  const endItem = Math.min(currentPage * PAGE_SIZE, totalRecipes);

  return (
    <ScrollView
      style={styles.scrollView}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#E85D04']} />
      }
      contentContainerStyle={[styles.scrollContent, { paddingHorizontal: 16 }]}
    >
      {/* Welcome Header */}
      <AnimatedCardWrapper index={0}>
        <View style={styles.welcomeContainer}>
          <View style={styles.welcomeTextContainer}>
            <Text style={styles.welcomeGreeting}>
              {user ? `Welcome back, ${user.firstName}!` : 'Welcome to Cookbook!'}
            </Text>
            <Text style={styles.welcomeSubtitle}>Discover delicious recipes</Text>
          </View>
          <Avatar.Icon size={56} icon="chef-hat" style={styles.welcomeAvatar} />
        </View>
      </AnimatedCardWrapper>

      {/* Categories */}
      <View style={styles.sectionContainer}>
        <View style={styles.sectionHeader}>
          <Title style={styles.sectionTitle}>Categories</Title>
          <TouchableOpacity
            onPress={() => router.push('/(app)/(tabs)/categories')}
            style={styles.seeAll}
          >
            <Text style={styles.seeAllText}>All Categories</Text>
          </TouchableOpacity>
        </View>
        <FlatList
          data={[
            'Dinner',
            'Lunch',
            'Breakfast',
            'Dessert',
            'Snack',
            'Appetizer',
            'Chicken',
            'Pasta',
          ]}
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.categoryList}
          renderItem={({ item }) => (
            <ScalePressable
              style={[styles.categoryChip, { backgroundColor: '#FFF3E0' }]}
              onPress={() =>
                router.push(`/(app)/(tabs)/search?category=${encodeURIComponent(item)}`)
              }
            >
              <Text style={styles.categoryChipText}>{item}</Text>
            </ScalePressable>
          )}
          keyExtractor={(item) => item}
        />
      </View>

      {/* Featured Recipes Grid (25 per page) */}
      <View style={styles.sectionContainer}>
        <View style={styles.sectionHeader}>
          <Title style={styles.sectionTitle}>
            Featured Recipes ({startItem}–{endItem} of {totalRecipes})
          </Title>
          <TouchableOpacity
            onPress={() => router.push('/(app)/(tabs)/search')}
            style={styles.seeAll}
          >
            <Text style={styles.seeAllText}>Search All</Text>
          </TouchableOpacity>
        </View>

        <FlatList
          key={`recipe-grid-${numColumns}-page-${currentPage}`}
          data={recipes}
          renderItem={renderRecipe}
          keyExtractor={(item) => item.id.toString()}
          numColumns={numColumns}
          scrollEnabled={false}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>No recipes found</Text>
            </View>
          }
        />

        {/* Page 1 / Page 2 Pagination Bar */}
        <View
          style={{
            flexDirection: 'row',
            justifyContent: 'center',
            alignItems: 'center',
            gap: 12,
            marginTop: 20,
            marginBottom: 12,
          }}
        >
          <Button
            mode="outlined"
            disabled={currentPage <= 1}
            onPress={() => fetchRecipesByPage(currentPage - 1)}
            style={{ borderColor: currentPage <= 1 ? '#D7CCC8' : '#E85D04' }}
            textColor="#E85D04"
            icon="chevron-left"
          >
            Previous
          </Button>

          {Array.from({ length: totalPages }, (_, i) => i + 1).map((pageNum) => {
            const isActive = pageNum === currentPage;
            return (
              <Button
                key={pageNum}
                mode={isActive ? 'contained' : 'outlined'}
                onPress={() => fetchRecipesByPage(pageNum)}
                buttonColor={isActive ? '#E85D04' : undefined}
                textColor={isActive ? '#FFFFFF' : '#E85D04'}
                style={{ borderColor: '#E85D04', minWidth: 44 }}
              >
                {pageNum}
              </Button>
            );
          })}

          <Button
            mode="outlined"
            disabled={currentPage >= totalPages}
            onPress={() => fetchRecipesByPage(currentPage + 1)}
            style={{ borderColor: currentPage >= totalPages ? '#D7CCC8' : '#E85D04' }}
            textColor="#E85D04"
            contentStyle={{ flexDirection: 'row-reverse' }}
            icon="chevron-right"
          >
            Next
          </Button>
        </View>
      </View>
    </ScrollView>
  );
}