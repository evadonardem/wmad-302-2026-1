/**
 * Product Detail Screen - Marketplace
 * Features: Multi-image gallery switcher, price & discount breakdown, specs table,
 * customer reviews, Share action, Wishlist toggle, and Quantity Add-to-Cart
 */
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  Image,
  TouchableOpacity,
  ActivityIndicator,
  Share,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { productApi } from '@/services/productApi';
import { useCart } from '@/context/CartContext';
import { Product } from '@/types/product';
import { Button, Chip, Divider, Snackbar } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';

export default function ProductDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { addToCart, toggleWishlist, isWishlisted } = useCart();

  const [product, setProduct] = useState<Product | null>(null);
  const [selectedImage, setSelectedImage] = useState<string>('');
  const [quantity, setQuantity] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [snackMsg, setSnackMsg] = useState('');

  useEffect(() => {
    const productId = Number(id);
    if (!productId) {
      setError('Invalid product ID');
      setLoading(false);
      return;
    }

    setLoading(true);
    setQuantity(1);
    productApi
      .getProductById(productId)
      .then((data) => {
        setProduct(data);
        setSelectedImage(data.images?.[0] || data.thumbnail);
        setError(null);
      })
      .catch((err) => {
        setError(err instanceof Error ? err.message : 'Failed to load product');
      })
      .finally(() => setLoading(false));
  }, [id]);

  const handleShare = async () => {
    if (!product) return;
    try {
      await Share.share({
        message: `Check out ${product.title} ($${product.price}) on Marketplace!`,
      });
    } catch {
      // Ignore share cancellation
    }
  };

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color="#1A73E8" />
        <Text style={{ marginTop: 12, color: '#5F6368' }}>Loading product details...</Text>
      </View>
    );
  }

  if (error || !product) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: 24 }}>
        <Text style={{ color: '#EA4335', fontSize: 16, marginBottom: 12 }}>
          {error || 'Product not found'}
        </Text>
        <Button mode="contained" onPress={() => router.back()}>
          Go Back
        </Button>
      </View>
    );
  }

  const discountedPrice = product.price * (1 - product.discountPercentage / 100);
  const wished = isWishlisted(product.id);
  const galleryImages = product.images?.length ? product.images : [product.thumbnail];

  return (
    <View style={{ flex: 1, backgroundColor: '#F8F9FA' }}>
      {/* Top Action Header */}
      <View
        style={{
          flexDirection: 'row',
          justifyContent: 'space-between',
          alignItems: 'center',
          paddingHorizontal: 16,
          paddingVertical: 12,
          backgroundColor: '#FFFFFF',
          borderBottomWidth: 1,
          borderBottomColor: '#E8EAED',
        }}
      >
        <TouchableOpacity
          onPress={() => router.back()}
          style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}
        >
          <MaterialCommunityIcons name="arrow-left" size={24} color="#202124" />
          <Text style={{ fontSize: 15, fontWeight: '600', color: '#202124' }}>Back</Text>
        </TouchableOpacity>

        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
          <TouchableOpacity onPress={handleShare}>
            <MaterialCommunityIcons name="share-variant-outline" size={22} color="#202124" />
          </TouchableOpacity>
          <TouchableOpacity onPress={() => toggleWishlist(product)}>
            <MaterialCommunityIcons
              name={wished ? 'heart' : 'heart-outline'}
              size={24}
              color={wished ? '#EA4335' : '#202124'}
            />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView contentContainerStyle={{ paddingBottom: 110 }}>
        {/* Main Image & Gallery Thumbnails */}
        <View style={{ backgroundColor: '#FFFFFF', padding: 16, alignItems: 'center' }}>
          <Image
            source={{ uri: selectedImage || product.thumbnail }}
            style={{ width: '100%', height: 260 }}
            resizeMode="contain"
          />
          {galleryImages.length > 1 && (
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={{ gap: 10, marginTop: 12 }}
            >
              {galleryImages.map((imgUri, idx) => (
                <TouchableOpacity
                  key={`${imgUri}-${idx}`}
                  onPress={() => setSelectedImage(imgUri)}
                  style={{
                    width: 60,
                    height: 60,
                    borderRadius: 10,
                    borderWidth: 2,
                    borderColor: selectedImage === imgUri ? '#1A73E8' : '#E8EAED',
                    padding: 4,
                    backgroundColor: '#F8F9FA',
                  }}
                >
                  <Image
                    source={{ uri: imgUri }}
                    style={{ width: '100%', height: '100%' }}
                    resizeMode="contain"
                  />
                </TouchableOpacity>
              ))}
            </ScrollView>
          )}
        </View>

        {/* Core Info Card */}
        <View style={{ backgroundColor: '#FFFFFF', marginTop: 8, padding: 16 }}>
          <View style={{ flexDirection: 'row', gap: 8, marginBottom: 8 }}>
            <Chip compact style={{ backgroundColor: '#E8F0FE' }} textStyle={{ color: '#1A73E8' }}>
              {product.category}
            </Chip>
            {product.brand && <Chip compact>{product.brand}</Chip>}
          </View>

          <Text style={{ fontSize: 22, fontWeight: '700', color: '#202124', marginBottom: 8 }}>
            {product.title}
          </Text>

          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 10 }}>
            <Text style={{ fontSize: 26, fontWeight: '800', color: '#1A73E8' }}>
              ${discountedPrice.toFixed(2)}
            </Text>
            {product.discountPercentage > 0 && (
              <>
                <Text
                  style={{
                    fontSize: 16,
                    color: '#9E9E9E',
                    textDecorationLine: 'line-through',
                  }}
                >
                  ${product.price.toFixed(2)}
                </Text>
                <View
                  style={{
                    backgroundColor: '#FCE8E6',
                    paddingHorizontal: 8,
                    paddingVertical: 3,
                    borderRadius: 6,
                  }}
                >
                  <Text style={{ color: '#EA4335', fontWeight: '700', fontSize: 12 }}>
                    -{Math.round(product.discountPercentage)}% OFF
                  </Text>
                </View>
              </>
            )}
          </View>

          <Text style={{ fontSize: 13, color: '#5F6368', marginBottom: 12 }}>
            ⭐ {product.rating.toFixed(1)} ({product.reviews?.length || 0} reviews) ·{' '}
            {product.stock > 0 ? `${product.stock} in stock` : 'Out of Stock'}
          </Text>

          <Divider style={{ marginVertical: 10 }} />

          <Text style={{ fontSize: 15, fontWeight: '700', color: '#202124', marginBottom: 6 }}>
            Description
          </Text>
          <Text style={{ fontSize: 14, color: '#3C4043', lineHeight: 21 }}>
            {product.description}
          </Text>
        </View>

        {/* Specifications & Policies */}
        <View style={{ backgroundColor: '#FFFFFF', marginTop: 8, padding: 16 }}>
          <Text style={{ fontSize: 16, fontWeight: '700', color: '#202124', marginBottom: 10 }}>
            Specifications &amp; Delivery
          </Text>
          {[
            { label: 'SKU', value: product.sku || 'N/A' },
            { label: 'Shipping', value: product.shippingInformation || 'Standard Shipping' },
            { label: 'Warranty', value: product.warrantyInformation || '1 Year Warranty' },
            { label: 'Return Policy', value: product.returnPolicy || '30 Days Return' },
            {
              label: 'Dimensions',
              value: product.dimensions
                ? `${product.dimensions.width} × ${product.dimensions.height} × ${product.dimensions.depth} cm`
                : 'Standard',
            },
          ].map((row) => (
            <View
              key={row.label}
              style={{
                flexDirection: 'row',
                justifyContent: 'space-between',
                paddingVertical: 8,
                borderBottomWidth: 1,
                borderBottomColor: '#F1F3F4',
              }}
            >
              <Text style={{ fontSize: 13, color: '#5F6368' }}>{row.label}</Text>
              <Text style={{ fontSize: 13, fontWeight: '600', color: '#202124' }}>{row.value}</Text>
            </View>
          ))}
        </View>

        {/* Customer Reviews */}
        <View style={{ backgroundColor: '#FFFFFF', marginTop: 8, padding: 16 }}>
          <Text style={{ fontSize: 16, fontWeight: '700', color: '#202124', marginBottom: 10 }}>
            Customer Reviews ({product.reviews?.length || 0})
          </Text>
          {product.reviews && product.reviews.length > 0 ? (
            product.reviews.map((rev, idx) => (
              <View
                key={`${rev.reviewerName}-${idx}`}
                style={{
                  paddingVertical: 10,
                  borderBottomWidth: idx < product.reviews.length - 1 ? 1 : 0,
                  borderBottomColor: '#F1F3F4',
                }}
              >
                <View
                  style={{
                    flexDirection: 'row',
                    justifyContent: 'space-between',
                    marginBottom: 4,
                  }}
                >
                  <Text style={{ fontSize: 13, fontWeight: '700', color: '#202124' }}>
                    {rev.reviewerName}
                  </Text>
                  <Text style={{ fontSize: 12, color: '#F9AB00', fontWeight: '700' }}>
                    {'★'.repeat(Math.round(rev.rating))}
                  </Text>
                </View>
                <Text style={{ fontSize: 13, color: '#3C4043' }}>{rev.comment}</Text>
              </View>
            ))
          ) : (
            <Text style={{ fontSize: 13, color: '#5F6368' }}>No reviews yet.</Text>
          )}
        </View>
      </ScrollView>

      {/* Bottom Sticky Add-to-Cart Bar */}
      <View
        style={{
          position: 'absolute',
          bottom: 0,
          left: 0,
          right: 0,
          backgroundColor: '#FFFFFF',
          borderTopWidth: 1,
          borderTopColor: '#E8EAED',
          paddingHorizontal: 16,
          paddingVertical: 12,
          flexDirection: 'row',
          alignItems: 'center',
          gap: 12,
        }}
      >
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            borderWidth: 1,
            borderColor: '#DADCE0',
            borderRadius: 10,
            paddingHorizontal: 6,
          }}
        >
          <TouchableOpacity
            onPress={() => setQuantity((q) => Math.max(1, q - 1))}
            style={{ padding: 8 }}
          >
            <MaterialCommunityIcons name="minus" size={18} color="#202124" />
          </TouchableOpacity>
          <Text style={{ fontSize: 15, fontWeight: '700', minWidth: 26, textAlign: 'center' }}>
            {quantity}
          </Text>
          <TouchableOpacity
            onPress={() => setQuantity((q) => Math.min(product.stock || 99, q + 1))}
            style={{ padding: 8 }}
          >
            <MaterialCommunityIcons name="plus" size={18} color="#202124" />
          </TouchableOpacity>
        </View>

        <Button
          mode="contained"
          disabled={product.stock <= 0}
          onPress={() => {
            addToCart(product, quantity);
            setSnackMsg(`Added ${quantity} × ${product.title} to cart!`);
          }}
          style={{ flex: 1, borderRadius: 10 }}
          contentStyle={{ height: 46 }}
          icon="cart-plus"
        >
          Add to Cart · ${(discountedPrice * quantity).toFixed(2)}
        </Button>
      </View>

      <Snackbar
        visible={!!snackMsg}
        onDismiss={() => setSnackMsg('')}
        duration={2000}
        action={{
          label: 'Cart',
          onPress: () => router.push('/(app)/(tabs)/cart'),
        }}
      >
        {snackMsg}
      </Snackbar>
    </View>
  );
}