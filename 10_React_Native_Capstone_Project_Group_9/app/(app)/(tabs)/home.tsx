/**
 * Home Screen - NextDoorFinds shop tab
 * Students implement: Product grid, categories, flash deals, recommendations
 * APIs: https://dummyjson.com/docs/products
 */
import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  ScrollView,
  FlatList,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  RefreshControl,
  useWindowDimensions,
  ImageBackground,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '@/context/AuthContext';
import { Card, Title, Button, Badge, TextInput as PaperTextInput } from 'react-native-paper';
import { productApi } from '@/services/productApi';
import type { Product } from '@/types/product';
import { useCurrencyFormatter } from '@/hooks/useCurrency';
import { styles } from './homeStyles';

type Category = string | { slug: string; name?: string };

function getCategorySlug(category: Category): string {
  return typeof category === 'string' ? category : category.slug;
}

function getCategoryLabel(category: Category): string {
  const label = typeof category === 'string' ? category : category.name || category.slug;
  return label.charAt(0).toUpperCase() + label.slice(1).replace('-', ' ');
}

export default function HomeScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const formatPrice = useCurrencyFormatter();
  const { width } = useWindowDimensions();
  const productColumns = width >= 1000 ? 4 : 2;
  const [products, setProducts] = useState<Product[]>([]);
  const [totalProducts, setTotalProducts] = useState(0);
  const [categories, setCategories] = useState<Category[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [loadingMoreError, setLoadingMoreError] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const loadingMoreRef = useRef(false);

  const fetchData = async (isRefresh = false) => {
    try {
      if (!isRefresh) setLoading(true);
      setError(null);
      setLoadingMoreError(null);

      const [productsData, categoriesData] = await Promise.all([
        productApi.getProducts({ limit: 20, skip: 0 }),
        productApi.getCategories(),
      ]);

      setProducts(productsData.products);
      setTotalProducts(productsData.total);
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

  const loadMoreProducts = async () => {
    if (loadingMoreRef.current || loading || products.length >= totalProducts) return;
    loadingMoreRef.current = true;
    setLoadingMore(true);
    setLoadingMoreError(null);
    try {
      const response = await productApi.getProducts({ limit: 20, skip: products.length });
      setProducts((current) => {
        const existingIds = new Set(current.map((product) => product.id));
        return [...current, ...response.products.filter((product) => !existingIds.has(product.id))];
      });
      setTotalProducts(response.total);
    } catch (err) {
      setLoadingMoreError(err instanceof Error ? err.message : 'Unable to load more products.');
    } finally {
      loadingMoreRef.current = false;
      setLoadingMore(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    void fetchData(true);
  };

  const openSearch = () => {
    const query = searchQuery.trim();
    router.push(query
      ? `/(app)/(tabs)/search?q=${encodeURIComponent(query)}`
      : '/(app)/(tabs)/search');
  };

  const renderProduct = ({ item }: { item: Product }) => {
    const discountedPrice = item.price * (1 - item.discountPercentage / 100);

    return (
      <TouchableOpacity
        style={[
          styles.productCard,
          productColumns === 2 && styles.productCardWide,
          productColumns === 4 && styles.productCardFour,
        ]}
        onPress={() => router.push(`/(app)/product/${item.id}`)}
        activeOpacity={0.8}
      >
        <Card style={styles.card} elevation={0}>
          <View style={[styles.imageContainer, productColumns === 2 && styles.imageContainerWide]}>
            <Image
              source={{ uri: item.thumbnail }}
              style={styles.productImage}
              resizeMode="contain"
            />
            {item.discountPercentage > 0 && (
              <Badge style={styles.discountBadge}>
                {`-${Math.round(item.discountPercentage)}%`}
              </Badge>
            )}
          </View>
          <Card.Content style={styles.cardContent}>
            <Text style={styles.productCategory}>{item.category}</Text>
            <Title style={styles.productTitle} numberOfLines={2}>
              {item.title}
            </Title>
            <View style={styles.priceRow}>
              <Text style={styles.currentPrice}>{formatPrice(discountedPrice)}</Text>
              {item.discountPercentage > 0 && (
                <Text style={styles.originalPrice}>{formatPrice(item.price)}</Text>
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
        <ActivityIndicator size="large" color="#708066" />
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
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#708066']} />
      }
      contentContainerStyle={styles.scrollContent}
      scrollEventThrottle={300}
      onScroll={(event) => {
        const { contentOffset, contentSize, layoutMeasurement } = event.nativeEvent;
        const nearBottom = contentOffset.y + layoutMeasurement.height >= contentSize.height - 240;
        if (nearBottom && !loading && !loadingMore && !loadingMoreError && products.length < totalProducts) {
          void loadMoreProducts();
        }
      }}
    >
      {/* Welcome Header */}
      <ImageBackground
        source={{ uri: 'https://images.unsplash.com/photo-1600566753086-00f18fb6b3ea?auto=format&fit=crop&w=1400&q=85' }}
        style={styles.heroContainer}
        imageStyle={styles.heroImage}
        resizeMode="cover"
      >
        <View style={styles.heroOverlay} />
        <View style={styles.heroContent}>
          <Text style={styles.heroKicker}>NEXTDOORFINDS CURATED</Text>
          <Text style={styles.heroTitle}>Life, Handcrafted & Natural.</Text>
          <Text style={styles.heroSubtitle}>
            {user ? `A warm welcome, ${user.firstName}. ` : ''}
            Everyday essentials made with care.
          </Text>
          <TouchableOpacity
            style={styles.heroButton}
            onPress={() => router.push('/(app)/(tabs)/search')}
          >
            <Text style={styles.heroButtonText}>Explore the collection</Text>
          </TouchableOpacity>
        </View>
      </ImageBackground>

      <View style={styles.homeSearchContainer}>
        <PaperTextInput
          mode="outlined"
          value={searchQuery}
          onChangeText={setSearchQuery}
          placeholder="Search products..."
          accessibilityLabel="Search products"
          returnKeyType="search"
          onSubmitEditing={openSearch}
          style={styles.homeSearchInput}
          right={<PaperTextInput.Icon icon="magnify" onPress={openSearch} />}
        />
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
              onPress={() => router.push(`/(app)/(tabs)/categories?category=${encodeURIComponent(getCategorySlug(item))}`)}
            >
              <Text style={styles.categoryChipText}>{getCategoryLabel(item)}</Text>
            </TouchableOpacity>
          )}
          keyExtractor={(item) => getCategorySlug(item)}
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
          key={`flash-deals-${productColumns}`}
          numColumns={productColumns}
          scrollEnabled={false}
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
          key={`recommended-${productColumns}`}
          numColumns={productColumns}
          scrollEnabled={false}
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

      <View style={styles.sectionContainer}>
        <View style={styles.sectionHeader}>
          <Title style={styles.sectionTitle}>More to Explore</Title>
        </View>
        <FlatList
          data={products.slice(10)}
          key={`more-products-${productColumns}`}
          numColumns={productColumns}
          scrollEnabled={false}
          renderItem={renderProduct}
          keyExtractor={(item) => item.id.toString()}
          ItemSeparatorComponent={() => <View style={styles.cardSeparator} />}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>No more products to show</Text>
            </View>
          }
        />
        {loadingMore ? (
          <View style={styles.loadingMore}>
            <ActivityIndicator size="small" color="#708066" />
            <Text style={styles.loadingMoreText}>Loading more products...</Text>
          </View>
        ) : null}
        {loadingMoreError ? (
          <View style={styles.loadMoreError}>
            <Text style={styles.errorText}>{loadingMoreError}</Text>
            <Button mode="outlined" onPress={() => void loadMoreProducts()}>Try again</Button>
          </View>
        ) : null}
        {!loadingMore && !loadingMoreError && products.length >= totalProducts ? (
          <Text style={styles.endOfProducts}>You have reached the end.</Text>
        ) : null}
      </View>
    </ScrollView>
  );
}