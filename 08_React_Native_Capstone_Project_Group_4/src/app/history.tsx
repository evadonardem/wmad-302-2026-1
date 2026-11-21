import { useEffect, useState } from 'react';
import { FlatList, Platform, StyleSheet, View } from 'react-native';
import { Appbar, List, Text, useTheme } from 'react-native-paper';
import { router } from 'expo-router';
import { useSearchHistory } from '@/searchHistory';
import { useThemeMode } from '@/themeMode';

const STORAGE_KEY = 'LAKBAY_PH_SEARCH_HISTORY';

export default function HistoryScreen() {
  const theme = useTheme();
  const { isDarkMode } = useThemeMode();
  const { history: contextHistory, clearHistory: clearContextHistory } = useSearchHistory();
  const [items, setItems] = useState<string[]>([]);

  // Basahin agad mula sa localStorage
  useEffect(() => {
    try {
      if (Platform.OS === 'web' && typeof window !== 'undefined') {
        const saved = localStorage.getItem(STORAGE_KEY);
        if (saved) {
          setItems(JSON.parse(saved));
          return;
        }
      }
    } catch (e) {
      console.error(e);
    }
    setItems(contextHistory);
  }, [contextHistory]);

  const handleSelectHistory = (query: string) => {
    router.replace({
      pathname: '/(tabs)',
      params: { q: query },
    });
  };

  const handleClear = () => {
    clearContextHistory();
    setItems([]);
    if (Platform.OS === 'web' && typeof window !== 'undefined') {
      localStorage.removeItem(STORAGE_KEY);
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: isDarkMode ? '#0b1329' : '#f8fafc' }]}>
      <Appbar.Header style={{ backgroundColor: theme.colors.surface, elevation: 2 }}>
        <Appbar.BackAction onPress={() => router.back()} />
        <Appbar.Content title="Recent Searches" titleStyle={{ fontWeight: '800' }} />
        {items.length > 0 && (
          <Appbar.Action icon="delete-outline" onPress={handleClear} />
        )}
      </Appbar.Header>

      <View style={styles.content}>
        {items.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Text style={{ color: theme.colors.onSurfaceVariant, fontSize: 16 }}>
              No recent searches yet.
            </Text>
          </View>
        ) : (
          <FlatList
            data={items}
            keyExtractor={(item, index) => `${item}-${index}`}
            renderItem={({ item }) => (
              <List.Item
                title={item}
                titleStyle={{ fontWeight: '600' }}
                left={(props) => <List.Icon {...props} icon="history" />}
                right={(props) => <List.Icon {...props} icon="chevron-right" />}
                onPress={() => handleSelectHistory(item)}
                style={[
                  styles.listItem,
                  { backgroundColor: isDarkMode ? 'rgba(30, 41, 59, 0.7)' : theme.colors.surface },
                ]}
              />
            )}
          />
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 12,
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  listItem: {
    borderRadius: 14,
    marginVertical: 6,
    paddingHorizontal: 8,
  },
});