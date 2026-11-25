import React, { useCallback, useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, Text, TouchableOpacity, View } from 'react-native';
import { Avatar, Button, Card, IconButton, TextInput, Title } from 'react-native-paper';
import { useFocusEffect, useRouter } from 'expo-router';
import { customRecipesStorage } from '@/utils/storage';
import { Recipe } from '@/types/recipe';
import { styles } from '@/styles/myRecipesStyles';

const initialForm = {
  name: '',
  cuisine: '',
  ingredients: '',
  instructions: '',
};

export default function MyRecipesScreen() {
  const router = useRouter();
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [form, setForm] = useState(initialForm);
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const goBack = () => {
    if (router.canGoBack()) {
      router.back();
    } else {
      router.replace('/(app)/(tabs)/profile');
    }
  };

  const loadRecipes = useCallback(async () => {
    setRecipes(await customRecipesStorage.getAll());
  }, []);

  useFocusEffect(
    useCallback(() => {
      void loadRecipes();
    }, [loadRecipes])
  );

  const updateField = (field: keyof typeof initialForm, value: string) => {
    setForm((current) => ({ ...current, [field]: value }));
    setError(null);
  };

  const saveRecipe = async () => {
    const ingredients = form.ingredients.split(',').map((item) => item.trim()).filter(Boolean);
    const instructions = form.instructions.split('\n').map((item) => item.trim()).filter(Boolean);

    if (!form.name.trim() || ingredients.length === 0 || instructions.length === 0) {
      setError('Add a recipe name, one ingredient, and one instruction.');
      return;
    }

    setSaving(true);
    setError(null);
    try {
      await customRecipesStorage.add({
        id: -Date.now(),
        name: form.name.trim(),
        ingredients,
        instructions,
        prepTimeMinutes: 0,
        cookTimeMinutes: 0,
        servings: 1,
        difficulty: 'Easy',
        cuisine: form.cuisine.trim() || 'Homemade',
        caloriesPerServing: 0,
        tags: ['Homemade'],
        userId: 0,
        image: 'https://images.unsplash.com/photo-1498837167922-ddd27525d352?w=800',
        rating: 0,
        reviewCount: 0,
        mealType: [],
      });
      setForm(initialForm);
      setCreating(false);
      await loadRecipes();
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : 'Unable to save recipe.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <View style={styles.header}>
          <IconButton icon="arrow-left" onPress={goBack} />
          <View style={styles.headerText}>
            <Title style={styles.title}>My Recipes</Title>
            <Text style={styles.subtitle}>Your personal kitchen collection</Text>
          </View>
        </View>

        {creating ? (
          <Card style={styles.formCard} elevation={2}>
            <Card.Content>
              <Text style={styles.formTitle}>Create a recipe</Text>
              <Text style={styles.formHint}>Capture the ingredients and steps you love.</Text>
              <TextInput
                label="Recipe name"
                value={form.name}
                onChangeText={(value) => updateField('name', value)}
                mode="outlined"
                style={styles.input}
              />
              <TextInput
                label="Cuisine (optional)"
                value={form.cuisine}
                onChangeText={(value) => updateField('cuisine', value)}
                mode="outlined"
                style={styles.input}
              />
              <TextInput
                label="Ingredients"
                placeholder="Chicken, garlic, olive oil"
                value={form.ingredients}
                onChangeText={(value) => updateField('ingredients', value)}
                mode="outlined"
                multiline
                style={styles.input}
              />
              <TextInput
                label="Instructions"
                placeholder="One step per line"
                value={form.instructions}
                onChangeText={(value) => updateField('instructions', value)}
                mode="outlined"
                multiline
                style={[styles.input, styles.inputLarge]}
              />
              {error && <Text style={styles.error}>{error}</Text>}
              <View style={styles.actions}>
                <Button mode="outlined" onPress={() => setCreating(false)} style={styles.actionButton} disabled={saving}>
                  Cancel
                </Button>
                <Button mode="contained" onPress={() => void saveRecipe()} style={styles.actionButton} loading={saving} disabled={saving}>
                  {saving ? 'Saving' : 'Save recipe'}
                </Button>
              </View>
            </Card.Content>
          </Card>
        ) : (
          <Card style={styles.hero} elevation={2}>
            <Card.Content style={styles.heroContent}>
              <Avatar.Icon icon="silverware-fork-knife" size={48} style={styles.heroIcon} />
              <Text style={styles.heroTitle}>Cook something yours</Text>
              <Text style={styles.heroText}>
                Save family favorites, experiments, and recipes you want to make again.
              </Text>
              <Button
                mode="contained"
                icon="plus"
                onPress={() => setCreating(true)}
                style={styles.heroButton}
                labelStyle={styles.heroButtonText}
              >
                Create recipe
              </Button>
            </Card.Content>
          </Card>
        )}

        <Text style={styles.sectionTitle}>Saved recipes ({recipes.length})</Text>
        {recipes.length === 0 ? (
          <View style={styles.empty}>
            <Avatar.Icon icon="book-open-page-variant" size={64} style={styles.recipeIcon} />
            <Text style={styles.emptyTitle}>Your collection is waiting</Text>
            <Text style={styles.emptyText}>Create your first recipe and it will appear here.</Text>
          </View>
        ) : (
          recipes.map((recipe) => (
            <TouchableOpacity
              key={recipe.id}
              onPress={() => router.push(`/(app)/recipe/${encodeURIComponent(String(recipe.id))}`)}
              activeOpacity={0.8}
            >
              <Card style={styles.recipeCard} elevation={1}>
                <Card.Content style={styles.recipeContent}>
                  <Avatar.Icon icon="food" size={46} style={styles.recipeIcon} />
                  <View style={styles.recipeInfo}>
                    <Text style={styles.recipeName}>{recipe.name}</Text>
                    <Text style={styles.recipeMeta}>
                      {recipe.cuisine} · {recipe.ingredients.length} ingredients
                    </Text>
                  </View>
                </Card.Content>
              </Card>
            </TouchableOpacity>
          ))
        )}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
