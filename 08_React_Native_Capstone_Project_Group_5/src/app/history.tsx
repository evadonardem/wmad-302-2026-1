import { StyleSheet, View } from 'react-native';
import { router } from 'expo-router';
import { Button, Text, useTheme } from 'react-native-paper';
import { useSearchHistory } from '@/searchHistory';

export default function HistoryScreen() {
  const theme = useTheme();
  const { entries } = useSearchHistory();

  const handlePick = (city: string) => {
    // TODO 5.3 [Cross-Screen Handoff]: Jump back to the Search tab carrying the chosen city as a
    // route param so the dashboard re-runs the search (see TODO 5.4 over there):
    //   router.navigate({ pathname: '/', params: { q: city } })
    // Use router.navigate (not push) so this history screen is not left sitting underneath
    // the returned stack entry.
    // [Your code here]
  };

  return (
    <View style={[styles.screen, { backgroundColor: theme.colors.background }]}>
      <Text variant="bodyMedium" style={[styles.intro, { color: theme.colors.onSurfaceVariant }]}>
        Tap a city to jump back into that search.
      </Text>

      {/* TODO 5.2 [History List Mapping]: Map through 'entries' (most recent first) and render a
          row per city — Paper <Button>, <List.Item>, or a plain Pressable all work. Each row's
          onPress should call handlePick(entry) with that city. Give each row a unique key. */}
      {/* [Your code here] */}

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
    marginBottom: 8,
  },
  empty: {
    textAlign: 'center',
    marginTop: 24,
  },
});
