/**
 * Onboarding - shown on first launch (and from Settings → Replay intro).
 * Three swipeable slides: welcome, what's inside, and picking your theme.
 */
import React, { useRef, useState } from 'react';
import {
  NativeScrollEvent,
  NativeSyntheticEvent,
  ScrollView,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Button } from 'react-native-paper';
import { useSettings } from '@/context/SettingsContext';
import { LivelyBackground } from '@/components/LivelyBackground';
import { GlassCard } from '@/components/GlassCard';
import { SeasonPicker } from '@/components/SeasonPicker';
import { SEASONS } from '@/constants/seasons';

const SLIDES = 3;

export default function OnboardingScreen() {
  const router = useRouter();
  const { width } = useWindowDimensions();
  const { palette, season, heading, updateSettings, t } = useSettings();
  const scroller = useRef<ScrollView>(null);
  const [page, setPage] = useState(0);
  const info = SEASONS[season];

  const finish = () => {
    updateSettings({ onboarded: true });
    if (router.canGoBack()) router.back();
    else router.replace('/');
  };

  const goTo = (index: number) => {
    scroller.current?.scrollTo({ x: index * width, animated: true });
    setPage(index);
  };

  const onScroll = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    setPage(Math.round(event.nativeEvent.contentOffset.x / width));
  };

  const features = [
    { emoji: '🎁', title: t('onboarding.rewards'), text: t('onboarding.rewardsText') },
    { emoji: '🎄', title: t('onboarding.advent'), text: t('onboarding.adventText') },
    { emoji: '💝', title: t('onboarding.giftLists'), text: t('onboarding.giftListsText') },
    { emoji: '₱', title: t('onboarding.pesos'), text: t('onboarding.pesosText') },
  ];

  return (
    <SafeAreaView style={[styles.screen, { backgroundColor: palette.background }]}>
      <LivelyBackground />
      <View style={styles.topRow}>
        <Button onPress={finish} textColor={palette.textMuted}>
          {t('onboarding.skip')}
        </Button>
      </View>

      <ScrollView
        ref={scroller}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onMomentumScrollEnd={onScroll}
        onScroll={onScroll}
        scrollEventThrottle={32}
      >
        {/* 1 · Welcome */}
        <View style={[styles.slide, { width }]}>
          <Text style={styles.bigEmoji}>{info.decoration}</Text>
          <Text style={[styles.title, heading(36), { color: palette.primary }]}>{t('onboarding.welcome')}</Text>
          <Text style={[styles.text, { color: palette.text }]}>{t('onboarding.welcomeText')}</Text>
          <Text style={styles.scene}>{info.scenery.join(' ')}</Text>
        </View>

        {/* 2 · Features */}
        <ScrollView style={{ width }} contentContainerStyle={styles.slideScroll}>
          <Text style={[styles.title, heading(30), { color: palette.primary }]}>{t('onboarding.inside')}</Text>
          {features.map((feature) => (
            <GlassCard key={feature.title} style={styles.feature}>
              <Text style={styles.featureEmoji}>{feature.emoji}</Text>
              <View style={styles.featureText}>
                <Text style={[styles.featureTitle, { color: palette.text }]}>{feature.title}</Text>
                <Text style={{ color: palette.textMuted }}>{feature.text}</Text>
              </View>
            </GlassCard>
          ))}
        </ScrollView>

        {/* 3 · Theme */}
        <ScrollView style={{ width }} contentContainerStyle={styles.slideScroll}>
          <Text style={[styles.title, heading(30), { color: palette.primary }]}>{t('onboarding.pickTheme')}</Text>
          <Text style={[styles.text, { color: palette.text }]}>{t('onboarding.pickThemeText')}</Text>
          <GlassCard>
            <SeasonPicker />
          </GlassCard>
        </ScrollView>
      </ScrollView>

      <View style={styles.footer}>
        <View style={styles.dots}>
          {Array.from({ length: SLIDES }, (_, index) => (
            <View
              key={index}
              style={[
                styles.dot,
                { backgroundColor: index === page ? palette.primary : palette.border },
                index === page && styles.dotActive,
              ]}
            />
          ))}
        </View>
        <Button
          mode="contained"
          onPress={() => (page < SLIDES - 1 ? goTo(page + 1) : finish())}
          contentStyle={styles.buttonContent}
          style={styles.button}
        >
          {page < SLIDES - 1 ? t('onboarding.next') : t('onboarding.start')}
        </Button>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    paddingHorizontal: 8,
  },
  slide: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 28,
  },
  slideScroll: {
    padding: 20,
    paddingBottom: 40,
    maxWidth: 640,
    width: '100%',
    alignSelf: 'center',
  },
  bigEmoji: {
    fontSize: 110,
  },
  title: {
    textAlign: 'center',
    marginVertical: 12,
  },
  text: {
    fontSize: 16,
    textAlign: 'center',
    lineHeight: 23,
    marginBottom: 16,
  },
  scene: {
    fontSize: 28,
    marginTop: 16,
    letterSpacing: 2,
  },
  feature: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    marginBottom: 12,
  },
  featureEmoji: {
    fontSize: 36,
    width: 44,
    textAlign: 'center',
  },
  featureText: {
    flex: 1,
  },
  featureTitle: {
    fontSize: 17,
    fontWeight: '800',
    marginBottom: 2,
  },
  footer: {
    padding: 20,
    gap: 16,
  },
  dots: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  dotActive: {
    width: 24,
  },
  button: {
    borderRadius: 28,
    maxWidth: 520,
    width: '100%',
    alignSelf: 'center',
  },
  buttonContent: {
    paddingVertical: 8,
  },
});
