import { Platform, ScrollView, StyleSheet, View } from 'react-native';
import { router } from 'expo-router';
import { List, Surface, Text, useTheme } from 'react-native-paper';
import { useSearchHistory } from '@/searchHistory';

const SERIF = Platform.select({ ios: 'Georgia', android: 'serif', default: 'Georgia, "Times New Roman", serif' });

export default function HistoryScreen() {
  const theme = useTheme();
  const { entries } = useSearchHistory();

  const handlePick = (city: string) => {
    // TODO 5.3 [Cross-Screen Handoff]: Jump back to the Search tab carrying the chosen city as a
    // route param so the dashboard re-runs the search (see TODO 5.4 over there):
    //   router.navigate({ pathname: '/', params: { q: city } })
    // Use router.navigate (not push) so this history screen is not left sitting underneath
    // the returned stack entry.
    router.navigate({ pathname: '/', params: { q: city } });
  };

  return (
    <ScrollView
      style={[styles.screen, { backgroundColor: theme.colors.background }]}
      contentContainerStyle={styles.content}
    >
      <Text variant="titleLarge" style={[styles.title, { color: theme.colors.onBackground }]}>
        Where to next?
      </Text>
      <Text variant="bodyMedium" style={[styles.intro, { color: theme.colors.onSurfaceVariant }]}>
        Tap a city to jump back into that search.
      </Text>

      {/* TODO 5.2 [History List Mapping]: Map through 'entries' (most recent first) and render a
          row per city — Paper <Button>, <List.Item>, or a plain Pressable all work. Each row's
          onPress should call handlePick(entry) with that city. Give each row a unique key. */}
      {entries.map((entry) => (
        <Surface
          key={entry}
          style={[styles.row, { backgroundColor: theme.colors.surface, borderLeftColor: theme.colors.secondary }]}
          elevation={2}
        >
          <List.Item
            title={entry}
            titleStyle={{ fontWeight: '700', color: theme.colors.onSurface }}
            left={(props) => <List.Icon {...props} icon="map-marker" color={theme.colors.primary} />}
            right={(props) => <List.Icon {...props} icon="chevron-right" color={theme.colors.onSurfaceVariant} />}
            onPress={() => handlePick(entry)}
          />
        </Surface>
      ))}

      {entries.length === 0 && (
        <View style={[styles.emptyBox, { borderColor: theme.colors.outlineVariant }]}>
          <Text style={styles.emptyIcon}>🧭</Text>
          <Text variant="bodyMedium" style={[styles.empty, { color: theme.colors.onSurfaceVariant }]}>
            No searches yet — run a search on the Search tab first.
          </Text>
        </View>
      )}
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
  title: {
    fontFamily: SERIF,
    fontWeight: '700',
  },
  intro: {
    marginBottom: 8,
  },
  row: {
    borderRadius: 16,
    borderLeftWidth: 4,
    overflow: 'hidden',
  },
  emptyBox: {
    alignItems: 'center',
    gap: 8,
    marginTop: 16,
    paddingVertical: 32,
    paddingHorizontal: 16,
    borderRadius: 24,
    borderWidth: 1.5,
    borderStyle: 'dashed',
  },
  emptyIcon: {
    fontSize: 40,
  },
  empty: {
    textAlign: 'center',
  },
});