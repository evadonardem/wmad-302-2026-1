/**
 * Search Screen - Cookbook
 * TODO: Students implement
 * - Search recipes by query (GET /recipes/search?q=)
 * - Filter by category, cuisine, difficulty
 * - Filter by meal type, prep time
 * - Sort by rating, time, calories
 * - Infinite scroll pagination
 */
import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, TextInput, FlatList, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { Card, Title, Chip, Button } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { styles } from './searchStyles';

interface Recipe {
  id: number;
  name: string;
  image: string;
  difficulty: string;
  cuisine: string;
  prepTimeMinutes: number;
  cookTimeMinutes: number;
  servings: number;
  rating: number;
}

export default function SearchScreen() {
  const router = useRouter();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<Recipe[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  const categories = [
    'Beef', 'Chicken', 'Dessert', 'Lamb', 'Pasta', 'Pork', 'Seafood', 'Vegetarian',
  ];

  const handleSearch = async () => {
    if (!query.trim()) return;
    setLoading(true);
    try {
      // TODO: Student implementation
      // const response = await fetch(`https://dummyjson.com/recipes/search?q=${encodeURIComponent(query)}`);
      // const data = await response.json();
      // setResults(data.recipes || []);
      Alert.alert('TODO', 'Implement search: GET /recipes/search?q=' + query);
    } catch {
      // Handle error
    } finally {
      setLoading(false);
    }
  };

  const renderResult = ({ item }: { item: Recipe }) => (
    <TouchableOpacity
      style={styles.resultCard}
      onPress={() => router.push(`/(app)/(tabs)/recipe/${item.id}`)}
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

  // Import Alert for TODO alert
  const { Alert } = require('react-native');

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Search Bar */}
      <View style={styles.searchBarContainer}>
        <TextInput
          style={styles.searchInput}
          placeholder="Search recipes..."
          value={query}
          onChangeText={setQuery}
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
              onPress={() => setSelectedCategory(selectedCategory === item ? null : item)}
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
        ) : results.length === 0 && query ? (
          <View style={styles.emptyState}>
            <MaterialCommunityIcons name="magnify" size={64} color="#BCAAA4" />
            <Text style={styles.emptyText}>No recipes found</Text>
            <Text style={styles.emptySubtext}>Try a different search term</Text>
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

      {/* Student Guide */}
      <View style={styles.guideContainer}>
        <Text style={styles.guideTitle}>📝 Student Implementation Guide</Text>
        <Text style={styles.guideText}>
          Complete the search functionality:\n
          1. Call GET /recipes/search?q={query}\n
          2. Add category filter: &category={category}\n
          3. Add pagination with skip/limit\n
          4. Implement infinite scroll\n
          5. Add sort options (rating, time, calories)
        </Text>
      </View>
    </ScrollView>
  );
}

// Need Image import
import { Image } from 'react-native';