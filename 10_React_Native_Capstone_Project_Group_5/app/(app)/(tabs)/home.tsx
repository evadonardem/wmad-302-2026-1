/**
 * Home Screen - Marketplace Shop Tab
 * Students implement: Product grid, categories, flash deals, recommendations
 * APIs: https://dummyjson.com/docs/products
 */
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  FlatList,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '@/context/AuthContext';
import { Card, Title, Chip, Avatar, Button, Badge } from 'react-native-paper';
import { styles } from './homeStyles';

// Types for DummyJSON Products API
interface Product {
  id: number;
  title: string;
  description: string;
  category: string;
  price: number;
  discountPercentage: number;
  rating: number;
  stock: number;
  tags: string[];
  brand?: string;
  sku: string;
  weight: number;
  dimensions: { width: number; height: number; depth: number };
  warrantyInformation: string;
  shippingInformation: string;
  availabilityStatus: string;
  reviews: Array<{ rating: number; comment: string; date: string; reviewerName: string }>;
  returnPolicy: string;
  minimumOrderQuantity: number;
  meta: { createdAt: string; updatedAt: string; barcode: string; qrCode: string };
  images: string[];
  thumbnail: string;
}

interface ProductsResponse {
  products: Product[];
  total: number;
  skip: number;
  limit: number;
}

export default function HomeScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchData = async (isRefresh = false) => {
    try {
      if (!isRefresh) setLoading(true);
      setError(null);

      const [productsRes, categoriesRes] = await Promise.all([
        fetch('https://dummyjson.com/products?limit=20'),
        fetch('https://dummyjson.com/products/categories'),
      ]);

      if (!productsRes.ok || !categoriesRes.ok) throw new Error('Failed to fetch data');

      const productsData: ProductsResponse = await productsRes.json();
      const categoriesData: string[] = await categoriesRes.json();

      setProducts(productsData.products);
      setCategories(categoriesData);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load products');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const onRefresh = () => fetchData(true);

  const renderProduct = ({ item }: { item: Product }) => {
    const discountedPrice = item.price * (1 - item.discountPercentage / 100);

    return (
      <TouchableOpacity
        style={styles.productCard}
        onPress={() => router.push(`/(app)/(tabs)/product/${item.id}`)}
        activeOpacity={0.8}
      >
        <Card style={styles.card} elevation={2}>
          <View style={styles.imageContainer}>
            <Image
              source={{ uri: item.thumbnail }}
              style={styles.productImage}
              resizeMode="contain"
            />
            {item.discountPercentage > 0 && (
              <Badge style={styles.discountBadge}>
                -{Math.round(item.discountPercentage)}%
              </Badge>
            )}
          </View>
          <Card.Content style={styles.cardContent}>
            <Text style={styles.productCategory}>{item.category}</Text>
            <Title style={styles.productTitle} numberOfLines={2}>
              {item.title}
            </Title>
            <View style={styles.priceRow}>
              <Text style={styles.currentPrice}>${discountedPrice.toFixed(2)}</Text>
              {item.discountPercentage > 0 && (
                <Text style={styles.originalPrice}>${item.price.toFixed(2)}</Text>
              )}
            </View>
            <View style={styles.ratingRow}>
              <Text style={styles.ratingText}>
                ⭐ {item.rating.toFixed(1)} · {item.stock > 0 ? 'In Stock' : 'Out of Stock'}
              </Text>
            </View>
          </Card.Content>
        </Card>
      </TouchableOpacity>
    );
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#1A73E8" />
        <Text style={styles.loadingText}>Loading products...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>{error}</Text>
        <Button mode="contained" onPress={() => fetchData()} style={styles.retryButton}>
          Retry
        </Button>
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.scrollView}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#1A73E8']} />
      }
      contentContainerStyle={styles.scrollContent}
    >
      {/* Welcome Header */}
      <View style={styles.welcomeContainer}>
        <View style={styles.welcomeTextContainer}>
          <Text style={styles.welcomeGreeting}>
            {user ? `Welcome, ${user.firstName}!` : 'Welcome to Marketplace!'}
          </Text>
          <Text style={styles.welcomeSubtitle}>Discover amazing deals</Text>
        </View>
        <Avatar.Icon size={56} icon="storefront" style={styles.welcomeAvatar} />
      </View>

      {/* Categories */}
      <View style={styles.sectionContainer}>
        <View style={styles.sectionHeader}>
          <Title style={styles.sectionTitle}>Categories</Title>
        </View>
        <FlatList
          data={categories.slice(0, 10)}
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.categoryList}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={styles.categoryChip}
              onPress={() => router.push(`/(app)/(tabs)/categories?category=${item}`)}
            >
              <Text style={styles.categoryChipText}>
                {item.charAt(0).toUpperCase() + item.slice(1).replace('-', ' ')}
              </Text>
            </TouchableOpacity>
          )}
          keyExtractor={(item) => item}
        />
      </View>

      {/* Flash Deals */}
      <View style={styles.sectionContainer}>
        <View style={styles.sectionHeader}>
          <Title style={styles.sectionTitle}>⚡ Flash Deals</Title>
          <TouchableOpacity style={styles.seeAll}>
            <Text style={styles.seeAllText}>See All</Text>
          </TouchableOpacity>
        </View>
        <FlatList
          data={products.filter((p) => p.discountPercentage > 20).slice(0, 5)}
          renderItem={renderProduct}
          keyExtractor={(item) => item.id.toString()}
          ItemSeparatorComponent={() => <View style={styles.cardSeparator} />}
        />
      </View>

      {/* Recommended Products */}
      <View style={styles.sectionContainer}>
        <View style={styles.sectionHeader}>
          <Title style={styles.sectionTitle}>Recommended for You</Title>
          <TouchableOpacity onPress={() => router.push('/(app)/(tabs)/search')} style={styles.seeAll}>
            <Text style={styles.seeAllText}>See All</Text>
          </TouchableOpacity>
        </View>
        <FlatList
          data={products.slice(0, 10)}
          renderItem={renderProduct}
          keyExtractor={(item) => item.id.toString()}
          ItemSeparatorComponent={() => <View style={styles.cardSeparator} />}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>No products found</Text>
            </View>
          }
        />
      </View>
    </ScrollView>
  );
}