import { StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import QuoteOfTheDay from '@/components/QuoteOfTheDay';
import { useTheme } from '@/theme';

export default function HomeScreen() {
  const theme = useTheme();

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <View style={styles.intro}>
        <View style={styles.eyebrow}>
          <Ionicons name="sparkles" size={14} color={theme.colors.accent} />
          <Text style={[styles.eyebrowText, { color: theme.colors.accent }]}>A little perspective</Text>
        </View>
        <Text style={[styles.title, { color: theme.colors.text }]}>Find your next thought.</Text>
        <Text style={[styles.subtitle, { color: theme.colors.textSecondary }]}>
          Take a moment, choose a feeling, and let a quote meet you there.
        </Text>
      </View>
      <QuoteOfTheDay />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
    gap: 20,
  },
  intro: {
    width: '100%',
    maxWidth: 500,
    gap: 7,
  },
  eyebrow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  eyebrowText: {
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 1.2,
    textTransform: 'uppercase',
  },
  title: {
    fontSize: 30,
    fontWeight: '800',
    letterSpacing: -0.8,
  },
  subtitle: {
    fontSize: 14,
    lineHeight: 21,
  },
});
