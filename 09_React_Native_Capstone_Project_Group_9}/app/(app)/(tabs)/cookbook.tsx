import React, { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, FlatList, Text, TouchableOpacity, View } from 'react-native';
import { useRouter } from 'expo-router';
import { Button, Card, Title } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { recipeApi } from '@/services/recipeApi';
import { getRecipeCategories } from '@/services/recipeCategories';
import { Recipe } from '@/types/recipe';

const colors = ['#E1F3EA', '#FCE6DB', '#DDEFF5', '#F8EBCB'];

export default function CookbookScreen() {
  const router = useRouter();
  const [collections, setCollections] = useState<{ name: string; count: number }[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadCollections = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await recipeApi.getWorldRecipes({ limit: 100 });
      setCollections(getRecipeCategories(response.recipes as Recipe[]));
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : 'Could not load cookbook collections.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadCollections();
  }, [loadCollections]);

  return (
    <View style={{ flex: 1, backgroundColor: '#F3F8F3' }}>
      <View style={{ paddingHorizontal: 20, paddingTop: 24, paddingBottom: 16 }}>
        <TouchableOpacity onPress={() => router.back()} accessibilityRole="button" accessibilityLabel="Go back" style={{ marginBottom: 16 }}>
          <MaterialCommunityIcons name="arrow-left" size={24} color="#183B35" />
        </TouchableOpacity>
        <Text style={{ color: '#168C78', fontSize: 11, fontWeight: '800', letterSpacing: 1.5 }}>
          YOUR COOKBOOK
        </Text>
        <Title style={{ color: '#183B35', fontSize: 27, fontWeight: '800', marginTop: 4 }}>
          Pick a collection
        </Title>
        <Text style={{ color: '#71857D', fontSize: 14, marginTop: 3 }}>
          Browse recipes by cuisine, meal, or favorite ingredients.
        </Text>
      </View>
      {loading ? (
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <ActivityIndicator size="large" color="#168C78" />
        </View>
      ) : error ? (
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: 28 }}>
          <Text style={{ color: '#49655D', textAlign: 'center', marginBottom: 14 }}>{error}</Text>
          <Button mode="contained" onPress={() => void loadCollections()} buttonColor="#168C78">Try again</Button>
        </View>
      ) : (
        <FlatList
          data={collections}
          keyExtractor={(item) => item.name}
          numColumns={2}
          showsVerticalScrollIndicator={false}
          columnWrapperStyle={{ justifyContent: 'space-between' }}
          contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 120 }}
          renderItem={({ item, index }) => (
            <TouchableOpacity
              style={{ width: '48%', marginBottom: 12 }}
              activeOpacity={0.84}
              onPress={() => router.push(`/(app)/(tabs)/search?tag=${encodeURIComponent(item.name)}`)}
            >
              <Card style={{ minHeight: 140, borderRadius: 18, backgroundColor: '#FFFFFF' }} elevation={1}>
                <Card.Content style={{ alignItems: 'center', paddingTop: 19 }}>
                  <View style={{
                    width: 49,
                    height: 49,
                    borderRadius: 17,
                    backgroundColor: colors[index % colors.length],
                    justifyContent: 'center',
                    alignItems: 'center',
                    marginBottom: 9,
                  }}>
                    <MaterialCommunityIcons name="food" size={25} color="#168C78" />
                  </View>
                  <Title numberOfLines={1} style={{ color: '#183B35', fontSize: 14, fontWeight: '700' }}>
                    {item.name}
                  </Title>
                  <Text style={{ color: '#71857D', fontSize: 11, marginTop: 2 }}>
                    {item.count} {item.count === 1 ? 'recipe' : 'recipes'}
                  </Text>
                </Card.Content>
              </Card>
            </TouchableOpacity>
          )}
          ListEmptyComponent={
            <Text style={{ color: '#71857D', textAlign: 'center', marginTop: 40 }}>
              No collections are available right now.
            </Text>
          }
        />
      )}
    </View>
  );
}
