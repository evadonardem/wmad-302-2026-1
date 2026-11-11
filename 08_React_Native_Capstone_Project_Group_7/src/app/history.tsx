import { ScrollView, StyleSheet, View } from 'react-native';
import { router } from 'expo-router';
import { Divider, List, Text, useTheme } from 'react-native-paper';
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
        Tap a city to jump back into that search.
      </Text>

      {entries.length > 0 && (
        <ScrollView
          style={[styles.list, { backgroundColor: theme.colors.surface }]}
          showsVerticalScrollIndicator={false}
        >
          {entries.map((entry, index) => (
            <View key={`${entry}-${index}`}>
              <List.Item
                title={entry}
                titleStyle={{ fontWeight: '600' }}
                left={(props) => <List.Icon {...props} icon="history" color={theme.colors.primary} />}
                right={(props) => <List.Icon {...props} icon="chevron-right" />}
                onPress={() => handlePick(entry)}
                accessibilityLabel={`Search ${entry} again`}
              />
              {index < entries.length - 1 && <Divider />}
            </View>
          ))}
        </ScrollView>
      )}

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
  list: {
    borderRadius: 16,
    overflow: 'hidden',
  },
  empty: {
    textAlign: 'center',
    marginTop: 24,
  },
});