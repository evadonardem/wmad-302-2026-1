/**
 * Home hero in the theme color: seasonal greeting, search shortcut, floating
 * accent bubbles, the season's particles and an emoji scene along the bottom
 * (🎃🪦👻 for Halloween, 🌲⛄🏔️ for Winter …). Extends under the status bar.
 */
import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useSettings } from '@/context/SettingsContext';
import { SEASONS } from '@/constants/seasons';
import { SeasonParticles } from './SeasonParticles';

export function SeasonHero({ firstName }: { firstName?: string }) {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { palette, season, heading, t } = useSettings();
  const info = SEASONS[season];
  const onHero = palette.onPrimary;
  const [accent1, accent2, accent3] = palette.accents;
  const particleColors = info.particles.kind === 'emoji' ? [] : [onHero, accent1, accent3];

  return (
    <View style={[styles.hero, { backgroundColor: palette.primary, paddingTop: insets.top + 16 }]}>
      <View style={[styles.bubble, styles.bubbleOne, { backgroundColor: accent1 }]} />
      <View style={[styles.bubble, styles.bubbleTwo, { backgroundColor: accent2 }]} />
      <View style={[styles.bubble, styles.bubbleThree, { backgroundColor: accent3 }]} />
      <SeasonParticles spec={info.particles} colors={particleColors} count={18} />

      <View style={styles.welcomeRow}>
        <View style={styles.welcomeText}>
          <Text style={[styles.seasonTag, { color: palette.primary, backgroundColor: onHero }]}>
            {info.emoji} {t(`season.${season}`)}
          </Text>
          <Text style={[styles.greeting, heading(28), { color: onHero }]}>
            {firstName ? t(`greet.${season}`, { name: firstName }) : t('home.welcomeGuest')}
          </Text>
          <Text style={[styles.subtitle, { color: onHero }]}>{t(`mood.${season}`)}</Text>
        </View>
        <View style={[styles.avatar, { backgroundColor: onHero }]}>
          <MaterialCommunityIcons name={info.icon} size={30} color={palette.primary} />
        </View>
      </View>

      <TouchableOpacity
        style={[styles.search, { backgroundColor: palette.surface }]}
        onPress={() => router.push('/search')}
        accessibilityRole="search"
      >
        <MaterialCommunityIcons name="magnify" size={22} color={palette.primary} />
        <Text style={[styles.searchText, { color: palette.textMuted }]}>{t('home.searchPlaceholder')}</Text>
        <Text style={styles.searchEmoji}>{info.motifs[0]}</Text>
      </TouchableOpacity>

      <View style={styles.scenery} accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
        {info.scenery.map((glyph, index) => (
          <Text key={index} style={[styles.sceneryGlyph, { fontSize: index % 2 ? 30 : 38 }]}>
            {glyph}
          </Text>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  hero: {
    overflow: 'hidden',
    borderBottomLeftRadius: 32,
    borderBottomRightRadius: 32,
    paddingHorizontal: 16,
  },
  bubble: {
    position: 'absolute',
    opacity: 0.4,
  },
  bubbleOne: {
    width: 220,
    height: 220,
    borderRadius: 110,
    top: -90,
    right: -70,
  },
  bubbleTwo: {
    width: 120,
    height: 120,
    borderRadius: 60,
    bottom: 10,
    left: -50,
  },
  bubbleThree: {
    width: 70,
    height: 70,
    borderRadius: 35,
    top: 40,
    left: '45%',
  },
  welcomeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  welcomeText: {
    flex: 1,
    gap: 4,
  },
  seasonTag: {
    alignSelf: 'flex-start',
    overflow: 'hidden',
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 12,
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 0.3,
  },
  greeting: {
    fontSize: 26,
    fontWeight: '800',
  },
  subtitle: {
    fontSize: 15,
    fontWeight: '600',
    opacity: 0.92,
  },
  avatar: {
    width: 58,
    height: 58,
    borderRadius: 29,
    alignItems: 'center',
    justifyContent: 'center',
  },
  search: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 16,
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderRadius: 24,
    shadowColor: '#000',
    shadowOpacity: 0.12,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 3 },
    elevation: 3,
  },
  searchText: {
    flex: 1,
    fontSize: 15,
  },
  searchEmoji: {
    fontSize: 18,
  },
  scenery: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'flex-end',
    marginTop: 10,
    marginBottom: 2,
  },
  sceneryGlyph: {
    textAlign: 'center',
  },
});
