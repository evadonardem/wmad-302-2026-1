import { productApi } from '@/services/productApi';
import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  StyleSheet,
  useWindowDimensions,
  Platform,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Product, CategoryItem } from '@/types/product';
import { useCart } from '@/context/CartContext';
import { useDesignMode } from '@/context/DesignModeContext';
import { CrimsonHeader } from '@/components/CrimsonHeader';

const CATEGORY_ICONS: Record<string, keyof typeof MaterialCommunityIcons.glyphMap> = {
  beauty: 'lipstick',
  fragrances: 'bottle-tonic-outline',
  furniture: 'sofa-outline',
  groceries: 'basket-outline',
  'home-decoration': 'lamp-outline',
  'kitchen-accessories': 'silverware-fork-knife',
  laptops: 'laptop',
  'mens-shirts': 'tshirt-crew-outline',
  'mens-shoes': 'shoe-formal',
  'mens-watches': 'watch',
  'mobile-accessories': 'headphones',
  motorcycle: 'motorbike',
  'skin-care': 'face-woman-shimmer-outline',
  smartphones: 'cellphone',
  'sports-accessories': 'basketball',
  sunglasses: 'sunglasses',
  tablets: 'tablet',
  tops: 'hanger',
  vehicle: 'car-outline',
  'womens-bags': 'bag-personal-outline',
  'womens-dresses': 'human-female',
  'womens-jewellery': 'diamond-stone',
  'womens-shoes': 'shoe-heel',
  'womens-watches': 'watch-variant',
};

export default function CategoriesScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ category?: string }>();
  const { addToCart } = useCart();
  const { isCrimson } = useDesignMode();
  const { width } = useWindowDimensions();

  const [categories, setCategories] = useState<CategoryItem[]>([]);
  const [selectedSlug, setSelectedSlug] = useState<string>(params.category ?? '');
  const [products, setProducts] = useState<Product[]>([]);
  const [loadingCats, setLoadingCats] = useState(true);
  const [loadingProducts, setLoadingProducts] = useState(false);

  useEffect(() => {
    if (params.category !== undefined) {
      setSelectedSlug(params.category);
    }
  }, [params.category]);

  useEffect(() => {
    let active = true;
    setLoadingCats(true);
    productApi
      .getCategories()
      .then((list: any[]) => {
        if (!active) return;
        const normalized: CategoryItem[] = (list as (string | CategoryItem)[]).map((entry) =>
          typeof entry === 'string'
            ? {
                slug: entry,
                url: '',
                name: entry
                  .split('-')
                  .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
                  .join(' '),
              }
            : entry
        );
        setCategories(normalized);
      })
      .finally(() => {
        if (active) setLoadingCats(false);
      });
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    if (!selectedSlug) {
      setProducts([]);
      return;
    }
    let active = true;
    setLoadingProducts(true);
    productApi
      .getProductsByCategory(selectedSlug)
      .then((res: any) => {
        if (active) setProducts(res.products ?? []);
      })
      .finally(() => {
        if (active) setLoadingProducts(false);
      });
    return () => {
      active = false;
    };
  }, [selectedSlug]);

  const isDesktop = width >= 820;
  const activeCategory = categories.find((c) => c.slug === selectedSlug);

  const canvasBg = isCrimson ? '#09090D' : '#F4F6FA';
  const cardBg = isCrimson ? 'rgba(18, 18, 26, 0.86)' : 'rgba(255, 255, 255, 0.85)';
  const cardBorder = isCrimson ? 'rgba(225, 29, 72, 0.34)' : 'rgba(226, 232, 240, 0.95)';
  const titleColor = isCrimson ? '#F8FAFC' : '#0F172A';
  const subTextColor = isCrimson ? '#94A3B8' : '#64748B';
  const accentColor = isCrimson ? '#E11D48' : '#2563EB';
  const iconBoxBg = isCrimson ? 'rgba(225, 29, 72, 0.16)' : 'rgba(37, 99, 235, 0.1)';

  return (
    <View style={[styles.container, { backgroundColor: canvasBg }]}>
      <CrimsonHeader
        searchPlaceholder={isCrimson ? 'Search in Crimson Mode...' : 'Search for products...'}
      />

      {!selectedSlug ? (
        <ScrollView contentContainerStyle={styles.scrollContent}>
          <View style={styles.pageHeader}>
            <Text style={[styles.pageTitle, { color: titleColor }]}>All Categories</Text>
            <Text style={[styles.pageSubtitle, { color: subTextColor }]}>
              Browse {categories.length || 24} product departments
            </Text>
          </View>

          {loadingCats ? (
            <ActivityIndicator size="large" color={accentColor} style={{ marginTop: 40 }} />
          ) : (
            <View style={[styles.deptGrid, isDesktop && styles.deptGridDesktop]}>
              {categories.map((cat) => {
                const iconName = CATEGORY_ICONS[cat.slug] ?? 'tag-outline';
                return (
                  <TouchableOpacity
                    key={cat.slug}
                    activeOpacity={0.85}
                    onPress={() => setSelectedSlug(cat.slug)}
                    style={[
                      styles.deptCard,
                      isDesktop && styles.deptCardDesktop,
                      { backgroundColor: cardBg, borderColor: cardBorder },
                    ]}
                  >
                    <View style={[styles.deptIconBox, { backgroundColor: iconBoxBg }]}>
                      <MaterialCommunityIcons name={iconName} size={20} color={accentColor} />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={[styles.deptName, { color: titleColor }]}>{cat.name}</Text>
                      <Text style={[styles.deptAction, { color: accentColor }]}>Explore →</Text>
                    </View>
                  </TouchableOpacity>
                );
              })}
            </View>
          )}
        </ScrollView>
      ) : (
        <ScrollView contentContainerStyle={styles.scrollContent}>
          <View style={styles.selectedHeaderRow}>
            <View>
              <Text style={[styles.pageTitle, { color: titleColor }]}>
                {activeCategory?.name ?? selectedSlug}
              </Text>
              <Text style={[styles.pageSubtitle, { color: subTextColor }]}>
                {products.length} products in {activeCategory?.name ?? selectedSlug}
              </Text>
            </View>

            <TouchableOpacity
              onPress={() => setSelectedSlug('')}
              activeOpacity={0.85}
              style={[
                styles.allCatsBtn,
                {
                  backgroundColor: isCrimson ? 'rgba(225, 29, 72, 0.16)' : '#EFF6FF',
                  borderColor: isCrimson ? 'rgba(225, 29, 72, 0.45)' : '#BFDBFE',
                },
              ]}
            >
              <Text style={[styles.allCatsBtnText, { color: accentColor }]}>All Categories</Text>
            </TouchableOpacity>
          </View>

          {/* Horizontal Category Pills */}
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.pillsRow}
          >
            {categories.map((cat) => {
              const active = cat.slug === selectedSlug;
              return (
                <TouchableOpacity
                  key={cat.slug}
                  onPress={() => setSelectedSlug(cat.slug)}
                  style={[
                    styles.catPill,
                    {
                      backgroundColor: active
                        ? accentColor
                        : isCrimson
                          ? 'rgba(24, 24, 34, 0.85)'
                          : '#FFFFFF',
                      borderColor: active ? accentColor : cardBorder,
                    },
                  ]}
                >
                  <Text
                    style={[
                      styles.catPillText,
                      { color: active ? '#FFFFFF' : isCrimson ? '#CBD5E1' : '#334155' },
                    ]}
                  >
                    {active ? `✓ ${cat.name}` : cat.name}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>

          {loadingProducts ? (
            <ActivityIndicator size="large" color={accentColor} style={{ marginTop: 40 }} />
          ) : (
            <View style={styles.productList}>
              {products.map((item) => {
                const origPrice = item.discountPercentage
                  ? (item.price / (1 - item.discountPercentage / 100)).toFixed(2)
                  : null;
                return (
                  <TouchableOpacity
                    key={item.id}
                    activeOpacity={0.9}
                    onPress={() => router.push(`/(app)/(tabs)/product/${item.id}`)}
                    style={[
                      styles.productRowCard,
                      { backgroundColor: cardBg, borderColor: cardBorder },
                    ]}
                  >
                    <View
                      style={[
                        styles.thumbWrap,
                        {
                          backgroundColor: isCrimson
                            ? 'rgba(255, 255, 255, 0.06)'
                            : '#F8FAFC',
                        },
                      ]}
                    >
                      <Image
                        source={{ uri: item.thumbnail }}
                        style={styles.thumb}
                        resizeMode="contain"
                      />
                    </View>

                    <View style={{ flex: 1 }}>
                      <Text style={[styles.prodTitle, { color: titleColor }]} numberOfLines={1}>
                        {item.title}
                      </Text>
                      <Text style={[styles.prodMeta, { color: subTextColor }]}>
                        ★ {item.rating.toFixed(1)} · Stock: {item.stock}
                      </Text>
                      <View style={styles.priceRow}>
                        <Text style={[styles.prodPrice, { color: accentColor }]}>
                          ₱{item.price.toFixed(2)}
                        </Text>
                        {origPrice && (
                          <Text style={[styles.origPrice, { color: subTextColor }]}>
                            ₱{origPrice}
                          </Text>
                        )}
                      </View>
                    </View>

                    <TouchableOpacity
                      onPress={() => addToCart(item)}
                      activeOpacity={0.85}
                      style={[styles.addBtn, { backgroundColor: accentColor }]}
                    >
                      <Text style={styles.addBtnText}>+ Cart</Text>
                    </TouchableOpacity>
                  </TouchableOpacity>
                );
              })}
            </View>
          )}
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    padding: 18,
    paddingBottom: 90,
  },
  pageHeader: {
    marginBottom: 16,
  },
  selectedHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
  },
  pageTitle: {
    fontSize: 22,
    fontWeight: '800',
  },
  pageSubtitle: {
    fontSize: 13,
    marginTop: 2,
  },
  allCatsBtn: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 16,
    borderWidth: 1,
  },
  allCatsBtnText: {
    fontSize: 12,
    fontWeight: '700',
  },
  deptGrid: {
    gap: 12,
  },
  deptGridDesktop: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  deptCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    padding: 16,
    borderRadius: 14,
    borderWidth: 1,
    ...(Platform.OS === 'web'
      ? ({ backdropFilter: 'blur(14px)', WebkitBackdropFilter: 'blur(14px)' } as object)
      : {}),
  },
  deptCardDesktop: {
    width: '49.2%',
  },
  deptIconBox: {
    width: 40,
    height: 40,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  deptName: {
    fontSize: 14,
    fontWeight: '700',
  },
  deptAction: {
    fontSize: 12,
    fontWeight: '600',
    marginTop: 2,
  },
  pillsRow: {
    gap: 8,
    paddingBottom: 14,
  },
  catPill: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 18,
    borderWidth: 1,
  },
  catPillText: {
    fontSize: 12,
    fontWeight: '700',
  },
  productList: {
    gap: 12,
  },
  productRowCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    padding: 14,
    borderRadius: 14,
    borderWidth: 1,
    ...(Platform.OS === 'web'
      ? ({ backdropFilter: 'blur(14px)', WebkitBackdropFilter: 'blur(14px)' } as object)
      : {}),
  },
  thumbWrap: {
    width: 64,
    height: 64,
    borderRadius: 12,
    padding: 6,
    alignItems: 'center',
    justifyContent: 'center',
  },
  thumb: {
    width: '100%',
    height: '100%',
  },
  prodTitle: {
    fontSize: 15,
    fontWeight: '700',
  },
  prodMeta: {
    fontSize: 12,
    marginTop: 3,
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 4,
  },
  prodPrice: {
    fontSize: 15,
    fontWeight: '800',
  },
  origPrice: {
    fontSize: 12,
    textDecorationLine: 'line-through',
  },
  addBtn: {
    paddingHorizontal: 16,
    paddingVertical: 9,
    borderRadius: 18,
  },
  addBtnText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '800',
  },
});
