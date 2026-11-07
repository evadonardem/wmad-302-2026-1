import { StyleSheet, View } from 'react-native';
import { router } from 'expo-router';
import { Card, Text, useTheme } from 'react-native-paper';
import { useSearchHistory } from '@/searchHistory';

export default function HistoryScreen() {
  const theme = useTheme();
  const { entries } = useSearchHistory();

  const handlePick = (city: string) => {
    router.navigate({ pathname: '/', params: { q: city } });
  };

  return (
    <View style={[styles.screen, { backgroundColor: theme.colors.background }]}>
      <Text variant="bodyMedium" style={[styles.intro, { color: theme.colors.onSurfaceVariant }]}>
        Your recently explored destinations
      </Text>

      {entries.map((entry) => (
        <Card key={entry} style={styles.card} mode="contained" onPress={() => handlePick(entry)}>
          <Card.Content style={styles.cardContent}>
            <View style={[styles.icon, { backgroundColor: theme.colors.primaryContainer }]}>
              <Text style={{ color: theme.colors.primary }}>⌖</Text>
            </View>
            <View style={styles.copy}>
              <Text variant="titleMedium" style={styles.entry}>{entry}</Text>
              <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant }}>Explore again</Text>
            </View>
            <Text style={{ color: theme.colors.onSurfaceVariant }}>›</Text>
          </Card.Content>
        </Card>
      ))}

      {entries.length === 0 && (
        <Text variant="bodyMedium" style={[styles.empty, { color: theme.colors.onSurfaceVariant }]}>
          No searches yet — run a search on the Search tab first.
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    width: '100%',
    maxWidth: 720,
    alignSelf: 'center',
    padding: 20,
    gap: 8,
  },
  intro: {
    marginBottom: 10,
    fontWeight: '600',
  },
  empty: {
    textAlign: 'center',
    marginTop: 24,
  },
  card: {
    borderRadius: 18,
    marginBottom: 10,
  },
  cardContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    paddingVertical: 6,
  },
  icon: {
    width: 42,
    height: 42,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  copy: {
    flex: 1,
  },
  entry: {
    fontWeight: '700',
  },
});
