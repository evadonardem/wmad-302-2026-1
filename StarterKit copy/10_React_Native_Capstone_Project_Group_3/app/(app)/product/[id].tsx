/**
 * Product Detail Screen
 * Image gallery, price, rating, specs, reviews (read + write), share via deep
 * link, wishlist, compare and add-to-cart.
 * GET /products/{id}
 */
import React, { useCallback, useEffect, useState } from 'react';
import {
  FlatList,
  Image,
  NativeScrollEvent,
  NativeSyntheticEvent,
  Platform,
  ScrollView,
  TouchableOpacity,
  Text,
  View,
  useWindowDimensions,
} from 'react-native';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import * as Linking from 'expo-linking';
import { Button, Chip, Divider, HelperText, IconButton, Snackbar, TextInput } from 'react-native-paper';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { GiftListPicker } from '@/components/GiftListPicker';
import { ImageZoomViewer } from '@/components/ImageZoomViewer';
import { ProductSuggestions } from '@/components/ProductSuggestions';
import { useFlyToCart } from '@/components/FlyToCart';
import { useGiftLists } from '@/context/GiftListsContext';
import { shareLink } from '@/services/share';
import { productApi } from '@/services/productApi';
import { useAuth } from '@/context/AuthContext';
import { useCart } from '@/context/CartContext';
import { useWishlist } from '@/context/WishlistContext';
import { useActivity } from '@/context/ActivityContext';
import { useSettings } from '@/context/SettingsContext';
import { useThemedStyles } from '@/hooks';
import { EmptyState, ErrorState, QuantitySelector } from '@/components/CommonComponents';
import { SeasonSpinner } from '@/components/SeasonSpinner';
import { LivelyBackground } from '@/components/LivelyBackground';
import { Stars, StarRatingInput } from '@/components/Stars';
import { formatCategory, formatDate, formatPrice, getDiscountedPrice } from '@/utils/format';
import { getErrorMessage } from '@/utils/errors';
import type { Product } from '@/types/product';
import { makeCommon } from '@/styles/common';
import { makeProductStyles } from '@/styles/product';

/** Screens at least this wide show the gallery and details side by side. */
const WIDE_LAYOUT = 900;

export default function ProductDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { width } = useWindowDimensions();
  const { user } = useAuth();
  const { addItem, getQuantity } = useCart();
  const { isInWishlist, toggle } = useWishlist();
  const { addRecentlyViewed, isComparing, toggleCompare, getReviews, addReview } = useActivity();
  const { palette, t } = useSettings();
  const common = useThemedStyles(makeCommon);
  const styles = useThemedStyles(makeProductStyles);

  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeImage, setActiveImage] = useState(0);
  const [quantity, setQuantity] = useState(1);
  const [snackbar, setSnackbar] = useState<{ text: string; action?: 'cart' | 'compare' } | null>(null);
  const [writing, setWriting] = useState(false);
  const [reviewRating, setReviewRating] = useState(0);
  const [reviewComment, setReviewComment] = useState('');
  const [reviewError, setReviewError] = useState<string | null>(null);
  const [zoomOpen, setZoomOpen] = useState(false);
  const [giftPickerOpen, setGiftPickerOpen] = useState(false);
  const flyToCart = useFlyToCart();
  const { listsContaining } = useGiftLists();
  const wide = width >= WIDE_LAYOUT;
  const galleryWidth = wide ? Math.min(width * 0.5, 640) : width;

  const productId = Number(id);

  const loadProduct = useCallback(async () => {
    if (!Number.isInteger(productId) || productId <= 0) {
      setError('Invalid product');
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const data = await productApi.getProductById(productId);
      setProduct(data);
      setActiveImage(0);
      setQuantity(Math.max(1, Math.min(data.minimumOrderQuantity || 1, data.stock)));
      addRecentlyViewed(data);
    } catch (err) {
      setError(getErrorMessage(err, 'Failed to load product'));
    } finally {
      setLoading(false);
    }
    // addRecentlyViewed changes whenever the list changes; we only want to record once per load
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [productId]);

  useEffect(() => {
    loadProduct();
  }, [loadProduct]);

  /** Deep link that opens this product: marketplace://product/12 in builds, an http URL on web. */
  const handleShare = useCallback(async () => {
    if (!product) return;
    const url = Linking.createURL(`/product/${product.id}`);
    const message = `Check out ${product.title} for ${formatPrice(
      getDiscountedPrice(product.price, product.discountPercentage)
    )} on Marketplace!`;
    const outcome = await shareLink(product.title, message, url);
    if (outcome === 'copied') setSnackbar({ text: t('common.linkCopied') });
  }, [product, t]);

  const inWishlist = product ? isInWishlist(product.id) : false;
  const comparing = product ? isComparing(product.id) : false;
  const inGiftList = product ? listsContaining(product.id).length > 0 : false;

  const headerRight = useCallback(
    () =>
      product ? (
        <View style={common.row}>
          <IconButton
            icon={inWishlist ? 'heart' : 'heart-outline'}
            iconColor={palette.onPrimary}
            onPress={() => {
              const added = toggle(product);
              setSnackbar({ text: added ? 'Added to wishlist' : 'Removed from wishlist' });
            }}
            accessibilityLabel={inWishlist ? 'Remove from wishlist' : 'Add to wishlist'}
          />
          <IconButton
            icon="compare-horizontal"
            iconColor={comparing ? palette.accents[0] : palette.onPrimary}
            onPress={() => {
              const result = toggleCompare(product);
              setSnackbar(
                result === 'full'
                  ? { text: 'You can compare up to 3 products', action: 'compare' }
                  : result === 'added'
                    ? { text: 'Added to compare', action: 'compare' }
                    : { text: 'Removed from compare' }
              );
            }}
            accessibilityLabel={comparing ? 'Remove from compare' : 'Add to compare'}
          />
          <IconButton
            icon={inGiftList ? 'gift' : 'gift-outline'}
            iconColor={palette.onPrimary}
            onPress={() => setGiftPickerOpen(true)}
            accessibilityLabel="Add to a gift list"
          />
          <IconButton icon="share-variant" iconColor={palette.onPrimary} onPress={handleShare} accessibilityLabel="Share product" />
        </View>
      ) : null,
    [product, inWishlist, comparing, inGiftList, toggle, toggleCompare, handleShare, palette, common.row]
  );

  if (loading) {
    return (
      <View style={common.centered}>
        <SeasonSpinner size="large" />
        <Text style={common.loadingText}>{t('common.loading')}</Text>
      </View>
    );
  }

  if (error || !product) {
    return (
      <View style={common.screen}>
        <LivelyBackground />
        {error ? (
          <ErrorState message={error} onRetry={loadProduct} />
        ) : (
          <EmptyState icon="package-variant-closed" title="Product not found" message="It may have been removed." />
        )}
      </View>
    );
  }

  const discountedPrice = getDiscountedPrice(product.price, product.discountPercentage);
  const inCart = getQuantity(product.id);
  const maxAddable = Math.max(product.stock - inCart, 0);
  const outOfStock = product.stock <= 0;
  const images = product.images.length > 0 ? product.images : [product.thumbnail];
  const myReviews = getReviews(product.id);
  const reviewCount = product.reviews.length + myReviews.length;

  const onGalleryScroll = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    setActiveImage(Math.round(event.nativeEvent.contentOffset.x / galleryWidth));
  };

  const handleAddToCart = (goToCart = false, from?: { x: number; y: number }) => {
    if (maxAddable <= 0) {
      setSnackbar({ text: `You already have all ${product.stock} in your cart` });
      return;
    }
    const qty = Math.min(quantity, maxAddable);
    addItem(product, qty);
    if (!goToCart) flyToCart(product.thumbnail, from);
    if (goToCart) router.push('/cart');
    else setSnackbar({ text: `Added ${qty} × ${product.title} to cart`, action: 'cart' });
  };

  const submitReview = () => {
    if (reviewRating === 0) {
      setReviewError('Please choose a star rating');
      return;
    }
    if (reviewComment.trim().length < 5) {
      setReviewError('Please write at least 5 characters');
      return;
    }
    addReview({
      productId: product.id,
      rating: reviewRating,
      comment: reviewComment.trim(),
      date: new Date().toISOString(),
      reviewerName: user ? `${user.firstName} ${user.lastName}` : 'You',
    });
    setWriting(false);
    setReviewRating(0);
    setReviewComment('');
    setReviewError(null);
    setSnackbar({ text: 'Thanks for your review!' });
  };

  const specs: [string, string][] = [
    ['Brand', product.brand ?? '—'],
    ['Category', formatCategory(product.category)],
    ['SKU', product.sku],
    ['Weight', `${product.weight} g`],
    ['Dimensions', `${product.dimensions.width} × ${product.dimensions.height} × ${product.dimensions.depth} cm`],
    ['Warranty', product.warrantyInformation],
    ['Shipping', product.shippingInformation],
    ['Returns', product.returnPolicy],
    ['Min. order', `${product.minimumOrderQuantity} pcs`],
  ];

  return (
    <View style={common.screen}>
      <LivelyBackground />
      {/* The full title is shown on the page; the header keeps room for the action icons */}
      <Stack.Screen options={{ headerRight }} />
      <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
        {/* Tablets / wide screens: gallery on the left, details on the right */}
        <View style={wide ? styles.wideRow : undefined}>
        {/* Image Gallery (tap a photo to zoom) */}
        <Animated.View entering={FadeInDown.duration(350)} style={wide ? { width: galleryWidth } : undefined}>
          <FlatList
            data={images}
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            keyExtractor={(uri, index) => `${uri}-${index}`}
            onMomentumScrollEnd={onGalleryScroll}
            onScroll={Platform.OS === 'web' ? onGalleryScroll : undefined}
            scrollEventThrottle={16}
            renderItem={({ item, index }) => (
              <TouchableOpacity
                activeOpacity={0.9}
                onPress={() => {
                  setActiveImage(index);
                  setZoomOpen(true);
                }}
                style={[styles.galleryItem, { width: galleryWidth }]}
                accessibilityRole="imagebutton"
                accessibilityLabel={`Photo ${index + 1} of ${images.length}, tap to zoom`}
              >
                <Image source={{ uri: item }} style={styles.galleryImage} resizeMode="contain" />
              </TouchableOpacity>
            )}
          />
          {images.length > 1 && (
            <View style={styles.dots}>
              {images.map((uri, index) => (
                <View key={`${uri}-${index}`} style={[styles.dot, index === activeImage && styles.dotActive]} />
              ))}
            </View>
          )}
          <Text style={styles.zoomHint}>🔍 {t('product.tapToZoom')}</Text>
        </Animated.View>

        <View style={[styles.body, wide && styles.wideBody]}>
          <Text style={styles.category}>
            {formatCategory(product.category)}
            {product.brand ? ` · ${product.brand}` : ''}
          </Text>
          <Text style={styles.title}>{product.title}</Text>

          <View style={[common.row, styles.ratingRow]}>
            <Stars rating={product.rating} />
            <Text style={styles.ratingText}>
              {product.rating.toFixed(1)} ({reviewCount} reviews)
            </Text>
          </View>

          <View style={[common.row, styles.priceRow]}>
            <Text style={styles.price}>{formatPrice(discountedPrice)}</Text>
            {product.discountPercentage > 0 && (
              <>
                <Text style={styles.originalPrice}>{formatPrice(product.price)}</Text>
                <View style={styles.discountTag}>
                  <Text style={styles.discountTagText}>-{Math.round(product.discountPercentage)}%</Text>
                </View>
              </>
            )}
          </View>

          <Text style={[styles.stock, outOfStock || product.stock < 10 ? styles.stockLow : null]}>
            {outOfStock ? 'Out of stock' : `${product.availabilityStatus} · ${product.stock} available`}
          </Text>

          {product.tags.length > 0 && (
            <View style={styles.tags}>
              {product.tags.map((tag) => (
                <Chip key={tag} compact style={styles.tag} textStyle={styles.tagText}>
                  {tag}
                </Chip>
              ))}
            </View>
          )}

          <Divider style={common.divider} />

          <Text style={common.sectionTitle}>Description</Text>
          <Text style={styles.description}>{product.description}</Text>

          <Divider style={common.divider} />

          <Text style={common.sectionTitle}>Specifications</Text>
          {specs.map(([label, value]) => (
            <View key={label} style={styles.specRow}>
              <Text style={styles.specLabel}>{label}</Text>
              <Text style={styles.specValue}>{value}</Text>
            </View>
          ))}

          <Divider style={common.divider} />

          <View style={common.rowBetween}>
            <Text style={common.sectionTitle}>Customer Reviews</Text>
            {!writing && (
              <Button compact icon="pencil" onPress={() => setWriting(true)}>
                Write a review
              </Button>
            )}
          </View>

          {writing && (
            <View style={styles.reviewForm}>
              <StarRatingInput
                value={reviewRating}
                onChange={(value) => {
                  setReviewRating(value);
                  setReviewError(null);
                }}
              />
              <TextInput
                mode="outlined"
                label="Your review"
                value={reviewComment}
                onChangeText={(value) => {
                  setReviewComment(value);
                  setReviewError(null);
                }}
                multiline
                maxLength={500}
                style={styles.reviewInput}
              />
              {reviewError && <HelperText type="error">{reviewError}</HelperText>}
              <View style={common.rowBetween}>
                <Button onPress={() => setWriting(false)}>{t('common.cancel')}</Button>
                <Button mode="contained" onPress={submitReview}>
                  Submit
                </Button>
              </View>
            </View>
          )}

          {myReviews.map((review, index) => (
            <View key={`mine-${review.date}-${index}`} style={[styles.review, styles.myReview]}>
              <View style={common.rowBetween}>
                <Text style={styles.reviewer}>{review.reviewerName} (you)</Text>
                <Text style={styles.reviewDate}>{formatDate(review.date)}</Text>
              </View>
              <Stars rating={review.rating} size={14} />
              <Text style={styles.reviewComment}>{review.comment}</Text>
            </View>
          ))}

          {reviewCount === 0 ? (
            <Text style={common.muted}>No reviews yet. Be the first!</Text>
          ) : (
            product.reviews.map((review, index) => (
              <View key={`${review.reviewerEmail}-${index}`} style={styles.review}>
                <View style={common.rowBetween}>
                  <Text style={styles.reviewer}>{review.reviewerName}</Text>
                  <Text style={styles.reviewDate}>{formatDate(review.date)}</Text>
                </View>
                <Stars rating={review.rating} size={14} />
                <Text style={styles.reviewComment}>{review.comment}</Text>
              </View>
            ))
          )}
          <ProductSuggestions product={product} cardWidth={150} />
        </View>
        </View>
      </ScrollView>

      {/* Add to cart bar */}
      <View style={styles.actionBar}>
        <QuantitySelector value={quantity} max={Math.max(maxAddable, 1)} onChange={setQuantity} />
        <Button
          mode="outlined"
          onPress={(event) => handleAddToCart(false, { x: event.nativeEvent.pageX, y: event.nativeEvent.pageY })}
          disabled={outOfStock}
          style={styles.actionButton}
          icon="cart-plus"
        >
          Add
        </Button>
        <Button mode="contained" onPress={() => handleAddToCart(true)} disabled={outOfStock} style={styles.actionButton}>
          Buy Now
        </Button>
      </View>
      {inCart > 0 && <Text style={styles.inCartNote}>{inCart} already in your cart</Text>}

      <ImageZoomViewer
        images={images}
        index={activeImage}
        visible={zoomOpen}
        onIndexChange={setActiveImage}
        onClose={() => setZoomOpen(false)}
      />
      <GiftListPicker product={product} visible={giftPickerOpen} onDismiss={() => setGiftPickerOpen(false)} />
      <Snackbar
        visible={!!snackbar}
        onDismiss={() => setSnackbar(null)}
        duration={2500}
        action={
          snackbar?.action === 'cart'
            ? { label: t('common.viewCart'), onPress: () => router.push('/cart') }
            : snackbar?.action === 'compare'
              ? { label: 'Compare', onPress: () => router.push('/compare') }
              : undefined
        }
      >
        {snackbar?.text}
      </Snackbar>
    </View>
  );
}
