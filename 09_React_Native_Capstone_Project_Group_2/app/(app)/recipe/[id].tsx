import React, { useEffect, useState } from 'react';
import { ScrollView, View, Text, Image, ActivityIndicator, Alert } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Button, Chip, IconButton, Title } from 'react-native-paper';
import { recipeApi } from '@/services/recipeApi';
import { customRecipesStorage, favoritesStorage } from '@/utils/storage';
import { Recipe } from '@/types/recipe';

export default function RecipeDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const [recipe, setRecipe] = useState<Recipe | null>(null);
  const [favorite, setFavorite] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const goBack = () => {
    if (router.canGoBack()) {
      router.back();
    } else {
      router.replace('/(app)/(tabs)/home');
    }
  };

  useEffect(() => {
    const recipeId = Number(Array.isArray(id) ? id[0] : id);
    if (!Number.isInteger(recipeId)) {
      setError('Invalid recipe ID.');
      return;
    }

    setError(null);
    setRecipe(null);
    const loadRecipe = async () => {
      try {
        let loaded: Recipe | null = null;
        try {
          loaded = await recipeApi.getRecipeById(recipeId);
        } catch (apiError) {
          loaded = await customRecipesStorage.getById(recipeId);
          if (!loaded) throw apiError;
        }
        setRecipe(loaded);
        const ids = await favoritesStorage.getIds();
        setFavorite(ids.includes(recipeId));
      } catch (loadError: unknown) {
        const message = loadError instanceof Error ? loadError.message : 'Please try again.';
        setError(message);
        Alert.alert('Unable to load recipe', message);
      }
    };

    void loadRecipe();
  }, [id]);

  const toggleFavorite = async () => {
    if (!recipe) return;
    try {
      setFavorite(await favoritesStorage.toggleId(recipe.id));
    } catch (error) {
      Alert.alert('Unable to update favorites', error instanceof Error ? error.message : 'Please try again.');
    }
  };

  if (!recipe) {
    if (error) {
      return (
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: 24 }}>
          <Text style={{ textAlign: 'center' }}>Unable to load this recipe: {error}</Text>
          <Button mode="contained" onPress={goBack} style={{ marginTop: 16 }}>
            Go back
          </Button>
        </View>
      );
    }
    return <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}><ActivityIndicator size="large" /></View>;
  }

  return (
    <ScrollView contentContainerStyle={{ paddingBottom: 32 }}>
      <IconButton icon="arrow-left" onPress={goBack} />
      <Image source={{ uri: recipe.image }} style={{ width: '100%', height: 240 }} resizeMode="cover" />
      <View style={{ padding: 20 }}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
          <Title style={{ flex: 1 }}>{recipe.name}</Title>
          <IconButton icon={favorite ? 'heart' : 'heart-outline'} iconColor="#C62828" onPress={toggleFavorite} />
        </View>
        <Text>{recipe.cuisine} · {recipe.difficulty} · {recipe.rating.toFixed(1)} ({recipe.reviewCount} reviews)</Text>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginVertical: 12 }}>
          {recipe.tags.map((tag) => <Chip key={tag}>{tag}</Chip>)}
        </View>
        <Text style={{ fontWeight: '700', fontSize: 20, marginTop: 12 }}>Ingredients</Text>
        {recipe.ingredients.map((ingredient) => <Text key={ingredient} style={{ marginTop: 6 }}>• {ingredient}</Text>)}
        <Text style={{ fontWeight: '700', fontSize: 20, marginTop: 20 }}>Instructions</Text>
        {recipe.instructions.map((instruction, index) => <Text key={instruction} style={{ marginTop: 8 }}>{index + 1}. {instruction}</Text>)}
        <Text style={{ marginTop: 20 }}>⏱️ {recipe.prepTimeMinutes + recipe.cookTimeMinutes} minutes · 🔥 {recipe.caloriesPerServing} calories per serving</Text>
        <Button mode="contained" onPress={toggleFavorite} style={{ marginTop: 20 }}>{favorite ? 'Remove from favorites' : 'Save to favorites'}</Button>
      </View>
    </ScrollView>
  );
}
