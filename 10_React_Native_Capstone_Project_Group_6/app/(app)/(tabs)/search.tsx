/**
 * Search Screen - Marketplace
 * TODO: Students implement
 * - Search products by query (GET /products/search?q=)
 * - Filter by category, brand, price range
 * - Sort by price, rating, discount, newest
 * - Infinite scroll pagination
 */
import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, FlatList, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { Card, Title, Chip, Button, TextInput as PaperTextInput } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { styles } from './searchStyles';

interface Product {
  id: number;
  title: string;
  thumbnail: string;
  category: string;
  price: number;
  discountPercentage: number;
  rating: number;
  stock: number;
}

export default function SearchScreen() {
  const router = useRouter();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<Product[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState<'price' | 'rating' | 'discount' | 'newest'>('rating');

  const categories = [
    'smartphones', 'laptops', 'fragrances', 'skincare', 'groceries', 'home-decoration',
  ];

  const handleSearch = async () => {
    if (!query.trim()) return;
    setLoading(true);
    try {
      // TODO: Student implementation
      // const response = await fetch(`https://dummyjson.com/products/search?q=${encodeURIComponent(query)}`);
      // const data = await response.json();
      // setResults(data.products || []);
      Alert.alert('TODO', 'Implement search: GET /products/search?q=' + query);
    } catch {
      // Handle error
    } finally {
      setLoading(false);
    }
  };

  const renderResult = ({ item }: { item: Product }) => {
    const discountedPrice = item.price * (1 - item.discountPercentage / 100);
    return (
      <TouchableOpacity
        style={styles.resultCard}
        onPress={() => router.push(`/(app)/(tabs)/product/${item.id}`)}
      >
        <Card style={styles.card} elevation={1}>
          <View style={styles.resultContent}>
            <Image source={{ uri: item.thumbnail }} style={styles.resultImage} resizeMode="contain" />
            <View style={styles.resultInfo}>
              <Text style={styles.resultCategory}>{item.category}</Text>
              <Title style={styles.resultTitle} numberOfLines={2}>{item.title}</Title>
              <View style={styles.resultPrice}>
                <Text style={styles.currentPrice}>${discountedPrice.toFixed(2)}</Text>
                {item.discountPercentage > 0 && (
                  <Text style={styles.originalPrice}>${item.price.toFixed(2)}</Text>
                )}
              </View>
              <Text style={styles.resultDetails}>
                ⭐ {item.rating} · {item.stock > 0 ? 'In Stock' : 'Out of Stock'}
              </Text>
            </View>
          </View>
        </Card>
      </TouchableOpacity>
    );
  };

  const { Alert } = require('react-native');

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Search Bar */}
      <View style={styles.searchBarContainer}>
        <PaperTextInput
          style={styles.searchInput}
          placeholder="Search products..."
          value={query}
          onChangeText={setQuery}
          onSubmitEditing={handleSearch}
          left={<MaterialCommunityIcons name="magnify" size={24} color="#5F6368" style={{ marginLeft: 12 }} />}
          right={
            query ? (
              <TouchableOpacity onPress={() => setQuery('')} style={styles.clearButton}>
                <MaterialCommunityIcons name="close" size={24} color="#5F6368" style={{ marginRight: 12 }} />
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
                {item.charAt(0).toUpperCase() + item.slice(1).replace('-', ' ')}
              </Text>
            </TouchableOpacity>
          )}
          keyExtractor={(item) => item}
        />
      </View>

      {/* Sort Options */}
      <View style={styles.sortSection}>
        <Title style={styles.filterTitle}>Sort By</Title>
        <View style={styles.sortOptions}>
          {(['price', 'rating', 'discount', 'newest'] as const).map((option) => (
            <TouchableOpacity
              key={option}
              style={[
                styles.sortChip,
                sortBy === option && styles.sortChipSelected,
              ]}
              onPress={() => setSortBy(option)}
            >
              <Text style={[
                styles.sortChipText,
                sortBy === option && styles.sortChipTextSelected,
              ]}>
                {option.charAt(0).toUpperCase() + option.slice(1)}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Results */}
      <View style={styles.resultsSection}>
        <Title style={styles.resultsTitle}>
          Results {query ? `for "${query}"` : ''} {results.length > 0 && `(${results.length})`}
        </Title>
        {loading ? (
          <View style={styles.loadingCenter}>
            <ActivityIndicator size="large" color="#1A73E8" />
          </View>
        ) : results.length === 0 && query ? (
          <View style={styles.emptyState}>
            <MaterialCommunityIcons name="magnify" size={64} color="#DADCE0" />
            <Text style={styles.emptyText}>No products found</Text>
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
          1. Call GET /products/search?q={query}\n
          2. Add category filter: &category={'{category}'}\n
          3. Add price range filters\n
          4. Implement sort: price, rating, discount\n
          5. Add pagination with skip/limit
        </Text>
      </View>
    </ScrollView>
  );
}

import { Image } from 'react-native';