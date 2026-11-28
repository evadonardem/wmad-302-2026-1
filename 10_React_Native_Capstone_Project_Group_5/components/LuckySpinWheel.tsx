/**
 * LuckySpinWheel - fun random picker for cart/wishlist.
 * A carnival-style prize wheel: colorful petals, product cards, gold rim lights,
 * a pointer and a centre hub. Lands on a random item and reports the pick.
 */
import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  Animated,
  Easing,
  Image,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from 'react-native';
import { Modal, Portal, Button } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { palette, radius, spacing, softShadow, themed, typeface, withAlpha } from '@/constants/theme';

export interface SpinItem {
  id: number | string;
  label: string;
  image?: string;
  subtitle?: string;
}

interface LuckySpinWheelProps {
  visible: boolean;
  title?: string;
  items: SpinItem[];
  onClose: () => void;
  onPick?: (item: SpinItem) => void;
  actionLabel?: string;
  onAction?: (item: SpinItem) => void;
}

const COLORS = ['#7C4DFF', '#F2C45A', '#E5788D', '#4F8F6A', '#8B5FD0', '#3F6FD8', '#E0A53A', '#5B35A3'];
const LIGHT_CARD_COLORS = new Set(['#F2C45A', '#E0A53A']);
const BULB_COUNT = 16;
const RAY_COUNT = 16;

const cardTextColor = (color: string): string => (LIGHT_CARD_COLORS.has(color) ? '#3A1E70' : '#FFFFFF');

export function LuckySpinWheel({ visible, title = 'Spin to Pick!', items, onClose, onPick, actionLabel, onAction }: LuckySpinWheelProps) {
  const spin = useRef(new Animated.Value(0)).current;
  const spinValue = useRef(0);
  const [spinning, setSpinning] = useState(false);
  const [picked, setPicked] = useState<SpinItem | null>(null);
  const { width: windowWidth, height: windowHeight } = useWindowDimensions();

  useEffect(() => {
    const id = spin.addListener(({ value }) => {
      spinValue.current = value;
    });
    return () => spin.removeListener(id);
  }, [spin]);

  useEffect(() => {
    if (!visible) {
      setSpinning(false);
      setPicked(null);
      spin.setValue(0);
      spinValue.current = 0;
    }
  }, [visible, spin]);

  // Fits comfortably inside the modal on small phones, grows on bigger screens.
  const size = Math.round(Math.min(300, Math.max(210, Math.min(windowWidth * 0.7, windowHeight * 0.36))));
  const shellSize = size + 20;
  const radiusSize = size / 2;
  const segmentAngle = items.length > 0 ? 360 / items.length : 360;

  const labels = useMemo(() => {
    return items.map((item, i) => {
      const angle = i * segmentAngle;
      return { item, angle, color: COLORS[i % COLORS.length] };
    });
  }, [items, segmentAngle]);

  // Wider petals when there are only a few prizes, narrower ones for a full wheel.
  const petalWidth = Math.min(84, Math.max(30, ((2 * Math.PI * radiusSize * 0.58) / Math.max(items.length, 1)) * 0.9));
  const cardWidth = Math.max(28, Math.min(petalWidth - 4, 78));
  const cardHeight = Math.max(52, Math.min(92, radiusSize * 0.62, petalWidth * 1.18));
  const showCardLabel = cardWidth >= 50;
  const cardImageSize = Math.max(20, Math.min(cardWidth - 14, cardHeight - (showCardLabel ? 28 : 14)));
  const cardRadius = Math.max(8, Math.min(16, cardWidth * 0.22));
  const hubSize = Math.max(54, Math.min(68, Math.round(size * 0.23)));
  const hubInnerSize = Math.round(hubSize * 0.74);
  const glowSize = size * 0.72;
  const centerRingSize = size * 0.34;

  const doSpin = () => {
    if (spinning || items.length === 0) return;
    setPicked(null);
    setSpinning(true);
    const winnerIndex = Math.floor(Math.random() * items.length);
    const extraSpins = 5 + Math.floor(Math.random() * 3); // 5-7 full spins
    // Pointer is at top (0deg). Item i sits at i * segmentAngle, so rotate it to 0deg.
    const jitter = (Math.random() - 0.5) * Math.min(segmentAngle * 0.4, 12);
    const current = spinValue.current;
    const base = current - (current % 360);
    const target = base + extraSpins * 360 + (360 - winnerIndex * segmentAngle) + jitter;
    Animated.timing(spin, {
      toValue: target,
      duration: 3800,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: Platform.OS !== 'web',
    }).start(() => {
      setSpinning(false);
      const winner = items[winnerIndex];
      setPicked(winner);
      onPick?.(winner);
    });
  };

  const rotate = spin.interpolate({
    inputRange: [0, 360],
    outputRange: ['0deg', '360deg'],
  });

  return (
    <Portal>
      <Modal visible={visible} onDismiss={spinning ? undefined : onClose} contentContainerStyle={styles.modal}>
        <View style={styles.header}>
          <View style={{ flex: 1 }}>
            <View style={styles.eyebrowRow}>
              <MaterialCommunityIcons name="ferris-wheel" size={14} color={palette.accent} />
              <Text style={styles.eyebrow}>CAN&apos;T DECIDE?</Text>
            </View>
            <Text style={styles.title}>{title}</Text>
            <Text style={styles.sub}>Spin the wheel and let luck pick for you!</Text>
          </View>
          <Pressable onPress={spinning ? undefined : onClose} style={styles.closeBtn} accessibilityLabel="Close">
            <MaterialCommunityIcons name="close" size={20} color={palette.ink} />
          </Pressable>
        </View>

        {items.length < 2 ? (
          <View style={styles.empty}>
            <View style={styles.emptyIcon}>
              <MaterialCommunityIcons name="ferris-wheel" size={38} color={palette.forest} />
            </View>
            <Text style={styles.emptyTitle}>The wheel needs two prizes</Text>
            <Text style={styles.emptyText}>Add at least 2 items to spin the wheel.</Text>
          </View>
        ) : (
          <>
            <View style={styles.wheelArea}>
              <View
                style={[
                  styles.wheelHalo,
                  { width: shellSize + 20, height: shellSize + 20, borderRadius: (shellSize + 20) / 2 },
                ]}
              />
              <MaterialCommunityIcons name="star-four-points" size={18} color={palette.gold} style={styles.sparkA} />
              <MaterialCommunityIcons name="star-four-points" size={13} color={palette.rose} style={styles.sparkB} />
              <MaterialCommunityIcons name="star-four-points" size={12} color={palette.gold} style={styles.sparkC} />

              <View style={[styles.pointer, { pointerEvents: 'none' }]}>
                <View style={styles.pointerKnob} />
                <View style={styles.pointerArrow} />
              </View>

              <View style={[styles.wheelShell, { width: shellSize, height: shellSize, borderRadius: shellSize / 2 }]}>
                <View
                  style={[
                    styles.innerRim,
                    { width: size + 4, height: size + 4, borderRadius: (size + 4) / 2 },
                    { pointerEvents: 'none' },
                  ]}
                />
                <Animated.View
                  style={[
                    styles.wheel,
                    { width: size, height: size, borderRadius: radiusSize, transform: [{ rotate }] },
                  ]}
                >
                  <View
                    style={[
                      styles.wheelGlow,
                      {
                        width: glowSize,
                        height: glowSize,
                        borderRadius: glowSize / 2,
                        top: (size - glowSize) / 2,
                        left: (size - glowSize) / 2,
                      },
                      { pointerEvents: 'none' },
                    ]}
                  />

                  {/* Soft carnival rays behind the prize petals */}
                  {Array.from({ length: RAY_COUNT }).map((_, i) => (
                    <View
                      key={`ray-${i}`}
                      style={[
                        styles.rayArm,
                        { width: size, height: size, transform: [{ rotate: `${(360 / RAY_COUNT) * i}deg` }] },
                        { pointerEvents: 'none' },
                      ]}
                    >
                      <View style={[styles.ray, { height: radiusSize }]} />
                    </View>
                  ))}

                  {labels.map(({ item, angle, color }) => {
                    const textColor = cardTextColor(color);
                    return (
                      <View
                        key={String(item.id)}
                        style={[
                          styles.segment,
                          { width: size, height: size, transform: [{ rotate: `${angle}deg` }] },
                        ]}
                      >
                        <View
                          style={[
                            styles.petal,
                            {
                              width: petalWidth,
                              height: radiusSize - 2,
                              left: (size - petalWidth) / 2,
                              backgroundColor: withAlpha(color, 0.16),
                              borderColor: withAlpha(color, 0.34),
                            },
                          ]}
                        />
                        <View
                          style={[
                            styles.prizeCard,
                            {
                              width: cardWidth,
                              height: cardHeight,
                              left: (size - cardWidth) / 2,
                              borderRadius: cardRadius,
                              backgroundColor: color,
                              borderColor: withAlpha('#FFFFFF', 0.42),
                            },
                          ]}
                        >
                          <View
                            style={[
                              styles.prizeImageWrap,
                              {
                                width: cardImageSize,
                                height: cardImageSize,
                                borderRadius: Math.max(8, cardImageSize * 0.22),
                              },
                            ]}
                          >
                            {item.image ? (
                              <Image source={{ uri: item.image }} style={styles.prizeImage} resizeMode="contain" />
                            ) : (
                              <MaterialCommunityIcons
                                name="shopping-outline"
                                size={Math.max(14, cardImageSize * 0.5)}
                                color={palette.stone}
                              />
                            )}
                          </View>
                          {showCardLabel ? (
                            <Text style={[styles.prizeLabel, { color: textColor }]} numberOfLines={1}>
                              {item.label}
                            </Text>
                          ) : null}
                        </View>
                      </View>
                    );
                  })}

                  <View
                    style={[
                      styles.centerRing,
                      {
                        width: centerRingSize,
                        height: centerRingSize,
                        borderRadius: centerRingSize / 2,
                        top: (size - centerRingSize) / 2,
                        left: (size - centerRingSize) / 2,
                      },
                      { pointerEvents: 'none' },
                    ]}
                  />
                  <View style={[styles.centerHub, { width: hubSize, height: hubSize, borderRadius: hubSize / 2 }]}>
                    <View
                      style={[
                        styles.centerHubInner,
                        { width: hubInnerSize, height: hubInnerSize, borderRadius: hubInnerSize / 2 },
                      ]}
                    >
                      <MaterialCommunityIcons name="star-four-points" size={Math.round(hubSize * 0.36)} color={palette.gold} />
                    </View>
                  </View>
                </Animated.View>
              </View>

              {/* Rim lights sit outside the spinning wheel so they stay still */}
              <View style={[styles.bulbLayer, { width: shellSize, height: shellSize }, { pointerEvents: 'none' }]}>
                {Array.from({ length: BULB_COUNT }).map((_, i) => (
                  <View
                    key={`bulb-${i}`}
                    style={[
                      styles.bulbArm,
                      { width: shellSize, height: shellSize, transform: [{ rotate: `${(360 / BULB_COUNT) * i}deg` }] },
                    ]}
                  >
                    <View style={[styles.bulb, i % 2 === 0 ? styles.bulbGold : styles.bulbCream]} />
                  </View>
                ))}
              </View>
            </View>

            {picked ? (
              <View style={styles.resultCard}>
                <View style={styles.resultHeader}>
                  <View style={styles.resultBadge}>
                    <MaterialCommunityIcons name="party-popper" size={16} color={palette.forest} />
                  </View>
                  <Text style={styles.resultEyebrow}>LUCKY PICK</Text>
                </View>
                <View style={styles.resultRow}>
                  {picked.image ? <Image source={{ uri: picked.image }} style={styles.resultImg} /> : null}
                  <View style={{ flex: 1 }}>
                    <Text style={styles.resultName} numberOfLines={2}>{picked.label}</Text>
                    {picked.subtitle ? <Text style={styles.resultSub} numberOfLines={1}>{picked.subtitle}</Text> : null}
                  </View>
                </View>
                {actionLabel && onAction ? (
                  <Button
                    mode="contained"
                    compact
                    icon="check-circle-outline"
                    onPress={() => onAction(picked)}
                    style={styles.actionBtn}
                    labelStyle={styles.actionBtnLabel}
                  >
                    {actionLabel}
                  </Button>
                ) : null}
              </View>
            ) : null}

            <Button
              mode="contained"
              onPress={doSpin}
              loading={spinning}
              disabled={spinning}
              icon={spinning ? undefined : 'ferris-wheel'}
              style={styles.spinBtn}
              contentStyle={styles.spinBtnContent}
              labelStyle={styles.spinBtnLabel}
            >
              {spinning ? 'Spinning...' : picked ? 'Spin Again' : 'Spin the Wheel!'}
            </Button>
          </>
        )}
      </Modal>
    </Portal>
  );
}

const styles = themed(() =>
  StyleSheet.create({
    modal: {
      margin: spacing.md,
      backgroundColor: palette.surface,
      borderRadius: 28,
      padding: spacing.lg,
      maxWidth: 440,
      width: '92%',
      alignSelf: 'center',
      borderWidth: 1,
      borderColor: withAlpha(palette.gold, 0.22),
      ...softShadow('#241540', 0.22, 28, 12, 10),
    },
    header: { flexDirection: 'row', alignItems: 'flex-start', gap: spacing.sm, marginBottom: spacing.md },
    eyebrowRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
    eyebrow: { fontSize: 10, letterSpacing: 2, fontWeight: '800', color: palette.accent },
    title: { fontFamily: typeface.display, fontSize: 28, color: palette.ink, marginTop: 2 },
    sub: { fontSize: 13, color: palette.stone, marginTop: 3 },
    closeBtn: {
      width: 36,
      height: 36,
      borderRadius: 18,
      backgroundColor: palette.blush,
      alignItems: 'center',
      justifyContent: 'center',
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: palette.line,
    },

    wheelArea: { alignItems: 'center', justifyContent: 'center', marginVertical: spacing.sm },
    wheelHalo: { position: 'absolute', top: -10, left: -10, backgroundColor: withAlpha(palette.gold, 0.12) },
    sparkA: { position: 'absolute', top: 20, left: 8, opacity: 0.95 },
    sparkB: { position: 'absolute', top: 78, right: 2, opacity: 0.8 },
    sparkC: { position: 'absolute', bottom: 46, left: 0, opacity: 0.75 },
    pointer: { position: 'absolute', top: -18, left: 0, right: 0, alignItems: 'center', zIndex: 30 },
    pointerKnob: {
      width: 18,
      height: 18,
      borderRadius: 9,
      backgroundColor: palette.gold,
      borderWidth: 3,
      borderColor: palette.surface,
      ...softShadow('#241540', 0.3, 6, 3, 4),
    },
    pointerArrow: {
      width: 0,
      height: 0,
      borderLeftWidth: 10,
      borderRightWidth: 10,
      borderTopWidth: 18,
      borderLeftColor: 'transparent',
      borderRightColor: 'transparent',
      borderTopColor: palette.gold,
      marginTop: -3,
    },
    wheelShell: {
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: palette.blush,
      borderWidth: 8,
      borderColor: palette.gold,
      ...softShadow('#241540', 0.24, 20, 10, 8),
    },
    innerRim: {
      position: 'absolute',
      top: 0,
      left: 0,
      borderWidth: 1.5,
      borderColor: withAlpha(palette.gold, 0.55),
    },
    bulbLayer: { position: 'absolute', top: 0, left: 0 },
    bulbArm: { position: 'absolute', top: 0, left: 0, alignItems: 'center' },
    bulb: { width: 8, height: 8, borderRadius: 4, marginTop: -4, borderWidth: 1 },
    bulbGold: { backgroundColor: palette.gold, borderColor: withAlpha('#FFFFFF', 0.65) },
    bulbCream: { backgroundColor: palette.surface, borderColor: withAlpha(palette.gold, 0.75) },

    wheel: {
      backgroundColor: palette.surface,
      overflow: 'hidden',
      alignItems: 'center',
      justifyContent: 'center',
      borderWidth: 1,
      borderColor: withAlpha(palette.gold, 0.35),
    },
    wheelGlow: {
      position: 'absolute',
      backgroundColor: withAlpha(palette.gold, 0.08),
    },
    rayArm: { position: 'absolute', top: 0, left: 0, alignItems: 'center' },
    ray: { width: 1, backgroundColor: withAlpha(palette.gold, 0.18) },
    segment: { position: 'absolute', left: 0, top: 0 },
    petal: {
      position: 'absolute',
      top: 0,
      borderWidth: 1,
      borderRadius: 999,
    },
    prizeCard: {
      position: 'absolute',
      top: 12,
      alignItems: 'center',
      justifyContent: 'center',
      padding: 4,
      borderWidth: 1.5,
      ...softShadow('#241540', 0.2, 6, 3, 3),
    },
    prizeImageWrap: {
      backgroundColor: '#FFFFFF',
      alignItems: 'center',
      justifyContent: 'center',
      overflow: 'hidden',
    },
    prizeImage: { width: '82%', height: '82%' },
    prizeLabel: { fontSize: 8.5, lineHeight: 11, fontWeight: '800', textAlign: 'center', marginTop: 3, paddingHorizontal: 1 },

    centerRing: {
      position: 'absolute',
      borderWidth: 1.5,
      borderColor: withAlpha(palette.gold, 0.45),
    },
    centerHub: {
      width: 68,
      height: 68,
      borderRadius: 34,
      backgroundColor: '#3A1E70',
      alignItems: 'center',
      justifyContent: 'center',
      borderWidth: 4,
      borderColor: palette.gold,
      ...softShadow('#241540', 0.35, 10, 5, 7),
    },
    centerHubInner: {
      width: 50,
      height: 50,
      borderRadius: 25,
      alignItems: 'center',
      justifyContent: 'center',
      borderWidth: 1,
      borderColor: withAlpha('#FFFFFF', 0.25),
    },

    resultCard: {
      backgroundColor: withAlpha(palette.gold, 0.12),
      borderRadius: radius.lg,
      padding: spacing.md,
      marginTop: spacing.md,
      borderWidth: 1.5,
      borderColor: withAlpha(palette.gold, 0.42),
    },
    resultHeader: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 8 },
    resultBadge: {
      width: 24,
      height: 24,
      borderRadius: 12,
      backgroundColor: withAlpha(palette.gold, 0.3),
      alignItems: 'center',
      justifyContent: 'center',
    },
    resultEyebrow: { fontSize: 10, fontWeight: '800', letterSpacing: 2, color: palette.accent },
    resultRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
    resultImg: {
      width: 56,
      height: 56,
      borderRadius: 14,
      backgroundColor: palette.surface,
      borderWidth: 1,
      borderColor: palette.line,
    },
    resultName: { fontSize: 16, fontWeight: '800', color: palette.ink },
    resultSub: { fontSize: 12, color: palette.stone, marginTop: 2 },
    actionBtn: { marginTop: spacing.sm, borderRadius: radius.pill, backgroundColor: palette.forest },
    actionBtnLabel: { fontSize: 12, fontWeight: '700' },
    spinBtn: {
      marginTop: spacing.md,
      borderRadius: radius.pill,
      backgroundColor: palette.forest,
      ...softShadow('#241540', 0.24, 12, 6, 5),
    },
    spinBtnContent: { height: 50 },
    spinBtnLabel: { fontWeight: '800', fontSize: 14 },
    empty: { alignItems: 'center', paddingVertical: spacing.xl, gap: spacing.sm },
    emptyIcon: {
      width: 76,
      height: 76,
      borderRadius: 38,
      backgroundColor: palette.blush,
      alignItems: 'center',
      justifyContent: 'center',
      borderWidth: 1,
      borderColor: withAlpha(palette.gold, 0.3),
    },
    emptyTitle: { fontFamily: typeface.display, fontSize: 22, color: palette.ink, marginTop: 4 },
    emptyText: { fontSize: 13, color: palette.stone, textAlign: 'center' },
  })
);
