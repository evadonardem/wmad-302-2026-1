import { ScrollView, StyleSheet, View } from 'react-native';
import { Link } from 'expo-router';
import { Button, Card, Divider, Text, useTheme } from 'react-native-paper';

export default function AboutScreen() {
  const theme = useTheme();

  return (
    <ScrollView
      style={[styles.screen, { backgroundColor: theme.colors.background }]}
      contentContainerStyle={styles.content}
    >
      <View style={[styles.hero, { backgroundColor: theme.colors.primaryContainer }]}>
        <Text variant="labelLarge" style={[styles.eyebrow, { color: theme.colors.secondary }]}>ABOUT THE JOURNEY</Text>
        <Text variant="displaySmall" style={[styles.heading, { color: theme.colors.onPrimaryContainer }]}>
          See the Philippines{'\n'}in a new light.
        </Text>
        <Text variant="bodyMedium" style={{ color: theme.colors.onPrimaryContainer }}>
          Lakbay means journey. We make it easier to find the places worth taking one for.
        </Text>
      </View>

      <Card style={styles.infoCard} mode="contained">
        <Card.Content>
          <Text variant="titleMedium" style={styles.cardTitle}>How it works</Text>
          <Text variant="bodyMedium" style={{ color: theme.colors.onSurfaceVariant }}>
            Pick a region, choose a city or municipality, and search. We pair Philippine
            geography with beautiful photography to help you plan your next escape.
          </Text>
        </Card.Content>
      </Card>

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

      <View style={styles.cta}>
        <Button mode="contained" icon="compass-outline" onPress={() => {}} contentStyle={styles.ctaButton}>
          <Link href="/" style={{ color: theme.colors.onPrimary }}>Start exploring</Link>
        </Button>
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
    gap: 10,
  },
  hero: {
    borderRadius: 26,
    padding: 24,
    gap: 12,
    marginBottom: 8,
  },
  eyebrow: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 1.6,
  },
  heading: {
    fontWeight: '800',
    lineHeight: 40,
  },
  infoCard: {
    borderRadius: 18,
  },
  cardTitle: {
    fontWeight: '800',
    marginBottom: 8,
  },
  divider: {
    marginVertical: 12,
  },
  cta: {
    marginTop: 4,
    alignItems: 'center',
  },
  ctaButton: {
    paddingHorizontal: 10,
  },
});
