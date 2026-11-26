/**
 * LuckySpinWheel - fun random picker for cart/wishlist.
 * Shows a colorful spinning wheel; lands on a random item and reports the pick.
 */
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Animated, Easing, Image, Pressable, StyleSheet, Text, View } from 'react-native';
import { Modal, Portal, Button } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { palette, radius, spacing, themed, typeface, withAlpha } from '@/constants/theme';

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

const COLORS = ['#6B3FC4', '#F2C45A', '#E5788D', '#4F8F6A', '#8B5FD0', '#5B35A3', '#E0A53A', '#3F2380'];

export function LuckySpinWheel({ visible, title = 'Spin to Pick!', items, onClose, onPick, actionLabel, onAction }: LuckySpinWheelProps) {
  const spin = useRef(new Animated.Value(0)).current;
  const spinValue = useRef(0);
  const [spinning, setSpinning] = useState(false);
  const [picked, setPicked] = useState<SpinItem | null>(null);

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

  const size = 280;
  const radiusSize = size / 2;
  const segmentAngle = items.length > 0 ? 360 / items.length : 360;

  const labels = useMemo(() => {
    return items.map((item, i) => {
      const angle = i * segmentAngle;
      return { item, angle, color: COLORS[i % COLORS.length] };
    });
  }, [items, segmentAngle]);

  const doSpin = () => {
    if (spinning || items.length === 0) return;
    setPicked(null);
    setSpinning(true);
    const winnerIndex = Math.floor(Math.random() * items.length);
    const extraSpins = 5 + Math.floor(Math.random() * 3); // 5-7 full spins
    // Pointer is at top (0deg). Wheel segments are placed with i*segmentAngle from top.
    // To land winner at top, rotate so that winner angle aligns to 0: target = -(winnerIndex*segmentAngle)
    const jitter = (Math.random() - 0.5) * segmentAngle * 0.5;
    const current = spinValue.current;
    const base = current - (current % 360);
    const target = base + extraSpins * 360 + (360 - winnerIndex * segmentAngle) + jitter;
    Animated.timing(spin, {
      toValue: target,
      duration: 3800,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
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
            <Text style={styles.eyebrow}>CAN&apos;T DECIDE?</Text>
            <Text style={styles.title}>{title}</Text>
            <Text style={styles.sub}>Spin the wheel and let luck pick for you!</Text>
          </View>
          <Pressable onPress={spinning ? undefined : onClose} style={styles.closeBtn} accessibilityLabel="Close">
            <MaterialCommunityIcons name="close" size={20} color={palette.ink} />
          </Pressable>
        </View>

        {items.length < 2 ? (
          <View style={styles.empty}>
            <MaterialCommunityIcons name="emoticon-sad-outline" size={40} color={palette.mist} />
            <Text style={styles.emptyText}>Add at least 2 items to spin the wheel.</Text>
          </View>
        ) : (
          <>
            <View style={styles.wheelArea}>
              <View style={styles.pointer}>
                <MaterialCommunityIcons name="map-marker-down" size={34} color={palette.gold} />
              </View>
              <View style={[styles.wheelShell, { width: size + 16, height: size + 16, borderRadius: (size + 16) / 2 }]}>
                <Animated.View style={[styles.wheel, { width: size, height: size, borderRadius: radiusSize, transform: [{ rotate }] }]}>
                  {labels.map(({ item, angle, color }, i) => (
                    <View
                      key={String(item.id)}
                      style={[
                        styles.segment,
                        {
                          width: size,
                          height: size,
                          transform: [{ rotate: `${angle}deg` }],
                        },
                      ]}
                    >
                      <View style={[styles.segmentLine, { backgroundColor: withAlpha(color, 0.18) }]} />
                      <View style={[styles.segmentLabelWrap, { transform: [{ rotate: `${segmentAngle / 2}deg` }] }]}>
                        <View style={[styles.segmentPill, { backgroundColor: withAlpha(color, 0.18), borderColor: withAlpha(color, 0.35) }]}>
                          {item.image ? (
                            <Image source={{ uri: item.image }} style={styles.segmentImg} />
                          ) : (
                            <Text style={[styles.segmentText, { color }]}>{i + 1}</Text>
                          )}
                        </View>
                      </View>
                    </View>
                  ))}
                  <View style={styles.centerHub}>
                    <View style={styles.centerInner}>
                      <MaterialCommunityIcons name="star-four-points" size={22} color={palette.gold} />
                    </View>
                  </View>
                </Animated.View>
              </View>
            </View>

            {picked ? (
              <View style={styles.resultCard}>
                <Text style={styles.resultEyebrow}>LUCKY PICK</Text>
                <View style={styles.resultRow}>
                  {picked.image ? <Image source={{ uri: picked.image }} style={styles.resultImg} /> : null}
                  <View style={{ flex: 1 }}>
                    <Text style={styles.resultName} numberOfLines={2}>{picked.label}</Text>
                    {picked.subtitle ? <Text style={styles.resultSub} numberOfLines={1}>{picked.subtitle}</Text> : null}
                  </View>
                </View>
                {actionLabel && onAction ? (
                  <Button mode="contained" compact onPress={() => onAction(picked)} style={styles.actionBtn} labelStyle={styles.actionBtnLabel}>
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
    modal: { margin: spacing.md, backgroundColor: palette.surface, borderRadius: radius.xl, padding: spacing.lg, maxWidth: 440, width: '92%', alignSelf: 'center' },
    header: { flexDirection: 'row', alignItems: 'flex-start', gap: spacing.sm, marginBottom: spacing.md },
    eyebrow: { fontSize: 10, letterSpacing: 2, fontWeight: '700', color: palette.accent },
    title: { fontFamily: typeface.display, fontSize: 28, color: palette.ink, marginTop: 2 },
    sub: { fontSize: 13, color: palette.stone, marginTop: 2 },
    closeBtn: { width: 36, height: 36, borderRadius: 18, backgroundColor: palette.blush, alignItems: 'center', justifyContent: 'center' },
    wheelArea: { alignItems: 'center', justifyContent: 'center', marginVertical: spacing.sm },
    pointer: { position: 'absolute', top: -8, zIndex: 20 },
    wheelShell: { backgroundColor: palette.blush, alignItems: 'center', justifyContent: 'center', borderWidth: 6, borderColor: withAlpha(palette.gold, 0.5) },
    wheel: { backgroundColor: palette.surface, overflow: 'hidden', position: 'relative' },
    segment: { position: 'absolute', left: 0, top: 0 },
    segmentLine: { position: 'absolute', left: '50%', top: 0, width: 1, height: '50%', marginLeft: -0.5 },
    segmentLabelWrap: { position: 'absolute', top: 16, left: '50%', width: 44, marginLeft: -22, alignItems: 'center' },
    segmentPill: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center', borderWidth: 1, overflow: 'hidden' },
    segmentImg: { width: 34, height: 34, borderRadius: 17, backgroundColor: palette.sand },
    segmentText: { fontSize: 12, fontWeight: '800' },
    centerHub: { position: 'absolute', top: '50%', left: '50%', width: 56, height: 56, marginLeft: -28, marginTop: -28, borderRadius: 28, backgroundColor: palette.forest, alignItems: 'center', justifyContent: 'center', borderWidth: 4, borderColor: palette.gold },
    centerInner: { alignItems: 'center', justifyContent: 'center' },
    resultCard: { backgroundColor: withAlpha(palette.gold, 0.14), borderRadius: radius.lg, padding: spacing.md, marginTop: spacing.md, borderWidth: 1, borderColor: withAlpha(palette.gold, 0.3) },
    resultEyebrow: { fontSize: 10, fontWeight: '700', letterSpacing: 2, color: palette.accent, marginBottom: 6 },
    resultRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
    resultImg: { width: 52, height: 52, borderRadius: 12, backgroundColor: palette.sand },
    resultName: { fontSize: 15, fontWeight: '700', color: palette.ink },
    resultSub: { fontSize: 12, color: palette.stone, marginTop: 2 },
    actionBtn: { marginTop: spacing.sm, borderRadius: radius.pill, backgroundColor: palette.forest },
    actionBtnLabel: { fontSize: 13, fontWeight: '700' },
    spinBtn: { marginTop: spacing.md, borderRadius: radius.pill, backgroundColor: palette.forest },
    spinBtnContent: { height: 48 },
    spinBtnLabel: { fontWeight: '700', fontSize: 15 },
    empty: { alignItems: 'center', paddingVertical: spacing.xl, gap: spacing.sm },
    emptyText: { fontSize: 13, color: palette.stone, textAlign: 'center' },
  })
);
