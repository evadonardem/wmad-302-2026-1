import React from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { router } from 'expo-router';
import { List, Text, useTheme } from 'react-native-paper';
import { useSearchHistory } from '@/searchHistory';

export default function HistoryScreen() {
  const theme = useTheme();
  const { entries } = useSearchHistory();

  const handlePick = (city: string) => {
    // TODO 5.3  COMPLETED — Cross-Screen Handoff
    router.navigate({
      pathname: '/',
      params: { q: city },
    });
  };

  return (
    <View style={[styles.screen, { backgroundColor: theme.colors.background }]}>
      <Text variant="bodyMedium" style={[styles.intro, { color: theme.colors.onSurfaceVariant }]}>
        Tap a city to jump back into that search.
      </Text>

      {/* TODO 5.2  COMPLETED — History List Mapping */}
      {entries.map((city, index) => (
        <Pressable
          key={`${city}-${index}`}
          style={styles.itemRow}
          onPress={() => handlePick(city)}
        >
          <List.Item
            title={city}
            description="Previously searched"
            left={(props) => <List.Icon {...props} icon="map-marker" />}
            right={(props) => <List.Icon {...props} icon="arrow-right" />}
            style={styles.item}
          />
        </Pressable>
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
    gap: 4,
  },
  intro: {
    marginBottom: 16,
  },
  itemRow: {
    borderRadius: 8,
    overflow: 'hidden',
  },
  item: {
    paddingVertical: 4,
  },
  empty: {
    textAlign: 'center',
    marginTop: 32,
  },
});