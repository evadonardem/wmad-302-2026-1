import { ScrollView, StyleSheet, View } from 'react-native';
import { Link } from 'expo-router';
import { Button, Divider, Text, useTheme } from 'react-native-paper';

export default function AboutScreen() {
  const theme = useTheme();

  return (
    <ScrollView
      style={[styles.screen, { backgroundColor: theme.colors.background }]}
      contentContainerStyle={styles.content}
    >
      <Text variant="titleLarge" style={[styles.heading, { color: theme.colors.primary }]}>
         TechCare
      </Text>
      <Text variant="bodyMedium" style={{ color: theme.colors.onSurfaceVariant }}>
        Your ultimate companion for discovering the beautiful tourist spots across the Philippines.
      </Text>

      <Divider style={styles.divider} />

      <Text variant="titleMedium" style={{ color: theme.colors.onBackground }}>
        How it works
      </Text>
      <Text variant="bodyMedium" style={{ color: theme.colors.onSurfaceVariant }}>
        Pick a Region, then a City/Municipality inside it, and Search. The app queries the PSGC
        registry for geography, then asks Pexels for matching tourist spot photos. Tap any photo
        to open it, then like, favorite, share, download, or open its location on the map. Swipe
        or use the arrows to browse more spots, tap the photographer's name to visit their
        profile, or pull the list down to refresh it.
      </Text>

      <Divider style={styles.divider} />

      <Text variant="titleMedium" style={{ color: theme.colors.onBackground }}>
        Built with
      </Text>
      <Text variant="bodyMedium" style={{ color: theme.colors.onSurfaceVariant }}>
        Expo Router (tabs + modal routes) · React Native Paper (Material Design 3) · Axios ·
        expo-image · TypeScript
      </Text>

      <Divider style={styles.divider} />

      <Text variant="titleMedium" style={{ color: theme.colors.onBackground }}>
        Data sources
      </Text>
      <Text variant="bodyMedium" style={{ color: theme.colors.onSurfaceVariant }}>
        Philippine Standard Geographic Code (PSGC) API · Pexels Image API
      </Text>

      <Divider style={styles.divider} />

      {/* Declarative navigation back to the Search tab */}
      <View style={styles.cta}>
        <Link href="/" asChild>
          <Button mode="contained" icon="compass">
            Start exploring →
          </Button>
        </Link>
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
    fontWeight: '800',
  },
  divider: {
    marginVertical: 12,
  },
  cta: {
    marginTop: 24,
    alignItems: 'center',
  },
});