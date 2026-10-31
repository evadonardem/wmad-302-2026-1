import { Platform, ScrollView, StyleSheet, View, useWindowDimensions } from 'react-native';
import { Link } from 'expo-router';
import { Divider, Surface, Text, useTheme } from 'react-native-paper';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const SERIF = Platform.select({ ios: 'Georgia', android: 'serif', default: 'Georgia, "Times New Roman", serif' });

// How far the banner reaches down behind the first card (change this number to move the waves up or down)
const WAVE_EXTRA = 70;

// Wavy bottom edge of the banner: a gold wave, a teal wave and a page-coloured wave on top, each one made of
// several rounded humps (same waves as the Search tab). 'height' is how tall the gold crest is.
function BannerWaves({ width, background, height }: { width: number; background: string; height: number }) {
  const W = Math.max(width, 360);
  const amp = W * 0.07;
  const humpW = W * 0.5;
  const layers = [
    { color: 'rgba(244,182,63,0.7)', crest: height, phase: 0, bumps: [0, -10, 6, -6, 8] },
    { color: 'rgba(43,179,168,0.8)', crest: height - 26, phase: W * 0.12, bumps: [6, -4, 10, -8, 2] },
    { color: background, crest: height - 54, phase: W * 0.22, bumps: [-4, 8, -6, 6, -2] },
  ];

  return (
    <View pointerEvents="none" style={[StyleSheet.absoluteFill, { zIndex: 1 }]}>
      {layers.map((layer) => {
        const lift = layer.crest - amp;
        return (
          <View key={layer.color} style={StyleSheet.absoluteFill}>
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

// Small round number / icon badge used in front of each section
function Badge({ label, color, textColor }: { label: string; color: string; textColor: string }) {
  return (
    <View style={[styles.badge, { backgroundColor: color }]}>
      <Text style={{ color: textColor, fontWeight: '800', fontSize: 16 }}>{label}</Text>
    </View>
  );
}

export default function AboutScreen() {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const isMd = width >= 768;

  const builtWith = ['Expo Router', 'React Native Paper', 'Axios', 'expo-image', 'TypeScript'];
  const sources = [
    { icon: '🗺️', name: 'PSGC API', detail: 'Philippine Standard Geographic Code' },
    { icon: '📷', name: 'Pexels API', detail: 'Image API' },
  ];

  return (
    <ScrollView
      style={[styles.screen, { backgroundColor: theme.colors.background }]}
      contentContainerStyle={styles.scrollContent}
    >
      {/* Banner with the website name */}
      <View style={[styles.banner, { paddingTop: insets.top + 36, paddingBottom: 96 + WAVE_EXTRA }]}>
        <View style={styles.glowGold} />
        <View style={styles.glowTeal} />
        <View style={styles.flagPill}>
          <Text style={styles.flagText}>🇵🇭  ABOUT THE APP</Text>
        </View>
        <Text numberOfLines={1} adjustsFontSizeToFit style={[styles.brand, { fontSize: isMd ? 64 : 42 }]}>
          PH <Text style={styles.brandGold}>NAVYRA</Text>
        </Text>
        <View style={styles.dividerRow}>
          <View style={[styles.dividerLine, { backgroundColor: theme.colors.secondary }]} />
          <View style={[styles.diamond, { backgroundColor: theme.colors.secondary }]} />
          <View style={[styles.dividerLine, { backgroundColor: theme.colors.secondary }]} />
        </View>
        <Text style={styles.caption}>Nature, Attractions, Visuals</Text>
        <Text style={[styles.caption, styles.captionGold]}>Your Regional Adventure</Text>
        <BannerWaves width={width} background={theme.colors.background} height={WAVE_EXTRA + 40} />
      </View>

      <View style={styles.content}>
        <Surface
          style={[styles.card, { backgroundColor: theme.colors.surface, borderTopColor: theme.colors.secondary }]}
          elevation={3}
        >
          <Text variant="titleLarge" style={[styles.heading, { color: theme.colors.onBackground }]}>
            PH NAVYRA
          </Text>
          <Text variant="bodyMedium" style={[styles.body, { color: theme.colors.onSurfaceVariant }]}>
            A React Native (Expo) capstone demo that maps Philippine geography and surfaces
            tourist spot photography — built for the web, Android, and iOS from one codebase.
          </Text>

          {/* Three quick facts */}
          <View style={styles.statsRow}>
            {[
              { value: '3', label: 'Island groups' },
              { value: '3', label: 'Platforms' },
              { value: '1', label: 'Codebase' },
            ].map((stat) => (
              <View key={stat.label} style={[styles.stat, { backgroundColor: theme.colors.primaryContainer }]}>
                <Text style={[styles.statValue, { color: theme.colors.primary }]}>{stat.value}</Text>
                <Text style={[styles.statLabel, { color: theme.colors.onPrimaryContainer }]}>{stat.label}</Text>
              </View>
            ))}
          </View>

          <Divider style={styles.divider} />

          <View style={styles.sectionHead}>
            <Badge label="✈" color={theme.colors.primary} textColor={theme.colors.onPrimary} />
            <Text variant="titleMedium" style={[styles.sectionTitle, { color: theme.colors.primary }]}>
              How it works
            </Text>
          </View>
          <Text variant="bodyMedium" style={[styles.body, { color: theme.colors.onSurfaceVariant }]}>
            Pick a Region, then a City/Municipality inside it, and Search. The app queries the
            PSGC registry for geography, then asks Pexels for matching tourist spot photos.
            Tap any photo card to open its detail view, or pull the list down to refresh it.
          </Text>

          {/* The same story as three small steps */}
          <View style={styles.steps}>
            {[
              { n: '1', text: 'Pick a region and a city' },
              { n: '2', text: 'Search Philippine photos' },
              { n: '3', text: 'Tap a photo to open it' },
            ].map((step) => (
              <View key={step.n} style={[styles.step, { borderColor: theme.colors.outlineVariant }]}>
                <Badge label={step.n} color={theme.colors.secondary} textColor={theme.colors.onSecondary} />
                <Text style={[styles.stepText, { color: theme.colors.onSurface }]}>{step.text}</Text>
              </View>
            ))}
          </View>

          <Divider style={styles.divider} />

          <View style={styles.sectionHead}>
            <Badge label="⚙" color={theme.colors.primary} textColor={theme.colors.onPrimary} />
            <Text variant="titleMedium" style={[styles.sectionTitle, { color: theme.colors.primary }]}>
              Built with
            </Text>
          </View>
          <Text variant="bodyMedium" style={[styles.body, { color: theme.colors.onSurfaceVariant }]}>
            Expo Router (tabs + modal routes) · React Native Paper (Material Design 3) ·
            Axios · expo-image · TypeScript
          </Text>
          <View style={styles.chips}>
            {builtWith.map((item) => (
              <View key={item} style={[styles.chip, { backgroundColor: theme.colors.primaryContainer }]}>
                <Text style={{ color: theme.colors.onPrimaryContainer, fontWeight: '700', fontSize: 12 }}>{item}</Text>
              </View>
            ))}
          </View>

          <Divider style={styles.divider} />

          <View style={styles.sectionHead}>
            <Badge label="◎" color={theme.colors.primary} textColor={theme.colors.onPrimary} />
            <Text variant="titleMedium" style={[styles.sectionTitle, { color: theme.colors.primary }]}>
              Data sources
            </Text>
          </View>
          <Text variant="bodyMedium" style={[styles.body, { color: theme.colors.onSurfaceVariant }]}>
            Philippine Standard Geographic Code (PSGC) API · Pexels Image API
          </Text>
          <View style={styles.sourceRow}>
            {sources.map((source) => (
              <View
                key={source.name}
                style={[styles.source, { borderColor: theme.colors.secondary, backgroundColor: theme.colors.surfaceVariant }]}
              >
                <Text style={styles.sourceIcon}>{source.icon}</Text>
                <Text style={[styles.sourceName, { color: theme.colors.onSurface }]}>{source.name}</Text>
                <Text style={[styles.sourceDetail, { color: theme.colors.onSurfaceVariant }]}>{source.detail}</Text>
              </View>
            ))}
          </View>

          <Divider style={styles.divider} />

          {/* TODO 4.9 [Declarative Navigation]: Render a declarative <Link href="/"> below that jumps
              back to the Search tab — the JSX-based counterpart to the imperative router.push calls
              used elsewhere. Style it like a call-to-action (e.g. "Start exploring →"). */}
          <View style={styles.cta}>
            <View style={[styles.ctaButton, { backgroundColor: theme.colors.secondary }]}>
              <Link
                href="/"
                style={{
                  color: theme.colors.onSecondary,
                  fontSize: 18,
                  fontWeight: '700',
                }}
              >
                Start exploring →
              </Link>
            </View>
          </View>
        </Surface>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 32,
  },
  banner: {
    width: '100%',
    alignItems: 'center',
    paddingHorizontal: 16,
    overflow: 'hidden',
    backgroundColor: '#0B5F5B',
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
  glowTeal: {
    position: 'absolute',
    top: 40,
    left: -120,
    width: 260,
    height: 260,
    borderRadius: 130,
    backgroundColor: 'rgba(43,179,168,0.28)',
  },
  flagPill: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: 'rgba(255,217,138,0.7)',
    backgroundColor: 'rgba(255,255,255,0.1)',
    marginBottom: 14,
  },
  flagText: {
    color: '#FFD98A',
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 2.5,
  },
  brand: {
    fontFamily: SERIF,
    fontWeight: '800',
    letterSpacing: 4,
    color: '#FFFFFF',
    textShadowColor: 'rgba(0,0,0,0.55)',
    textShadowOffset: { width: 0, height: 3 },
    textShadowRadius: 12,
  },
  brandGold: {
    color: '#FFD98A',
  },
  dividerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginVertical: 12,
  },
  dividerLine: {
    height: 2,
    width: 64,
    borderRadius: 1,
  },
  diamond: {
    width: 9,
    height: 9,
    transform: [{ rotate: '45deg' }],
  },
  caption: {
    color: '#FFFFFF',
    fontWeight: '600',
    fontSize: 13,
    letterSpacing: 2.5,
    textTransform: 'uppercase',
    textAlign: 'center',
    lineHeight: 22,
  },
  captionGold: {
    color: '#FFD98A',
  },
  content: {
    width: '100%',
    maxWidth: 720,
    alignSelf: 'center',
    paddingHorizontal: 16,
    marginTop: -(WAVE_EXTRA + 20),
    zIndex: 2,
  },
  card: {
    borderRadius: 24,
    borderTopWidth: 4,
    padding: 22,
    gap: 10,
  },
  heading: {
    fontFamily: SERIF,
    fontWeight: 'bold',
  },
  body: {
    lineHeight: 22,
  },
  statsRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 6,
  },
  stat: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 12,
    borderRadius: 16,
  },
  statValue: {
    fontFamily: SERIF,
    fontWeight: '800',
    fontSize: 26,
  },
  statLabel: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  sectionHead: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  badge: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sectionTitle: {
    fontFamily: SERIF,
    fontWeight: '700',
  },
  divider: {
    marginVertical: 12,
  },
  steps: {
    gap: 8,
    marginTop: 4,
  },
  step: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 10,
    borderRadius: 16,
    borderWidth: 1,
  },
  stepText: {
    flex: 1,
    fontWeight: '600',
  },
  chips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 4,
  },
  chip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
  },
  sourceRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 4,
  },
  source: {
    flex: 1,
    alignItems: 'center',
    padding: 14,
    borderRadius: 18,
    borderBottomWidth: 3,
    gap: 2,
  },
  sourceIcon: {
    fontSize: 28,
  },
  sourceName: {
    fontWeight: '800',
  },
  sourceDetail: {
    fontSize: 11,
    textAlign: 'center',
  },
  cta: {
    marginTop: 4,
    alignItems: 'center',
  },
  ctaButton: {
    paddingHorizontal: 28,
    paddingVertical: 12,
    borderRadius: 999,
  },
});