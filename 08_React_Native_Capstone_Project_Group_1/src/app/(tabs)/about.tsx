import { ScrollView, StyleSheet, View } from 'react-native';
import { Link } from 'expo-router';
import { Divider, Text, useTheme } from 'react-native-paper';
import { LinearGradient } from 'expo-linear-gradient';

export default function AboutScreen() {
  const theme = useTheme();

  const gradientColors = theme.dark
    ? (['#071B11', '#102D1D', '#183D28'] as const)
    : (['#B8E0B0', '#D8ECD0', '#EFF7EC'] as const);

  return (
    <LinearGradient colors={gradientColors} style={styles.gradientContainer}>
      <ScrollView
        style={styles.screen}
        contentContainerStyle={styles.content}
      >
        <Text
          variant="headlineSmall"
          style={[styles.heading, { color: theme.colors.onBackground }]}
        >
          🇵🇭 Lakbay PH
        </Text>

        <Text
          variant="bodyMedium"
          style={{ color: theme.colors.onSurfaceVariant, lineHeight: 22 }}
        >
          A React Native (Expo) capstone demo that maps Philippine geography and surfaces
          tourist spot photography — built for the web, Android, and iOS from one codebase.
        </Text>

        <Divider style={styles.divider} />

        <Text variant="titleMedium" style={{ color: theme.colors.onBackground, fontWeight: '800' }}>
          How it works
        </Text>

        <Text
          variant="bodyMedium"
          style={{ color: theme.colors.onSurfaceVariant, lineHeight: 22 }}
        >
          Pick a Region, then a City/Municipality inside it, and Search. The app queries the
          PSGC registry for geography, then asks Pexels for matching tourist spot photos.
          Tap any photo card to open its detail view, or pull the list down to refresh it.
        </Text>

        <Divider style={styles.divider} />

        <Text variant="titleMedium" style={{ color: theme.colors.onBackground, fontWeight: '800' }}>
          Built with
        </Text>

        <Text
          variant="bodyMedium"
          style={{ color: theme.colors.onSurfaceVariant, lineHeight: 22 }}
        >
          Expo Router (tabs + modal routes) · React Native Paper (Material Design 3) ·
          Axios · expo-image · TypeScript
        </Text>

        <Divider style={styles.divider} />

        <Text variant="titleMedium" style={{ color: theme.colors.onBackground, fontWeight: '800' }}>
          Data sources
        </Text>

        <Text
          variant="bodyMedium"
          style={{ color: theme.colors.onSurfaceVariant, lineHeight: 22 }}
        >
          Philippine Standard Geographic Code (PSGC) API · Pexels Image API
        </Text>

        <Divider style={styles.divider} />

        <View style={styles.cta}>
          <Link href="/" style={styles.link} accessibilityRole="button" accessibilityLabel="Start exploring back to Search">
            <Text
              variant="titleMedium"
              style={[
                styles.linkText,
                { color: theme.dark ? '#A2E3B2' : '#176B45' },
              ]}
            >
              Start exploring →
            </Text>
          </Link>
        </View>
      </ScrollView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  gradientContainer: {
    flex: 1,
  },
  screen: {
    flex: 1,
  },
  content: {
    width: '100%',
    maxWidth: 720,
    alignSelf: 'center',
    padding: 24,
    gap: 10,
  },
  heading: {
    fontWeight: '900',
  },
  divider: {
    marginVertical: 14,
  },
  cta: {
    marginTop: 8,
    alignItems: 'center',
  },
  link: {
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  linkText: {
    fontWeight: '900',
    textAlign: 'center',
  },
});