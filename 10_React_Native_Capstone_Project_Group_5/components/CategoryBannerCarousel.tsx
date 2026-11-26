/**
 * CategoryBannerCarousel - the featured collection cards inside the category banner
 *
 * A snap-scrolling rail of category cards that sits on the right of the banner
 * (below the copy on phones). It advances on its own, pauses while the shopper
 * drags, and can be driven with the arrows or the dots. Cards fade/rise in on
 * mount and lift a little on hover.
 */
import React, { useCallback, useEffect, useRef, useState } from 'react';
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
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { BentoCategory } from './CategoryBento';
import { useAnimatedCard } from '@/hooks/useAnimatedCard';
import { palette, softShadow, themed, typeface } from '@/constants/theme';

const CREAM = '#FBF7FF';
const GAP = 12;

const pretty = (s: string): string => s.charAt(0).toUpperCase() + s.slice(1).replace(/-/g, ' ');
const clamp = (value: number, min: number, max: number): number => Math.min(max, Math.max(min, value));

interface CategoryBannerCarouselProps {
  items: BentoCategory[];
  onOpen: (name: string) => void;
  /** Shorter cards for the stacked phone banner */
  compact?: boolean;
  autoPlayMs?: number;
}

interface CarouselCardProps {
  item: BentoCategory;
  index: number;
  width: number;
  height: number;
  onPress: () => void;
}

function CarouselCard({ item, index, width, height, onPress }: CarouselCardProps) {
  const { entranceStyle, hoverStyle, handlers, active } = useAnimatedCard({
    index,
    stagger: 80,
    float: false,
    hoverScale: 1.035,
    pressScale: 0.97,
    lift: 5,
  });
  const lavender = index % 3 === 1;

  const baseShadow = softShadow('#1B0F3A', 0.22, 16, 8, 4);
  const activeShadow = softShadow('#1B0F3A', 0.34, 24, 14, 8);

  return (
    <Animated.View style={[{ width, height }, entranceStyle]}>
      <Pressable style={styles.fill} onPress={onPress} accessibilityRole="button" accessibilityLabel={`${pretty(item.name)}, ${item.count} products`} {...handlers}>
        <Animated.View style={[styles.shadowWrap, baseShadow, active && activeShadow, hoverStyle]}>
          <View style={[styles.card, lavender && styles.cardLavender]}>
            <View style={styles.art}>
              <View style={styles.ring} />
              {item.image ? <Image source={{ uri: item.image }} style={styles.artImage} resizeMode="contain" /> : null}
            </View>
            <View style={styles.foot}>
              <View style={styles.footText}>
                <Text style={styles.name} numberOfLines={1}>{pretty(item.name)}</Text>
                <Text style={styles.count} numberOfLines={1}>{item.count} {item.count === 1 ? 'piece' : 'pieces'}</Text>
              </View>
              <View style={styles.arrow}>
                <MaterialCommunityIcons name="arrow-top-right" size={13} color={palette.surface} />
              </View>
            </View>
          </View>
        </Animated.View>
      </Pressable>
    </Animated.View>
  );
}

export function CategoryBannerCarousel({ items, onOpen, compact = false, autoPlayMs = 4200 }: CategoryBannerCarouselProps) {
  const [measured, setMeasured] = useState(0);
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const scrollRef = useRef<ScrollView>(null);

  const n = items.length;
  const cardWidth = measured > 0 ? Math.round(clamp(measured * (compact ? 0.68 : 0.62), 148, compact ? 210 : 220)) : compact ? 180 : 200;
  const cardHeight = compact ? 148 : 158;
  const step = cardWidth + GAP;
  const current = clamp(index, 0, Math.max(0, n - 1));

  const goTo = useCallback(
    (target: number) => {
      if (n === 0) return;
      const next = ((target % n) + n) % n;
      setIndex(next);
      scrollRef.current?.scrollTo({ x: next * step, animated: true });
    },
    [n, step]
  );

  // Auto-advance; the timer restarts after every manual change so a click gets a full pause
  useEffect(() => {
    if (n < 2 || paused) return undefined;
    const timer = setTimeout(() => goTo(current + 1), autoPlayMs);
    return () => clearTimeout(timer);
  }, [autoPlayMs, current, goTo, n, paused]);

  const onMomentumEnd = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const x = e.nativeEvent.contentOffset.x;
    setIndex(clamp(Math.round(x / step), 0, Math.max(0, n - 1)));
    setPaused(false);
  };

  if (n === 0) return null;

  return (
    <View style={styles.shell} onLayout={(e: LayoutChangeEvent) => setMeasured(Math.floor(e.nativeEvent.layout.width))}>
      <View style={styles.shellHead}>
        <Text style={styles.shellLabel}>TOP PICKS</Text>
        {n > 1 ? (
          <View style={styles.arrows}>
            <Pressable style={styles.arrowBtn} onPress={() => goTo(current - 1)} accessibilityRole="button" accessibilityLabel="Previous categories">
              <MaterialCommunityIcons name="chevron-left" size={18} color={CREAM} />
            </Pressable>
            <Pressable style={styles.arrowBtn} onPress={() => goTo(current + 1)} accessibilityRole="button" accessibilityLabel="Next categories">
              <MaterialCommunityIcons name="chevron-right" size={18} color={CREAM} />
            </Pressable>
          </View>
        ) : null}
      </View>

      <ScrollView
        ref={scrollRef}
        horizontal
        showsHorizontalScrollIndicator={false}
        snapToInterval={step}
        snapToAlignment="start"
        decelerationRate="fast"
        disableIntervalMomentum
        scrollEnabled={n > 1}
        onScrollBeginDrag={() => setPaused(true)}
        onMomentumScrollEnd={onMomentumEnd}
        onScrollEndDrag={() => setPaused(false)}
        contentContainerStyle={{ gap: GAP, paddingRight: GAP }}
      >
        {items.map((item, i) => (
          <CarouselCard key={item.name} item={item} index={i} width={cardWidth} height={cardHeight} onPress={() => onOpen(item.name)} />
        ))}
      </ScrollView>

      <View style={styles.dots}>
        {n > 1
          ? items.map((item, i) => (
              <Pressable
                key={item.name}
                style={[styles.dot, i === current && styles.dotActive]}
                onPress={() => goTo(i)}
                accessibilityRole="button"
                accessibilityLabel={`Show ${pretty(item.name)}`}
                accessibilityState={{ selected: i === current }}
              />
            ))
          : null}
      </View>
    </View>
  );
}

const styles = themed(() =>
  StyleSheet.create({
    shell: {
      width: '100%',
      borderRadius: 20,
      backgroundColor: 'rgba(255,255,255,0.08)',
      borderWidth: 1,
      borderColor: 'rgba(255,255,255,0.14)',
      padding: 10,
    },
    shellHead: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8, paddingHorizontal: 2 },
    shellLabel: { fontSize: 9, letterSpacing: 2.2, fontWeight: '700', color: 'rgba(251,247,255,0.72)' },
    arrows: { flexDirection: 'row', gap: 6 },
    arrowBtn: { width: 26, height: 26, borderRadius: 13, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(255,255,255,0.14)' },

    fill: { flex: 1 },
    shadowWrap: { flex: 1, borderRadius: 18, backgroundColor: palette.surface },
    card: { flex: 1, borderRadius: 18, backgroundColor: palette.surface, borderWidth: StyleSheet.hairlineWidth, borderColor: palette.line, padding: 9, overflow: 'hidden' },
    cardLavender: { backgroundColor: palette.beige, borderColor: palette.line },

    art: { flex: 1, minHeight: 0, alignItems: 'center', justifyContent: 'center' },
    artImage: { width: '78%', height: '78%' },
    ring: { position: 'absolute', width: '76%', height: '76%', borderRadius: 999, borderWidth: 1, borderColor: palette.line },

    foot: { flexDirection: 'row', alignItems: 'flex-end', gap: 6, paddingTop: 4 },
    footText: { flex: 1, minWidth: 0 },
    name: { fontFamily: typeface.display, fontSize: 14, lineHeight: 17, color: palette.ink },
    count: { fontSize: 9, color: palette.stone, marginTop: 1 },
    arrow: { width: 24, height: 24, borderRadius: 12, alignItems: 'center', justifyContent: 'center', backgroundColor: palette.forest },

    dots: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 5, marginTop: 8, height: 8 },
    dot: { width: 5, height: 5, borderRadius: 3, backgroundColor: 'rgba(255,255,255,0.32)' },
    dotActive: { width: 16, backgroundColor: CREAM },
  })
);
