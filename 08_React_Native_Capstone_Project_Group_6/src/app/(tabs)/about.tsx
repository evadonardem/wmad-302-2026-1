import { ImageBackground, ScrollView, StyleSheet, View, useWindowDimensions } from 'react-native';
import { router } from 'expo-router';
import { Button, Card, IconButton, Text, useTheme } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useThemeMode } from '@/themeMode';

const BACKGROUND_IMAGE =
  'https://thumb.wikimedia.org/wikipedia/commons/thumb/f/f8/El_Nido%2C_Filipino_sunset%2C_Palawan%2C_Philippines.jpg/1920px-El_Nido%2C_Filipino_sunset%2C_Palawan%2C_Philippines.jpg';

const sections = [
  {
    icon: 'map-marker-path',
    title: 'How it works',
    description:
      'Choose a region and city or municipality, then search for local sights. Browse matching photos, open them for details, and revisit recent searches anytime.',
  },
  {
    icon: 'image-multiple-outline',
    title: 'Photo source',
    description:
      'Photos are found on Wikimedia Commons. Each image links to its source page, where you can review its creator and license.',
  },
  {
    icon: 'code-tags',
    title: 'Built with',
    description:
      'Made with Expo and React Native, with Expo Router, React Native Paper, Axios, and TypeScript.',
  },
];

export default function AboutScreen() {
  const theme = useTheme();
  const { isDarkMode, setIsDarkMode } = useThemeMode();
  const { width } = useWindowDimensions();
  const wideLayout = width >= 720;
  const foreground = '#fff';

  return (
    <ImageBackground
      source={{ uri: BACKGROUND_IMAGE }}
      style={styles.background}
      imageStyle={styles.backgroundImage}
      resizeMode="cover"
      accessibilityLabel="Sunset over El Nido, Palawan"
    >
      <View
        pointerEvents="none"
        style={[
          styles.scrim,
          { backgroundColor: isDarkMode ? 'rgba(0,0,0,0.68)' : 'rgba(0,0,0,0.36)' },
        ]}
      />
      <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
        <ScrollView contentContainerStyle={styles.scrollContent}>
          <View style={styles.topBar}>
            <Button
              mode="text"
              icon="arrow-left"
              textColor={foreground}
              onPress={() => router.replace('/')}
              accessibilityLabel="Back to search"
            >
              Search
            </Button>
            <IconButton
              icon={isDarkMode ? 'weather-sunny' : 'weather-night'}
              iconColor={foreground}
              onPress={() => setIsDarkMode(!isDarkMode)}
              accessibilityLabel="Toggle dark mode"
            />
          </View>

          <View style={styles.hero}>
            <Text style={[styles.eyebrow, styles.textShadow]}>PHILIPPINE COMPASS</Text>
            <Text style={[styles.title, !wideLayout && styles.titleCompact, styles.textShadow]}>
              About Lakbay PH
            </Text>
            <Text style={[styles.intro, styles.textShadow]}>
              Discover the Philippines, one destination at a time.
            </Text>
          </View>

          <View style={[styles.cards, wideLayout && styles.cardsWide]}>
            {sections.map((section) => (
              <Card
                key={section.title}
                mode="contained"
                style={[
                  styles.card,
                  wideLayout && styles.cardWide,
                  { backgroundColor: theme.colors.surface },
                ]}
              >
                <Card.Content style={styles.cardContent}>
                  <View
                    style={[
                      styles.iconWrap,
                      { backgroundColor: theme.colors.secondaryContainer },
                    ]}
                  >
                    <IconButton
                      icon={section.icon}
                      size={22}
                      iconColor={theme.colors.onSecondaryContainer}
                      style={styles.sectionIcon}
                    />
                  </View>
                  <View style={styles.cardCopy}>
                    <Text
                      variant="titleMedium"
                      style={[styles.cardTitle, { color: theme.colors.onSurface }]}
                    >
                      {section.title}
                    </Text>
                    <Text
                      variant="bodyMedium"
                      style={[styles.cardDescription, { color: theme.colors.onSurfaceVariant }]}
                    >
                      {section.description}
                    </Text>
                  </View>
                </Card.Content>
              </Card>
            ))}
          </View>

          <View
            style={[
              styles.sources,
              { borderColor: 'rgba(255,255,255,0.35)' },
            ]}
          >
            <Text variant="labelLarge" style={[styles.sourceLabel, styles.textShadow]}>
              DATA SOURCES
            </Text>
            <Text style={[styles.sourceText, styles.textShadow]}>
              Philippine Standard Geographic Code (PSGC) · Wikimedia Commons
            </Text>
          </View>

          <Button
            mode="contained"
            icon="compass-outline"
            onPress={() => router.replace('/')}
            style={styles.exploreButton}
            contentStyle={styles.exploreButtonContent}
          >
            Start exploring
          </Button>
        </ScrollView>
      </SafeAreaView>
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  background: { flex: 1, width: '100%' },
  backgroundImage: { resizeMode: 'cover' },
  scrim: { position: 'absolute', top: 0, right: 0, bottom: 0, left: 0 },
  safeArea: { flex: 1, backgroundColor: 'transparent' },
  scrollContent: {
    width: '100%',
    maxWidth: 1120,
    alignSelf: 'center',
    paddingHorizontal: 28,
    paddingTop: 8,
    paddingBottom: 36,
  },
  topBar: {
    minHeight: 44,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 28,
  },
  hero: { marginBottom: 28 },
  eyebrow: { color: 'rgba(255,255,255,0.82)', fontSize: 12, fontWeight: '700', letterSpacing: 2 },
  title: { color: '#fff', fontSize: 42, fontWeight: '900', marginTop: 8 },
  titleCompact: { fontSize: 34 },
  intro: { color: 'rgba(255,255,255,0.94)', fontSize: 17, marginTop: 6 },
  textShadow: {
    textShadowColor: 'rgba(0,0,0,0.55)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 4,
  },
  cards: { gap: 12 },
  cardsWide: { flexDirection: 'row', alignItems: 'stretch' },
  card: { borderRadius: 12 },
  cardWide: { flex: 1 },
  cardContent: { flexDirection: 'row', alignItems: 'flex-start', gap: 12, paddingVertical: 18 },
  iconWrap: { borderRadius: 12 },
  sectionIcon: { margin: 0 },
  cardCopy: { flex: 1, gap: 6 },
  cardTitle: { fontWeight: '700' },
  cardDescription: { lineHeight: 21 },
  sources: { borderTopWidth: StyleSheet.hairlineWidth, marginTop: 26, paddingTop: 18, gap: 6 },
  sourceLabel: { color: 'rgba(255,255,255,0.82)', fontSize: 11, letterSpacing: 1.5 },
  sourceText: { color: '#fff', fontSize: 13 },
  exploreButton: { alignSelf: 'flex-start', marginTop: 24, borderRadius: 8 },
  exploreButtonContent: { minHeight: 46, paddingHorizontal: 8 },
});
