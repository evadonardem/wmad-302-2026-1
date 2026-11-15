/**
 * Favorites Screen - Cookbook
 */
import React, { useState } from 'react';
import {
  View,
  Text,
  FlatList,
  ActivityIndicator,
  Alert,
  Image,
  RefreshControl,
  Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Card, Title, Chip, Button } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useFavorites } from '@/context/FavoritesContext';
import { Recipe } from '@/types/recipe';
import {
  AnimatedCardWrapper,
  AnimatedHeartButton,
  ScalePressable,
} from '@/components/AnimatedComponents';
import { styles } from './favoritesStyles';

export default function FavoritesScreen() {
  const router = useRouter();
  const { favorites, isLoading, removeFavorite, refreshFavorites } = useFavorites();
  const [refreshing, setRefreshing] = useState(false);

  const handleRefresh = async () => {
    setRefreshing(true);
    await refreshFavorites();
    setRefreshing(false);
  };

  const handleRemoveFavorite = (recipeId: number, recipeName: string) => {
    if (Platform.OS === 'web') {
      if (window.confirm(`Are you sure you want to remove "${recipeName}" from favorites?`)) {
        void removeFavorite(recipeId);
      }
      return;
    }

    Alert.alert(
      'Remove from Favorites',
      `Are you sure you want to remove "${recipeName}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: async () => {
            await removeFavorite(recipeId);
          },
        },
      ]
    );
  };

  const renderFavorite = ({ item, index }: { item: Recipe; index: number }) => (
    <AnimatedCardWrapper index={index}>
      <ScalePressable
        style={styles.favoriteCard}
        onPress={() => router.push(`/(app)/(tabs)/recipe/${item.id}`)}
      >
        <Card style={styles.card} elevation={1}>
          <View style={styles.cardContent}>
            <Image source={{ uri: item.image }} style={styles.recipeImage} resizeMode="cover" />
            <View style={styles.info}>
              <Title style={styles.title} numberOfLines={1}>
                {item.name}
              </Title>
              <View style={styles.meta}>
                <Chip style={styles.difficultyChip} textStyle={{ fontSize: 11 }}>
                  {item.difficulty}
                </Chip>
                <Chip style={styles.cuisineChip} textStyle={{ fontSize: 11 }}>
                  {item.cuisine}
                </Chip>
              </View>
              <Text style={styles.details}>
                ⏱️ {item.prepTimeMinutes + item.cookTimeMinutes}min · 👥 {item.servings} · ⭐{' '}
                {item.rating}
              </Text>
            </View>
            <AnimatedHeartButton
              isFavorite={true}
              onPress={() => handleRemoveFavorite(item.id, item.name)}
              size={24}
            />
          </View>
        </Card>
      </ScalePressable>
    </AnimatedCardWrapper>
  );

  if (isLoading && !refreshing) {
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
        <AnimatedCardWrapper index={0} style={styles.emptyState}>
          <MaterialCommunityIcons name="heart-outline" size={80} color="#BCAAA4" />
          <Text style={styles.emptyTitle}>No Favorites Yet</Text>
          <Text style={styles.emptyText}>Recipes you love will appear here</Text>
          <Button
            mode="contained"
            onPress={() => router.push('/(app)/(tabs)/search')}
            style={styles.browseButton}
            contentStyle={styles.buttonContent}
          >
            <Text style={styles.buttonText}>Browse Recipes</Text>
          </Button>
        </AnimatedCardWrapper>
      ) : (
        <FlatList
          data={favorites}
          renderItem={renderFavorite}
          keyExtractor={(item) => item.id.toString()}
          contentContainerStyle={styles.listContent}
          ItemSeparatorComponent={() => <View style={styles.separator} />}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={handleRefresh}
              colors={['#E85D04']}
            />
          }
          ListHeaderComponent={
            <View style={styles.header}>
              <Title style={styles.headerTitle}>Your Favorites ({favorites.length})</Title>
            </View>
          }
        />
      )}
    </View>
  );
}