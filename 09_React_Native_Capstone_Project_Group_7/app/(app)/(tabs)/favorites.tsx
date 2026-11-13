/**
 * Favorites Screen - Cookbook
 * Persists favorite recipe IDs & personal notes in AsyncStorage, fetches full recipe details
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
  Platform,
  Modal,
  StyleSheet,
} from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import { Card, Title, Chip, Button, IconButton, TextInput as PaperTextInput } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { favoritesStorage } from '@/utils/storage';
import { recipeApi } from '@/services/recipeApi';
import { Recipe } from '@/types/recipe';
import { styles } from './favoritesStyles';

export default function FavoritesScreen() {
  const router = useRouter();
  const [favorites, setFavorites] = useState<Recipe[]>([]);
  const [notes, setNotes] = useState<Record<number, string>>({});
  const [loading, setLoading] = useState(true);

  const [editingRecipe, setEditingRecipe] = useState<Recipe | null>(null);
  const [noteInput, setNoteInput] = useState('');

  const loadFavorites = useCallback(async () => {
    try {
      setLoading(true);
      const [ids, savedNotes] = await Promise.all([
        favoritesStorage.getIds(),
        favoritesStorage.getNotes(),
      ]);
      setNotes(savedNotes);

      if (ids.length > 0) {
        const recipes = await Promise.all(
          ids.map((id) => recipeApi.getRecipeById(id).catch(() => null))
        );
        setFavorites(recipes.filter((r): r is Recipe => r !== null));
      } else {
        setFavorites([]);
      }
    } catch (error) {
      console.error('Failed to load favorites:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadFavorites();
    }, [loadFavorites])
  );

  const performRemove = async (recipeId: number) => {
    await favoritesStorage.removeId(recipeId);
    setFavorites((prev) => prev.filter((r) => r.id !== recipeId));
  };

  const removeFavorite = (recipeId: number) => {
    if (Platform.OS === 'web') {
      if (window.confirm('Remove this recipe from your favorites?')) {
        performRemove(recipeId);
      }
      return;
    }

    Alert.alert('Remove from Favorites', 'Are you sure you want to remove this recipe?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Remove',
        style: 'destructive',
        onPress: () => performRemove(recipeId),
      },
    ]);
  };

  const openNoteModal = (recipe: Recipe) => {
    setEditingRecipe(recipe);
    setNoteInput(notes[recipe.id] || '');
  };

  const saveNote = async () => {
    if (!editingRecipe) return;
    await favoritesStorage.setNote(editingRecipe.id, noteInput);
    const updatedNotes = await favoritesStorage.getNotes();
    setNotes(updatedNotes);
    setEditingRecipe(null);
  };

  const renderFavorite = ({ item }: { item: Recipe }) => (
    <TouchableOpacity
      style={styles.favoriteCard}
      onPress={() => router.push(`/(app)/recipe/${item.id}`)}
      activeOpacity={0.85}
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
              ⏱️ {item.prepTimeMinutes + item.cookTimeMinutes}m · 👥 {item.servings} · ⭐{' '}
              {item.rating.toFixed(1)}
            </Text>
            {notes[item.id] ? (
              <Text style={noteStyles.noteBadge} numberOfLines={2}>
                📝 {notes[item.id]}
              </Text>
            ) : null}
          </View>
          <View style={{ justifyContent: 'center' }}>
            <IconButton
              icon="note-edit-outline"
              size={20}
              iconColor="#E85D04"
              onPress={() => openNoteModal(item)}
              accessibilityLabel="Edit recipe note"
            />
            <IconButton
              icon="heart"
              size={22}
              iconColor="#C62828"
              onPress={() => removeFavorite(item.id)}
              accessibilityLabel="Remove from favorites"
            />
          </View>
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
          <MaterialCommunityIcons name="heart-outline" size={80} color="#BCAAA4" />
          <Text style={styles.emptyTitle}>No Favorites Yet</Text>
          <Text style={styles.emptyText}>
            Tap the heart icon on any recipe to save it here for offline quick access
          </Text>
          <Button
            mode="contained"
            onPress={() => router.push('/(app)/(tabs)/search')}
            style={styles.browseButton}
            contentStyle={styles.buttonContent}
          >
            Browse Recipes
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
              <Title style={styles.headerTitle}>Your Favorites ({favorites.length})</Title>
            </View>
          }
        />
      )}

      <Modal
        visible={Boolean(editingRecipe)}
        transparent
        animationType="fade"
        onRequestClose={() => setEditingRecipe(null)}
      >
        <View style={noteStyles.backdrop}>
          <Card style={noteStyles.modalCard}>
            <Card.Content>
              <Title style={noteStyles.modalTitle}>Cooking Note</Title>
              <Text style={noteStyles.modalSubtitle}>{editingRecipe?.name}</Text>
              <PaperTextInput
                label="Personal note (e.g. Less salt, extra garlic)"
                mode="outlined"
                value={noteInput}
                onChangeText={setNoteInput}
                multiline
                numberOfLines={3}
                style={{ backgroundColor: '#FFFFFF', marginBottom: 12 }}
              />
              <View style={noteStyles.modalActions}>
                <Button mode="text" onPress={() => setEditingRecipe(null)}>
                  Cancel
                </Button>
                <Button mode="contained" onPress={saveNote} style={{ backgroundColor: '#E85D04' }}>
                  Save Note
                </Button>
              </View>
            </Card.Content>
          </Card>
        </View>
      </Modal>
    </View>
  );
}

const noteStyles = StyleSheet.create({
  noteBadge: {
    marginTop: 6,
    fontSize: 12,
    color: '#5D4037',
    backgroundColor: '#FFF3E0',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.45)',
    justifyContent: 'center',
    padding: 20,
  },
  modalCard: {
    borderRadius: 14,
    backgroundColor: '#FFFDF8',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#3E2723',
  },
  modalSubtitle: {
    fontSize: 13,
    color: '#8D6E63',
    marginBottom: 12,
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 8,
  },
});
