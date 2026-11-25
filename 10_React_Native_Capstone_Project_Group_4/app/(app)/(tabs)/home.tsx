/**
 * Home Screen - Crimson Obsidian Dark Glassmorphism MartFury Storefront
 * Features:
 * - Dark glass top navbar with crimson search pill & red "Shop By Department" button
 * - Toggleable left Categories sidebar + auto fade-in/fade-out Limited Edition Hero Banner
 * - Top Categories icon cards + continuous looping Deals Of The Day + full-width product grid
 */
import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { CrimsonAmbientBackdrop } from '@/components/CrimsonAmbientBackdrop';
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
  Animated,
  Easing,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '@/context/AuthContext';
import { useCart } from '@/context/CartContext';
import { productApi } from '@/services/productApi';
import { Product, CategoryItem } from '@/types/product';
import { Card, Button, Snackbar } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useDesignMode } from '@/context/DesignModeContext';
import { DesignModeToggle } from '@/components/DesignModeToggle';
import { styles } from './homeStyles';

const PAGE_SIZE = 24;

type SortMode = 'featured' | 'rating' | 'discount' | 'price-asc' | 'price-desc';

const SORT_OPTIONS: { key: SortMode; label: string }[] = [
  { key: 'featured', label: 'Mixed Feed' },
  { key: 'rating', label: 'Top Rated' },
  { key: 'discount', label: 'Best Seller' },
  { key: 'price-asc', label: 'Price: Low to High' },
  { key: 'price-desc', label: 'Price: High to Low' },
];

const TRUST_ITEMS = [
  { icon: 'truck-fast-outline', title: 'Free Delivery', sub: 'For orders over ₱500' },
  { icon: 'shield-refresh-outline', title: '90 Days Return', sub: 'If goods have problems' },
  { icon: 'credit-card-check-outline', title: 'Secure Payment', sub: '100% secure payment' },
  { icon: 'headset', title: '24/7 Support', sub: 'Dedicated support' },
  { icon: 'gift-outline', title: 'Gift Service', sub: 'Support gift wrapping' },
] as const;

const getCategoryIcon = (slug: string): keyof typeof MaterialCommunityIcons.glyphMap => {
  const s = slug.toLowerCase();
  if (s.includes('beauty') || s.includes('skin')) return 'lipstick';
  if (s.includes('fragrance')) return 'spray-bottle';
  if (s.includes('furniture') || s.includes('home')) return 'sofa-outline';
  if (s.includes('grocer')) return 'basket-outline';
  if (s.includes('kitchen')) return 'silverware-fork-knife';
  if (s.includes('laptop')) return 'laptop';
  if (s.includes('shirt') || s.includes('top') || s.includes('dress')) return 'tshirt-crew-outline';
  if (s.includes('shoe')) return 'shoe-sneaker';
  if (s.includes('watch')) return 'watch';
  if (s.includes('phone') || s.includes('mobile')) return 'cellphone';
  if (s.includes('motor') || s.includes('vehicle')) return 'motorbike';
  if (s.includes('sport')) return 'basketball';
  if (s.includes('sunglass')) return 'sunglasses';
  if (s.includes('tablet')) return 'tablet';
  if (s.includes('jewel')) return 'diamond-stone';
  if (s.includes('bag')) return 'bag-personal-outline';
  return 'tag-outline';
};

export default function HomeScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const { addToCart, toggleWishlist, isWishlisted, items, wishlist } = useCart();
  const { width } = useWindowDimensions();
  const { isCrimson } = useDesignMode();

  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<CategoryItem[]>([]);
  const [totalProducts, setTotalProducts] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [sortMode, setSortMode] = useState<SortMode>('featured');
  const [showDeptSidebar, setShowDeptSidebar] = useState(false);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [snackMessage, setSnackMessage] = useState('');
  const [secondsLeft, setSecondsLeft] = useState(7 * 3600 + 29 * 60 + 51);

  // Hero fade-in / fade-out state & animation
  const [heroIndex, setHeroIndex] = useState(0);
  const heroFade = useRef(new Animated.Value(1)).current;

  // Deals Of The Day continuous horizontal loop
  const [dealsTrackWidth, setDealsTrackWidth] = useState(0);
  const [dealsPaused, setDealsPaused] = useState(false);
  const dealsMarqueeX = useRef(new Animated.Value(0)).current;

  const itemCount = items.reduce((sum, entry) => sum + entry.quantity, 0);
  const isDesktop = width >= 920;
  const numColumns =
    width >= 1200 ? 6 : width >= 960 ? 5 : width >= 720 ? 4 : width >= 500 ? 3 : 2;
  const columnPercent = `${100 / numColumns}%` as const;

  useEffect(() => {
    const timer = setInterval(() => {
      setSecondsLeft((prev) => (prev > 0 ? prev - 1 : 7 * 3600 + 29 * 60 + 51));
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const formatCountdown = (totalSec: number) => {
    const hrs = String(Math.floor(totalSec / 3600)).padStart(2, '0');
    const mins = String(Math.floor((totalSec % 3600) / 60)).padStart(2, '0');
    const secs = String(totalSec % 60).padStart(2, '0');
    return `${hrs} : ${mins} : ${secs}`;
  };

  const fetchData = useCallback(async (page = 1, isRefresh = false) => {
    try {
      if (!isRefresh) setLoading(true);
      setError(null);

      const skip = (page - 1) * PAGE_SIZE;
      const [productsData, categoriesData] = await Promise.all([
        productApi.getProducts({ limit: PAGE_SIZE, skip }),
        productApi.getCategories(),
      ]);

      setProducts(productsData.products);
      setTotalProducts(productsData.total);
      setCategories(categoriesData);
      setCurrentPage(page);
      setHeroIndex(0);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load products');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchData(1);
  }, [fetchData]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchData(currentPage, true);
  };

  const handleQuickAdd = (product: Product) => {
    addToCart(product, 1);
    setSnackMessage(`Added "${product.title}" to cart`);
  };

  const arrangedProducts = useMemo(() => {
    const list = [...products];
    if (sortMode === 'rating') {
      return list.sort((a, b) => b.rating - a.rating);
    }
    if (sortMode === 'discount') {
      return list.sort((a, b) => b.discountPercentage - a.discountPercentage);
    }
    if (sortMode === 'price-asc') {
      return list.sort(
        (a, b) =>
          a.price * (1 - a.discountPercentage / 100) - b.price * (1 - b.discountPercentage / 100)
      );
    }
    if (sortMode === 'price-desc') {
      return list.sort(
        (a, b) =>
          b.price * (1 - b.discountPercentage / 100) - a.price * (1 - a.discountPercentage / 100)
      );
    }

    const buckets = new Map<string, Product[]>();
    for (const p of list) {
      const group = buckets.get(p.category) || [];
      group.push(p);
      buckets.set(p.category, group);
    }
    const mixed: Product[] = [];
    let added = true;
    while (added) {
      added = false;
      for (const group of buckets.values()) {
        const nextItem = group.shift();
        if (nextItem) {
          mixed.push(nextItem);
          added = true;
        }
      }
    }
    return mixed;
  }, [products, sortMode]);

  const heroSlides = useMemo(() => {
    if (arrangedProducts.length === 0) return [];
    return arrangedProducts.slice(0, Math.min(5, arrangedProducts.length));
  }, [arrangedProducts]);

  useEffect(() => {
    if (heroSlides.length <= 1) return;

    const interval = setInterval(() => {
      Animated.timing(heroFade, {
        toValue: 0,
        duration: 420,
        easing: Easing.out(Easing.ease),
        useNativeDriver: false,
      }).start(() => {
        setHeroIndex((prev) => (prev + 1) % heroSlides.length);
        Animated.timing(heroFade, {
          toValue: 1,
          duration: 520,
          easing: Easing.in(Easing.ease),
          useNativeDriver: false,
        }).start();
      });
    }, 4000);

    return () => clearInterval(interval);
  }, [heroSlides.length, heroFade]);

  const handleSelectHeroSlide = (idx: number) => {
    if (idx === heroIndex) return;
    Animated.timing(heroFade, {
      toValue: 0,
      duration: 220,
      useNativeDriver: false,
    }).start(() => {
      setHeroIndex(idx);
      Animated.timing(heroFade, {
        toValue: 1,
        duration: 300,
        useNativeDriver: false,
      }).start();
    });
  };

  useEffect(() => {
    if (dealsTrackWidth <= 0 || dealsPaused) return;

    dealsMarqueeX.setValue(0);
    const loopAnim = Animated.loop(
      Animated.timing(dealsMarqueeX, {
        toValue: -dealsTrackWidth,
        duration: Math.max(16000, dealsTrackWidth * 16),
        easing: Easing.linear,
        useNativeDriver: false,
      })
    );
    loopAnim.start();

    return () => {
      loopAnim.stop();
    };
  }, [dealsTrackWidth, dealsPaused, dealsMarqueeX]);

  const totalPages = Math.max(1, Math.ceil(totalProducts / PAGE_SIZE));
  const flashDeals = products.filter((p) => p.discountPercentage >= 10).slice(0, 10);
  const heroMain = heroSlides[heroIndex] || products[0];
  const heroSideTop = products[5] || products[1];
  const heroSideBottom = products[10] || products[2];

  const renderDealCard = (item: Product, prefix: string) => {
    const discountedPrice = item.price * (1 - item.discountPercentage / 100);
    const soldRatio = Math.min(92, Math.max(25, 100 - item.stock));
    return (
      <TouchableOpacity
        key={`${prefix}-${item.id}`}
        style={{ width: 192 }}
        onPress={() => router.push(`/(app)/(tabs)/product/${item.id}`)}
        activeOpacity={0.88}
      >
        <Card style={styles.dealCard} elevation={0}>
          <View style={styles.dealImageBox}>
            <Image
              source={{ uri: item.thumbnail }}
              style={styles.productImage}
              resizeMode="contain"
            />
            <View style={styles.amberDiscountTag}>
              <Text style={styles.amberDiscountText}>
                -{Math.round(item.discountPercentage)}%
              </Text>
            </View>
          </View>
          <Card.Content style={{ padding: 10 }}>
            <View style={styles.priceRow}>
              <Text style={styles.dealGreenPrice}>₱{discountedPrice.toFixed(2)}</Text>
              <Text style={styles.originalPrice}>₱{item.price.toFixed(2)}</Text>
            </View>
            <Text style={styles.blueProductTitle} numberOfLines={2}>
              {item.title}
            </Text>
            <View style={styles.starsRow}>
              <MaterialCommunityIcons name="star" size={13} color="#FBBF24" />
              <Text style={styles.ratingText}>{item.rating.toFixed(1)}</Text>
              <Text style={styles.reviewCountText}>· Sold: {soldRatio}</Text>
            </View>
            <TouchableOpacity
              onPress={() => handleQuickAdd(item)}
              style={styles.dealCartBtn}
              activeOpacity={0.85}
            >
              <MaterialCommunityIcons name="cart-outline" size={14} color="#FFFFFF" />
              <Text style={styles.dealCartBtnText}>Add to Cart</Text>
            </TouchableOpacity>
          </Card.Content>
        </Card>
      </TouchableOpacity>
    );
  };

  if (loading) {
    return (
    <View style={styles.loadingContainer}>
      <ActivityIndicator size="large" color="#E11D48" />
        <Text style={styles.loadingText}>Loading MartFury Crimson Storefront...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.errorContainer}>
        <MaterialCommunityIcons name="alert-circle-outline" size={44} color="#E11D48" />
        <Text style={styles.errorText}>{error}</Text>
        <Button
          mode="contained"
          buttonColor="#E11D48"
          textColor="#FFFFFF"
          onPress={() => fetchData(currentPage)}
          style={styles.retryButton}
        >
          Retry
        </Button>
      </View>
    );
  }

  return (
    <View style={[styles.root, { backgroundColor: isCrimson ? '#09090D' : '#F4F6FA', backgroundImage: isCrimson ? undefined : 'radial-gradient(circle at 18% 15%, rgba(251,191,36,0.22), transparent 45%), radial-gradient(circle at 85% 25%, rgba(56,189,248,0.18), transparent 48%)' } as object]}>
      <CrimsonAmbientBackdrop />
      <ScrollView
        style={styles.scrollView}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#E11D48']} />
        }
        contentContainerStyle={styles.scrollContent}
      >
        {/* Obsidian Dark Header with Crimson Search Pill */}
        <View style={[styles.headerOuter, !isCrimson && { backgroundColor: 'rgba(251, 191, 36, 0.9)', borderBottomColor: 'rgba(255,255,255,0.7)' }]}>
          <View style={styles.headerInner}>
            <View style={styles.headerMainRow}>
              <TouchableOpacity
                style={styles.brandRow}
                onPress={() => fetchData(1)}
                activeOpacity={0.85}
              >
                <View style={styles.brandLogoMark}>
                  <Text style={styles.brandLogoM}>M</Text>
                </View>
                <Text style={styles.brandDark}>mart</Text>
                <Text style={styles.brandWhite}>fury</Text>
              </TouchableOpacity>

              {isDesktop && (
                <TouchableOpacity
                  style={styles.searchBoxDesktop}
                  activeOpacity={0.9}
                  onPress={() => router.push('/(app)/(tabs)/search')}
                >
                  <Text style={styles.searchInputPlaceholder} numberOfLines={1}>
                    Search for products... ({totalProducts} items available)
                  </Text>
                  <View style={styles.searchDarkBtn}>
                    <MaterialCommunityIcons name="magnify" size={20} color="#FFFFFF" />
                  </View>
                </TouchableOpacity>
              )}

              <View style={styles.headerIconsRow}>
                <TouchableOpacity
                  style={styles.accountLink}
                  onPress={() => router.push('/(app)/(tabs)/profile')}
                >
                  <MaterialCommunityIcons name="account-circle-outline" size={26} color="#F8FAFC" />
                  <View>
                    <Text style={styles.accountLabelTop}>
                      Hello, {user ? user.firstName : 'User'}
                    </Text>
                    <Text style={styles.accountLabelBottom}>Account ⌄</Text>
                  </View>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.headerIconBtn}
                  onPress={() => router.push('/(app)/(tabs)/profile')}
                >
                  <MaterialCommunityIcons name="heart-outline" size={23} color="#F8FAFC" />
                  {wishlist.length > 0 && (
                    <View style={styles.countBadge}>
                      <Text style={styles.countBadgeText}>{wishlist.length}</Text>
                    </View>
                  )}
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.headerIconBtn}
                  onPress={() => router.push('/(app)/(tabs)/cart')}
                >
                  <MaterialCommunityIcons name="cart-outline" size={23} color="#F8FAFC" />
                  {itemCount > 0 && (
                    <View style={styles.countBadge}>
                      <Text style={styles.countBadgeText}>{itemCount}</Text>
                    </View>
                  )}
                </TouchableOpacity>
              </View>
            </View>

            {!isDesktop && (
              <TouchableOpacity
                style={styles.searchBoxMobile}
                activeOpacity={0.9}
                onPress={() => router.push('/(app)/(tabs)/search')}
              >
                <Text style={styles.searchInputPlaceholder} numberOfLines={1}>
                  Search for products...
                </Text>
                <View style={styles.searchDarkBtn}>
                  <MaterialCommunityIcons name="magnify" size={18} color="#FFFFFF" />
                </View>
              </TouchableOpacity>
            )}
          </View>

          {/* Sub-Navigation Bar with Crimson "Shop By Department" Pill */}
          <View style={styles.subNavBar}>
            <View style={styles.subNavInner}>
              <TouchableOpacity
                style={styles.deptButton}
                activeOpacity={0.85}
                onPress={() => {
                  if (isDesktop) {
                    setShowDeptSidebar((prev) => !prev);
                  } else {
                    router.push('/(app)/(tabs)/categories');
                  }
                }}
              >
                <MaterialCommunityIcons
                  name={showDeptSidebar && isDesktop ? 'close' : 'menu'}
                  size={18}
                  color="#FFFFFF"
                />
                <Text style={styles.deptButtonText}>Shop By Department</Text>
              </TouchableOpacity>

              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.subNavLinks}
              >
                <TouchableOpacity
                  style={styles.subNavItem}
                  onPress={() => router.push('/(app)/(tabs)/search?sort=discount')}
                >
                  <MaterialCommunityIcons name="fire" size={16} color="#E11D48" />
                  <Text style={styles.subNavLinkText}>Hot Deals</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.subNavItem}
                  onPress={() => router.push('/(app)/(tabs)/categories')}
                >
                  <MaterialCommunityIcons name="tag-outline" size={16} color="#E11D48" />
                  <Text style={styles.subNavLinkText}>Categories ({categories.length})</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.subNavItem}
                  onPress={() => router.push('/(app)/(tabs)/profile')}
                >
                  <MaterialCommunityIcons name="lightning-bolt" size={16} color="#E11D48" />
                  <Text style={styles.subNavLinkText}>Track Your Order</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={() => router.push('/(app)/(tabs)/cart')}>
                  <Text style={styles.subNavPromoText}>Promo Code: SAVE10</Text>
                </TouchableOpacity>
                <DesignModeToggle />
              </ScrollView>
            </View>
          </View>
        </View>

        {/* Main Storefront Body (Optional Left Categories Sidebar + Right Content) */}
        <View style={[styles.bodyWrapper, { flexDirection: isDesktop && showDeptSidebar ? 'row' : 'column' }]}>
          {/* Toggleable Left Categories Drawer (Desktop) */}
          {isDesktop && showDeptSidebar && (
            <View style={styles.leftSidebar}>
              <View style={styles.sidebarHeader}>
                <Text style={styles.sidebarTitle}>Categories</Text>
                <TouchableOpacity onPress={() => setShowDeptSidebar(false)}>
                  <MaterialCommunityIcons name="close" size={18} color="#94A3B8" />
                </TouchableOpacity>
              </View>
              {categories.slice(0, 12).map((cat) => (
                <TouchableOpacity
                  key={cat.slug}
                  style={styles.sidebarItem}
                  onPress={() =>
                    router.push(`/(app)/(tabs)/categories?category=${encodeURIComponent(cat.slug)}`)
                  }
                >
                  <View style={styles.sidebarItemLeft}>
                    <MaterialCommunityIcons
                      name={getCategoryIcon(cat.slug)}
                      size={17}
                      color="#E11D48"
                    />
                    <Text style={styles.sidebarItemText} numberOfLines={1}>
                      {cat.name}
                    </Text>
                  </View>
                  <MaterialCommunityIcons name="chevron-right" size={16} color="#64748B" />
                </TouchableOpacity>
              ))}
              <TouchableOpacity
                style={styles.sidebarViewAll}
                onPress={() => router.push('/(app)/(tabs)/categories')}
              >
                <Text style={styles.sidebarViewAllText}>View All Categories →</Text>
              </TouchableOpacity>
            </View>
          )}

          {/* Primary Content Column */}
          <View style={{ flex: 1 }}>
            {/* Crimson Hero Banner + Right Stacked Promo Cards */}
            {heroMain && (
              <View style={[styles.heroGrid, { flexDirection: isDesktop ? 'row' : 'column' }]}>
                <View style={[styles.heroLeftCard, { flex: isDesktop ? 2.15 : undefined }]}>
                  <Animated.View
                    style={{
                      flex: 1,
                      flexDirection: 'row',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      opacity: heroFade,
                    }}
                  >
                    <TouchableOpacity
                      style={{
                        flex: 1,
                        flexDirection: 'row',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                      }}
                      activeOpacity={0.9}
                      onPress={() => router.push(`/(app)/(tabs)/product/${heroMain.id}`)}
                    >
                      <View style={styles.heroLeftContent}>
                        <Text style={styles.heroBlueTag}>
                          Limited Edition · EXCLUSIVE
                        </Text>
                        <Text style={styles.heroMainHeading} numberOfLines={3}>
                          {heroMain.title.toUpperCase()}
                        </Text>
                        <View style={styles.heroPriceBadge}>
                          <Text style={styles.heroPriceLine}>
                            JUST ₱
                            {(
                              heroMain.price *
                              (1 - heroMain.discountPercentage / 100)
                            ).toFixed(2)}
                          </Text>
                        </View>
                        <View style={styles.shopNowBtn}>
                          <Text style={styles.shopNowBtnText}>Shop Now →</Text>
                        </View>
                      </View>
                      <Image
                        source={{ uri: heroMain.thumbnail }}
                        style={styles.heroMainImage}
                        resizeMode="contain"
                      />
                    </TouchableOpacity>
                  </Animated.View>

                  {/* Slide Indicator Dots */}
                  {heroSlides.length > 1 && (
                    <View
                      style={{
                        position: 'absolute',
                        bottom: 14,
                        left: 24,
                        flexDirection: 'row',
                        gap: 6,
                      }}
                    >
                      {heroSlides.map((slide, idx) => (
                        <TouchableOpacity
                          key={slide.id}
                          onPress={() => handleSelectHeroSlide(idx)}
                          style={{
                            width: idx === heroIndex ? 22 : 8,
                            height: 8,
                            borderRadius: 4,
                            backgroundColor: idx === heroIndex ? '#E11D48' : 'rgba(255,255,255,0.35)',
                          }}
                        />
                      ))}
                    </View>
                  )}
                </View>

                <View style={[styles.heroRightCol, { flex: isDesktop ? 1 : undefined }]}>
                  {heroSideTop && (
                    <TouchableOpacity
                      style={styles.heroSideCard}
                      activeOpacity={0.88}
                      onPress={() => router.push(`/(app)/(tabs)/product/${heroSideTop.id}`)}
                    >
                      <View style={{ flex: 1 }}>
                        <Text style={styles.sideCardTitle} numberOfLines={2}>
                          {heroSideTop.title}
                        </Text>
                        <Text style={styles.sideCardSub}>Top seller in {heroSideTop.category}</Text>
                      </View>
                      <Image
                        source={{ uri: heroSideTop.thumbnail }}
                        style={styles.sideCardImage}
                        resizeMode="contain"
                      />
                      <View style={styles.sideDiscountCircle}>
                        <Text style={styles.sideDiscountOff}>UP TO</Text>
                        <Text style={styles.sideDiscountPct}>
                          {Math.max(15, Math.round(heroSideTop.discountPercentage))}%
                        </Text>
                        <Text style={styles.sideDiscountOff}>OFF</Text>
                      </View>
                    </TouchableOpacity>
                  )}

                  {heroSideBottom && (
                    <TouchableOpacity
                      style={styles.heroSideCard}
                      activeOpacity={0.88}
                      onPress={() => router.push(`/(app)/(tabs)/product/${heroSideBottom.id}`)}
                    >
                      <View style={{ flex: 1 }}>
                        <Text style={styles.sideCardTitle} numberOfLines={2}>
                          {heroSideBottom.title}
                        </Text>
                        <Text style={styles.sideCardSub}>Fold Smarter, Sleep Better</Text>
                      </View>
                      <Image
                        source={{ uri: heroSideBottom.thumbnail }}
                        style={styles.sideCardImage}
                        resizeMode="contain"
                      />
                      <View style={styles.sideDiscountCircle}>
                        <Text style={styles.sideDiscountOff}>UP TO</Text>
                        <Text style={styles.sideDiscountPct}>
                          {Math.max(20, Math.round(heroSideBottom.discountPercentage))}%
                        </Text>
                        <Text style={styles.sideDiscountOff}>OFF</Text>
                      </View>
                    </TouchableOpacity>
                  )}
                </View>
              </View>
            )}

            {/* 5-Pillar Service & Trust Strip */}
            <View style={styles.trustBox}>
              {TRUST_ITEMS.map((item, idx) => (
                <View
                  key={item.title}
                  style={[
                    styles.trustItem,
                    isDesktop && idx < TRUST_ITEMS.length - 1 ? styles.trustItemDivider : undefined,
                  ]}
                >
                  <MaterialCommunityIcons name={item.icon} size={26} color="#E11D48" />
                  <View style={{ flex: 1 }}>
                    <Text style={styles.trustTitle}>{item.title}</Text>
                    <Text style={styles.trustSub}>{item.sub}</Text>
                  </View>
                </View>
              ))}
            </View>

            {/* Top Categories (Icon Tiles Row) */}
            <View style={styles.sectionContainer}>
              <View style={styles.sectionHeader}>
                <View style={styles.sectionHeadingGroup}>
                  <Text style={styles.sectionHeading}>Top Categories</Text>
                  <Text style={styles.crimsonSlashes}>{'///'}</Text>
                </View>
                <TouchableOpacity onPress={() => router.push('/(app)/(tabs)/categories')}>
                  <Text style={styles.viewAllLink}>View All →</Text>
                </TouchableOpacity>
              </View>
              <FlatList
                data={categories}
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.categoryList}
                keyExtractor={(item) => item.slug}
                renderItem={({ item }) => (
                  <TouchableOpacity
                    style={styles.categoryChip}
                    activeOpacity={0.82}
                    onPress={() =>
                      router.push(
                        `/(app)/(tabs)/categories?category=${encodeURIComponent(item.slug)}`
                      )
                    }
                  >
                    <MaterialCommunityIcons
                      name={getCategoryIcon(item.slug)}
                      size={24}
                      color="#F8FAFC"
                    />
                    <Text style={styles.categoryChipText} numberOfLines={1}>
                      {item.name}
                    </Text>
                  </TouchableOpacity>
                )}
              />
            </View>

            {/* Deals Of The Day - Continuous Sideways Loop */}
            {flashDeals.length > 0 && (
              <View style={styles.dealsSection}>
                <View style={styles.dealsHeaderRow}>
                  <View style={styles.dealsTitleGroup}>
                    <MaterialCommunityIcons name="fire" size={22} color="#E11D48" />
                    <Text style={styles.sectionHeading}>Deals Of The Day</Text>
                    <View style={styles.countdownPill}>
                      <Text style={styles.countdownText}>
                        Ends In: {formatCountdown(secondsLeft)}
                      </Text>
                    </View>
                  </View>
                  <TouchableOpacity onPress={() => router.push('/(app)/(tabs)/search?sort=discount')}>
                    <Text style={styles.viewAllLink}>View All →</Text>
                  </TouchableOpacity>
                </View>

                <View
                  style={{ overflow: 'hidden', width: '100%' }}
                  onTouchStart={() => setDealsPaused(true)}
                  onTouchEnd={() => setDealsPaused(false)}
                >
                  <Animated.View
                    style={{
                      flexDirection: 'row',
                      transform: [{ translateX: dealsMarqueeX }],
                    }}
                  >
                    <View
                      style={{ flexDirection: 'row', gap: 12, paddingRight: 12 }}
                      onLayout={(e) => {
                        const measured = e.nativeEvent.layout.width;
                        if (measured > 0 && measured !== dealsTrackWidth) {
                          setDealsTrackWidth(measured);
                        }
                      }}
                    >
                      {flashDeals.map((item) => renderDealCard(item, 'deal-a'))}
                    </View>

                    <View style={{ flexDirection: 'row', gap: 12, paddingRight: 12 }}>
                      {flashDeals.map((item) => renderDealCard(item, 'deal-b'))}
                    </View>
                  </Animated.View>
                </View>
              </View>
            )}

            {/* Featured Marketplace Products */}
            <View style={styles.sectionContainer}>
              <View style={styles.sectionHeader}>
                <View>
                  <View style={styles.sectionHeadingGroup}>
                    <Text style={styles.sectionHeading}>Featured Marketplace Products</Text>
                    <Text style={styles.crimsonSlashes}>{'///'}</Text>
                  </View>
                  <Text style={styles.pageMetaText}>
                    Shop top picks, handpicked for you · Page {currentPage} of {totalPages}
                  </Text>
                </View>
                <TouchableOpacity
                  onPress={() => router.push('/(app)/(tabs)/search')}
                  style={styles.filterBtn}
                >
                  <Text style={styles.filterBtnText}>Advanced Search →</Text>
                </TouchableOpacity>
              </View>

              {/* Quick Sort Bar */}
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={{ gap: 8, marginBottom: 14 }}
              >
                {SORT_OPTIONS.map((opt) => {
                  const active = sortMode === opt.key;
                  return (
                    <TouchableOpacity
                      key={opt.key}
                      onPress={() => setSortMode(opt.key)}
                      style={{
                        paddingHorizontal: 14,
                        paddingVertical: 8,
                        borderRadius: 8,
                        backgroundColor: active ? '#E11D48' : 'rgba(20, 20, 30, 0.8)',
                        borderWidth: 1,
                        borderColor: active ? '#FF1E42' : 'rgba(255, 255, 255, 0.14)',
                      }}
                    >
                      <Text
                        style={{
                          fontSize: 12,
                          fontWeight: '700',
                          color: active ? '#FFFFFF' : '#CBD5E1',
                        }}
                      >
                        {opt.label}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>

              {/* Edge-to-Edge Product Grid */}
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', marginHorizontal: -6 }}>
                {arrangedProducts.map((item) => {
                  const discountedPrice = item.price * (1 - item.discountPercentage / 100);
                  const wished = isWishlisted(item.id);
                  return (
                    <View key={item.id} style={{ width: columnPercent, padding: 6 }}>
                      <TouchableOpacity
                        onPress={() => router.push(`/(app)/(tabs)/product/${item.id}`)}
                        activeOpacity={0.88}
                      >
                        <Card style={styles.card} elevation={0}>
                          <View style={styles.imageContainer}>
                            <Image
                              source={{ uri: item.thumbnail }}
                              style={styles.productImage}
                              resizeMode="contain"
                            />
                            {item.discountPercentage > 0 && (
                              <View style={styles.amberDiscountTag}>
                                <Text style={styles.amberDiscountText}>
                                  -{Math.round(item.discountPercentage)}%
                                </Text>
                              </View>
                            )}
                            <TouchableOpacity
                              onPress={() => toggleWishlist(item)}
                              style={styles.wishlistBtn}
                            >
                              <MaterialCommunityIcons
                                name={wished ? 'heart' : 'heart-outline'}
                                size={16}
                                color={wished ? '#E11D48' : '#CBD5E1'}
                              />
                            </TouchableOpacity>
                          </View>

                          <Card.Content style={{ padding: 10 }}>
                            <Text style={styles.productCategory}>{item.category}</Text>
                            <Text style={styles.blueProductTitle} numberOfLines={2}>
                              {item.title}
                            </Text>

                            <View style={styles.priceRow}>
                              <Text style={styles.currentPrice}>₱{discountedPrice.toFixed(2)}</Text>
                              {item.discountPercentage > 0 && (
                                <Text style={styles.originalPrice}>₱{item.price.toFixed(2)}</Text>
                              )}
                            </View>

                            <View style={styles.cardFooterRow}>
                              <View style={styles.ratingBadge}>
                                <MaterialCommunityIcons name="star" size={14} color="#FBBF24" />
                                <Text style={styles.ratingText}>{item.rating.toFixed(1)}</Text>
                              </View>
                              <TouchableOpacity
                                onPress={() => handleQuickAdd(item)}
                                style={styles.quickAddBtn}
                              >
                                <MaterialCommunityIcons name="cart-plus" size={14} color="#FFFFFF" />
                                <Text style={styles.quickAddText}>Add</Text>
                              </TouchableOpacity>
                            </View>
                          </Card.Content>
                        </Card>
                      </TouchableOpacity>
                    </View>
                  );
                })}
              </View>

              {/* Pagination Bar */}
              <View style={styles.paginationBar}>
                <Button
                  mode="outlined"
                  textColor="#F8FAFC"
                  disabled={currentPage <= 1}
                  onPress={() => fetchData(currentPage - 1)}
                >
                  Previous
                </Button>
                <Text style={styles.paginationText}>
                  Page {currentPage} / {totalPages}
                </Text>
                <Button
                  mode="contained"
                  buttonColor="#E11D48"
                  textColor="#FFFFFF"
                  disabled={currentPage >= totalPages}
                  onPress={() => fetchData(currentPage + 1)}
                >
                  Next
                </Button>
              </View>
            </View>
          </View>
        </View>
      </ScrollView>

      <Snackbar
        visible={!!snackMessage}
        onDismiss={() => setSnackMessage('')}
        duration={2000}
        action={{
          label: 'View Cart',
          onPress: () => router.push('/(app)/(tabs)/cart'),
        }}
      >
        {snackMessage}
      </Snackbar>
    </View>
  );
}