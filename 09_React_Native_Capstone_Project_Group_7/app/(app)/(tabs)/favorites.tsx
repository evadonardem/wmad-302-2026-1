/**
 * Favorites Screen - Cookbook
 * Responsive grid of saved recipes with prominent food photos & personal cooking notes
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
  useWindowDimensions,
} from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import { Card, Title, Chip, Button, IconButton, TextInput as PaperTextInput } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { favoritesStorage } from '@/utils/storage';
import { recipeApi } from '@/services/recipeApi';
import { Recipe } from '@/types/recipe';

export default function FavoritesScreen() {
  const router = useRouter();
  const { width } = useWindowDimensions();
  const numColumns = width >= 960 ? 3 : width >= 360 ? 2 : 1;

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
      style={ui.gridItem}
      onPress={() => router.push(`/(app)/recipe/${item.id}`)}
      activeOpacity={0.88}
    >
      <Card style={ui.card} elevation={2}>
        <View style={ui.imageBox}>
          <Image source={{ uri: item.image }} style={ui.heroImage} resizeMode="cover" />
          <View style={ui.overlayActions}>
            <IconButton
              icon="note-edit-outline"
              size={18}
              iconColor="#FFFFFF"
              containerColor="rgba(33,21,16,0.72)"
              onPress={() => openNoteModal(item)}
              accessibilityLabel="Edit recipe note"
            />
            <IconButton
              icon="heart"
              size={18}
              iconColor="#FF5252"
              containerColor="rgba(33,21,16,0.72)"
              onPress={() => removeFavorite(item.id)}
              accessibilityLabel="Remove from favorites"
            />
          </View>
        </View>

        <Card.Content style={ui.cardBody}>
          <View style={ui.tagRow}>
            <Chip style={ui.difficultyChip} textStyle={{ fontSize: 11 }}>
              {item.difficulty}
            </Chip>
            <Chip style={ui.cuisineChip} textStyle={{ fontSize: 11 }}>
              {item.cuisine}
            </Chip>
          </View>

          <Title style={ui.title} numberOfLines={2}>
            {item.name}
          </Title>

          <Text style={ui.details}>
            ⏱️ {item.prepTimeMinutes + item.cookTimeMinutes}m · 👥 {item.servings} · ⭐{' '}
            {item.rating.toFixed(1)}
          </Text>

          {notes[item.id] ? (
            <Text style={ui.noteBadge} numberOfLines={2}>
              📝 {notes[item.id]}
            </Text>
          ) : null}
        </Card.Content>
      </Card>
    </TouchableOpacity>
  );

  if (loading) {
    return (
      <View style={ui.centerBox}>
        <ActivityIndicator size="large" color="#E85D04" />
        <Text style={ui.loadingText}>Loading favorites...</Text>
      </View>
    );
  }

  return (
    <View style={ui.screen}>
      {favorites.length === 0 ? (
        <View style={ui.centerBox}>
          <MaterialCommunityIcons name="heart-outline" size={80} color="#BCAAA4" />
          <Text style={ui.emptyTitle}>No Favorites Yet</Text>
          <Text style={ui.emptyText}>
            Tap the heart icon on any recipe to save it here for offline quick access
          </Text>
          <Button
            mode="contained"
            onPress={() => router.push('/(app)/(tabs)/search')}
            style={ui.browseButton}
          >
            Browse Recipes
          </Button>
        </View>
      ) : (
        <FlatList
          key={`fav-grid-${numColumns}`}
          data={favorites}
          renderItem={renderFavorite}
          numColumns={numColumns}
          keyExtractor={(item) => item.id.toString()}
          columnWrapperStyle={numColumns > 1 ? ui.columnRow : undefined}
          contentContainerStyle={ui.listContent}
          ListHeaderComponent={
            <View style={ui.header}>
              <Text style={ui.kicker}>SAVED COLLECTION</Text>
              <Title style={ui.headerTitle}>Your Favorites ({favorites.length})</Title>
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
        <View style={ui.backdrop}>
          <Card style={ui.modalCard}>
            <Card.Content>
              <Title style={ui.modalTitle}>Cooking Note</Title>
              <Text style={ui.modalSubtitle}>{editingRecipe?.name}</Text>
              <PaperTextInput
                label="Personal note (e.g. Less salt, extra garlic)"
                mode="outlined"
                value={noteInput}
                onChangeText={setNoteInput}
                multiline
                numberOfLines={3}
                style={{ backgroundColor: '#FFFFFF', marginBottom: 12 }}
              />
              <View style={ui.modalActions}>
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

const ui = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#FAF6F0',
  },
  listContent: {
    width: '100%',
    maxWidth: 1120,
    alignSelf: 'center',
    padding: 12,
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
    marginBottom: 10,
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
  card: {
    flex: 1,
    borderRadius: 18,
    backgroundColor: '#FFFFFF',
    overflow: 'hidden',
  },
  imageBox: {
    position: 'relative',
    width: '100%',
    height: 145,
    backgroundColor: '#EFE6DD',
  },
  heroImage: {
    width: '100%',
    height: '100%',
  },
  overlayActions: {
    position: 'absolute',
    top: 8,
    right: 8,
    flexDirection: 'row',
    gap: 2,
  },
  cardBody: {
    padding: 10,
  },
  tagRow: {
    flexDirection: 'row',
    gap: 6,
    marginBottom: 8,
  },
  difficultyChip: {
    backgroundColor: '#E8F5E9',
  },
  cuisineChip: {
    backgroundColor: '#FFF3E0',
  },
  title: {
    fontSize: 14,
    lineHeight: 19,
    fontWeight: '700',
    color: '#2D1B14',
    marginBottom: 6,
  },
  details: {
    fontSize: 13,
    color: '#7A6258',
  },
  noteBadge: {
    marginTop: 8,
    fontSize: 12,
    color: '#5D4037',
    backgroundColor: '#FFF3E0',
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: 8,
  },
  centerBox: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FAF6F0',
    padding: 32,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 15,
    color: '#7A6258',
  },
  emptyTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: '#2D1B14',
    marginTop: 16,
  },
  emptyText: {
    fontSize: 14,
    color: '#7A6258',
    textAlign: 'center',
    marginTop: 8,
    maxWidth: 320,
  },
  browseButton: {
    marginTop: 20,
    backgroundColor: '#E85D04',
    borderRadius: 12,
  },
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.45)',
    justifyContent: 'center',
    padding: 20,
  },
  modalCard: {
    maxWidth: 460,
    width: '100%',
    alignSelf: 'center',
    borderRadius: 16,
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
