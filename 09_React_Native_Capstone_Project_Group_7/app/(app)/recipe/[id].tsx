/**
 * Recipe Detail Screen - Cookbook
 * Full-bleed hero food photography, servings scaler, ingredients, instructions, and favorite toggle
 */
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  Image,
  ActivityIndicator,
  StyleSheet,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Card, Title, Chip, Button, IconButton } from 'react-native-paper';
import { recipeApi } from '@/services/recipeApi';
import { favoritesStorage } from '@/utils/storage';
import { Recipe } from '@/types/recipe';

export default function RecipeDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const recipeId = Number(id);

  const [recipe, setRecipe] = useState<Recipe | null>(null);
  const [loading, setLoading] = useState(true);
  const [isFavorite, setIsFavorite] = useState(false);
  const [servings, setServings] = useState(1);

  useEffect(() => {
    let active = true;
    async function load() {
      try {
        setLoading(true);
        const [data, favIds] = await Promise.all([
          recipeApi.getRecipeById(recipeId),
          favoritesStorage.getIds(),
        ]);
        if (!active) return;
        setRecipe(data);
        setServings(data.servings || 1);
        setIsFavorite(favIds.includes(recipeId));
      } catch (err) {
        console.error('Failed to load recipe detail:', err);
      } finally {
        if (active) setLoading(false);
      }
    }
    if (recipeId) load();
    return () => {
      active = false;
    };
  }, [recipeId]);

  const toggleFavorite = async () => {
    const next = await favoritesStorage.toggleId(recipeId);
    setIsFavorite(next);
  };

  const scaleIngredient = (line: string): string => {
    if (!recipe || !recipe.servings || servings === recipe.servings) return line;
    const ratio = servings / recipe.servings;
    return line.replace(/^(\d+(?:\.\d+)?)/, (match) => {
      const val = parseFloat(match) * ratio;
      return Number.isInteger(val) ? String(val) : val.toFixed(1);
    });
  };

  if (loading || !recipe) {
    return (
      <View style={ui.centerBox}>
        <ActivityIndicator size="large" color="#E85D04" />
        <Text style={ui.statusText}>Loading recipe...</Text>
      </View>
    );
  }

  return (
    <ScrollView style={ui.screen} contentContainerStyle={ui.container}>
      <View style={ui.topBar}>
        <Button icon="arrow-left" mode="text" textColor="#3E2723" onPress={() => router.back()}>
          Back
        </Button>
        <IconButton
          icon={isFavorite ? 'heart' : 'heart-outline'}
          iconColor={isFavorite ? '#C62828' : '#3E2723'}
          size={26}
          onPress={toggleFavorite}
        />
      </View>

      <View style={ui.heroWrapper}>
        <Image source={{ uri: recipe.image }} style={ui.heroImage} resizeMode="cover" />
        <View style={ui.heroBadgeRow}>
          <Chip style={ui.badgeChip}>{recipe.cuisine}</Chip>
          <Chip style={ui.badgeChip}>{recipe.difficulty}</Chip>
          <Chip style={ui.badgeChip}>⭐ {recipe.rating.toFixed(1)}</Chip>
        </View>
      </View>

      <Title style={ui.title}>{recipe.name}</Title>

      <View style={ui.statsGrid}>
        <View style={ui.statCard}>
          <Text style={ui.statLabel}>Prep</Text>
          <Text style={ui.statValue}>{recipe.prepTimeMinutes}m</Text>
        </View>
        <View style={ui.statCard}>
          <Text style={ui.statLabel}>Cook</Text>
          <Text style={ui.statValue}>{recipe.cookTimeMinutes}m</Text>
        </View>
        <View style={ui.statCard}>
          <Text style={ui.statLabel}>Calories</Text>
          <Text style={ui.statValue}>{recipe.caloriesPerServing}</Text>
        </View>
        <View style={ui.statCard}>
          <Text style={ui.statLabel}>Reviews</Text>
          <Text style={ui.statValue}>{recipe.reviewCount}</Text>
        </View>
      </View>

      <Card style={ui.sectionCard}>
        <Card.Content>
          <View style={ui.servingsHeader}>
            <Title style={ui.sectionTitle}>Ingredients</Title>
            <View style={ui.stepper}>
              <IconButton
                icon="minus"
                size={18}
                onPress={() => setServings((s) => Math.max(1, s - 1))}
              />
              <Text style={ui.servingsText}>{servings} servings</Text>
              <IconButton icon="plus" size={18} onPress={() => setServings((s) => s + 1)} />
            </View>
          </View>
          {recipe.ingredients.map((ing, idx) => (
            <View key={idx} style={ui.ingredientRow}>
              <Text style={ui.bullet}>•</Text>
              <Text style={ui.ingredientText}>{scaleIngredient(ing)}</Text>
            </View>
          ))}
        </Card.Content>
      </Card>

      <Card style={ui.sectionCard}>
        <Card.Content>
          <Title style={ui.sectionTitle}>Instructions</Title>
          {recipe.instructions.map((step, idx) => (
            <View key={idx} style={ui.stepRow}>
              <View style={ui.stepNumber}>
                <Text style={ui.stepNumberText}>{idx + 1}</Text>
              </View>
              <Text style={ui.stepText}>{step}</Text>
            </View>
          ))}
        </Card.Content>
      </Card>
    </ScrollView>
  );
}

const ui = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#FAF6F0',
  },
  container: {
    width: '100%',
    maxWidth: 820,
    alignSelf: 'center',
    padding: 16,
    paddingBottom: 40,
  },
  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  heroWrapper: {
    position: 'relative',
    width: '100%',
    height: 310,
    borderRadius: 20,
    overflow: 'hidden',
    backgroundColor: '#EFE6DD',
    marginBottom: 16,
  },
  heroImage: {
    width: '100%',
    height: '100%',
  },
  heroBadgeRow: {
    position: 'absolute',
    bottom: 12,
    left: 12,
    flexDirection: 'row',
    gap: 8,
  },
  badgeChip: {
    backgroundColor: 'rgba(255, 253, 248, 0.94)',
  },
  title: {
    fontSize: 26,
    fontWeight: '800',
    color: '#2D1B14',
    marginBottom: 14,
  },
  statsGrid: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 16,
  },
  statCard: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 12,
    alignItems: 'center',
  },
  statLabel: {
    fontSize: 12,
    color: '#8D6E63',
    fontWeight: '600',
  },
  statValue: {
    fontSize: 17,
    fontWeight: '800',
    color: '#E85D04',
    marginTop: 2,
  },
  sectionCard: {
    borderRadius: 18,
    backgroundColor: '#FFFFFF',
    marginBottom: 16,
  },
  servingsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  sectionTitle: {
    fontSize: 19,
    fontWeight: '700',
    color: '#2D1B14',
  },
  stepper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FAF6F0',
    borderRadius: 12,
  },
  servingsText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#3E2723',
  },
  ingredientRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingVertical: 6,
    gap: 8,
  },
  bullet: {
    color: '#E85D04',
    fontSize: 16,
    fontWeight: '700',
  },
  ingredientText: {
    flex: 1,
    fontSize: 15,
    color: '#3E2723',
  },
  stepRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    marginTop: 12,
  },
  stepNumber: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#E85D04',
    justifyContent: 'center',
    alignItems: 'center',
  },
  stepNumberText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 13,
  },
  stepText: {
    flex: 1,
    fontSize: 15,
    lineHeight: 22,
    color: '#3E2723',
  },
  centerBox: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FAF6F0',
  },
  statusText: {
    marginTop: 10,
    color: '#7A6258',
  },
});
