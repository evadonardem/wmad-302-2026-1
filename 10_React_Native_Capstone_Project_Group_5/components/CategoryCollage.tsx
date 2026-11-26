/**
 * CategoryCollage - the tilted category card rail
 *
 * A horizontal, snap-scrolling rail of large category cards on a soft lavender
 * stage with wavy shapes and sparkles. Each card pairs a product photo with a
 * serif name, an item count and a round arrow button. Cards alternate their
 * tilt, fade/rise in one after another and straighten on hover. Arrow buttons
 * scroll the rail, and a "More Categories" link opens the full catalog.
 */
import React, { useRef, useState } from 'react';
import {
  Animated,
  Image,
  LayoutChangeEvent,
  NativeScrollEvent,
  NativeSyntheticEvent,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
  ViewStyle,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { BentoCategory } from './CategoryBento';
import { useAnimatedCard } from '@/hooks/useAnimatedCard';
import { palette, softShadow, spacing, themed, typeface, withAlpha } from '@/constants/theme';

const GAP = 16;
const PAD = 18;
// Alternating resting tilt, so the row looks hand-placed rather than mechanical
const TILTS = [-3.2, 2.4, -2.6, 3, -1.8, 2.8];
// A subtle vertical rhythm (the reference row arches slightly)
const OFFSETS = [8, 0, -4, 0, 8, -2];

const pretty = (s: string): string => s.charAt(0).toUpperCase() + s.slice(1).replace(/-/g, ' ');
const clamp = (value: number, min: number, max: number): number => Math.min(max, Math.max(min, value));

interface CategoryCollageProps {
  items: BentoCategory[];
  /** Width available for the rail (measured again on layout) */
  width: number;
  onOpen: (name: string) => void;
  subtitle?: string;
  onSeeAll?: () => void;
}

interface RailCardProps {
  item: BentoCategory;
  index: number;
  width: number;
  height: number;
  tint: ViewStyle;
  onPress: () => void;
}

function RailCard({ item, index, width, height, tint, onPress }: RailCardProps) {
  const { entranceStyle, floatStyle, hoverStyle, handlers, active } = useAnimatedCard({
    index,
    stagger: 90,
    restRotation: TILTS[index % TILTS.length],
    hoverScale: 1.05,
    lift: 10,
    floatDistance: 4,
    floatDuration: 5200,
  });

  const baseShadow = softShadow('#2A1550', 0.16, 22, 12, 6);
  const activeShadow = softShadow('#2A1550', 0.3, 34, 20, 14);
  // Each card gets a different accent glow behind the product photo
  const accents = [styles.accent0, styles.accent1, styles.accent2, styles.accent3, styles.accent4];
  const accent = accents[index % accents.length];

  return (
    <Animated.View style={[{ width, height, top: OFFSETS[index % OFFSETS.length], zIndex: active ? 20 : 1 }, entranceStyle]}>
      <Animated.View style={[styles.fill, floatStyle]}>
        <Pressable
          style={styles.fill}
          onPress={onPress}
          accessibilityRole="button"
          accessibilityLabel={`${pretty(item.name)}, ${item.count} products`}
          {...handlers}
        >
          <Animated.View style={[styles.cardShadow, baseShadow, active && activeShadow, hoverStyle]}>
            <View style={styles.card}>
              <View style={[styles.art, tint]}>
                <View style={[styles.artBlob, accent]} />
                <View style={styles.artHalo} />
                <View style={styles.artRing} />
                <View style={styles.artRingInner} />
                <View style={styles.artWave} />
                <MaterialCommunityIcons name="star-four-points" size={16} color={palette.gold} style={styles.artSparkle} />
                {item.image ? (
                  <Image source={{ uri: item.image }} style={styles.artImage} resizeMode="contain" />
                ) : (
                  <MaterialCommunityIcons name="shape-outline" size={42} color={palette.mist} />
                )}
              </View>
              <View style={styles.foot}>
                <View style={styles.footText}>
                  <Text style={styles.name} numberOfLines={2}>
                    {pretty(item.name)}
                  </Text>
                  <Text style={styles.count} numberOfLines={1}>
                    {item.count > 0 ? `${item.count}+ Items` : 'Explore'}
                  </Text>
                </View>
                <View style={styles.arrow}>
                  <MaterialCommunityIcons name="arrow-top-right" size={18} color={palette.surface} />
                </View>
              </View>
            </View>
          </Animated.View>
        </Pressable>
      </Animated.View>
    </Animated.View>
  );
}

export function CategoryCollage({ items, width, onOpen, subtitle, onSeeAll }: CategoryCollageProps) {
  const [measured, setMeasured] = useState(0);
  const scrollRef = useRef<ScrollView>(null);
  const offsetRef = useRef(0);
  const [atStart, setAtStart] = useState(true);
  const [atEnd, setAtEnd] = useState(false);
  const [viewport, setViewport] = useState(0);
  const [content, setContent] = useState(0);

  const usable = measured > 0 ? measured : width;

  if (items.length === 0) return null;

  // Cards sit inside the stage's horizontal padding, so snapping lines up with the cards
  const innerW = Math.max(0, usable - PAD * 2);
  const cardW =
    innerW >= 900
      ? clamp((innerW - GAP * 4) / 4.5, 190, 235)
      : innerW >= 560
        ? clamp((innerW - GAP * 2) / 3.2, 168, 215)
        : clamp(innerW * 0.64, 176, 232);
  const cardH = Math.round(cardW * 1.3);
  const stageH = cardH + PAD * 2;
  const step = cardW + GAP;
  const maxScroll = Math.max(0, content - viewport);
  const showArrows = usable >= 640 && maxScroll > 0;

  const tints = [styles.tint0, styles.tint1, styles.tint2, styles.tint3, styles.tint4];

  const onScroll = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const x = e.nativeEvent.contentOffset.x;
    offsetRef.current = x;
    // Only update when crossing an edge, so scrolling does not re-render every card
    const start = x <= 2;
    const end = x >= maxScroll - 2;
    setAtStart((prev) => (prev === start ? prev : start));
    setAtEnd((prev) => (prev === end ? prev : end));
  };

  const scrollBy = (direction: number) => {
    const target = clamp(offsetRef.current + direction * step, 0, maxScroll);
    scrollRef.current?.scrollTo({ x: target, animated: true });
  };

  return (
    <View style={styles.section}>
      <View style={styles.head}>
        <View style={styles.headText}>
          <Text style={styles.kicker}>THE CATEGORY EDIT</Text>
          <Text style={styles.heading}>Shop by collection</Text>
          {subtitle ? <Text style={styles.sub}>{subtitle}</Text> : null}
        </View>
      </View>

      <View style={[styles.stage, { height: stageH }]} onLayout={(e: LayoutChangeEvent) => setMeasured(Math.floor(e.nativeEvent.layout.width))}>
        <View style={styles.decorBlob} />
        <View style={styles.decorBlob2} />
        <View style={styles.decorArc} />
        <MaterialCommunityIcons name="star-four-points" size={22} color={palette.rose} style={styles.sparkleA} />
        <MaterialCommunityIcons name="star-four-points" size={12} color={palette.rose} style={styles.sparkleB} />

        <ScrollView
          ref={scrollRef}
          horizontal
          showsHorizontalScrollIndicator={false}
          snapToInterval={step}
          snapToAlignment="start"
          decelerationRate="fast"
          disableIntervalMomentum
          scrollEventThrottle={16}
          onScroll={onScroll}
          onLayout={(e: LayoutChangeEvent) => setViewport(Math.floor(e.nativeEvent.layout.width))}
          onContentSizeChange={(w: number) => setContent(Math.floor(w))}
          style={[styles.rail, { height: stageH, marginHorizontal: PAD }]}
          contentContainerStyle={styles.railContent}
        >
          {items.map((item, i) => (
            <RailCard
              key={item.name}
              item={item}
              index={i}
              width={cardW}
              height={cardH}
              tint={tints[i % tints.length]}
              onPress={() => onOpen(item.name)}
            />
          ))}
        </ScrollView>

        {showArrows ? (
          <>
            <Pressable
              style={[styles.navBtn, styles.navLeft, { top: stageH / 2 - 20 }, atStart && styles.navDisabled]}
              onPress={() => scrollBy(-1)}
              disabled={atStart}
              accessibilityRole="button"
              accessibilityLabel="Previous categories"
            >
              <MaterialCommunityIcons name="chevron-left" size={22} color={palette.ink} />
            </Pressable>
            <Pressable
              style={[styles.navBtn, styles.navRight, { top: stageH / 2 - 20 }, atEnd && styles.navDisabled]}
              onPress={() => scrollBy(1)}
              disabled={atEnd}
              accessibilityRole="button"
              accessibilityLabel="Next categories"
            >
              <MaterialCommunityIcons name="chevron-right" size={22} color={palette.ink} />
            </Pressable>
          </>
        ) : null}
      </View>

      {onSeeAll ? (
        <Pressable style={styles.more} onPress={onSeeAll} accessibilityRole="button" accessibilityLabel="More categories">
          <Text style={styles.moreText}>More Categories</Text>
          <View style={styles.moreLine} />
          <MaterialCommunityIcons name="arrow-right" size={16} color={palette.forest} />
        </Pressable>
      ) : null}
    </View>
  );
}

const styles = themed(() =>
  StyleSheet.create({
    section: { marginTop: spacing.sm, marginBottom: spacing.md },
    head: { flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between', gap: spacing.md, marginBottom: spacing.sm },
    headText: { flex: 1, minWidth: 0 },
    kicker: { fontSize: 10, letterSpacing: 2.6, fontWeight: '700', color: palette.accent },
    heading: { fontFamily: typeface.display, fontSize: 25, lineHeight: 30, color: palette.ink, marginTop: 3 },
    sub: { fontSize: 12, color: palette.stone, marginTop: 3 },

    // Lavender stage with soft waves and sparkles
    stage: { position: 'relative', borderRadius: 28, backgroundColor: palette.blush, overflow: 'hidden' },
    decorBlob: { position: 'absolute', right: -70, top: -90, width: 260, height: 260, borderRadius: 130, backgroundColor: palette.surface, opacity: 0.85 },
    decorBlob2: { position: 'absolute', left: -90, bottom: -130, width: 300, height: 300, borderRadius: 150, backgroundColor: palette.beige, opacity: 0.9 },
    decorArc: {
      position: 'absolute',
      right: -140,
      top: -170,
      width: 420,
      height: 420,
      borderRadius: 210,
      borderWidth: 1.5,
      borderColor: palette.rose,
      opacity: 0.25,
    },
    sparkleA: { position: 'absolute', left: 16, top: 14, opacity: 0.8 },
    sparkleB: { position: 'absolute', right: 26, bottom: 16, opacity: 0.6 },

    rail: { flexGrow: 0 },
    railContent: { gap: GAP, paddingVertical: PAD, alignItems: 'center' },

    // Card
    fill: { flex: 1 },
    cardShadow: { flex: 1, borderRadius: 18, backgroundColor: palette.surface },
    card: {
      flex: 1,
      borderRadius: 18,
      overflow: 'hidden',
      backgroundColor: palette.surface,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: palette.line,
    },
    art: { flex: 1, minHeight: 0, alignItems: 'center', justifyContent: 'center', overflow: 'hidden' },
    artBlob: { position: 'absolute', right: -34, top: -34, width: '78%', height: '78%', borderRadius: 999 },
    artHalo: { position: 'absolute', width: '66%', height: '66%', borderRadius: 999, backgroundColor: 'rgba(255,255,255,0.34)' },
    artRing: { position: 'absolute', width: '70%', height: '70%', borderRadius: 999, borderWidth: 1, borderColor: 'rgba(255,255,255,0.55)' },
    artRingInner: { position: 'absolute', width: '50%', height: '50%', borderRadius: 999, borderWidth: 1, borderColor: 'rgba(255,255,255,0.4)' },
    artWave: { position: 'absolute', left: '-12%', right: '-12%', bottom: -36, height: 78, borderRadius: 999, backgroundColor: 'rgba(255,255,255,0.18)' },
    artSparkle: { position: 'absolute', right: 12, top: 12, opacity: 0.85 },
    artImage: { width: '72%', height: '72%' },
    foot: { height: 86, flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 14, paddingVertical: 12, backgroundColor: palette.surface },
    footText: { flex: 1, minWidth: 0 },
    name: { fontFamily: typeface.display, fontSize: 18, lineHeight: 21, color: palette.ink },
    count: { fontSize: 11, color: palette.stone, marginTop: 3 },
    arrow: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center', backgroundColor: palette.forest },

    // Rail arrows
    navBtn: {
      position: 'absolute',
      width: 40,
      height: 40,
      borderRadius: 20,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: palette.surface,
      zIndex: 30,
      ...softShadow('#2A1550', 0.2, 14, 6, 8),
    },
    navLeft: { left: 6 },
    navRight: { right: 6 },
    navDisabled: { opacity: 0.35 },

    // "More Categories" link
    more: { flexDirection: 'row', alignItems: 'center', gap: 10, alignSelf: 'flex-start', marginTop: spacing.sm, paddingVertical: 4 },
    moreText: { fontSize: 13, fontWeight: '700', color: palette.forest },
    moreLine: { width: 96, height: 1, backgroundColor: palette.mist },

    // Image tints, cycled per card
    tint0: { backgroundColor: palette.sand },
    tint1: { backgroundColor: palette.beige },
    tint2: { backgroundColor: palette.roseLight },
    tint3: { backgroundColor: palette.blush },
    tint4: { backgroundColor: palette.accentSoft },

    // Soft colour glows layered inside each card's image area
    accent0: { backgroundColor: withAlpha(palette.rose, 0.3) },
    accent1: { backgroundColor: withAlpha(palette.gold, 0.32) },
    accent2: { backgroundColor: withAlpha(palette.accent, 0.26) },
    accent3: { backgroundColor: withAlpha(palette.roseLight, 0.55) },
    accent4: { backgroundColor: withAlpha(palette.gold, 0.2) },
  })
);
