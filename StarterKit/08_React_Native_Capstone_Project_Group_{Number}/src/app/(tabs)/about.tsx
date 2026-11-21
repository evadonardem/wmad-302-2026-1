import { ScrollView, StyleSheet, View } from 'react-native';
import { Link } from 'expo-router';
import { Divider, Text, useTheme } from 'react-native-paper';

export default function AboutScreen() {
  const theme = useTheme();

  return (
    <ScrollView
      style={[styles.screen, { backgroundColor: theme.colors.background }]}
      contentContainerStyle={styles.content}
    >
      <Text variant="titleLarge" style={[styles.heading, { color: theme.colors.onBackground }]}>
        🇵🇭 Lakbay PH
      </Text>
      <Text variant="bodyMedium" style={{ color: theme.colors.onSurfaceVariant }}>
        A React Native (Expo) capstone demo that maps Philippine geography and surfaces
        tourist spot photography — built for the web, Android, and iOS from one codebase.
      </Text>

      <Divider style={styles.divider} />

      <Text variant="titleMedium" style={{ color: theme.colors.onBackground }}>
        How it works
      </Text>
      <Text variant="bodyMedium" style={{ color: theme.colors.onSurfaceVariant }}>
        Pick a Region, then a City/Municipality inside it, and Search. The app queries the
        PSGC registry for geography, then asks Pexels for matching tourist spot photos.
        Tap any photo card to open its detail view, or pull the list down to refresh it.
      </Text>

      <Divider style={styles.divider} />

      <Text variant="titleMedium" style={{ color: theme.colors.onBackground }}>
        Built with
      </Text>
      <Text variant="bodyMedium" style={{ color: theme.colors.onSurfaceVariant }}>
        Expo Router (tabs + modal routes) · React Native Paper (Material Design 3) ·
        Axios · expo-image · TypeScript
      </Text>

      <Divider style={styles.divider} />

      <Text variant="titleMedium" style={{ color: theme.colors.onBackground }}>
        Data sources
      </Text>
      <Text variant="bodyMedium" style={{ color: theme.colors.onSurfaceVariant }}>
        Philippine Standard Geographic Code (PSGC) API · Pexels Image API
      </Text>

      <Divider style={styles.divider} />

      {/* TODO 4.9 [Declarative Navigation]: Render a declarative <Link href="/"> below that jumps
          back to the Search tab — the JSX-based counterpart to the imperative router.push calls
          used elsewhere. Style it like a call-to-action (e.g. "Start exploring →"). */}
      <View style={styles.cta}>
        {/* [Your <Link> here] */}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },
  content: {
    width: '100%',
    maxWidth: 720,
    alignSelf: 'center',
    padding: 20,
    gap: 8,
  },
  heading: {
    fontWeight: 'bold',
  },
  divider: {
    marginVertical: 12,
  },
  cta: {
    marginTop: 4,
    alignItems: 'center',
  },
});
