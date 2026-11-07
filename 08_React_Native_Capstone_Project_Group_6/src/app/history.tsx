import { ScrollView, StyleSheet, View } from 'react-native';
import { router } from 'expo-router';
import { Button, Card, IconButton, List, Text, useTheme } from 'react-native-paper';
import { useSearchHistory } from '@/searchHistory';

export default function HistoryScreen() {
  const theme = useTheme();
  const { entries } = useSearchHistory();
  const isEmpty = entries.length === 0;

  const handlePick = (city: string) => {
    // TODO 5.3 [Cross-Screen Handoff]: navigate (not push) so this screen isn't left underneath
    router.navigate({ pathname: '/', params: { q: city } });
  };

  return (
    <View style={[styles.screen, { backgroundColor: theme.colors.background }]}>
      {isEmpty ? (
        <View style={styles.emptyState}>
          <Card
            mode="contained"
            style={[styles.emptyCard, { backgroundColor: theme.colors.surface }]}
          >
            <Card.Content style={styles.emptyContent}>
              <View
                style={[
                  styles.historyIconWrap,
                  { backgroundColor: theme.colors.secondaryContainer },
                ]}
              >
                <IconButton
                  icon="history"
                  size={34}
                  iconColor={theme.colors.onSecondaryContainer}
                  style={styles.historyIcon}
                />
              </View>
              <Text
                variant="titleLarge"
                style={[styles.emptyTitle, { color: theme.colors.onSurface }]}
              >
                No recent searches
              </Text>
              <Text
                variant="bodyMedium"
                style={[styles.emptyDescription, { color: theme.colors.onSurfaceVariant }]}
              >
                Search for a Philippine city or municipality and it will appear here for quick
                access.
              </Text>
              <Button
                mode="contained"
                icon="magnify"
                onPress={() => router.replace('/')}
                style={styles.searchButton}
                contentStyle={styles.searchButtonContent}
              >
                Start searching
              </Button>
            </Card.Content>
          </Card>
        </View>
      ) : (
        <>
          <Text variant="bodyMedium" style={[styles.intro, { color: theme.colors.onSurfaceVariant }]}>
            Tap a city to jump back into that search.
          </Text>
          {/* TODO 5.2 [History List Mapping]: entries are already stored most recent first */}
          <ScrollView contentContainerStyle={styles.listContent}>
            {entries.map((entry) => (
              <List.Item
                key={entry}
                title={entry}
                titleStyle={{ color: theme.colors.onSurface, fontWeight: '600' }}
                description="Search tourist spots"
                descriptionStyle={{ color: theme.colors.onSurfaceVariant }}
                left={(props) => <List.Icon {...props} icon="map-marker-outline" />}
                right={(props) => <List.Icon {...props} icon="chevron-right" />}
                onPress={() => handlePick(entry)}
                accessibilityLabel={`Search ${entry} again`}
                style={[
                  styles.listItem,
                  { backgroundColor: theme.colors.surface, borderColor: theme.colors.outlineVariant },
                ]}
              />
            ))}
          </ScrollView>
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    width: '100%',
    paddingHorizontal: 20,
    paddingTop: 16,
  },
  emptyState: { flex: 1, justifyContent: 'center', width: '100%', maxWidth: 520, alignSelf: 'center' },
  emptyCard: { borderRadius: 18 },
  emptyContent: { alignItems: 'center', paddingHorizontal: 24, paddingVertical: 36 },
  historyIconWrap: {
    width: 76,
    height: 76,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 38,
    marginBottom: 18,
  },
  historyIcon: { margin: 0 },
  emptyTitle: { fontWeight: '700', textAlign: 'center' },
  emptyDescription: { textAlign: 'center', lineHeight: 22, marginTop: 8, maxWidth: 350 },
  searchButton: { marginTop: 22, borderRadius: 8 },
  searchButtonContent: { minHeight: 44, paddingHorizontal: 8 },
  intro: { marginBottom: 12 },
  listContent: { gap: 8, paddingBottom: 20 },
  listItem: { borderRadius: 12, borderWidth: StyleSheet.hairlineWidth },
});
