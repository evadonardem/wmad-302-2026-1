/**
 * Home banner for the active season. Christmas shows the countdown to Dec 25 and
 * the XMAS25 code; every other season shows its tagline and a shop shortcut.
 * Drawn in the theme's second color so it stands out under the primary hero.
 */
import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useRouter } from 'expo-router';
import { useSettings } from '@/context/SettingsContext';
import { SEASONS } from '@/constants/seasons';
import { daysUntilChristmas } from '@/utils/orders';
import { SeasonParticles } from './SeasonParticles';

export function SeasonBanner() {
  const router = useRouter();
  const { palette, season, heading, t } = useSettings();
  const info = SEASONS[season];
  const onBanner = palette.isDark ? palette.background : '#FFFFFF';
  const isChristmas = season === 'christmas';
  const days = daysUntilChristmas();
  const [accent1, accent2, accent3] = palette.accents;
  // Dot particles in white so they show on the colored banner
  const particleColors = info.particles.kind === 'emoji' ? [] : [onBanner, accent1];

  return (
    <View style={[styles.banner, { backgroundColor: palette.secondary }]}>
      <View style={[styles.bubble, styles.bubbleLarge, { backgroundColor: accent1 }]} />
      <View style={[styles.bubble, styles.bubbleMedium, { backgroundColor: accent2 }]} />
      <View style={[styles.bubble, styles.bubbleSmall, { backgroundColor: accent3 }]} />
      <SeasonParticles spec={info.particles} colors={particleColors} count={12} />
      <Text style={styles.decoration} accessibilityElementsHidden importantForAccessibility="no">
        {info.decoration}
      </Text>
      <View style={styles.content}>
        <Text style={[styles.title, heading(24), { color: onBanner }]}>
          {info.emoji} {isChristmas ? t('holiday.title') : t(`banner.${season}.title`)}
        </Text>
        <Text style={[styles.tagline, { color: onBanner }]}>
          {isChristmas
            ? days === 0
              ? t('holiday.today')
              : t('holiday.countdown', { days })
            : t(`banner.${season}.tagline`)}
        </Text>
        {isChristmas && <Text style={[styles.code, { color: onBanner }]}>{t('holiday.code')}</Text>}
        <TouchableOpacity
          style={[styles.button, { backgroundColor: onBanner }]}
          onPress={() => router.push({ pathname: '/search', params: info.shopParams })}
          accessibilityRole="button"
        >
          <Text style={[styles.buttonText, { color: palette.secondary }]}>
            {isChristmas ? `🎁 ${t('holiday.giftsUnder')}` : t(`banner.${season}.cta`)}
          </Text>
        </TouchableOpacity>
        {isChristmas && (
          <TouchableOpacity
            style={[styles.button, styles.outlineButton, { borderColor: onBanner }]}
            onPress={() => router.push('/advent')}
            accessibilityRole="button"
          >
            <Text style={[styles.buttonText, { color: onBanner }]}>🗓️ {t('advent.title')}</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  banner: {
    marginHorizontal: 16,
    marginTop: 12,
    borderRadius: 20,
    overflow: 'hidden',
    minHeight: 150,
  },
  bubble: {
    position: 'absolute',
    opacity: 0.45,
  },
  bubbleLarge: {
    width: 160,
    height: 160,
    borderRadius: 80,
    right: -40,
    top: -60,
  },
  bubbleMedium: {
    width: 90,
    height: 90,
    borderRadius: 45,
    right: 70,
    bottom: -45,
  },
  bubbleSmall: {
    width: 46,
    height: 46,
    borderRadius: 23,
    left: -12,
    bottom: 18,
  },
  decoration: {
    position: 'absolute',
    right: 12,
    bottom: 4,
    fontSize: 72,
  },
  content: {
    padding: 16,
    paddingRight: 96,
    gap: 4,
  },
  title: {
    fontSize: 22,
    fontWeight: '800',
  },
  tagline: {
    fontSize: 15,
    fontWeight: '700',
  },
  code: {
    fontSize: 13,
    opacity: 0.95,
  },
  button: {
    alignSelf: 'flex-start',
    marginTop: 8,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
  },
  outlineButton: {
    borderWidth: 2,
    marginTop: 6,
  },
  buttonText: {
    fontSize: 14,
    fontWeight: '800',
  },
});
