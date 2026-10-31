import { useEffect, useRef, useState, type ReactNode } from 'react';
import { Animated, Easing, Platform, Pressable, RefreshControl, ScrollView, StyleSheet, View, useWindowDimensions,} from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { Image } from 'expo-image';
import { IconButton, Surface, Text, useTheme } from 'react-native-paper';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import LocationForm from '@/components/LocationForm';
import MediaGallery from '@/components/MediaGallery';
import { searchPhotosByLocation, type Photo } from '@/services/geoPhotoService';
import { usePhotos } from '@/photos';
import { useSearchHistory } from '@/searchHistory';
import { useThemeMode } from '@/themeMode';

const SERIF = Platform.select({ ios: 'Georgia', android: 'serif', default: 'Georgia, "Times New Roman", serif' });

// How far the header reaches down behind the search card (about half of the card). Change this one number
// to make the waves end higher or lower.
const WAVE_EXTRA = 130;

// Wavy bottom edge of the header: a gold wave, a teal wave and a page-coloured wave on top, each one made of
// several rounded humps, so the header photo flows into the page (squashed circles, no extra packages needed).
// 'height' is how tall the highest (gold) crest is, measured from the bottom of the header.
function HeaderWaves({ width, background, height }: { width: number; background: string; height: number }) {
  const W = Math.max(width, 360);
  const amp = W * 0.07; // how high one hump rises
  const humpW = W * 0.5; // width of one hump
  const layers = [
    { color: 'rgba(244,182,63,0.7)', crest: height, phase: 0, bumps: [0, -10, 6, -6, 8] },
    { color: 'rgba(43,179,168,0.8)', crest: height - 26, phase: W * 0.12, bumps: [6, -4, 10, -8, 2] },
    { color: background, crest: height - 54, phase: W * 0.22, bumps: [-4, 8, -6, 6, -2] },
  ];

  return (
    <View pointerEvents="none" style={[StyleSheet.absoluteFill, { zIndex: 3 }]}>
      {layers.map((layer) => {
        const lift = layer.crest - amp; // height of the centre line of the humps
        return (
          <View key={layer.color} style={StyleSheet.absoluteFill}>
            {/* solid fill under the humps so nothing shows through at the bottom */}
            <View style={{ position: 'absolute', left: 0, right: 0, bottom: 0, height: lift, backgroundColor: layer.color }} />
            {layer.bumps.map((bump, i) => {
              const cx = -W * 0.02 + layer.phase - W * 0.36 + i * W * 0.36;
              return (
                <View
                  key={i}
                  style={{
                    position: 'absolute',
                    width: humpW,
                    height: humpW,
                    borderRadius: humpW / 2,
                    left: cx - humpW / 2,
                    bottom: -humpW / 2 + lift + bump,
                    backgroundColor: layer.color,
                    transform: [{ scaleY: (2 * amp) / humpW }],
                  }}
                />
              );
            })}
          </View>
        );
      })}
    </View>
  );
}

// DESIGN: height of the wavy top edge of the footer (the deep teal block with the brand sits right under it)
const FOOTER_WAVE_H = 96;

// DESIGN: the header waves again, but upside down, at the bottom of the page: a gold wave, a teal wave and a deep
// teal wave that flows into the footer block. Same trick as HeaderWaves (squashed circles, no extra packages).
function FooterWaves({ width }: { width: number }) {
  const W = Math.max(width, 360);
  const amp = Math.min(W * 0.035, 22); // how high one hump rises
  const humpW = W * 0.5; // width of one hump
  const layers = [
    { color: 'rgba(244,182,63,0.7)', drop: 34, phase: 0, bumps: [0, 8, -6, 6, -4] },
    { color: 'rgba(43,179,168,0.8)', drop: 56, phase: W * 0.16, bumps: [6, -6, 8, -4, 4] },
    { color: '#0B5F5B', drop: 78, phase: W * 0.3, bumps: [-4, 6, -6, 8, -2] },
  ];

  return (
    <View pointerEvents="none" style={{ width: '100%', height: FOOTER_WAVE_H, overflow: 'hidden' }}>
      {layers.map((layer) => (
        <View key={layer.color} style={StyleSheet.absoluteFill}>
          {/* solid fill under the humps so nothing shows through at the bottom */}
          <View style={{ position: 'absolute', left: 0, right: 0, top: layer.drop, bottom: 0, backgroundColor: layer.color }} />
          {layer.bumps.map((bump, i) => {
            const cx = -W * 0.02 + layer.phase - W * 0.36 + i * W * 0.36;
            return (
              <View
                key={i}
                style={{
                  position: 'absolute',
                  width: humpW,
                  height: humpW,
                  borderRadius: humpW / 2,
                  left: cx - humpW / 2,
                  top: layer.drop + bump - humpW / 2,
                  backgroundColor: layer.color,
                  transform: [{ scaleY: (2 * amp) / humpW }],
                }}
              />
            );
          })}
        </View>
      ))}
    </View>
  );
}

// DESIGN: a small grid of dots, used as a light pattern in the page background
function DotGrid({ color, rows, cols, style }: { color: string; rows: number; cols: number; style?: object }) {
  return (
    <View style={[{ gap: 9, opacity: 0.4 }, style]}>
      {Array.from({ length: rows }, (_, r) => (
        <View key={r} style={{ flexDirection: 'row', gap: 9 }}>
          {Array.from({ length: cols }, (_, c) => (
            <View key={c} style={{ width: 4, height: 4, borderRadius: 2, backgroundColor: color }} />
          ))}
        </View>
      ))}
    </View>
  );
}

// DESIGN: soft teal and gold shapes, rings and dots behind the whole body of the page (they only draw, they never
// catch touches). They sit in their own clipped layer, so the search card can still reach up into the header.
function BodyDecor({ primary, secondary }: { primary: string; secondary: string }) {
  return (
    <View pointerEvents="none" style={styles.decorLayer}>
      {/* near the top */}
      <View style={[styles.decorShape, { width: 300, height: 300, borderRadius: 150, right: -130, top: 140, backgroundColor: primary, opacity: 0.07 }]} />
      <View style={[styles.decorShape, { width: 170, height: 170, borderRadius: 85, left: -70, top: 420, backgroundColor: secondary, opacity: 0.12 }]} />
      <View style={[styles.decorShape, { width: 120, height: 120, borderRadius: 60, borderWidth: 2, borderColor: secondary, right: 30, top: 520, opacity: 0.28 }]} />
      <DotGrid color={secondary} rows={4} cols={6} style={{ position: 'absolute', left: 14, top: 250 }} />
      {/* near the bottom */}
      <View style={[styles.decorShape, { width: 240, height: 240, borderRadius: 120, left: -100, bottom: 160, backgroundColor: primary, opacity: 0.07 }]} />
      <View style={[styles.decorShape, { width: 150, height: 150, borderRadius: 75, right: -50, bottom: 60, backgroundColor: secondary, opacity: 0.12 }]} />
      <View style={[styles.decorShape, { width: 100, height: 100, borderRadius: 50, borderWidth: 2, borderColor: primary, left: 24, bottom: 40, opacity: 0.25 }]} />
      <DotGrid color={primary} rows={4} cols={6} style={{ position: 'absolute', right: 14, bottom: 230 }} />
    </View>
  );
}

// DESIGN: numbers shown in the welcome banner under the search card (plain information, nothing to press)
const BANNER_STATS = [
  { value: '7,641', label: 'Islands' },
  { value: '3', label: 'Island groups' },
  { value: '17', label: 'Regions' },
];

// Header timing (milliseconds): a photo stays in the spotlight, then fills the whole header, then goes back
const HERO_SPOT_MS = 1000;
const HERO_FULL_MS = 7000;
const HERO_BACK_MS = 1200;

type HeroPhase = 'spot' | 'full' | 'back';

// One photo of the spotlight carousel. 'offset' says where it is compared with the current photo:
// 0 = centre (big and lit), -1 = left, 1 = right (smaller and dimmed), 2 / -2 = hidden.
function HeroSlide({
  photo,
  offset,
  fullAnim,
  spotW,
  spotH,
  spotTop,
  boxW,
  boxH,
  gap,
  onPress,
}: {
  photo: Photo;
  offset: number;
  fullAnim: Animated.Value;
  spotW: number;
  spotH: number;
  spotTop: number;
  boxW: number;
  boxH: number;
  gap: number;
  onPress: () => void;
}) {
  const anim = useRef(new Animated.Value(offset)).current;
  const previous = useRef(offset);
  const isCurrent = offset === 0;

  // Slides from right to left when the offset changes (a photo that jumps across the row just reappears)
  useEffect(() => {
    if (Math.abs(offset - previous.current) > 1.5) {
      anim.setValue(offset);
    } else {
      Animated.timing(anim, {
        toValue: offset,
        duration: 900,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: false,
      }).start();
    }
    previous.current = offset;
  }, [offset, anim]);

  const translateX = anim.interpolate({
    inputRange: [-2, 2],
    outputRange: [-2 * gap * spotW, 2 * gap * spotW],
  });
  const scale = anim.interpolate({ inputRange: [-1, 0, 1], outputRange: [0.8, 1, 0.8], extrapolate: 'clamp' });
  const sideOpacity = anim.interpolate({
    inputRange: [-2, -1, 0, 1, 2],
    outputRange: [0, 0.65, 1, 0.65, 0],
  });
  // while the centre photo fills the header the side photos fade out
  const opacity = Animated.multiply(
    sideOpacity,
    fullAnim.interpolate({ inputRange: [0, 1], outputRange: [1, isCurrent ? 1 : 0] }),
  );
  const dim = anim.interpolate({ inputRange: [-1, 0, 1], outputRange: [0.45, 0.3, 0.45], extrapolate: 'clamp' });

  const grow = (from: number, to: number) => fullAnim.interpolate({ inputRange: [0, 1], outputRange: [from, to] });

  return (
    <Animated.View
      style={{
        position: 'absolute',
        left: isCurrent ? grow((boxW - spotW) / 2, 0) : (boxW - spotW) / 2,
        top: isCurrent ? grow(spotTop, 0) : spotTop,
        width: isCurrent ? grow(spotW, boxW) : spotW,
        height: isCurrent ? grow(spotH, boxH) : spotH,
        borderRadius: isCurrent ? grow(20, 0) : 20,
        overflow: 'hidden',
        zIndex: isCurrent ? 2 : 1,
        opacity,
        transform: [{ translateX }, { scale }],
        shadowColor: '#000',
        shadowOpacity: isCurrent ? 0.5 : 0.3,
        shadowRadius: isCurrent ? 24 : 12,
        shadowOffset: { width: 0, height: isCurrent ? 14 : 6 },
        elevation: isCurrent ? 12 : 4,
      }}
    >
      <Image source={{ uri: photo.imageUrl }} style={StyleSheet.absoluteFill} contentFit="cover" accessibilityLabel={photo.altText} />
      {/* side photos are darker */}
      <Animated.View pointerEvents="none" style={[StyleSheet.absoluteFill, { backgroundColor: '#000', opacity: dim }]} />
      {/* white frame and warm glow around the centre photo (it disappears while the photo fills the header) */}
      {isCurrent && (
        <Animated.View
          pointerEvents="none"
          style={[
            StyleSheet.absoluteFill,
            styles.spotFrame,
            { opacity: fullAnim.interpolate({ inputRange: [0, 1], outputRange: [1, 0] }), borderRadius: grow(20, 0) },
          ]}
        />
      )}
      {!isCurrent && Math.abs(offset) <= 1 && (
        <Pressable style={StyleSheet.absoluteFill} onPress={onPress} accessibilityLabel="Show this photo" />
      )}
    </Animated.View>
  );
}

// Header: spotlight carousel. The current photo is big, bright and lit in the centre; the photos before and
// after it peek in dimmed on both sides. After 1 second the centre photo grows to fill the whole header, after
// 7 seconds it shrinks back, and then the row slides from right to left to the next photo.
function HeroCarousel({
  photos,
  width,
  topInset,
  background,
  children,
}: {
  photos: Photo[];
  width: number;
  topInset: number;
  background: string;
  children?: ReactNode;
}) {
  const isMd = width >= 768;
  const count = photos.length;
  const [index, setIndex] = useState(0);
  const [phase, setPhase] = useState<HeroPhase>('spot');
  const fullAnim = useRef(new Animated.Value(0)).current;

  // sizes of the spotlight photo and of the whole header
  const spotW = isMd ? Math.min(width * 0.56, 720) : width * 0.78;
  const spotH = isMd ? 300 : 190;
  const spotTop = topInset + 48;
  const boxH = spotTop + spotH + 112 + WAVE_EXTRA; // whole header, including the part behind the search card
  const gap = isMd ? 1.04 : 0.82; // distance between the photos, as a share of the spotlight width

  // by hand (arrows, tap on a side photo): move and start again from the spotlight
  const go = (step: number) => {
    setIndex((i) => (i + step + count) % count);
    setPhase('spot');
  };

  // the centre photo grows while the phase is 'full' and shrinks back otherwise
  useEffect(() => {
    Animated.timing(fullAnim, {
      toValue: phase === 'full' ? 1 : 0,
      duration: 900,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: false,
    }).start();
  }, [phase, fullAnim]);

  // spotlight (1s) -> whole header (7s) -> back to the spotlight (1.2s) -> next photo, and again
  useEffect(() => {
    if (count === 0) {
      return undefined;
    }
    const delay = phase === 'spot' ? HERO_SPOT_MS : phase === 'full' ? HERO_FULL_MS : HERO_BACK_MS;
    const timer = setTimeout(() => {
      if (phase === 'spot') {
        setPhase('full');
      } else if (phase === 'full') {
        setPhase('back');
      } else {
        if (count > 1) {
          setIndex((i) => (i + 1) % count);
        }
        setPhase('spot');
      }
    }, delay);
    return () => clearTimeout(timer);
  }, [count, phase, index]);

  const offsetOf = (i: number) => {
    let o = (i - index + count) % count;
    if (o > count / 2) {
      o -= count;
    }
    return Math.max(-2, Math.min(2, o));
  };

  const current = count > 0 ? photos[index % count] : null;

  return (
    <View style={[styles.hero, { height: boxH }]}>
      {/* Dark blurred backdrop made from the current photo (the "room" the spotlight is in) */}
      {current && (
        <Image
          source={{ uri: current.imageUrl }}
          style={StyleSheet.absoluteFill}
          contentFit="cover"
          blurRadius={30}
          transition={900}
        />
      )}
      <View style={[StyleSheet.absoluteFill, styles.heroTint]} />
      <View style={styles.glowGold} />
      {/* Light cone from the top, shining on the centre photo */}
      <View pointerEvents="none" style={[styles.lightCone, { left: width / 2 - width * 0.4, width: width * 0.8 }]} />

      {photos.map((photo, i) => {
        const offset = offsetOf(i);
        return (
          <HeroSlide
            key={photo.id}
            photo={photo}
            offset={offset}
            fullAnim={fullAnim}
            spotW={spotW}
            spotH={spotH}
            spotTop={spotTop}
            boxW={width}
            boxH={boxH}
            gap={gap}
            onPress={() => go(offset)}
          />
        );
      })}

      <HeaderWaves width={width} background={background} height={WAVE_EXTRA - 12} />

      {/* Name and caption, centred on the spotlight photo (they stay in front, also while the photo fills the header) */}
      <Animated.View
        pointerEvents="none"
        style={[
          styles.brandWrap,
          { top: spotTop, height: spotH },
        ]}
      >
        <View style={[styles.brandCard, { paddingHorizontal: isMd ? 44 : 22 }]}>
          <Text numberOfLines={1} adjustsFontSizeToFit style={[styles.brand, { fontSize: isMd ? 78 : width < 420 ? 46 : 56 }]}>
            PH <Text style={styles.brandGold}>NAVYRA</Text>
          </Text>
          <View style={styles.divider}>
            <View style={styles.dividerLine} />
            <View style={styles.diamond} />
            <View style={[styles.dividerLine, styles.dividerLineRight]} />
          </View>
          <Text style={styles.caption}>Nature, Attractions, Visuals</Text>
          <Text style={[styles.caption, styles.captionGold]}>Your Regional Adventure</Text>
        </View>
      </Animated.View>

      {count > 1 && (
        <>
          <IconButton
            icon="chevron-left"
            iconColor="#FFFFFF"
            containerColor="rgba(255,255,255,0.2)"
            size={22}
            style={[styles.arrow, { left: 8, top: spotTop + spotH / 2 - 20 }]}
            onPress={() => go(-1)}
            accessibilityLabel="Previous photo"
          />
          <IconButton
            icon="chevron-right"
            iconColor="#FFFFFF"
            containerColor="rgba(255,255,255,0.2)"
            size={22}
            style={[styles.arrow, { right: 8, top: spotTop + spotH / 2 - 20 }]}
            onPress={() => go(1)}
            accessibilityLabel="Next photo"
          />
        </>
      )}

      {children}
    </View>
  );
}

export default function SearchScreen() {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const { isDarkMode, setIsDarkMode } = useThemeMode();
  const { photos, setPhotos } = usePhotos();
  const { recordSearch } = useSearchHistory();

  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [lastSearchedCity, setLastSearchedCity] = useState('');
  // Region of the last search (used to confirm the photos are from that region)
  const [lastSearchedRegion, setLastSearchedRegion] = useState('');

  // Photos shown in the header carousel
  const [heroPhotos, setHeroPhotos] = useState<Photo[]>([]);

  // City handed back from the History screen as a route param (see TODO 5.4)
  const { q } = useLocalSearchParams<{ q?: string }>();

  const handleSearchSubmit = async (locationName: string, regionName?: string) => {
    setLoading(true);
    try {
      const results = await searchPhotosByLocation(locationName, regionName);
      setPhotos(results);
      setLastSearchedCity(locationName);
      setLastSearchedRegion(regionName ?? '');

      // TODO 5.1 [History Recording]: Once the search above succeeds, record the searched city
      // with recordSearch(locationName) from useSearchHistory() so the History screen can list it.
      if (results.length > 0) {
        recordSearch(locationName);
      }
    } catch (error) {
      console.warn('Search failed:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      if (lastSearchedCity) {
        const results = await searchPhotosByLocation(lastSearchedCity, lastSearchedRegion || undefined);
        setPhotos(results);
      }
    } catch (error) {
      console.warn('Refresh failed:', error);
    } finally {
      setRefreshing(false);
    }
  };

  useEffect(() => {
    if (q) {
      router.setParams({ q: undefined });
      handleSearchSubmit(q);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [q]);

  // Loads the header photos once (one Pexels request)
  useEffect(() => {
    let cancelled = false;

    const loadHero = async () => {
      const found = await searchPhotosByLocation('Philippines');
      if (!cancelled) {
        setHeroPhotos(found);
      }
    };

    loadHero();

    return () => {
      cancelled = true;
    };
  }, []);


  return (
    <SafeAreaView style={[styles.screen, { backgroundColor: theme.colors.background }]} edges={['left', 'right']}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor={theme.colors.primary} />
        }
      >
        {/* Header: spotlight carousel of Philippine photos with the PH NAVYRA name, curved into the page */}
        <HeroCarousel photos={heroPhotos.slice(0, 8)} width={width} topInset={insets.top} background={theme.colors.background}>
          {/* History and theme buttons (they sit on top of the header photo) */}
          <View style={[styles.headerButtons, { top: insets.top + 4 }]}>
            <IconButton
              icon="history"
              iconColor="#FFFFFF"
              containerColor="rgba(255,255,255,0.18)"
              size={22}
              onPress={() => router.push('/history')}
              accessibilityLabel="Recent searches"
            />
            <IconButton
              icon={isDarkMode ? 'weather-sunny' : 'weather-night'}
              iconColor="#FFFFFF"
              containerColor="rgba(255,255,255,0.18)"
              size={24}
              onPress={() => setIsDarkMode(!isDarkMode)}
              accessibilityLabel="Toggle dark mode"
            />
          </View>
        </HeroCarousel>

        {/* DESIGN: the whole body sits in a full-width wrapper so the background shapes can reach the screen edges */}
        <View style={styles.bodyWrap}>
          <BodyDecor primary={theme.colors.primary} secondary={theme.colors.secondary} />

          <View style={styles.container}>
            {/* Floating search card, in front of the header */}
            <Surface
              style={[styles.searchCard, { backgroundColor: theme.colors.surface, borderTopColor: theme.colors.secondary }]}
              elevation={4}
            >
              <Text variant="headlineSmall" style={[styles.cardTitle, { color: theme.colors.onSurface }]}>
                Where do you want to go?
              </Text>
              <Text variant="bodyMedium" style={[styles.subtitle, { color: theme.colors.onSurfaceVariant }]}>
                Explore tourist spots across regions, cities, and municipalities in the Philippines
              </Text>

              {/* Connect the location selection input modules */}
              <LocationForm onSearch={handleSearchSubmit} />
            </Surface>

            {/* DESIGN: welcome banner under the search card. It is only information (a flat colour panel with
                text and numbers), so it does not look like something to press. */}
            <View style={styles.banner}>
              <View pointerEvents="none" style={styles.bannerSun} />
              <View pointerEvents="none" style={styles.bannerRing} />
              <View pointerEvents="none" style={styles.bannerCircle} />

              <Text style={styles.bannerEyebrow}>DISCOVER THE PHILIPPINES</Text>
              <Text style={[styles.bannerTitle, { fontSize: width < 420 ? 21 : 27, lineHeight: width < 420 ? 28 : 34 }]}>
                7,641 islands. Endless adventures.
              </Text>

              <View style={styles.bannerDivider}>
                <View style={styles.bannerDividerLine} />
                <View style={styles.bannerDiamond} />
                <View style={styles.bannerDividerLine} />
              </View>

              <View style={styles.bannerStats}>
                {BANNER_STATS.map((stat, i) => (
                  <View key={stat.label} style={[styles.bannerStat, i > 0 && styles.bannerStatBorder]}>
                    <Text style={styles.bannerStatNumber}>{stat.value}</Text>
                    <Text style={styles.bannerStatLabel}>{stat.label}</Text>
                  </View>
                ))}
              </View>
            </View>

            {/* Results */}
            {photos.length > 0 && !loading && (
              <View style={styles.resultsHeader}>
                {/* DESIGN: small label with gold lines and diamonds on both sides */}
                <View style={styles.sectionLabelRow}>
                  <View style={[styles.sectionLabelLine, { backgroundColor: theme.colors.secondary }]} />
                  <View style={[styles.sectionLabelDiamond, { backgroundColor: theme.colors.secondary }]} />
                  <Text style={[styles.sectionLabelText, { color: theme.colors.primary }]}>FEATURED SPOTS</Text>
                  <View style={[styles.sectionLabelDiamond, { backgroundColor: theme.colors.secondary }]} />
                  <View style={[styles.sectionLabelLine, { backgroundColor: theme.colors.secondary }]} />
                </View>

                <Text variant="titleLarge" style={[styles.resultsTitle, { color: theme.colors.onBackground }]}>
                  {lastSearchedCity ? `Tourist spots in ${lastSearchedCity}` : 'Tourist spots'}
                </Text>

                {/* DESIGN: gold and teal bars under the title */}
                <View style={styles.titleUnderline}>
                  <View style={[styles.underlineGold, { backgroundColor: theme.colors.secondary }]} />
                  <View style={[styles.underlineTeal, { backgroundColor: theme.colors.primary }]} />
                </View>

                <View style={[styles.countBadge, { backgroundColor: theme.colors.primary }]}>
                  <Text variant="labelSmall" style={{ color: theme.colors.onPrimary, fontWeight: '700' }}>
                    {photos.length} photos
                  </Text>
                </View>
              </View>
            )}

            {/* Connect presentation display layout nodes passing state parameters downstream */}
            <MediaGallery photos={photos} loading={loading} />
          </View>
        </View>

        {/* DESIGN: footer with a wavy top edge (full width, outside the centred container) */}
        <View>
          <FooterWaves width={width} />
          <View style={styles.footer}>
            <Text style={styles.footerBrand}> PH NAVYRA</Text>
            <View style={styles.footerDivider}>
              <View style={[styles.footerLine, { backgroundColor: theme.colors.secondary }]} />
              <View style={[styles.footerDiamond, { backgroundColor: theme.colors.secondary }]} />
              <View style={[styles.footerLine, { backgroundColor: theme.colors.secondary }]} />
            </View>
            <Text style={styles.footerTagline}>NATURE · ATTRACTIONS · VISUALS</Text>
            <Text variant="bodySmall" style={styles.footerCredit}>
              Photos provided by Pexels · Location data from PSGC
            </Text>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    width: '100%',
  },
  scrollContent: {
    width: '100%',
    paddingBottom: 0, // the footer now reaches the bottom edge of the page
  },
  // DESIGN: full-width wrapper around the body (holds the background shapes)
  bodyWrap: {
    width: '100%',
    paddingBottom: 8,
  },
  decorLayer: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
    overflow: 'hidden',
  },
  decorShape: {
    position: 'absolute',
  },
  container: {
    width: '100%',
    maxWidth: 960,
    alignSelf: 'center',
    paddingHorizontal: 16,
  },
  hero: {
    width: '100%',
    overflow: 'hidden',
    backgroundColor: '#0B5F5B',
  },
  heroTint: {
    backgroundColor: 'rgba(4,36,38,0.5)',
  },
  glowGold: {
    position: 'absolute',
    top: -90,
    right: -90,
    width: 280,
    height: 280,
    borderRadius: 140,
    backgroundColor: 'rgba(244,182,63,0.22)',
  },
  lightCone: {
    position: 'absolute',
    top: -140,
    height: 320,
    borderRadius: 160,
    backgroundColor: 'rgba(255,244,214,0.16)',
  },
  spotFrame: {
    borderWidth: 3,
    borderColor: 'rgba(255,255,255,0.85)',
  },
  brandWrap: {
    position: 'absolute',
    zIndex: 10,
    elevation: 24, // Android: stay above the photos, which also have an elevation
    left: 0,
    right: 0,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 16,
  },
  // no box or background any more: the title is plain text with a strong shadow so it stays readable
  brandCard: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
  },
  cornerLine: {
    position: 'absolute',
    left: 22,
    right: 22,
    height: 3,
    borderRadius: 2,
    backgroundColor: '#F4B63F',
  },
  cornerTop: {
    top: 0,
  },
  cornerBottom: {
    bottom: 0,
    backgroundColor: '#2BB3A8',
  },
  brandGlow: {
    position: 'absolute',
    width: '86%',
    height: '88%',
    borderRadius: 999,
    backgroundColor: 'rgba(4,20,24,0.42)',
  },
  brand: {
    fontFamily: SERIF,
    fontWeight: '800',
    letterSpacing: 4,
    color: '#FFFFFF',
    textShadowColor: 'rgba(0,0,0,0.95)',
    textShadowOffset: { width: 0, height: 3 },
    textShadowRadius: 22,
  },
  brandGold: {
    color: '#FFD98A',
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginVertical: 10,
  },
  dividerLine: {
    height: 2,
    width: 64,
    borderRadius: 1,
    backgroundColor: '#F4B63F',
  },
  dividerLineRight: {
    opacity: 0.85,
  },
  diamond: {
    width: 9,
    height: 9,
    backgroundColor: '#F4B63F',
    transform: [{ rotate: '45deg' }],
  },
  caption: {
    color: '#FFFFFF',
    fontWeight: '600',
    fontSize: 14,
    letterSpacing: 2.5,
    textTransform: 'uppercase',
    textAlign: 'center',
    lineHeight: 22,
    textShadowColor: 'rgba(0,0,0,0.9)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 8,
  },
  captionGold: {
    color: '#FFD98A',
  },
  arrow: {
    position: 'absolute',
    zIndex: 5,
    margin: 0,
  },
  headerButtons: {
    position: 'absolute',
    zIndex: 6,
    right: 8,
    flexDirection: 'row',
    gap: 4,
  },
  searchCard: {
    marginTop: -WAVE_EXTRA,
    borderRadius: 24,
    borderTopWidth: 4,
    padding: 20,
    zIndex: 2,
  },
  cardTitle: {
    fontFamily: SERIF,
    fontWeight: '700',
    textAlign: 'center',
  },
  subtitle: {
    textAlign: 'center',
    marginTop: 4,
    marginBottom: 20,
  },
  // DESIGN: welcome banner
  banner: {
    marginTop: 20,
    marginBottom: 28, // space between the banner and the All photos / Favorites buttons (or the results title)
    alignItems: 'center',
    gap: 10,
    paddingVertical: 28,
    paddingHorizontal: 20,
    borderRadius: 28,
    backgroundColor: '#0B5F5B',
    overflow: 'hidden',
  },
  bannerSun: {
    position: 'absolute',
    top: -60,
    right: -40,
    width: 170,
    height: 170,
    borderRadius: 85,
    backgroundColor: '#F4B63F',
    opacity: 0.28,
  },
  bannerRing: {
    position: 'absolute',
    top: 22,
    right: 44,
    width: 70,
    height: 70,
    borderRadius: 35,
    borderWidth: 2,
    borderColor: '#FFD98A',
    opacity: 0.35,
  },
  bannerCircle: {
    position: 'absolute',
    bottom: -60,
    left: -40,
    width: 170,
    height: 170,
    borderRadius: 85,
    backgroundColor: '#2BB3A8',
    opacity: 0.3,
  },
  bannerEyebrow: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 2.6,
    color: '#FFD98A',
    textAlign: 'center',
  },
  bannerTitle: {
    fontFamily: SERIF,
    fontWeight: '800',
    color: '#FFFFFF',
    textAlign: 'center',
  },
  bannerDivider: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  bannerDividerLine: {
    width: 48,
    height: 2,
    borderRadius: 1,
    backgroundColor: '#F4B63F',
  },
  bannerDiamond: {
    width: 8,
    height: 8,
    backgroundColor: '#F4B63F',
    transform: [{ rotate: '45deg' }],
  },
  bannerStats: {
    flexDirection: 'row',
    alignSelf: 'stretch',
    marginTop: 6,
  },
  bannerStat: {
    flex: 1,
    alignItems: 'center',
    gap: 2,
  },
  bannerStatBorder: {
    borderLeftWidth: 1,
    borderLeftColor: 'rgba(255,255,255,0.28)',
  },
  bannerStatNumber: {
    fontFamily: SERIF,
    fontWeight: '800',
    fontSize: 26,
    color: '#FFD98A',
  },
  bannerStatLabel: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 1.4,
    textTransform: 'uppercase',
    color: 'rgba(255,255,255,0.85)',
    textAlign: 'center',
  },
  resultsHeader: {
    alignItems: 'center',
    gap: 8,
    marginTop: 8, // the banner above already has a bottom margin
    marginBottom: 16,
  },
  // DESIGN: label above the results title
  sectionLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  sectionLabelLine: {
    width: 36,
    height: 2,
    borderRadius: 1,
  },
  sectionLabelDiamond: {
    width: 7,
    height: 7,
    transform: [{ rotate: '45deg' }],
  },
  sectionLabelText: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 2.2,
  },
  resultsTitle: {
    fontFamily: SERIF,
    fontWeight: '700',
    fontSize: 26,
    lineHeight: 32,
    textAlign: 'center',
  },
  // DESIGN: bars under the results title
  titleUnderline: {
    flexDirection: 'row',
    gap: 4,
  },
  underlineGold: {
    width: 48,
    height: 4,
    borderRadius: 2,
  },
  underlineTeal: {
    width: 20,
    height: 4,
    borderRadius: 2,
  },
  countBadge: {
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 4,
  },
  // DESIGN: footer block under the waves
  footer: {
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 16,
    paddingTop: 4,
    paddingBottom: 36,
    backgroundColor: '#0B5F5B',
  },
  footerDivider: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  footerLine: {
    width: 56,
    height: 2,
    borderRadius: 1,
  },
  footerDiamond: {
    width: 8,
    height: 8,
    transform: [{ rotate: '45deg' }],
  },
  footerBrand: {
    fontFamily: SERIF,
    fontWeight: '800',
    fontSize: 22,
    letterSpacing: 3,
    color: '#FFFFFF',
  },
  footerTagline: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 2.4,
    color: '#FFD98A',
    textAlign: 'center',
  },
  footerCredit: {
    color: 'rgba(255,255,255,0.75)',
    textAlign: 'center',
  },
});