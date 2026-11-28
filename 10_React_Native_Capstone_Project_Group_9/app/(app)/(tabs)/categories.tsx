import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, FlatList, Image, RefreshControl, Text, TouchableOpacity, View } from 'react-native';
import { useRouter } from 'expo-router';
import { Card, Title } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { productApi } from '@/services/productApi';
import { styles } from './categoriesStyles';

interface Category {
  name: string;
  count: number;
  thumbnail: string;
}

interface FeaturedBrand {
  name: string;
  count: number;
}

const departments = ['All', 'Beauty', 'Fashion', 'Home', 'Electronics', 'Lifestyle', 'Vehicles', 'Grocery'];

export default function CategoriesScreen() {
  const router = useRouter();
  const [categories, setCategories] = useState<Category[]>([]);
  const [brands, setBrands] = useState<FeaturedBrand[]>([]);
  const [department, setDepartment] = useState('All');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadCategories = useCallback(async (refresh = false) => {
    if (refresh) setRefreshing(true);
    else setLoading(true);
    setError(null);
    try {
      const [categoryNames, productsResponse] = await Promise.all([
        productApi.getCategories(),
        productApi.getProducts({ limit: 100, select: 'brand' }),
      ]);
      const categoryResults = await Promise.all(
        categoryNames.map(async (name) => {
          const response = await productApi.getProductsByCategory(name, { limit: 1 });
          return {
            name,
            count: response.total,
            thumbnail: response.products[0]?.thumbnail ?? '',
          };
        })
      );
      const brandCounts = new Map<string, number>();
      productsResponse.products.forEach((product) => {
        if (product.brand?.trim()) {
          brandCounts.set(product.brand, (brandCounts.get(product.brand) ?? 0) + 1);
        }
      });

      setCategories(categoryResults);
      setBrands(
        [...brandCounts.entries()]
          .map(([name, count]) => ({ name, count }))
          .sort((left, right) => right.count - left.count || left.name.localeCompare(right.name))
          .slice(0, 8)
      );
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : 'Failed to load categories.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    void loadCategories();
  }, [loadCategories]);

  const visibleCategories = useMemo(
    () => department === 'All'
      ? categories
      : categories.filter((category) => getDepartment(category.name) === department),
    [categories, department]
  );

  const navigateToSearch = (params: { category?: string; brand?: string }) => {
    const query = params.category
      ? `category=${encodeURIComponent(params.category)}`
      : `brand=${encodeURIComponent(params.brand ?? '')}`;
    router.push(`/(app)/(tabs)/search?${query}`);
  };

  const renderCategory = ({ item }: { item: Category }) => (
    <TouchableOpacity
      style={styles.categoryCard}
      onPress={() => navigateToSearch({ category: item.name })}
      activeOpacity={0.8}
      accessibilityRole="button"
      accessibilityLabel={`Browse ${formatCategory(item.name)}, ${item.count} products`}
    >
      <Card style={styles.card} elevation={1}>
        <View style={styles.categoryBanner}>
          {item.thumbnail ? (
            <Image source={{ uri: item.thumbnail }} style={styles.categoryImage} resizeMode="cover" />
          ) : null}
          <View style={styles.iconContainer}>
            <MaterialCommunityIcons
              name={getCategoryIcon(item.name)}
              size={30}
              color="#708066"
            />
          </View>
        </View>
        <Card.Content style={styles.cardContent}>
          <Title style={styles.categoryName}>{formatCategory(item.name)}</Title>
          <Text style={styles.categoryCount}>{item.count} products</Text>
        </Card.Content>
      </Card>
    </TouchableOpacity>
  );

  const listHeader = (
    <View>
      <Text style={styles.pageTitle}>Categories</Text>
      <Text style={styles.pageSubtitle}>Browse products by category</Text>

      <Title style={styles.sectionTitle}>Shop by department</Title>
      <FlatList
        horizontal
        data={departments}
        keyExtractor={(item) => item}
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.chipList}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={[styles.departmentChip, department === item && styles.departmentChipSelected]}
            onPress={() => setDepartment(item)}
            accessibilityRole="button"
            accessibilityState={{ selected: department === item }}
          >
            <Text style={[styles.departmentChipText, department === item && styles.departmentChipTextSelected]}>
              {item}
            </Text>
          </TouchableOpacity>
        )}
      />

      <Title style={styles.sectionTitle}>Featured brands</Title>
      {brands.length ? (
        <FlatList
          horizontal
          data={brands}
          keyExtractor={(item) => item.name}
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.chipList}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={styles.brandCard}
              onPress={() => navigateToSearch({ brand: item.name })}
              accessibilityRole="button"
              accessibilityLabel={`Browse ${item.name}, ${item.count} products`}
            >
              <MaterialCommunityIcons name="tag-outline" size={18} color="#708066" />
              <Text style={styles.brandName}>{item.name}</Text>
            </TouchableOpacity>
          )}
        />
      ) : (
        <Text style={styles.emptyBrands}>No featured brands available.</Text>
      )}
      <Title style={styles.sectionTitle}>Browse categories</Title>
    </View>
  );

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#708066" />
        <Text style={styles.loadingText}>Loading categories...</Text>
      </View>
    );
  }

  if (error && categories.length === 0) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>{error}</Text>
        <TouchableOpacity style={styles.retryButton} onPress={() => void loadCategories()}>
          <Text style={styles.retryButtonText}>Try again</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {error ? <Text style={styles.errorText}>{error}</Text> : null}
      <FlatList
        data={visibleCategories}
        renderItem={renderCategory}
        keyExtractor={(item) => item.name}
        numColumns={2}
        columnWrapperStyle={styles.gridWrapper}
        contentContainerStyle={styles.gridContent}
        ListHeaderComponent={listHeader}
        ListEmptyComponent={<Text style={styles.emptyBrands}>No categories in this department.</Text>}
        ItemSeparatorComponent={() => <View style={styles.separator} />}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => void loadCategories(true)}
            tintColor="#708066"
            colors={['#708066']}
          />
        }
      />
    </View>
  );
}

type IconName = React.ComponentProps<typeof MaterialCommunityIcons>['name'];

function getCategoryIcon(category: string): IconName {
  const icons: Record<string, IconName> = {
    smartphones: 'cellphone',
    laptops: 'laptop',
    fragrances: 'spray',
    beauty: 'face-woman',
    'skin-care': 'face-woman',
    groceries: 'cart',
    'home-decoration': 'home',
    furniture: 'sofa',
    'kitchen-accessories': 'silverware',
    'vehicle-accessories': 'car',
    'electronics-accessories': 'headphones',
  };
  return icons[category] || 'package-variant';
}

function formatCategory(category: string): string {
  return category.replace(/-/g, ' ').replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function getDepartment(category: string): string {
  if (category === 'beauty' || category === 'fragrances' || category.includes('skin-care')) return 'Beauty';
  if (category.startsWith('mens-') || category.startsWith('womens-') || category === 'sunglasses') {
    return 'Fashion';
  }
  if (category === 'furniture' || category === 'home-decoration' || category === 'kitchen-accessories') {
    return 'Home';
  }
  if (category === 'smartphones' || category === 'laptops' || category.includes('electronics')) {
    return 'Electronics';
  }
  if (category === 'groceries') return 'Grocery';
  if (category.includes('vehicle') || category.includes('motorcycle')) return 'Vehicles';
  return 'Lifestyle';
}
