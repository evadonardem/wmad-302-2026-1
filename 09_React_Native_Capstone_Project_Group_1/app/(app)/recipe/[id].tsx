
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  Share,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useThemeMode } from '@/context/ThemeContext';

interface RecipeDetails {
  id: number;
  name: string;
  image: string;
  cuisine: string;
  difficulty: string;
  prepTimeMinutes: number;
  cookTimeMinutes: number;
  servings: number;
  rating: number;
  caloriesPerServing: number;
  ingredients: string[];
  instructions: string[];
}

const LIGHT_COLORS = {
  background: '#F7FBF9',
  primary: '#176B63',
  text: '#294B36',
  muted: '#52634F',
  card: '#E9F4E4',
  buttonText: '#FFFFFF',
  backButton: '#FFFFFF',
  border: '#DCE9DF',
  error: '#D32F2F',
};

const DARK_COLORS = {
  background: '#101C18',
  primary: '#78C6A3',
  text: '#F3F7F2',
  muted: '#AAB8AE',
  card: '#1B2B24',
  buttonText: '#101C18',
  backButton: '#293B32',
  border: '#35483D',
  error: '#F07171',
};

export default function RecipeDetailsScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { isDark } = useThemeMode();

  const COLORS = isDark ? DARK_COLORS : LIGHT_COLORS;
  const styles = createStyles(COLORS);

  const [recipe, setRecipe] = useState<RecipeDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // SHARE RECIPE FUNCTION
  const handleShareRecipe = async () => {
    if (!recipe) return;

    try {
      await Share.share({
        message: `🍽️ ${recipe.name}

Cuisine: ${recipe.cuisine}
Difficulty: ${recipe.difficulty}
Preparation Time: ${recipe.prepTimeMinutes} minutes
Cooking Time: ${recipe.cookTimeMinutes} minutes
Servings: ${recipe.servings}
Calories: ${recipe.caloriesPerServing} per serving

INGREDIENTS:
${recipe.ingredients
  .map((item, index) => `${index + 1}. ${item}`)
  .join('\n')}

INSTRUCTIONS:
${recipe.instructions
  .map((item, index) => `${index + 1}. ${item}`)
  .join('\n')}

Shared from our Cookbook App!`,
      });
    } catch (error) {
      console.log('Unable to share recipe:', error);
    }
  };

  // FETCH RECIPE
  useEffect(() => {
    const fetchRecipe = async () => {
      try {
        setLoading(true);
        setError('');

        const response = await fetch(
          `https://dummyjson.com/recipes/${id}`
        );

        if (!response.ok) {
          throw new Error('Recipe not found.');
        }

        const data: RecipeDetails = await response.json();
        setRecipe(data);
      } catch (err) {
        setError(
          err instanceof Error
            ? err.message
            : 'Something went wrong.'
        );
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      fetchRecipe();
    }
  }, [id]);

  // LOADING
  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator
          size="large"
          color={COLORS.primary}
        />
        <Text style={styles.loadingText}>
          Loading recipe...
        </Text>
      </View>
    );
  }

  // ERROR
  if (error || !recipe) {
    return (
      <View style={styles.center}>
        <Text style={styles.errorText}>
          {error || 'Recipe not found.'}
        </Text>

        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <Text style={styles.backButtonText}>
            Go Back
          </Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.scrollContent}
      showsVerticalScrollIndicator={false}
    >
      {/* RECIPE IMAGE */}
      <View style={styles.imageContainer}>
        <Image
          source={{ uri: recipe.image }}
          style={styles.recipeImage}
          resizeMode="cover"
        />

        <TouchableOpacity
          style={styles.backIcon}
          onPress={() => router.back()}
        >
          <Text style={styles.backIconText}>‹</Text>
        </TouchableOpacity>
      </View>

      {/* RECIPE INFORMATION */}
      <View style={styles.content}>
        <Text style={styles.category}>
          {recipe.cuisine} • {recipe.difficulty}
        </Text>

        <Text style={styles.title}>
          {recipe.name}
        </Text>

        <Text style={styles.rating}>
          ⭐ {recipe.rating} / 5
        </Text>

        {/* RECIPE QUICK DETAILS */}
        <View style={styles.infoContainer}>
          <View style={styles.infoBox}>
            <Text style={styles.infoIcon}>⏱️</Text>
            <Text style={styles.infoValue}>
              {recipe.prepTimeMinutes + recipe.cookTimeMinutes} min
            </Text>
            <Text style={styles.infoLabel}>
              Total Time
            </Text>
          </View>

          <View style={styles.infoBox}>
            <Text style={styles.infoIcon}>🍽️</Text>
            <Text style={styles.infoValue}>
              {recipe.servings}
            </Text>
            <Text style={styles.infoLabel}>
              Servings
            </Text>
          </View>

          <View style={styles.infoBox}>
            <Text style={styles.infoIcon}>🔥</Text>
            <Text style={styles.infoValue}>
              {recipe.caloriesPerServing}
            </Text>
            <Text style={styles.infoLabel}>
              Calories
            </Text>
          </View>
        </View>

        {/* INGREDIENTS */}
        <Text style={styles.sectionTitle}>
          Ingredients
        </Text>

        {recipe.ingredients.map((ingredient, index) => (
          <View key={index} style={styles.listItem}>
            <Text style={styles.bullet}>•</Text>
            <Text style={styles.listText}>
              {ingredient}
            </Text>
          </View>
        ))}

        {/* INSTRUCTIONS */}
        <Text style={styles.sectionTitle}>
          Instructions
        </Text>

        {recipe.instructions.map((instruction, index) => (
          <View key={index} style={styles.instructionItem}>
            <View style={styles.stepNumber}>
              <Text style={styles.stepNumberText}>
                {index + 1}
              </Text>
            </View>

            <Text style={styles.instructionText}>
              {instruction}
            </Text>
          </View>
        ))}

        {/* SHARE RECIPE */}
        <TouchableOpacity
          style={styles.shareButton}
          onPress={handleShareRecipe}
          activeOpacity={0.8}
        >
          <Text style={styles.shareButtonText}>
            ↗  Share This Recipe
          </Text>
        </TouchableOpacity>

        <View style={styles.bottomSpace} />
      </View>
    </ScrollView>
  );
}

// DYNAMIC LIGHT AND DARK MODE STYLES
function createStyles(COLORS: typeof LIGHT_COLORS) {
  return StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: COLORS.background,
    },
    scrollContent: {
      flexGrow: 1,
      backgroundColor: COLORS.background,
    },
    center: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      backgroundColor: COLORS.background,
      padding: 24,
    },
    loadingText: {
      marginTop: 12,
      color: COLORS.muted,
      fontSize: 15,
    },
    errorText: {
      color: COLORS.error,
      fontSize: 16,
      textAlign: 'center',
    },
    imageContainer: {
      position: 'relative',
    },
    recipeImage: {
      width: '100%',
      height: 280,
      backgroundColor: COLORS.card,
    },
    backIcon: {
      position: 'absolute',
      top: 45,
      left: 18,
      width: 42,
      height: 42,
      borderRadius: 21,
      backgroundColor: COLORS.backButton,
      justifyContent: 'center',
      alignItems: 'center',
    },
    backIconText: {
      color: COLORS.primary,
      fontSize: 32,
      lineHeight: 36,
    },
    content: {
      padding: 20,
      backgroundColor: COLORS.background,
    },
    category: {
      color: COLORS.primary,
      fontSize: 13,
      fontWeight: '700',
      marginBottom: 8,
      textTransform: 'uppercase',
    },
    title: {
      color: COLORS.text,
      fontSize: 27,
      fontWeight: '800',
      marginBottom: 8,
    },
    rating: {
      color: COLORS.muted,
      fontSize: 15,
      marginBottom: 20,
    },
    infoContainer: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      marginBottom: 28,
    },
    infoBox: {
      flex: 1,
      backgroundColor: COLORS.card,
      borderRadius: 14,
      padding: 12,
      alignItems: 'center',
      marginHorizontal: 4,
      borderWidth: 1,
      borderColor: COLORS.border,
    },
    infoIcon: {
      fontSize: 22,
      marginBottom: 6,
    },
    infoValue: {
      color: COLORS.text,
      fontSize: 15,
      fontWeight: '800',
    },
    infoLabel: {
      color: COLORS.muted,
      fontSize: 11,
      marginTop: 4,
    },
    sectionTitle: {
      color: COLORS.text,
      fontSize: 21,
      fontWeight: '800',
      marginTop: 12,
      marginBottom: 14,
    },
    listItem: {
      flexDirection: 'row',
      marginBottom: 10,
      paddingRight: 8,
    },
    bullet: {
      color: COLORS.primary,
      fontSize: 20,
      marginRight: 10,
    },
    listText: {
      flex: 1,
      color: COLORS.muted,
      fontSize: 15,
      lineHeight: 23,
    },
    instructionItem: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      marginBottom: 16,
    },
    stepNumber: {
      width: 30,
      height: 30,
      borderRadius: 15,
      backgroundColor: COLORS.primary,
      justifyContent: 'center',
      alignItems: 'center',
      marginRight: 12,
    },
    stepNumberText: {
      color: COLORS.buttonText,
      fontWeight: '800',
    },
    instructionText: {
      flex: 1,
      color: COLORS.muted,
      fontSize: 15,
      lineHeight: 23,
    },
    backButton: {
      backgroundColor: COLORS.primary,
      paddingHorizontal: 24,
      paddingVertical: 12,
      borderRadius: 10,
      marginTop: 18,
    },
    backButtonText: {
      color: COLORS.buttonText,
      fontWeight: '700',
    },
    shareButton: {
      backgroundColor: COLORS.primary,
      paddingVertical: 16,
      borderRadius: 14,
      alignItems: 'center',
      marginTop: 20,
      marginBottom: 15,
    },
    shareButtonText: {
      color: COLORS.buttonText,
      fontSize: 16,
      fontWeight: '800',
    },
    bottomSpace: {
      height: 35,
    },
  });
}
