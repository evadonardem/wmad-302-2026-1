
import React, { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, FlatList, Image, Text, TouchableOpacity, View } from 'react-native';
import { useRouter } from 'expo-router';
import { Button, Card, Chip, Title } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { recipeApi } from '@/services/recipeApi';
import { Recipe } from '@/types/recipe';
import { styles } from './searchStyles';

export default function MyRecipesScreen() {
  const router = useRouter();
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadRecipes = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await recipeApi.getWorldRecipes({ limit: 100 });
      setRecipes(response.recipes);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : 'Could not load recipes.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadRecipes();
  }, [loadRecipes]);

  return (
    <View style={[styles.container, { backgroundColor: '#F3F8F3' }]}>
      <View style={{ paddingHorizontal: 20, paddingTop: 24, paddingBottom: 16 }}>
        <TouchableOpacity onPress={() => router.back()} accessibilityRole="button" accessibilityLabel="Go back" style={{ marginBottom: 16 }}>
          <MaterialCommunityIcons name="arrow-left" size={24} color="#183B35" />
        </TouchableOpacity>
        <Text style={{ color: '#168C78', fontSize: 11, fontWeight: '800', letterSpacing: 1.5 }}>
          YOUR KITCHEN
        </Text>
        <Title style={{ color: '#183B35', fontSize: 27, fontWeight: '800', marginTop: 4 }}>
          Recipe Library
        </Title>
        <Text style={{ color: '#71857D', fontSize: 14, marginTop: 3 }}>
          {recipes.length} recipes ready to inspire your next meal
        </Text>
      </View>
      {loading ? (
        <View style={styles.loadingCenter}>
          <ActivityIndicator size="large" color="#168C78" />
        </View>
      ) : error ? (
        <View style={styles.emptyState}>
          <Text style={styles.emptyText}>{error}</Text>
          <Button mode="contained" onPress={() => void loadRecipes()} buttonColor="#168C78">Try again</Button>
        </View>
      ) : (
        <FlatList
          data={recipes}
          keyExtractor={(item) => item.id.toString()}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 120 }}
          ItemSeparatorComponent={() => <View style={{ height: 10 }} />}
          renderItem={({ item }) => (
            <TouchableOpacity onPress={() => router.push(`/(app)/recipe/${item.id}`)} activeOpacity={0.85}>
              <Card style={{ borderRadius: 17, backgroundColor: '#FFFFFF' }} elevation={1}>
                <View style={{ flexDirection: 'row', alignItems: 'center', padding: 11 }}>
                  <Image source={{ uri: item.image }} style={{ width: 82, height: 82, borderRadius: 13 }} />
                  <View style={{ flex: 1, marginLeft: 13 }}>
                    <Title numberOfLines={2} style={{ color: '#183B35', fontSize: 15, fontWeight: '700' }}>
                      {item.name}
                    </Title>
                    <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 6, flexWrap: 'wrap' }}>
                      <Chip compact style={{ backgroundColor: '#E1F3EA', marginRight: 6 }}>{item.cuisine}</Chip>
                      <Text style={{ color: '#71857D', fontSize: 12 }}>
                        {item.prepTimeMinutes + item.cookTimeMinutes > 0
                          ? `${item.prepTimeMinutes + item.cookTimeMinutes} min`
                          : 'Traditional recipe'}
                        {item.rating > 0 ? ` · ★ ${item.rating.toFixed(1)}` : ''}
                      </Text>
                    </View>
                  </View>
                  <MaterialCommunityIcons name="chevron-right" size={23} color="#168C78" />
                </View>
              </Card>
            </TouchableOpacity>
          )}
        />
      )}
    </View>
  );
}
