import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  Image,
  ImageBackground,
  LayoutChangeEvent,
  Modal,
  Platform,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  View,
  useWindowDimensions,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { router, useLocalSearchParams, usePathname } from 'expo-router';
import { Icon, IconButton, Menu, Text, TextInput, useTheme } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import LocationForm from '@/components/LocationForm';
import MediaGallery, { GalleryPhoto } from '@/components/MediaGallery';
import {
  getInitialPhilippinePhotos,
  searchPhotosByLocation,
} from '@/services/geoPhotoService';
import { usePhotos } from '@/photos';
import { useSearchHistory } from '@/searchHistory';
import { useThemeMode } from '@/themeMode';

// CINEMATIC WALLPAPER IMAGES FOR LIGHT AND DARK MODES
const LIGHT_MODE_CINEMATIC_SUNNY_MOUNTAIN =
  'https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=2000&q=85';

const DARK_MODE_CINEMATIC_NIGHT_STARGAZING =
  'https://images.unsplash.com/photo-1519681393784-d120267933ba?auto=format&fit=crop&w=2000&q=85';

const STORAGE_RECENT_KEY = 'LAKBAY_TEMPORARY_RECENT_SEARCHES';
const STORAGE_SAVED_COLLECTION_KEY = 'LAKBAY_SAVED_COLLECTION_ITEMS';
const STORAGE_LIKED_COLLECTION_KEY = 'LAKBAY_LIKED_COLLECTION_ITEMS';
const STORAGE_FULL_HISTORY_KEY = 'LAKBAY_FULL_BROWSING_HISTORY_V3';

// HELPER TO REGISTER EVENTS IN HISTORY & RECENT SEARCHES
export async function registerNewSearchEvent(query: string) {
  if (!query || !query.trim()) return;
  const cleanQ = query.trim();

  try {
    let recentStored: string | null = null;
    if (Platform.OS === 'web' && typeof window !== 'undefined' && window.localStorage) {
      recentStored = window.localStorage.getItem(STORAGE_RECENT_KEY);
    } else {
      recentStored = await AsyncStorage.getItem(STORAGE_RECENT_KEY);
    }

    let recentArr: string[] = recentStored ? JSON.parse(recentStored) : [];
    recentArr = [cleanQ, ...recentArr.filter((q) => q.toLowerCase() !== cleanQ.toLowerCase())].slice(0, 5);

    const jsonRecent = JSON.stringify(recentArr);
    if (Platform.OS === 'web' && typeof window !== 'undefined' && window.localStorage) {
      window.localStorage.setItem(STORAGE_RECENT_KEY, jsonRecent);
    }
    await AsyncStorage.setItem(STORAGE_RECENT_KEY, jsonRecent);
  } catch (e) {}

  try {
    let historyStored: string | null = null;
    if (Platform.OS === 'web' && typeof window !== 'undefined' && window.localStorage) {
      historyStored = window.localStorage.getItem(STORAGE_FULL_HISTORY_KEY);
    } else {
      historyStored = await AsyncStorage.getItem(STORAGE_FULL_HISTORY_KEY);
    }

    let historyArr: any[] = historyStored ? JSON.parse(historyStored) : [];
    historyArr.unshift({
      id: `srch-${Date.now()}`,
      title: cleanQ,
      type: 'search',
      urlOrQuery: cleanQ,
      timestamp: Date.now(),
    });

    const jsonHist = JSON.stringify(historyArr);
    if (Platform.OS === 'web' && typeof window !== 'undefined' && window.localStorage) {
      window.localStorage.setItem(STORAGE_FULL_HISTORY_KEY, jsonHist);
    }
    await AsyncStorage.setItem(STORAGE_FULL_HISTORY_KEY, jsonHist);
  } catch (e) {}
}

export async function registerTabVisitEvent(tabTitle: string, routePath: string) {
  try {
    let historyStored: string | null = null;
    if (Platform.OS === 'web' && typeof window !== 'undefined' && window.localStorage) {
      historyStored = window.localStorage.getItem(STORAGE_FULL_HISTORY_KEY);
    } else {
      historyStored = await AsyncStorage.getItem(STORAGE_FULL_HISTORY_KEY);
    }

    let historyArr: any[] = historyStored ? JSON.parse(historyStored) : [];
    historyArr.unshift({
      id: `tab-${Date.now()}`,
      title: `${tabTitle} Tab Opened`,
      type: 'tab_visit',
      urlOrQuery: routePath,
      timestamp: Date.now(),
    });

    const jsonHist = JSON.stringify(historyArr);
    if (Platform.OS === 'web' && typeof window !== 'undefined' && window.localStorage) {
      window.localStorage.setItem(STORAGE_FULL_HISTORY_KEY, jsonHist);
    }
    await AsyncStorage.setItem(STORAGE_FULL_HISTORY_KEY, jsonHist);
  } catch (e) {}
}

// RECENT SEARCHES DROPDOWN COMPONENT (POPUP DIRECTLY BELOW INPUT)
function RecentSearchDropdown({
  visible,
  onSelectQuery,
}: {
  visible: boolean;
  onSelectQuery: (query: string) => void;
}) {
  const [recentList, setRecentList] = useState<string[]>([]);

  const loadRecentSearches = async () => {
    try {
      let stored: string | null = null;
      if (Platform.OS === 'web' && typeof window !== 'undefined' && window.localStorage) {
        stored = window.localStorage.getItem(STORAGE_RECENT_KEY);
      } else {
        stored = await AsyncStorage.getItem(STORAGE_RECENT_KEY);
      }

      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed) && parsed.length > 0) {
          setRecentList(parsed);
          return;
        }
      }

      const defaultRecent = ['baguio city', 'la trinidad benguet'];
      setRecentList(defaultRecent);
      await AsyncStorage.setItem(STORAGE_RECENT_KEY, JSON.stringify(defaultRecent));
    } catch (e) {}
  };

  useEffect(() => {
    if (visible) {
      void loadRecentSearches();
    }
  }, [visible]);

  const handleClearRecentOnly = async () => {
    setRecentList([]);
    try {
      if (Platform.OS === 'web' && typeof window !== 'undefined' && window.localStorage) {
        window.localStorage.removeItem(STORAGE_RECENT_KEY);
      }
      await AsyncStorage.setItem(STORAGE_RECENT_KEY, JSON.stringify([]));
    } catch (e) {}
  };

  const handleRemoveOneItem = async (queryToRemove: string) => {
    const updated = recentList.filter((item) => item !== queryToRemove);
    setRecentList(updated);
    try {
      const jsonStr = JSON.stringify(updated);
      if (Platform.OS === 'web' && typeof window !== 'undefined' && window.localStorage) {
        window.localStorage.setItem(STORAGE_RECENT_KEY, jsonStr);
      }
      await AsyncStorage.setItem(STORAGE_RECENT_KEY, JSON.stringify(updated));
    } catch (e) {}
  };

  if (!visible) return null;

  return (
    <View style={dropdownStyles.dropdownCard}>
      <View style={dropdownStyles.headerRow}>
        <Text style={dropdownStyles.headerTitle}>Recent searches</Text>
        <TouchableOpacity onPress={handleClearRecentOnly}>
          <Text style={dropdownStyles.clearText}>Clear</Text>
        </TouchableOpacity>
      </View>

      <View style={dropdownStyles.chipsContainer}>
        {recentList.map((item) => (
          <View key={item} style={dropdownStyles.chipPill}>
            <Pressable
              style={dropdownStyles.chipTextPressable}
              onPress={() => onSelectQuery(item)}
            >
              <Text style={dropdownStyles.chipText}>{item}</Text>
              <Icon source="history" size={14} color="#555555" />
            </Pressable>

            <TouchableOpacity
              style={dropdownStyles.removeOneBtn}
              onPress={() => void handleRemoveOneItem(item)}
            >
              <Icon source="close" size={12} color="#777777" />
            </TouchableOpacity>
          </View>
        ))}
      </View>
    </View>
  );
}

export default function SearchScreen() {
  const theme = useTheme();
  const { width } = useWindowDimensions();
  const isWide = width >= 760;

  const { isDarkMode, setIsDarkMode } = useThemeMode();
  const { photos, setPhotos } = usePhotos();
  const searchHistoryContext = useSearchHistory();
  const pathname = usePathname();

  // Scroll references & layout measurement state
  const scrollViewRef = useRef<React.ElementRef<typeof ScrollView>>(null);
  const resultsYPos = useRef<number>(550);

  // LOCAL STATE FALLBACK FOR RECENT SEARCHES
  const [localHistory, setLocalHistory] = useState<string[]>([]);
  const [menuVisible, setMenuVisible] = useState(false);

  // MY COLLECTION MODAL & TAB STATE
  const [collectionModalVisible, setCollectionModalVisible] = useState(false);
  const [activeCollectionTab, setActiveCollectionTab] = useState<'saved' | 'liked'>('saved');
  const [savedCollectionItems, setSavedCollectionItems] = useState<GalleryPhoto[]>([]);
  const [likedCollectionItems, setLikedCollectionItems] = useState<GalleryPhoto[]>([]);

  // Safely extract search history properties regardless of exact hook implementation
  const contextSearches: string[] =
    (searchHistoryContext as any)?.recentSearches ||
    (searchHistoryContext as any)?.history ||
    (searchHistoryContext as any)?.searches ||
    [];

  // Merge context search history with local state history
  const recentSearches = Array.from(new Set([...localHistory, ...contextSearches]));

  // LOAD PERSISTED SAVED & LIKED MEDIA COLLECTIONS
  const loadMediaCollections = useCallback(async () => {
    try {
      let savedStr: string | null = null;
      let likedStr: string | null = null;

      if (Platform.OS === 'web' && typeof window !== 'undefined' && window.localStorage) {
        savedStr = window.localStorage.getItem(STORAGE_SAVED_COLLECTION_KEY);
        likedStr = window.localStorage.getItem(STORAGE_LIKED_COLLECTION_KEY);
      } else {
        savedStr = await AsyncStorage.getItem(STORAGE_SAVED_COLLECTION_KEY);
        likedStr = await AsyncStorage.getItem(STORAGE_LIKED_COLLECTION_KEY);
      }

      if (savedStr) setSavedCollectionItems(JSON.parse(savedStr));
      if (likedStr) setLikedCollectionItems(JSON.parse(likedStr));
    } catch (e) {
      console.error('Failed to load saved or liked collection items', e);
    }
  }, []);

  const saveCollectionToStorage = async (key: string, data: GalleryPhoto[]) => {
    try {
      const jsonStr = JSON.stringify(data);
      if (Platform.OS === 'web' && typeof window !== 'undefined' && window.localStorage) {
        window.localStorage.setItem(key, jsonStr);
        window.dispatchEvent(new Event('storage'));
      }
      await AsyncStorage.setItem(key, jsonStr);
    } catch (e) {
      console.error('Failed to persist collection changes', e);
    }
  };

  const handleRemoveSavedItem = async (id: number) => {
    const updated = savedCollectionItems.filter((item) => item.id !== id);
    setSavedCollectionItems(updated);
    await saveCollectionToStorage(STORAGE_SAVED_COLLECTION_KEY, updated);
  };

  const handleRemoveLikedItem = async (id: number) => {
    const updated = likedCollectionItems.filter((item) => item.id !== id);
    setLikedCollectionItems(updated);
    await saveCollectionToStorage(STORAGE_LIKED_COLLECTION_KEY, updated);
  };

  const saveSearchToHistory = useCallback(
    async (queryStr: string) => {
      const cleanTerm = queryStr.trim();
      if (!cleanTerm) return;

      // Register into both short-term Recent Searches AND long-term History
      await registerNewSearchEvent(cleanTerm);

      setLocalHistory((prev) => {
        const filtered = prev.filter(
          (item) => item.toLowerCase() !== cleanTerm.toLowerCase()
        );
        const updated = [cleanTerm, ...filtered].slice(0, 10);

        if (Platform.OS === 'web' && typeof window !== 'undefined' && window.localStorage) {
          try {
            window.localStorage.setItem(STORAGE_RECENT_KEY, JSON.stringify(updated));
            window.dispatchEvent(new Event('storage'));
          } catch (e) {}
        }
        AsyncStorage.setItem(STORAGE_RECENT_KEY, JSON.stringify(updated)).catch(() => {});

        return updated;
      });
    },
    []
  );

  const handleClearAllHistory = useCallback(async () => {
    setLocalHistory([]);
    if (Platform.OS === 'web' && typeof window !== 'undefined' && window.localStorage) {
      try {
        window.localStorage.removeItem(STORAGE_RECENT_KEY);
        window.dispatchEvent(new Event('storage'));
      } catch (e) {}
    }
    await AsyncStorage.removeItem(STORAGE_RECENT_KEY).catch(() => {});
  }, []);

  // TODO 3.7 [Global Search Coordination]:
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [lastSearchedCity, setLastSearchedCity] = useState('');
  const [activeCategory, setActiveCategory] = useState('All');
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [searchError, setSearchError] = useState('');

  // Top Header Search Live Input State
  const [headerTypedQuery, setHeaderTypedQuery] = useState('');
  const [showTopDropdown, setShowTopDropdown] = useState(false);

  // DYNAMIC DICTIONARY AUTOCOMPLETE SUGGESTIONS
  const [dynamicSuggestions, setDynamicSuggestions] = useState<string[]>([]);

  // City handed back from the History screen as a route param (see TODO 5.4)
  const { q } = useLocalSearchParams<{ q?: string }>();

  // DYNAMIC THEME PALETTE FOR LIGHT MODE AND DARK MODE
  const palette = isDarkMode
    ? {
        text: '#F2F8EE',
        muted: '#B0D4B5',
        surface: 'rgba(7, 26, 21, 0.90)',
        navBg: 'rgba(7, 26, 21, 0.88)',
        inputBg: 'rgba(10, 37, 30, 0.92)',
        heroTitle: '#FFFFFF',
        heroSub: '#E0F2F1',
        eyebrowText: '#A2E3B2',
        border: 'rgba(90, 168, 117, 0.4)',
        primary: '#00695C',
        overlayGradient: ['rgba(7, 26, 21, 0.75)', 'rgba(4, 18, 14, 0.92)'] as const,
        hoverBg: 'rgba(0, 0, 0, 0.05)',
      }
    : {
        text: '#0D2D1B',
        muted: '#1E4D30',
        surface: 'rgba(235, 248, 238, 0.92)',
        navBg: 'rgba(240, 252, 243, 0.92)',
        inputBg: '#FFFFFF',
        heroTitle: '#04210F',
        heroSub: '#0D381E',
        eyebrowText: '#1B5E20',
        border: 'rgba(46, 125, 50, 0.35)',
        primary: '#2E7D32',
        overlayGradient: [
          'rgba(232, 245, 233, 0.68)',
          'rgba(165, 214, 167, 0.82)',
          'rgba(27, 94, 32, 0.35)',
        ] as const,
        hoverBg: 'rgba(0, 0, 0, 0.05)',
      };

  // FETCH DYNAMIC AUTOCOMPLETE WORD SUGGESTIONS
  useEffect(() => {
    const trimmed = headerTypedQuery.trim().toLowerCase();
    if (!trimmed) {
      setDynamicSuggestions([]);
      return;
    }

    const timer = setTimeout(async () => {
      try {
        const response = await fetch(
          `https://api.dictionaryapi.dev/api/v2/entries/en/${encodeURIComponent(trimmed)}`
        );

        if (response.ok) {
          const data = await response.json();
          if (Array.isArray(data)) {
            const wordList: string[] = [];
            data.forEach((entry: any) => {
              if (entry.word) wordList.push(entry.word.toLowerCase());
              if (entry.meanings) {
                entry.meanings.forEach((m: any) => {
                  if (m.synonyms) {
                    m.synonyms.forEach((syn: string) => wordList.push(syn.toLowerCase()));
                  }
                });
              }
            });

            const uniqueTerms = Array.from(new Set([trimmed, ...wordList])).slice(0, 7);
            setDynamicSuggestions(uniqueTerms);
          }
        } else {
          setDynamicSuggestions([
            trimmed,
            `${trimmed} city`,
            `${trimmed} country`,
            `${trimmed} island`,
            `${trimmed} landmark`,
          ]);
        }
      } catch (err) {
        setDynamicSuggestions([trimmed]);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [headerTypedQuery]);

  // INITIAL HOME PAGE LOAD & STORAGE HYDRATION
  useEffect(() => {
    let active = true;

    const loadInitialCollage = async () => {
      // Record home tab visit in full history
      void registerTabVisitEvent('Search & Discover Home', '/(tabs)');
      void loadMediaCollections();

      try {
        if (Platform.OS === 'web' && typeof window !== 'undefined' && window.localStorage) {
          const item = window.localStorage.getItem(STORAGE_RECENT_KEY);
          if (item && active) {
            const parsed = JSON.parse(item);
            setLocalHistory(parsed);
          }
        } else {
          const item = await AsyncStorage.getItem(STORAGE_RECENT_KEY);
          if (item && active) {
            const parsed = JSON.parse(item);
            setLocalHistory(parsed);
          }
        }
      } catch (e) {}

      if (photos.length > 0) return;
      setLoading(true);

      try {
        const initialPhotos = await getInitialPhilippinePhotos(40);
        if (active) {
          setPhotos(initialPhotos);
        }
      } catch (err) {
        console.error('Initial collage error:', err);
      } finally {
        if (active) setLoading(false);
      }
    };

    void loadInitialCollage();

    return () => {
      active = false;
    };
  }, [loadMediaCollections]);

  const handleResultsLayout = (e: LayoutChangeEvent) => {
    resultsYPos.current = e.nativeEvent.layout.y;
  };

  const scrollToResults = () => {
    if (scrollViewRef.current) {
      const scrollInstance = scrollViewRef.current as any;
      if (typeof scrollInstance.scrollTo === 'function') {
        scrollInstance.scrollTo({ y: resultsYPos.current - 10, animated: true });
      }
    }
  };

  const executeQuery = useCallback(
    async (queryText: string, category: string = 'All', pageNum: number = 1, append: boolean = false) => {
      setLoading(true);
      setSearchError('');

      try {
        let targetSearch = queryText.trim();
        if (!targetSearch) {
          targetSearch = category !== 'All' ? `Philippines ${category}` : 'Philippines';
        } else if (category !== 'All' && !targetSearch.toLowerCase().includes(category.toLowerCase())) {
          targetSearch = `${targetSearch} ${category}`;
        }

        const res = await searchPhotosByLocation(targetSearch, category, pageNum, 40);

        if (append) {
          setPhotos((prev) => [...prev, ...res.photos]);
        } else {
          setPhotos(res.photos);
          setTimeout(() => {
            scrollToResults();
          }, 150);
        }

        setHasMore(res.photos.length > 0);
        setPage(pageNum);

        if (queryText.trim()) {
          void saveSearchToHistory(queryText.trim());
        }
      } catch (err) {
        console.error('Execution Query Error:', err);
        setSearchError('Unable to load photos right now.');
      } finally {
        setLoading(false);
      }
    },
    [saveSearchToHistory, setPhotos]
  );

  const handleSearchSubmit = useCallback(
    (locationName: string) => {
      // TODO 3.8 [Operational Async Glue Engine]:
      const city = locationName.trim();
      setLastSearchedCity(city);
      setHeaderTypedQuery(city);
      setShowTopDropdown(false);
      void executeQuery(city, activeCategory, 1, false);
    },
    [activeCategory, executeQuery]
  );

  const handleSelectCategory = useCallback(
    (newCategory: string) => {
      setActiveCategory(newCategory);
      void executeQuery(lastSearchedCity, newCategory, 1, false);
    },
    [lastSearchedCity, executeQuery]
  );

  const handleSearchQueryChange = useCallback(
    (query: string) => {
      setLastSearchedCity(query);
      setHeaderTypedQuery(query);
    },
    []
  );

  const handleLoadMore = useCallback(() => {
    if (loading || !hasMore) return;
    const nextPage = page + 1;
    void executeQuery(lastSearchedCity, activeCategory, nextPage, true);
  }, [loading, hasMore, page, lastSearchedCity, activeCategory, executeQuery]);

  const handleRefresh = async () => {
    // TODO 4.6 [Pull-to-Refresh Workflow]:
    setRefreshing(true);
    try {
      if (lastSearchedCity || activeCategory !== 'All') {
        await executeQuery(lastSearchedCity, activeCategory, 1, false);
      } else {
        const fresh = await getInitialPhilippinePhotos(40);
        setPhotos(fresh);
      }
      await loadMediaCollections();
    } finally {
      setRefreshing(false);
    }
  };

  useEffect(() => {
    // TODO 5.4 [Param-Driven Re-Search]:
    const city = Array.isArray(q) ? q[0] : q;

    if (city?.trim()) {
      setLastSearchedCity(city.trim());
      setHeaderTypedQuery(city.trim());
      void executeQuery(city.trim(), activeCategory, 1, false);
    }
  }, [q, activeCategory, executeQuery]);

  const goToSearch = () => {
    if (pathname !== '/(tabs)' && pathname !== '/(tabs)/index') {
      router.replace('/(tabs)');
    }
  };

  const goToAbout = () => {
    void registerTabVisitEvent('About Us', '/(tabs)/about');
    router.push('/(tabs)/about');
  };

  const goToHistory = () => {
    void registerTabVisitEvent('Search & Browsing History', '/history');
    router.push('/history');
  };

  const renderHighlightedText = (term: string) => {
    const trimmed = headerTypedQuery.trim().toLowerCase();
    if (term.toLowerCase().startsWith(trimmed)) {
      const matchPart = term.slice(0, trimmed.length);
      const restPart = term.slice(trimmed.length);
      return (
        <Text style={{ fontSize: 15 }}>
          <Text style={{ fontWeight: '900', color: '#000000' }}>{matchPart}</Text>
          <Text style={{ fontWeight: '400', color: '#8E8E93' }}>{restPart}</Text>
        </Text>
      );
    }
    return <Text style={{ fontSize: 15, fontWeight: '400', color: '#8E8E93' }}>{term}</Text>;
  };

  return (
    <ImageBackground
      source={{
        uri: isDarkMode
          ? DARK_MODE_CINEMATIC_NIGHT_STARGAZING
          : LIGHT_MODE_CINEMATIC_SUNNY_MOUNTAIN,
      }}
      style={styles.fullBackground}
      resizeMode="cover"
    >
      <LinearGradient
        colors={palette.overlayGradient}
        style={styles.fullBackground}
        pointerEvents="box-none"
      >
        <SafeAreaView
          style={styles.safeArea}
          edges={['top', 'left', 'right']}
          pointerEvents="box-none"
        >
          {/* HEADER NAV BAR */}
          <View
            style={[
              styles.navBar,
              {
                backgroundColor: palette.navBg,
                borderBottomColor: palette.border,
                zIndex: 9999,
              },
            ]}
          >
            <Pressable
              onPress={(e) => {
                e.stopPropagation?.();
                goToSearch();
              }}
              style={({ pressed }) => [styles.brand, pressed && { opacity: 0.85 }]}
              accessibilityRole="button"
              accessibilityLabel="Lakbay PH Logo, Go to Search"
            >
              <LinearGradient
                colors={['#10B981', '#059669', '#047857']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.modernLogoBadge}
              >
                <Text style={styles.modernLogoEmoji}>🌱</Text>
                <View style={styles.modernLogoGlow} />
              </LinearGradient>
              {isWide && (
                <View style={{ marginRight: 10 }}>
                  <Text style={[styles.brandName, { color: palette.text }]}>
                    Lakbay PH
                  </Text>
                  <Text style={[styles.brandCaption, { color: palette.muted }]}>
                    EXPLORE NATURALLY
                  </Text>
                </View>
              )}
            </Pressable>

            {/* SEARCH BAR CONTAINER WITH EXPLICIT TOUCH & FOCUS HANDLERS */}
            <View style={styles.headerSearchWrapper}>
              <TouchableOpacity
                activeOpacity={1}
                onPress={() => setShowTopDropdown(true)}
                style={{ width: '100%' }}
              >
                <TextInput
                  mode="outlined"
                  placeholder="Search for free photos"
                  placeholderTextColor="#A2A2A2"
                  value={headerTypedQuery}
                  onChangeText={(text: string) => {
                    setHeaderTypedQuery(text);
                    setShowTopDropdown(true);
                  }}
                  onFocus={() => setShowTopDropdown(true)}
                  onSubmitEditing={() => {
                    setShowTopDropdown(false);
                    if (headerTypedQuery.trim()) {
                      handleSearchSubmit(headerTypedQuery.trim());
                    }
                  }}
                  right={
                    <TextInput.Icon
                      icon="magnify"
                      color="#8E8E93"
                      onPress={() => {
                        setShowTopDropdown(false);
                        if (headerTypedQuery.trim()) {
                          handleSearchSubmit(headerTypedQuery.trim());
                        }
                      }}
                    />
                  }
                  textColor="#000000"
                  style={styles.headerSearchInput}
                  outlineStyle={{ borderRadius: 28, borderColor: '#E5E5EA', borderWidth: 1 }}
                />
              </TouchableOpacity>
            </View>

            <View style={styles.navActions}>
              <IconButton
                icon="history"
                iconColor={palette.text}
                size={22}
                onPress={goToHistory}
                accessibilityRole="button"
                accessibilityLabel="Open Search History Screen"
              />

              <IconButton
                icon={isDarkMode ? 'weather-sunny' : 'weather-night'}
                iconColor={palette.text}
                size={22}
                onPress={() => setIsDarkMode(!isDarkMode)}
                accessibilityRole="button"
                accessibilityLabel="Toggle light or dark mode"
              />

              <Menu
                visible={menuVisible}
                onDismiss={() => setMenuVisible(false)}
                anchor={
                  <IconButton
                    icon="menu"
                    iconColor={palette.text}
                    size={24}
                    onPress={() => setMenuVisible(true)}
                    accessibilityRole="button"
                    accessibilityLabel="Open Navigation Menu"
                  />
                }
              >
                <Menu.Item
                  onPress={() => {
                    setMenuVisible(false);
                    void loadMediaCollections();
                    setCollectionModalVisible(true);
                  }}
                  title="My Collection"
                  leadingIcon="folder-multiple-image"
                />
                <Menu.Item
                  onPress={() => {
                    setMenuVisible(false);
                    goToAbout();
                  }}
                  title="About"
                  leadingIcon="information-outline"
                />
              </Menu>
            </View>
          </View>

          {/* FLOATING OVERLAY DROPDOWN FOR RECENT SEARCHES */}
          {showTopDropdown && (
            <Pressable
              style={styles.dropdownBackdropOverlay}
              onPress={() => setShowTopDropdown(false)}
            >
              <View style={styles.dropdownPortalContainer}>
                {!headerTypedQuery.trim() ? (
                  <RecentSearchDropdown
                    visible={true}
                    onSelectQuery={(qStr) => {
                      setHeaderTypedQuery(qStr);
                      setShowTopDropdown(false);
                      handleSearchSubmit(qStr);
                    }}
                  />
                ) : (
                  dynamicSuggestions.length > 0 && (
                    <View style={styles.suggestionsCard}>
                      <ScrollView keyboardShouldPersistTaps="handled" nestedScrollEnabled style={{ maxHeight: 280 }}>
                        {dynamicSuggestions.map((term: string, idx: number) => (
                          <Pressable
                            key={`${term}-${idx}`}
                            onPress={() => {
                              setHeaderTypedQuery(term);
                              setShowTopDropdown(false);
                              handleSearchSubmit(term);
                            }}
                            style={({ pressed }) => [
                              styles.suggestionRow,
                              pressed && { backgroundColor: palette.hoverBg },
                            ]}
                          >
                            {renderHighlightedText(term)}
                          </Pressable>
                        ))}
                      </ScrollView>
                    </View>
                  )
                )}
              </View>
            </Pressable>
          )}

          <ScrollView
            ref={scrollViewRef as any}
            style={styles.scrollView}
            contentContainerStyle={styles.scrollContent}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={handleRefresh}
                tintColor={palette.primary}
                colors={[palette.primary]}
              />
            }
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          >
            <View style={styles.pageFullWidth}>
              <View style={styles.formConstraintContainer}>
                <View style={styles.mergedHeroContainer}>
                  <LinearGradient
                    colors={
                      isDarkMode
                        ? ['rgba(16, 185, 129, 0.25)', 'rgba(5, 150, 105, 0.15)']
                        : ['rgba(209, 250, 229, 0.95)', 'rgba(167, 243, 208, 0.75)']
                    }
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={[styles.heroBadgePill, { borderColor: palette.border }]}
                  >
                    <View style={styles.heroBadgeIconWrap}>
                      <Text style={styles.heroBadgeIcon}>🌱</Text>
                    </View>
                    <Text style={[styles.heroBadgeText, { color: palette.eyebrowText }]}>
                      LakBay PH
                    </Text>
                  </LinearGradient>

                  <Text
                    variant={isWide ? 'displaySmall' : 'headlineLarge'}
                    style={[styles.heroTitle, { color: palette.heroTitle }]}
                  >
                    Find your{'\n'}wild side.
                  </Text>

                  <Text style={[styles.heroSubtitle, { color: palette.heroSub }]}>
                    Discover lush mountains, peaceful beaches, hidden waterfalls, and natural wonders worldwide.
                  </Text>

                  <View style={styles.heroTagline}>
                    <Text style={styles.sparkle}>✦</Text>
                    <Text style={[styles.heroTaglineText, { color: palette.eyebrowText }]}>
                      Find your path. Feel the Philippines & Beyond.
                    </Text>
                  </View>
                </View>

                <LocationForm onSearch={handleSearchSubmit} />

                <View onLayout={handleResultsLayout} style={styles.resultsHeader}>
                  <View style={styles.resultsCopy}>
                    <Text style={[styles.resultsTitle, { color: palette.heroTitle }]}>
                      {loading && photos.length === 0
                        ? 'Searching Pexels...'
                        : lastSearchedCity
                          ? `Results for "${lastSearchedCity}"${activeCategory !== 'All' ? ` - ${activeCategory}` : ''}`
                          : activeCategory !== 'All'
                            ? `Popular ${activeCategory} Destinations`
                            : 'Discover Popular Destinations'}
                    </Text>
                    <Text style={[styles.resultsSubtitle, { color: palette.heroSub }]}>
                      {lastSearchedCity
                        ? `Showing tourist photos for ${lastSearchedCity}${activeCategory !== 'All' ? ` (${activeCategory})` : ''}.`
                        : `Explore ${activeCategory === 'All' ? 'beaches, mountains, foods, and landmarks' : activeCategory.toLowerCase()} across the world.`}
                    </Text>
                  </View>
                  <Text style={styles.resultsEmoji}>🌱</Text>
                </View>
              </View>

              {searchError ? (
                <View style={[styles.messageCard, { backgroundColor: palette.surface, borderColor: palette.border }]}>
                  <Text style={[styles.messageText, { color: palette.text }]}>
                    {searchError}
                  </Text>
                </View>
              ) : null}

              <MediaGallery
                photos={photos}
                loading={loading}
                activeCategory={activeCategory}
                onSelectCategory={handleSelectCategory}
                onSearchQueryChange={handleSearchQueryChange}
                onLoadMore={handleLoadMore}
                hasMoreToLoad={hasMore}
              />
            </View>
          </ScrollView>

          {/* MY COLLECTION MODAL */}
          <Modal
            visible={collectionModalVisible}
            transparent
            animationType="slide"
            onRequestClose={() => setCollectionModalVisible(false)}
          >
            <View style={styles.collectionModalBackdrop}>
              <View style={[styles.collectionModalCard, { backgroundColor: palette.surface }]}>
                <View style={styles.collectionHeaderRow}>
                  <Text style={[styles.collectionModalTitle, { color: palette.text }]}>
                    My Collection
                  </Text>
                  <TouchableOpacity onPress={() => setCollectionModalVisible(false)}>
                    <Icon source="close" size={24} color={palette.text} />
                  </TouchableOpacity>
                </View>

                {/* COLLECTION TABS */}
                <View style={styles.tabBarRow}>
                  <TouchableOpacity
                    style={[
                      styles.tabButton,
                      activeCollectionTab === 'saved' && { backgroundColor: palette.primary },
                    ]}
                    onPress={() => setActiveCollectionTab('saved')}
                  >
                    <Icon
                      source="bookmark"
                      size={18}
                      color={activeCollectionTab === 'saved' ? '#FFFFFF' : palette.primary}
                    />
                    <Text
                      style={[
                        styles.tabButtonText,
                        { color: activeCollectionTab === 'saved' ? '#FFFFFF' : palette.primary },
                      ]}
                    >
                      Saved ({savedCollectionItems.length})
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[
                      styles.tabButton,
                      activeCollectionTab === 'liked' && { backgroundColor: '#E53935' },
                    ]}
                    onPress={() => setActiveCollectionTab('liked')}
                  >
                    <Icon
                      source="heart"
                      size={18}
                      color={activeCollectionTab === 'liked' ? '#FFFFFF' : '#E53935'}
                    />
                    <Text
                      style={[
                        styles.tabButtonText,
                        { color: activeCollectionTab === 'liked' ? '#FFFFFF' : '#E53935' },
                      ]}
                    >
                      Liked ({likedCollectionItems.length})
                    </Text>
                  </TouchableOpacity>
                </View>

                {/* COLLECTION MEDIA LIST WITH VISUAL IMAGE THUMBNAILS */}
                <ScrollView contentContainerStyle={styles.collectionListContainer}>
                  {activeCollectionTab === 'saved' && (
                    <>
                      {savedCollectionItems.length === 0 ? (
                        <Text style={[styles.emptyText, { color: palette.muted }]}>
                          No saved images in your collection yet.
                        </Text>
                      ) : (
                        savedCollectionItems.map((item) => (
                          <View
                            key={`saved-${item.id}`}
                            style={[styles.collectionItemCard, { backgroundColor: palette.inputBg }]}
                          >
                            <Image
                              source={{
                                uri:
                                  item.url ||
                                  item.imageUrl ||
                                  'https://images.pexels.com/photos/3601425/pexels-photo-3601425.jpeg',
                              }}
                              style={styles.cardThumbnail}
                              resizeMode="cover"
                            />
                            <View style={styles.cardInfoBox}>
                              <Text style={[styles.itemTitle, { color: palette.text }]} numberOfLines={2}>
                                {item.title || 'Saved Image'}
                              </Text>
                              <Text style={[styles.itemLocation, { color: palette.primary }]} numberOfLines={1}>
                                📍 {item.location || 'La Trinidad, Benguet'}
                              </Text>
                            </View>
                            <TouchableOpacity style={styles.removeMediaBtn} onPress={() => handleRemoveSavedItem(item.id)}>
                              <Icon source="bookmark-remove" size={22} color="#E53935" />
                            </TouchableOpacity>
                          </View>
                        ))
                      )}
                    </>
                  )}

                  {activeCollectionTab === 'liked' && (
                    <>
                      {likedCollectionItems.length === 0 ? (
                        <Text style={[styles.emptyText, { color: palette.muted }]}>
                          No liked images in your collection yet.
                        </Text>
                      ) : (
                        likedCollectionItems.map((item) => (
                          <View
                            key={`liked-${item.id}`}
                            style={[styles.collectionItemCard, { backgroundColor: palette.inputBg }]}
                          >
                            <Image
                              source={{
                                uri:
                                  item.url ||
                                  item.imageUrl ||
                                  'https://images.pexels.com/photos/3601425/pexels-photo-3601425.jpeg',
                              }}
                              style={styles.cardThumbnail}
                              resizeMode="cover"
                            />
                            <View style={styles.cardInfoBox}>
                              <Text style={[styles.itemTitle, { color: palette.text }]} numberOfLines={2}>
                                {item.title || 'Liked Image'}
                              </Text>
                              <Text style={[styles.itemLocation, { color: palette.primary }]} numberOfLines={1}>
                                📍 {item.location || 'La Trinidad, Benguet'}
                              </Text>
                            </View>
                            <TouchableOpacity style={styles.removeMediaBtn} onPress={() => handleRemoveLikedItem(item.id)}>
                              <Icon source="heart-broken" size={22} color="#E53935" />
                            </TouchableOpacity>
                          </View>
                        ))
                      )}
                    </>
                  )}
                </ScrollView>
              </View>
            </View>
          </Modal>
        </SafeAreaView>
      </LinearGradient>
    </ImageBackground>
  );
}

const dropdownStyles = StyleSheet.create({
  dropdownCard: {
    width: '100%',
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 16,
    elevation: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.18,
    shadowRadius: 10,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#000000',
  },
  clearText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#757575',
  },
  chipsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  chipPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F5F5F5',
    borderRadius: 18,
    paddingLeft: 12,
    paddingRight: 6,
    paddingVertical: 6,
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  chipTextPressable: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  chipText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#000000',
  },
  removeOneBtn: {
    marginLeft: 6,
    padding: 2,
  },
});

const styles = StyleSheet.create({
  fullBackground: {
    flex: 1,
    width: '100%',
    height: '100%',
  },
  safeArea: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  navBar: {
    minHeight: 74,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 12,
    elevation: 6,
    position: 'relative',
  },
  brand: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  modernLogoBadge: {
    width: 44,
    height: 44,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 6,
    shadowColor: '#059669',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 8,
    borderWidth: 1.5,
    borderColor: 'rgba(255, 255, 255, 0.4)',
    position: 'relative',
    overflow: 'hidden',
  },
  modernLogoEmoji: {
    fontSize: 22,
  },
  modernLogoGlow: {
    position: 'absolute',
    top: -10,
    left: -10,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: 'rgba(255, 255, 255, 0.35)',
  },
  brandName: {
    fontSize: 16,
    fontWeight: '900',
  },
  brandCaption: {
    fontSize: 8.5,
    letterSpacing: 1.1,
    fontWeight: '800',
    marginTop: 1,
  },
  headerSearchWrapper: {
    flex: 1,
    maxWidth: 600,
  },
  headerSearchInput: {
    height: 46,
    backgroundColor: '#FFFFFF',
  },
  dropdownBackdropOverlay: {
    position: 'absolute',
    top: 74,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 99999,
    backgroundColor: 'transparent',
  },
  dropdownPortalContainer: {
    width: '90%',
    maxWidth: 560,
    alignSelf: 'center',
    marginTop: 4,
  },
  suggestionsCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#E5E5EA',
    elevation: 12,
    overflow: 'hidden',
  },
  suggestionRow: {
    paddingHorizontal: 18,
    paddingVertical: 12,
  },
  navActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    width: '100%',
    paddingHorizontal: 8,
    paddingTop: 16,
    paddingBottom: 32,
  },
  pageFullWidth: {
    width: '100%',
  },
  formConstraintContainer: {
    width: '100%',
    maxWidth: 900,
    alignSelf: 'center',
    paddingHorizontal: 8,
  },
  mergedHeroContainer: {
    width: '100%',
    paddingVertical: 16,
    paddingHorizontal: 8,
    gap: 12,
    marginBottom: 12,
    backgroundColor: 'transparent',
  },
  heroBadgePill: {
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    borderWidth: 1.5,
    borderRadius: 30,
    paddingHorizontal: 16,
    paddingVertical: 8,
    elevation: 3,
    shadowColor: '#059669',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
  },
  heroBadgeIconWrap: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: 'rgba(16, 185, 129, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroBadgeIcon: {
    fontSize: 14,
  },
  heroBadgeText: {
    fontSize: 13,
    fontWeight: '900',
    letterSpacing: 0.6,
  },
  heroTitle: {
    fontWeight: '900',
    letterSpacing: -1,
    lineHeight: 44,
    textShadowColor: 'rgba(0, 0, 0, 0.25)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 4,
  },
  heroSubtitle: {
    fontSize: 15,
    lineHeight: 22,
    fontWeight: '700',
    textShadowColor: 'rgba(0, 0, 0, 0.2)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
  heroTagline: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 4,
  },
  sparkle: {
    color: '#F57F17',
    fontSize: 20,
  },
  heroTaglineText: {
    fontWeight: '800',
    fontSize: 13,
    textShadowColor: 'rgba(0, 0, 0, 0.2)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  resultsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 14,
    marginTop: 10,
  },
  resultsCopy: {
    flex: 1,
    gap: 4,
  },
  resultsTitle: {
    fontSize: 22,
    fontWeight: '900',
    textShadowColor: 'rgba(0, 0, 0, 0.2)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
  resultsSubtitle: {
    fontSize: 13,
    fontWeight: '600',
  },
  resultsEmoji: {
    fontSize: 28,
  },
  messageCard: {
    borderRadius: 20,
    borderWidth: 1.5,
    padding: 18,
    marginBottom: 20,
    marginHorizontal: 8,
  },
  messageText: {
    fontSize: 13,
    lineHeight: 20,
    fontWeight: '600',
  },
  collectionModalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.65)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  collectionModalCard: {
    width: '100%',
    maxWidth: 520,
    maxHeight: '80%',
    borderRadius: 24,
    padding: 20,
    elevation: 12,
  },
  collectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  collectionModalTitle: {
    fontSize: 18,
    fontWeight: '900',
  },
  tabBarRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 16,
  },
  tabButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 10,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.1)',
  },
  tabButtonText: {
    fontWeight: '800',
    fontSize: 13,
  },
  collectionListContainer: {
    gap: 10,
    paddingBottom: 16,
  },
  collectionItemCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
    borderRadius: 16,
    gap: 12,
  },
  cardThumbnail: {
    width: 64,
    height: 64,
    borderRadius: 12,
    backgroundColor: '#E0E0E0',
  },
  cardInfoBox: {
    flex: 1,
    justifyContent: 'center',
    gap: 4,
  },
  itemTitle: {
    fontWeight: '800',
    fontSize: 13,
    lineHeight: 17,
  },
  itemLocation: {
    fontSize: 11,
    fontWeight: '700',
  },
  removeMediaBtn: {
    padding: 6,
  },
  emptyText: {
    textAlign: 'center',
    marginVertical: 24,
  },
});