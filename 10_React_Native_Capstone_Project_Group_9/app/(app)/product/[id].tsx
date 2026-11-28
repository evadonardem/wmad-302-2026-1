import React, { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Image, Pressable, ScrollView, Text, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Button, IconButton, Snackbar } from 'react-native-paper';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Product } from '@/types/product';
import { productApi } from '@/services/productApi';
import { useCart } from '@/context/CartContext';
import { useCurrencyFormatter } from '@/hooks/useCurrency';
import { styles } from './styles';

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.detailRow}>
      <Text style={styles.detailLabel}>{label}</Text>
      <Text style={styles.detailValue}>{value}</Text>
    </View>
  );
}

function formatReviewDate(date: string): string {
  const parsedDate = new Date(date);
  return Number.isNaN(parsedDate.getTime()) ? date : parsedDate.toLocaleDateString();
}

export default function ProductDetailsScreen() {
  const router = useRouter();
  const { addItem } = useCart();
  const formatPrice = useCurrencyFormatter();
  const insets = useSafeAreaInsets();
  const { id } = useLocalSearchParams<{ id: string }>();
  const productId = Number(Array.isArray(id) ? id[0] : id);
  const [product, setProduct] = useState<Product | null>(null);
  const [selectedImage, setSelectedImage] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [cartNotice, setCartNotice] = useState('');

  const loadProduct = useCallback(async () => {
    if (!Number.isInteger(productId) || productId <= 0) {
      setError('This product link is invalid.');
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);
    try {
      setProduct(await productApi.getProductById(productId));
      setSelectedImage(0);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load product details.');
    } finally {
      setLoading(false);
    }
  }, [productId]);

  useEffect(() => {
    void loadProduct();
  }, [loadProduct]);

  const renderHeader = () => (
    <View style={styles.header}>
      <IconButton icon="arrow-left" onPress={() => router.back()} accessibilityLabel="Go back" />
      <Text style={styles.headerTitle}>Product details</Text>
      <View style={styles.headerSpacer} />
    </View>
  );

  if (loading) {
    return (
      <View style={styles.stateContainer}>
        {renderHeader()}
        <ActivityIndicator size="large" color="#708066" />
        <Text style={styles.stateText}>Loading product...</Text>
      </View>
    );
  }

  if (error || !product) {
    return (
      <View style={styles.stateContainer}>
        {renderHeader()}
        <Text style={styles.errorText}>{error || 'Product not found.'}</Text>
        <Button mode="contained" onPress={() => void loadProduct()} style={styles.retryButton}>
          Try again
        </Button>
      </View>
    );
  }

  const images = product.images?.length ? product.images : [product.thumbnail];
  const discountedPrice = product.price * (1 - product.discountPercentage / 100);
  const dimensions = product.dimensions;
  const reviews = product.reviews || [];
  const handleAddToCart = () => {
    addItem({
      productId: product.id,
      title: product.title,
      thumbnail: product.thumbnail,
      price: product.price,
      discountPercentage: product.discountPercentage,
      quantity: 1,
      stock: product.stock,
    });
    setCartNotice(`${product.title} has been added to your cart.`);
  };

  return (
    <View style={styles.container}>
      {renderHeader()}
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.gallery}>
          <Image
            source={{ uri: images[selectedImage] || product.thumbnail }}
            style={styles.mainImage}
            resizeMode="contain"
          />
          {images.length > 1 && (
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.thumbnailList}
            >
              {images.map((image, index) => (
                <Pressable
                  key={`${image}-${index}`}
                  onPress={() => setSelectedImage(index)}
                  accessibilityRole="button"
                  accessibilityState={{ selected: selectedImage === index }}
                  accessibilityLabel={`Product image ${index + 1}`}
                >
                  <Image
                    source={{ uri: image }}
                    style={[
                      styles.thumbnail,
                      selectedImage === index && styles.selectedThumbnail,
                    ]}
                  />
                </Pressable>
              ))}
            </ScrollView>
          )}
        </View>

        <View style={styles.productInfo}>
          <Text style={styles.category}>{product.category.replace('-', ' ')}</Text>
          <Text style={styles.title}>{product.title}</Text>
          {product.brand ? <Text style={styles.brand}>Brand: {product.brand}</Text> : null}
          <Text style={styles.rating}>
            {'★'.repeat(Math.max(0, Math.round(product.rating)))} {product.rating.toFixed(1)}
            {'  ·  '}{reviews.length} {reviews.length === 1 ? 'review' : 'reviews'}
          </Text>

          <View style={styles.priceRow}>
            <Text style={styles.price}>{formatPrice(discountedPrice)}</Text>
            {product.discountPercentage > 0 && (
              <>
                <Text style={styles.originalPrice}>{formatPrice(product.price)}</Text>
                <Text style={styles.discount}>
                  {Math.round(product.discountPercentage)}% off
                </Text>
              </>
            )}
          </View>
          <Text style={[styles.stock, product.stock > 0 ? styles.inStock : styles.outOfStock]}>
            {product.stock > 0 ? `${product.stock} in stock` : 'Out of stock'}
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Description</Text>
          <Text style={styles.description}>{product.description}</Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Product information</Text>
          {product.sku ? <DetailRow label="SKU" value={product.sku} /> : null}
          {product.weight ? <DetailRow label="Weight" value={`${product.weight}`} /> : null}
          {dimensions && (
            <DetailRow
              label="Dimensions"
              value={`${dimensions.width} × ${dimensions.height} × ${dimensions.depth} cm`}
            />
          )}
          {product.minimumOrderQuantity ? (
            <DetailRow label="Minimum order" value={`${product.minimumOrderQuantity}`} />
          ) : null}
          {product.availabilityStatus ? (
            <DetailRow label="Availability" value={product.availabilityStatus} />
          ) : null}
          {product.shippingInformation ? (
            <DetailRow label="Shipping" value={product.shippingInformation} />
          ) : null}
          {product.warrantyInformation ? (
            <DetailRow label="Warranty" value={product.warrantyInformation} />
          ) : null}
          {product.returnPolicy ? <DetailRow label="Returns" value={product.returnPolicy} /> : null}
          {product.tags?.length ? (
            <DetailRow label="Tags" value={product.tags.join(', ')} />
          ) : null}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Customer reviews ({reviews.length})</Text>
          {reviews.length === 0 ? (
            <Text style={styles.description}>There are no reviews for this product yet.</Text>
          ) : (
            reviews.map((review, index) => (
              <View key={`${review.reviewerName}-${review.date}-${index}`} style={styles.review}>
                <View style={styles.reviewHeader}>
                  <Text style={styles.reviewerName}>{review.reviewerName}</Text>
                  <Text style={styles.reviewDate}>{formatReviewDate(review.date)}</Text>
                </View>
                <Text style={styles.reviewRating}>
                  {'★'.repeat(Math.max(0, Math.min(5, Math.round(review.rating))))}
                  {'☆'.repeat(Math.max(0, 5 - Math.round(review.rating)))}
                  {'  '}{review.rating}/5
                </Text>
                <Text style={styles.reviewComment}>{review.comment}</Text>
              </View>
            ))
          )}
        </View>
      </ScrollView>
      <View style={[styles.purchaseBar, { paddingBottom: 12 + insets.bottom }]}>
        <Button
          mode="outlined"
          icon="cart-plus"
          onPress={handleAddToCart}
          disabled={product.stock <= 0}
          style={styles.purchaseButton}
        >
          Add to cart
        </Button>
        <Button
          mode="contained"
          icon="flash"
          onPress={() => router.push(`/(app)/checkout?productId=${product.id}`)}
          disabled={product.stock <= 0}
          style={styles.purchaseButton}
        >
          Shop now
        </Button>
      </View>
      <Snackbar
        visible={Boolean(cartNotice)}
        onDismiss={() => setCartNotice('')}
        duration={2500}
      >
        {cartNotice}
      </Snackbar>
    </View>
  );
}
