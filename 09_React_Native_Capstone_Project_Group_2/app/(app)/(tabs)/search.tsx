/** Search recipes by query or category. */
import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, FlatList, TouchableOpacity, ActivityIndicator, Image, Alert } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Card, Title, Chip, TextInput as PaperTextInput } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { styles } from '@/styles/searchStyles';
import { recipeApi } from '@/services/recipeApi';
import { Recipe } from '@/types/recipe';

export default function SearchScreen() {
  const router = useRouter();
  const { category: categoryParam } = useLocalSearchParams<{ category?: string }>();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<Recipe[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(categoryParam || null);

  const categories = [
    'Beef', 'Chicken', 'Dessert', 'Lamb', 'Pasta', 'Pork', 'Seafood', 'Vegetarian',
  ];

  const loadResults = async (category: string | null, searchQuery: string) => {
    if (!searchQuery && !category) {
      setResults([]);
      return;
    }

    setLoading(true);
    try {
      const response = category
        ? await recipeApi.getRecipesByCategory(category, { limit: 30 })
        : await recipeApi.searchRecipes(searchQuery, { limit: 30 });
      setResults(response.recipes);
    } catch (error) {
      Alert.alert('Search failed', error instanceof Error ? error.message : 'Unable to load recipes.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (typeof categoryParam === 'string') {
      setSelectedCategory(categoryParam);
      void loadResults(categoryParam, '');
    }
  }, [categoryParam]);

  const handleSearch = () => {
    void loadResults(selectedCategory, query.trim());
  };

  const handleCategoryPress = (category: string) => {
    const nextCategory = selectedCategory === category ? null : category;
    setSelectedCategory(nextCategory);
    void loadResults(nextCategory, query.trim());
  };

  const renderResult = ({ item }: { item: Recipe }) => (
    <TouchableOpacity
      style={styles.resultCard}
      onPress={() => router.push(`/(app)/recipe/${encodeURIComponent(String(item.id))}`)}
    >
      <Card style={styles.card} elevation={1}>
        <View style={styles.resultContent}>
          <Image source={{ uri: item.image }} style={styles.resultImage} resizeMode="cover" />
          <View style={styles.resultInfo}>
            <Title style={styles.resultTitle} numberOfLines={1}>{item.name}</Title>
            <View style={styles.resultMeta}>
              <Chip style={styles.difficultyChip}>{item.difficulty}</Chip>
              <Chip style={styles.cuisineChip}>{item.cuisine}</Chip>
            </View>
            <Text style={styles.resultDetails}>
              ⏱️ {item.prepTimeMinutes + item.cookTimeMinutes}min · 👥 {item.servings} · ⭐ {item.rating}
            </Text>
          </View>
        </View>
      </Card>
    </TouchableOpacity>
  );

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Search Bar */}
      <View style={styles.searchBarContainer}>
        <PaperTextInput
          style={styles.searchInput}
          placeholder="Search recipes..."
          value={query}
          onChangeText={(text) => {
            setQuery(text);
            if (text.trim()) {
              setSelectedCategory(null);
            }
          }}
          onSubmitEditing={handleSearch}
          left={<MaterialCommunityIcons name="magnify" size={24} color="#8D6E63" style={{ marginLeft: 12 }} />}
          right={
            query ? (
              <TouchableOpacity onPress={() => setQuery('')} style={styles.clearButton}>
                <MaterialCommunityIcons name="close" size={24} color="#8D6E63" style={{ marginRight: 12 }} />
              </TouchableOpacity>
            ) : (
              <TouchableOpacity onPress={handleSearch} disabled={loading} style={styles.searchButton}>
                {loading ? (
                  <ActivityIndicator size="small" color="white" />
                ) : (
                  <MaterialCommunityIcons name="magnify" size={24} color="white" />
                )}
              </TouchableOpacity>
            )
          }
        />
      </View>

      {/* Category Filters */}
      <View style={styles.filterSection}>
        <Title style={styles.filterTitle}>Categories</Title>
        <FlatList
          data={categories}
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filterList}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={[
                styles.filterChip,
                selectedCategory === item && styles.filterChipSelected,
              ]}
              onPress={() => handleCategoryPress(item)}
            >
              <Text style={[
                styles.filterChipText,
                selectedCategory === item && styles.filterChipTextSelected,
              ]}>
                {item}
              </Text>
            </TouchableOpacity>
          )}
          keyExtractor={(item) => item}
        />
      </View>

      {/* Results */}
      <View style={styles.resultsSection}>
        <Title style={styles.resultsTitle}>
          Results {query ? `for "${query}"` : ''} {results.length > 0 && `(${results.length})`}
        </Title>
        {loading ? (
          <View style={styles.loadingCenter}>
            <ActivityIndicator size="large" color="#E85D04" />
          </View>
        ) : results.length === 0 && (query || selectedCategory) ? (
          <View style={styles.emptyState}>
            <MaterialCommunityIcons name="magnify" size={64} color="#BCAAA4" />
            <Text style={styles.emptyText}>No recipes found</Text>
            <Text style={styles.emptySubtext}>Try a different search or category</Text>
          </View>
        ) : (
          <FlatList
            data={results}
            renderItem={renderResult}
            keyExtractor={(item) => item.id.toString()}
            contentContainerStyle={styles.resultsList}
            ItemSeparatorComponent={() => <View style={styles.separator} />}
          />
        )}
      </View>

    </ScrollView>
  );
}