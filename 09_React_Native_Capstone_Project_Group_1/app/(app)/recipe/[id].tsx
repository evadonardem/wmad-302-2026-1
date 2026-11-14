
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';

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

export default function RecipeDetailsScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();

  const [recipe, setRecipe] = useState<RecipeDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

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

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#176B63" />
        <Text style={styles.loadingText}>Loading recipe...</Text>
      </View>
    );
  }

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
          <Text style={styles.backButtonText}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      showsVerticalScrollIndicator={false}
    >
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

      <View style={styles.content}>
        <Text style={styles.category}>
          {recipe.cuisine} • {recipe.difficulty}
        </Text>

        <Text style={styles.title}>{recipe.name}</Text>

        <Text style={styles.rating}>
          ⭐ {recipe.rating} / 5
        </Text>

        <View style={styles.infoContainer}>
          <View style={styles.infoBox}>
            <Text style={styles.infoIcon}>⏱️</Text>
            <Text style={styles.infoValue}>
              {recipe.prepTimeMinutes + recipe.cookTimeMinutes} min
            </Text>
            <Text style={styles.infoLabel}>Total Time</Text>
          </View>

          <View style={styles.infoBox}>
            <Text style={styles.infoIcon}>🍽️</Text>
            <Text style={styles.infoValue}>
              {recipe.servings}
            </Text>
            <Text style={styles.infoLabel}>Servings</Text>
          </View>

          <View style={styles.infoBox}>
            <Text style={styles.infoIcon}>🔥</Text>
            <Text style={styles.infoValue}>
              {recipe.caloriesPerServing}
            </Text>
            <Text style={styles.infoLabel}>Calories</Text>
          </View>
        </View>

        <Text style={styles.sectionTitle}>Ingredients</Text>

        {recipe.ingredients.map((ingredient, index) => (
          <View key={index} style={styles.listItem}>
            <Text style={styles.bullet}>•</Text>
            <Text style={styles.listText}>{ingredient}</Text>
          </View>
        ))}

        <Text style={styles.sectionTitle}>Instructions</Text>

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

        <View style={styles.bottomSpace} />
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F7FBF9',
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F7FBF9',
    padding: 24,
  },
  loadingText: {
    marginTop: 12,
    color: '#52634F',
    fontSize: 15,
  },
  errorText: {
    color: '#D32F2F',
    fontSize: 16,
    textAlign: 'center',
  },
  imageContainer: {
    position: 'relative',
  },
  recipeImage: {
    width: '100%',
    height: 280,
  },
  backIcon: {
    position: 'absolute',
    top: 45,
    left: 18,
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  backIconText: {
    color: '#176B63',
    fontSize: 32,
    lineHeight: 36,
  },
  content: {
    padding: 20,
  },
  category: {
    color: '#176B63',
    fontSize: 13,
    fontWeight: '700',
    marginBottom: 8,
    textTransform: 'uppercase',
  },
  title: {
    color: '#294B36',
    fontSize: 27,
    fontWeight: '800',
    marginBottom: 8,
  },
  rating: {
    color: '#52634F',
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
    backgroundColor: '#E9F4E4',
    borderRadius: 14,
    padding: 12,
    alignItems: 'center',
    marginHorizontal: 4,
  },
  infoIcon: {
    fontSize: 22,
    marginBottom: 6,
  },
  infoValue: {
    color: '#294B36',
    fontSize: 15,
    fontWeight: '800',
  },
  infoLabel: {
    color: '#52634F',
    fontSize: 11,
    marginTop: 4,
  },
  sectionTitle: {
    color: '#294B36',
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
    color: '#176B63',
    fontSize: 20,
    marginRight: 10,
  },
  listText: {
    flex: 1,
    color: '#52634F',
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
    backgroundColor: '#176B63',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  stepNumberText: {
    color: '#FFFFFF',
    fontWeight: '800',
  },
  instructionText: {
    flex: 1,
    color: '#52634F',
    fontSize: 15,
    lineHeight: 23,
  },
  backButton: {
    backgroundColor: '#176B63',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 10,
    marginTop: 18,
  },
  backButtonText: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  bottomSpace: {
    height: 35,
  },
});
