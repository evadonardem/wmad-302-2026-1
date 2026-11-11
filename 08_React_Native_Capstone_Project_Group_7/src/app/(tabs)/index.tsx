import { useEffect, useRef, useState } from 'react';
import {
  Animated,
  Platform,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  View,
} from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { IconButton, Text, useTheme } from 'react-native-paper';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import LocationForm from '@/components/LocationForm';
import MediaGallery from '@/components/MediaGallery';
import { searchPhotosByLocation } from '@/services/geoPhotoService';
import { usePhotos } from '@/photos';
import { useSearchHistory } from '@/searchHistory';
import { useThemeMode } from '@/themeMode';

const NATIVE = Platform.OS !== 'web';

const POPULAR = [
  { name: 'Baguio', emoji: '🌲', rgb: '34,197,94' },
  { name: 'Boracay', emoji: '🏖️', rgb: '14,165,233' },
  { name: 'Cebu', emoji: '🏙️', rgb: '245,158,11' },
  { name: 'Vigan', emoji: '🏛️', rgb: '244,63,94' },
  { name: 'Puerto Princesa', emoji: '🌊', rgb: '20,184,166' },
  { name: 'El Nido', emoji: '🏝️', rgb: '56,189,248' },
  { name: 'Siargao', emoji: '🏄', rgb: '99,102,241' },
  { name: 'Bohol', emoji: '🐒', rgb: '132,204,22' },
  { name: 'Tagaytay', emoji: '🌋', rgb: '249,115,22' },
  { name: 'Davao', emoji: '🦅', rgb: '168,85,247' },
];

function FloatingIcon({
  emoji,
  style,
  delay = 0,
  duration = 3200,
}: {
  emoji: string;
  style: object;
  delay?: number;
  duration?: number;
}) {
  const y = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(y, { toValue: -12, duration, delay, useNativeDriver: NATIVE }),
        Animated.timing(y, { toValue: 0, duration, useNativeDriver: NATIVE }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [y, delay, duration]);

  return (
    <Animated.Text style={[styles.floating, style, { transform: [{ translateY: y }] }]}>
      {emoji}
    </Animated.Text>
  );
}

function DestinationChip({
  name,
  emoji,
  rgb,
  onPress,
}: {
  name: string;
  emoji: string;
  rgb: string;
  onPress: () => void;
}) {
  const theme = useTheme();
  const scale = useRef(new Animated.Value(1)).current;
  const lift = useRef(new Animated.Value(0)).current;
  const bounce = useRef(new Animated.Value(0)).current;
  const [hovered, setHovered] = useState(false);

  const to = (s: number, y: number) =>
    Animated.parallel([
      Animated.spring(scale, { toValue: s, useNativeDriver: NATIVE }),
      Animated.spring(lift, { toValue: y, useNativeDriver: NATIVE }),
    ]).start();

  const bounceEmoji = () =>
    Animated.sequence([
      Animated.timing(bounce, { toValue: -7, duration: 140, useNativeDriver: NATIVE }),
      Animated.spring(bounce, { toValue: 0, friction: 3, useNativeDriver: NATIVE }),
    ]).start();

  return (
    <Pressable
      onPress={onPress}
      onHoverIn={() => {
        setHovered(true);
        to(1.07, -3);
        bounceEmoji();
      }}
      onHoverOut={() => {
        setHovered(false);
        to(1, 0);
      }}
      onPressIn={() => to(0.95, 0)}
      onPressOut={() => to(1, 0)}
      accessibilityRole="button"
      accessibilityLabel={`Search ${name}`}
    >
      <Animated.View
        style={[
          styles.destChip,
          {
            backgroundColor: `rgba(${rgb},${hovered ? 0.3 : 0.16})`,
            borderColor: `rgba(${rgb},${hovered ? 0.9 : 0.5})`,
            transform: [{ scale }, { translateY: lift }],
          },
        ]}
      >
        <Animated.Text style={[styles.destEmoji, { transform: [{ translateY: bounce }] }]}>
          {emoji}
        </Animated.Text>
        <Text style={[styles.destText, { color: theme.colors.onBackground }]}>{name}</Text>
      </Animated.View>
    </Pressable>
  );
}

export default function SearchScreen() {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const { isDarkMode, setIsDarkMode } = useThemeMode();
  const { photos, setPhotos } = usePhotos();
  const { recordSearch } = useSearchHistory();

  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [lastSearchedCity, setLastSearchedCity] = useState('');

  const { q } = useLocalSearchParams<{ q?: string }>();

  const intro = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.timing(intro, { toValue: 1, duration: 900, useNativeDriver: NATIVE }).start();
  }, [intro]);
  const introStyle = {
    opacity: intro,
    transform: [{ translateY: intro.interpolate({ inputRange: [0, 1], outputRange: [18, 0] }) }],
  };

  const handleSearchSubmit = async (locationName: string) => {
    setLoading(true);
    try {
      const results = await searchPhotosByLocation(locationName);
      setPhotos(results);
      setLastSearchedCity(locationName);
      recordSearch(locationName);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    if (!lastSearchedCity) return;
    setRefreshing(true);
    try {
      const results = await searchPhotosByLocation(lastSearchedCity);
      setPhotos(results);
    } catch (error) {
      console.error(error);
    } finally {
      setRefreshing(false);
    }
  };

  useEffect(() => {
    if (q) {
      handleSearchSubmit(String(q));
    }
  }, [q]);

  const heroColors: [string, string, string] = theme.dark
    ? ['#042F2E', '#0B3B4A', '#2E1065']
    : ['#0F766E', '#0E7490', '#7C3AED'];

  const pageColors: [string, string] = theme.dark ? ['#071A19', '#0B2A2E'] : ['#F0FDFA', '#E0F2FE'];

  const showGallery = loading || photos.length > 0 || !!lastSearchedCity;
  const showPopular = !loading && photos.length === 0;

  return (
    <View style={styles.screen}>
      {/* Page background gradient (no more abrupt flat color) */}
      <LinearGradient colors={pageColors} style={StyleSheet.absoluteFill} />

      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor={theme.colors.primary} />
        }
      >
        {/* Hero banner */}
        <LinearGradient
          colors={heroColors}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={[styles.hero, { paddingTop: insets.top + 8 }]}
        >
          {/* Topographic-style rings */}
          {[140, 230, 320, 410, 500].map((s) => (
            <View
              key={s}
              pointerEvents="none"
              style={[
                styles.ring,
                { width: s, height: s, borderRadius: s / 2, right: 60 - s / 2, top: 60 - s / 2 },
              ]}
            />
          ))}
          <View pointerEvents="none" style={styles.glowA} />
          <View pointerEvents="none" style={styles.glowB} />

          {/* Floating tech + travel icons */}
          <FloatingIcon emoji="✈️" style={{ top: '22%', left: '7%' }} duration={3000} />
          <FloatingIcon emoji="⛰️" style={{ top: '48%', right: '8%' }} delay={400} duration={3600} />
          <FloatingIcon emoji="⚙️" style={{ top: '60%', left: '12%' }} delay={800} duration={4200} />
          <FloatingIcon emoji="📍" style={{ top: '18%', right: '16%' }} delay={200} duration={3400} />

          <View style={styles.heroActions}>
            <IconButton
              icon="history"
              iconColor="#FFFFFF"
              size={22}
              onPress={() => router.push('/history')}
              accessibilityLabel="Recent searches"
            />
            <IconButton
              icon={isDarkMode ? 'weather-sunny' : 'weather-night'}
              iconColor="#FFFFFF"
              size={24}
              onPress={() => setIsDarkMode(!isDarkMode)}
              accessibilityLabel="Toggle dark mode"
            />
          </View>

          <Animated.View style={[styles.brand, introStyle]}>
            <View style={styles.badge}>
              <Text style={styles.badgeText}>PHILIPPINES TOURIST GUIDE</Text>
            </View>

            <View style={styles.logoRow}>
              <View style={styles.logo}>
                <MaterialCommunityIcons name="map-marker-radius" size={32} color="#67E8F9" />
              </View>
              <Text style={styles.heroTitle}>
                <Text style={styles.titleTech}>Tech</Text>
                <Text style={styles.titleCare}>Care</Text>
              </Text>
            </View>

            <Text style={styles.heroSub}>Discover the best tourist spots across the Philippines</Text>
          </Animated.View>
        </LinearGradient>

        <View style={styles.body}>
          {/* Glassmorphism search card */}
          <View style={styles.formShadow}>
            <BlurView
              intensity={Platform.OS === 'web' ? 30 : 50}
              tint={theme.dark ? 'dark' : 'light'}
              style={[
                styles.formCard,
                {
                  backgroundColor: theme.dark ? 'rgba(14,42,40,0.55)' : 'rgba(255,255,255,0.72)',
                  borderColor: theme.dark ? 'rgba(255,255,255,0.12)' : 'rgba(255,255,255,0.85)',
                },
              ]}
            >
              <LocationForm onSearch={handleSearchSubmit} />
            </BlurView>
          </View>

          {/* Popular destinations */}
          {showPopular && (
            <View style={styles.popular}>
              <Text style={[styles.popularTitle, { color: theme.colors.onBackground }]}>
                🔥 Popular destinations
              </Text>
              <View style={styles.chips}>
                {POPULAR.map((p) => (
                  <DestinationChip
                    key={p.name}
                    name={p.name}
                    emoji={p.emoji}
                    rgb={p.rgb}
                    onPress={() => handleSearchSubmit(p.name)}
                  />
                ))}
              </View>
            </View>
          )}

          {showGallery && (
            <MediaGallery photos={photos} loading={loading} locationName={lastSearchedCity} />
          )}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, width: '100%' },
  hero: {
    paddingBottom: 72,
    paddingHorizontal: 20,
    alignItems: 'center',
    borderBottomLeftRadius: 36,
    borderBottomRightRadius: 36,
    overflow: 'hidden',
  },
  ring: {
    position: 'absolute',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.10)',
  },
  glowA: {
    position: 'absolute',
    width: 240,
    height: 240,
    borderRadius: 120,
    backgroundColor: 'rgba(103,232,249,0.14)',
    top: -80,
    left: -60,
  },
  glowB: {
    position: 'absolute',
    width: 180,
    height: 180,
    borderRadius: 90,
    backgroundColor: 'rgba(167,139,250,0.20)',
    bottom: -50,
    right: -30,
  },
  floating: { position: 'absolute', fontSize: 30, opacity: 0.3 },
  heroActions: {
    width: '100%',
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 4,
  },
  brand: { alignItems: 'center' },
  badge: {
    backgroundColor: 'rgba(255,255,255,0.16)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.3)',
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 999,
    marginTop: 4,
    marginBottom: 14,
  },
  badgeText: {
    color: '#FFFFFF',
    fontSize: 11,
    letterSpacing: 2,
    fontFamily: 'Poppins_600SemiBold',
  },
  logoRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 12 },
  logo: {
    width: 58,
    height: 58,
    borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.14)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.35)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroTitle: {
    fontSize: 52,
    letterSpacing: 1,
    textShadowColor: 'rgba(103,232,249,0.85)',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 18,
  },
  titleTech: { color: '#67E8F9', fontFamily: 'Poppins_800ExtraBold' },
  titleCare: { color: '#FFFFFF', fontFamily: 'Poppins_400Regular' },
  heroSub: {
    color: 'rgba(255,255,255,0.92)',
    fontSize: 16,
    textAlign: 'center',
    marginTop: 8,
    fontFamily: 'Poppins_400Regular',
  },
  body: {
    width: '100%',
    maxWidth: 960,
    alignSelf: 'center',
    paddingHorizontal: 16,
    marginTop: -40,
    paddingBottom: 40,
  },
  formShadow: {
    borderRadius: 24,
    marginBottom: 28,
    elevation: 14,
    shadowColor: '#0F172A',
    shadowOpacity: 0.2,
    shadowRadius: 30,
    shadowOffset: { width: 0, height: 14 },
  },
  formCard: {
    borderRadius: 24,
    padding: 16,
    paddingBottom: 0,
    borderWidth: 1,
    overflow: 'hidden',
  },
  popular: { marginBottom: 24 },
  popularTitle: {
    textAlign: 'center',
    marginBottom: 14,
    fontSize: 18,
    fontFamily: 'Poppins_600SemiBold',
  },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, justifyContent: 'center' },
  destChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 999,
    borderWidth: 1.5,
  },
  destEmoji: { fontSize: 18 },
  destText: { fontSize: 14, fontFamily: 'Poppins_600SemiBold' },
});