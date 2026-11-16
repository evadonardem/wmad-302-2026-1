
/**
 * Product Details Screen
 * Displays product information and allows users to add products to cart.
 */

import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  Image,
  ActivityIndicator,
  TouchableOpacity,
  Alert,
  StyleSheet,
} from 'react-native';
import { Button, IconButton } from 'react-native-paper';
import { useLocalSearchParams, useRouter } from 'expo-router';
import type { Product } from '@/types/product';
import { cartStorage } from '@/utils/storage';

const BLUE = '#1A73E8';

export default function ProductDetailsScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();

  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [selectedImage, setSelectedImage] = useState('');
  const [adding, setAdding] = useState(false);

  useEffect(() => {
    let isMounted = true;

    const fetchProduct = async () => {
      try {
        setLoading(true);
        setError('');

        if (!id || !/^\d+$/.test(id)) {
          throw new Error('Invalid product ID.');
        }

        const response = await fetch(
          `https://dummyjson.com/products/${id}`,
        );

        if (!response.ok) {
          throw new Error('Unable to load this product.');
        }

        const data: Product = await response.json();

        if (isMounted) {
          setProduct(data);
          setSelectedImage(data.thumbnail);
        }
      } catch (err) {
        if (isMounted) {
          setError(
            err instanceof Error
              ? err.message
              : 'Something went wrong while loading the product.',
          );
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    fetchProduct();

    return () => {
      isMounted = false;
    };
  }, [id]);

  const discountedPrice = product
    ? product.price * (1 - product.discountPercentage / 100)
    : 0;

  const changeQuantity = (amount: number) => {
    if (!product) return;

    setQuantity((current) =>
      Math.max(1, Math.min(product.stock, current + amount)),
    );
  };

  const handleAddToCart = async () => {
    if (!product || product.stock <= 0) return;

    try {
      setAdding(true);

      await cartStorage.addItem({
        productId: product.id,
        title: product.title,
        thumbnail: product.thumbnail,
        price: product.price,
        discountPercentage: product.discountPercentage,
        quantity,
        stock: product.stock,
      });

      Alert.alert(
        'Added to Cart',
        `${product.title} has been added to your cart.`,
        [
          { text: 'Continue Shopping', style: 'cancel' },
          {
            text: 'View Cart',
            onPress: () => router.push('/(app)/(tabs)/cart'),
          },
        ],
      );
    } catch {
      Alert.alert(
        'Error',
        'Unable to add this product to your cart. Please try again.',
      );
    } finally {
      setAdding(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color={BLUE} />
        <Text style={styles.loadingText}>Loading product details...</Text>
      </View>
    );
  }

  if (error || !product) {
    return (
      <View style={styles.centerContainer}>
        <Text style={styles.errorText}>
          {error || 'Product not found.'}
        </Text>
        <Button mode="contained" onPress={() => router.back()}>
          Go Back
        </Button>
      </View>
    );
  }

  const images =
    product.images?.length > 0
      ? product.images
      : [product.thumbnail];

  return (
    <View style={styles.container}>
      <View style={styles.topBar}>
        <IconButton
          icon="arrow-left"
          size={25}
          onPress={() => router.back()}
        />
        <Text style={styles.topBarTitle}>Product Details</Text>
        <IconButton
          icon="cart-outline"
          size={25}
          onPress={() => router.push('/(app)/(tabs)/cart')}
        />
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.imageContainer}>
          {product.discountPercentage > 0 && (
            <View style={styles.discountBadge}>
              <Text style={styles.discountText}>
                -{Math.round(product.discountPercentage)}%
              </Text>
            </View>
          )}

          <Image
            source={{ uri: selectedImage || product.thumbnail }}
            style={styles.mainImage}
            resizeMode="contain"
          />
        </View>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.thumbnailList}
        >
          {images.map((image, index) => (
            <TouchableOpacity
              key={`${product.id}-image-${index}`}
              style={[
                styles.thumbnailButton,
                selectedImage === image && styles.selectedThumbnail,
              ]}
              onPress={() => setSelectedImage(image)}
            >
              <Image
                source={{ uri: image }}
                style={styles.thumbnail}
                resizeMode="contain"
              />
            </TouchableOpacity>
          ))}
        </ScrollView>

        <View style={styles.detailsContainer}>
          <Text style={styles.category}>
            {product.category}
          </Text>

          <Text style={styles.productTitle}>
            {product.title}
          </Text>

          {product.brand ? (
            <Text style={styles.brand}>
              Brand: {product.brand}
            </Text>
          ) : null}

          <View style={styles.ratingRow}>
            <Text style={styles.rating}>
              ⭐ {product.rating.toFixed(1)}
            </Text>
            <Text style={styles.stock}>
              {product.stock > 0
                ? `${product.stock} available`
                : 'Out of Stock'}
            </Text>
          </View>

          <View style={styles.priceRow}>
            <Text style={styles.currentPrice}>
              ${discountedPrice.toFixed(2)}
            </Text>

            {product.discountPercentage > 0 && (
              <Text style={styles.originalPrice}>
                ${product.price.toFixed(2)}
              </Text>
            )}
          </View>

          <Text style={styles.sectionTitle}>Description</Text>
          <Text style={styles.description}>
            {product.description}
          </Text>

          <View style={styles.informationCard}>
            <Text style={styles.infoText}>
              <Text style={styles.infoLabel}>Availability: </Text>
              {product.availabilityStatus}
            </Text>

            <Text style={styles.infoText}>
              <Text style={styles.infoLabel}>Shipping: </Text>
              {product.shippingInformation}
            </Text>

            <Text style={styles.infoText}>
              <Text style={styles.infoLabel}>Warranty: </Text>
              {product.warrantyInformation}
            </Text>

            <Text style={styles.infoText}>
              <Text style={styles.infoLabel}>Return Policy: </Text>
              {product.returnPolicy}
            </Text>
          </View>

          <Text style={styles.sectionTitle}>Quantity</Text>

          <View style={styles.quantityContainer}>
            <IconButton
              icon="minus"
              mode="contained-tonal"
              disabled={quantity <= 1}
              onPress={() => changeQuantity(-1)}
            />

            <Text style={styles.quantityText}>{quantity}</Text>

            <IconButton
              icon="plus"
              mode="contained-tonal"
              disabled={quantity >= product.stock}
              onPress={() => changeQuantity(1)}
            />
          </View>

          <Button
            mode="contained"
            icon="cart-plus"
            loading={adding}
            disabled={adding || product.stock <= 0}
            onPress={handleAddToCart}
            style={styles.addButton}
            contentStyle={styles.addButtonContent}
          >
            {product.stock > 0 ? 'Add to Cart' : 'Out of Stock'}
          </Button>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  topBar: {
    height: 58,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E8EAED',
    paddingHorizontal: 8,
  },
  topBarTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#202124',
  },
  scrollContent: {
    paddingBottom: 30,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
    backgroundColor: '#F8F9FA',
  },
  loadingText: {
    marginTop: 14,
    color: '#5F6368',
    fontSize: 15,
  },
  errorText: {
    color: '#EA4335',
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 20,
  },
  imageContainer: {
    height: 300,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  mainImage: {
    width: '90%',
    height: '90%',
  },
  discountBadge: {
    position: 'absolute',
    top: 16,
    left: 16,
    zIndex: 1,
    backgroundColor: BLUE,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 8,
  },
  discountText: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  thumbnailList: {
    padding: 12,
    gap: 10,
    backgroundColor: '#FFFFFF',
  },
  thumbnailButton: {
    width: 65,
    height: 65,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 8,
    padding: 4,
  },
  selectedThumbnail: {
    borderColor: BLUE,
    borderWidth: 2,
  },
  thumbnail: {
    width: '100%',
    height: '100%',
  },
  detailsContainer: {
    padding: 18,
  },
  category: {
    color: BLUE,
    fontSize: 13,
    fontWeight: '600',
    textTransform: 'capitalize',
    marginBottom: 8,
  },
  productTitle: {
    fontSize: 23,
    fontWeight: '700',
    color: '#202124',
    marginBottom: 6,
  },
  brand: {
    fontSize: 14,
    color: '#5F6368',
    marginBottom: 10,
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginVertical: 10,
  },
  rating: {
    fontSize: 14,
    color: '#5F6368',
    fontWeight: '600',
  },
  stock: {
    fontSize: 13,
    color: '#34A853',
    fontWeight: '600',
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginVertical: 12,
  },
  currentPrice: {
    fontSize: 26,
    fontWeight: '700',
    color: BLUE,
  },
  originalPrice: {
    fontSize: 17,
    color: '#9E9E9E',
    textDecorationLine: 'line-through',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#202124',
    marginTop: 20,
    marginBottom: 10,
  },
  description: {
    fontSize: 15,
    lineHeight: 23,
    color: '#5F6368',
  },
  informationCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    padding: 14,
    marginTop: 18,
    gap: 10,
  },
  infoText: {
    fontSize: 14,
    lineHeight: 21,
    color: '#5F6368',
  },
  infoLabel: {
    fontWeight: '700',
    color: '#202124',
  },
  quantityContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: 12,
  },
  quantityText: {
    fontSize: 18,
    fontWeight: '700',
    color: '#202124',
    minWidth: 25,
    textAlign: 'center',
  },
  addButton: {
    marginTop: 22,
    borderRadius: 8,
  },
  addButtonContent: {
    height: 52,
  },
});
