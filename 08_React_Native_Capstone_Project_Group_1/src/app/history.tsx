import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  FlatList,
  Platform,
  Pressable,
  StyleSheet,
  View,
} from 'react-native';
import { Stack, router, useFocusEffect } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import {
  Button,
  Checkbox,
  Icon,
  IconButton,
  Text,
  useTheme,
} from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useThemeMode } from '@/themeMode';

const STORAGE_FULL_HISTORY_KEY = 'LAKBAY_FULL_BROWSING_HISTORY_V3';

export interface HistoryRecord {
  id: string;
  title: string;
  type: 'search' | 'tab_visit' | 'destination_view';
  urlOrQuery: string;
  timestamp: number;
}

export default function HistoryScreen() {
  const theme = useTheme();
  const { isDarkMode } = useThemeMode();

  // BROWSING HISTORY STATE ONLY
  const [historyItems, setHistoryItems] = useState<HistoryRecord[]>([]);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  // HELPER TO FORMAT DATES: "Today - Thursday, October 29, 2026"
  const formatDateHeader = (timestamp: number): string => {
    const itemDate = new Date(timestamp);
    const now = new Date();

    const isToday =
      itemDate.getDate() === now.getDate() &&
      itemDate.getMonth() === now.getMonth() &&
      itemDate.getFullYear() === now.getFullYear();

    const yesterday = new Date(now);
    yesterday.setDate(now.getDate() - 1);
    const isYesterday =
      itemDate.getDate() === yesterday.getDate() &&
      itemDate.getMonth() === yesterday.getMonth() &&
      itemDate.getFullYear() === yesterday.getFullYear();

    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const months = [
      'January', 'February', 'March', 'April', 'May', 'June',
      'July', 'August', 'September', 'October', 'November', 'December'
    ];

    const dayName = days[itemDate.getDay()];
    const monthName = months[itemDate.getMonth()];
    const dayNum = itemDate.getDate();
    const year = itemDate.getFullYear();

    const fullDateStr = `${dayName}, ${monthName} ${dayNum}, ${year}`;

    if (isToday) return `Today - ${fullDateStr}`;
    if (isYesterday) return `Yesterday - ${fullDateStr}`;
    return fullDateStr;
  };

  const formatTimeStr = (timestamp: number): string => {
    const d = new Date(timestamp);
    let hours = d.getHours();
    const minutes = d.getMinutes();
    const ampm = hours >= 12 ? 'PM' : 'AM';
    hours = hours % 12 || 12;
    const minStr = minutes < 10 ? `0${minutes}` : minutes;
    return `${hours}:${minStr} ${ampm}`;
  };

  // LOAD FULL BROWSING HISTORY INDEPENDENTLY
  const loadFullHistory = useCallback(async () => {
    try {
      let storedJson: string | null = null;
      if (Platform.OS === 'web' && typeof window !== 'undefined' && window.localStorage) {
        storedJson = window.localStorage.getItem(STORAGE_FULL_HISTORY_KEY);
      } else {
        storedJson = await AsyncStorage.getItem(STORAGE_FULL_HISTORY_KEY);
      }

      if (storedJson) {
        const parsed: HistoryRecord[] = JSON.parse(storedJson);
        if (Array.isArray(parsed) && parsed.length > 0) {
          setHistoryItems(parsed.sort((a, b) => b.timestamp - a.timestamp));
          return;
        }
      }

      // Default History Entries
      const defaultHistory: HistoryRecord[] = [
        {
          id: 'h-1',
          title: 'la trinidad benguet',
          type: 'search',
          urlOrQuery: 'la trinidad benguet',
          timestamp: new Date(2026, 9, 29, 12, 5).getTime(),
        },
        {
          id: 'h-2',
          title: 'Explore Destinations Tab Opened',
          type: 'tab_visit',
          urlOrQuery: '/(tabs)/explore',
          timestamp: new Date(2026, 9, 29, 11, 40).getTime(),
        },
        {
          id: 'h-3',
          title: 'baguio city',
          type: 'search',
          urlOrQuery: 'baguio city',
          timestamp: new Date(2026, 9, 28, 19, 57).getTime(),
        },
        {
          id: 'h-4',
          title: 'Saved Collections Tab Opened',
          type: 'tab_visit',
          urlOrQuery: '/(tabs)/saved',
          timestamp: new Date(2026, 9, 28, 18, 20).getTime(),
        },
      ];
      setHistoryItems(defaultHistory);
      await AsyncStorage.setItem(STORAGE_FULL_HISTORY_KEY, JSON.stringify(defaultHistory));
    } catch (e) {}
  }, []);

  useFocusEffect(
    useCallback(() => {
      void loadFullHistory();
    }, [loadFullHistory])
  );

  const saveUpdatedHistory = async (items: HistoryRecord[]) => {
    setHistoryItems(items);
    try {
      const jsonStr = JSON.stringify(items);
      if (Platform.OS === 'web' && typeof window !== 'undefined' && window.localStorage) {
        window.localStorage.setItem(STORAGE_FULL_HISTORY_KEY, jsonStr);
        window.dispatchEvent(new Event('storage'));
      }
      await AsyncStorage.setItem(STORAGE_FULL_HISTORY_KEY, jsonStr);
    } catch (e) {}
  };

  const groupedHistory = useMemo(() => {
    const groups: { [key: string]: HistoryRecord[] } = {};

    historyItems.forEach((item) => {
      const headerKey = formatDateHeader(item.timestamp);
      if (!groups[headerKey]) {
        groups[headerKey] = [];
      }
      groups[headerKey].push(item);
    });

    return Object.keys(groups).map((key) => ({
      dateLabel: key,
      data: groups[key],
    }));
  }, [historyItems]);

  const handleBack = () => {
    if (router.canGoBack()) {
      router.back();
    } else {
      router.replace('/(tabs)');
    }
  };

  const toggleSelectItem = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const handleDeleteSelected = async () => {
    const remaining = historyItems.filter((item) => !selectedIds.includes(item.id));
    setSelectedIds([]);
    await saveUpdatedHistory(remaining);
  };

  const handleClearAllHistory = async () => {
    setSelectedIds([]);
    await saveUpdatedHistory([]);
  };

  const handleOpenItem = (record: HistoryRecord) => {
    if (record.type === 'search') {
      router.replace({ pathname: '/(tabs)', params: { q: record.urlOrQuery } });
    } else if (record.type === 'tab_visit') {
      router.push(record.urlOrQuery as any);
    }
  };

  const gradientColors: readonly [string, string, string] = isDarkMode
    ? ['#03180E', '#082E1C', '#01120B']
    : ['#0B3C26', '#1A5336', '#08291A'];

  const cardBgColor = isDarkMode ? 'rgba(15, 45, 30, 0.82)' : 'rgba(10, 38, 24, 0.78)';
  const textColor = '#F0F9F3';
  const subTextColor = '#A3CBB1';

  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />

      <LinearGradient colors={gradientColors} style={styles.gradientContainer}>
        <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
          {/* HEADER BAR */}
          <View style={styles.chromeHeaderBar}>
            {selectedIds.length > 0 ? (
              <View style={styles.selectionBar}>
                <IconButton icon="close" iconColor={textColor} size={20} onPress={() => setSelectedIds([])} />
                <Text style={[styles.selectedCountText, { color: textColor }]}>
                  {selectedIds.length} selected
                </Text>

                <View style={styles.actionButtonsRow}>
                  <Button
                    mode="outlined"
                    textColor="#FF8A80"
                    style={[styles.actionBtn, { borderColor: '#FF8A80' }]}
                    labelStyle={{ fontSize: 12, marginHorizontal: 8 }}
                    onPress={() => void handleDeleteSelected()}
                  >
                    Delete Selected
                  </Button>
                </View>
              </View>
            ) : (
              <View style={styles.normalHeaderBar}>
                <IconButton icon="arrow-left" iconColor={textColor} size={22} onPress={handleBack} />
                <View style={styles.brandTitleRow}>
                  <Text style={[styles.chromeTitle, { color: textColor }]}>History</Text>
                  <View style={styles.phBadge}>
                    <Text style={styles.phBadgeText}>LAKBAY PH</Text>
                  </View>
                </View>

                {historyItems.length > 0 && (
                  <Button mode="text" textColor="#FF8A80" onPress={() => void handleClearAllHistory()}>
                    Clear All
                  </Button>
                )}
              </View>
            )}
          </View>

          {/* SUBHEADER TABS */}
          <View style={styles.subHeaderTabs}>
            <View style={styles.subHeaderLeft}>
              <Icon source="format-list-bulleted" size={18} color="#80CBC4" />
              <Text style={styles.tabTextActive}>By Date (Searches & Tab Visited)</Text>
            </View>
            <Text style={styles.historyTotalBadge}>{historyItems.length} items</Text>
          </View>

          {/* HISTORY LIST */}
          {historyItems.length === 0 ? (
            <View style={styles.emptyContainer}>
              <View style={styles.emptyIconCircle}>
                <Icon source="history" size={32} color="#80CBC4" />
              </View>
              <Text style={[styles.emptyTitle, { color: textColor }]}>Browsing history is empty</Text>
              <Text style={[styles.emptySubtitle, { color: subTextColor }]}>
                Searches and tab visits will be saved here independently.
              </Text>
            </View>
          ) : (
            <FlatList
              data={groupedHistory}
              keyExtractor={(group) => group.dateLabel}
              contentContainerStyle={styles.listContainer}
              renderItem={({ item: group }) => (
                <View style={styles.groupCard}>
                  <Text style={styles.dateGroupTitle}>{group.dateLabel}</Text>

                  <View style={[styles.itemsBox, { backgroundColor: cardBgColor }]}>
                    {group.data.map((item) => {
                      const isChecked = selectedIds.includes(item.id);
                      const isTab = item.type === 'tab_visit';
                      return (
                        <View key={item.id} style={styles.historyRow}>
                          <Checkbox
                            status={isChecked ? 'checked' : 'unchecked'}
                            onPress={() => toggleSelectItem(item.id)}
                            color="#80CBC4"
                            uncheckedColor="#396B50"
                          />

                          <Text style={styles.timeText}>{formatTimeStr(item.timestamp)}</Text>

                          <Pressable
                            style={styles.queryPressable}
                            onPress={() => handleOpenItem(item)}
                          >
                            <View style={styles.sparkleIconWrapper}>
                              <Icon
                                source={isTab ? 'tab' : 'magnify'}
                                size={14}
                                color={isTab ? '#FFB74D' : '#80CBC4'}
                              />
                            </View>
                            <Text numberOfLines={1} style={styles.queryTitle}>
                              {item.title} -{' '}
                              <Text style={styles.domainSubtext}>
                                {isTab ? 'Tab Access' : 'Lakbay PH Search'}
                              </Text>
                            </Text>
                          </Pressable>

                          <IconButton
                            icon="dots-vertical"
                            iconColor={subTextColor}
                            size={18}
                            onPress={() => toggleSelectItem(item.id)}
                          />
                        </View>
                      );
                    })}
                  </View>
                </View>
              )}
            />
          )}
        </SafeAreaView>
      </LinearGradient>
    </>
  );
}

const styles = StyleSheet.create({
  gradientContainer: { flex: 1 },
  container: { flex: 1 },
  chromeHeaderBar: {
    height: 56,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.12)',
    justifyContent: 'center',
    backgroundColor: 'rgba(0,0,0,0.15)',
    zIndex: 1000,
  },
  normalHeaderBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
  },
  brandTitleRow: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  selectionBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
  },
  selectedCountText: {
    fontSize: 15,
    fontWeight: '700',
    flex: 1,
    marginLeft: 8,
  },
  actionButtonsRow: {
    flexDirection: 'row',
    gap: 8,
  },
  actionBtn: {
    borderColor: 'rgba(255,255,255,0.35)',
    borderRadius: 18,
    height: 36,
    justifyContent: 'center',
  },
  chromeTitle: {
    fontSize: 18,
    fontWeight: '900',
  },
  phBadge: {
    backgroundColor: 'rgba(128, 203, 196, 0.2)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(128, 203, 196, 0.4)',
  },
  phBadgeText: {
    color: '#80CBC4',
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  subHeaderTabs: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  subHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  tabTextActive: {
    color: '#F0F9F3',
    fontWeight: '800',
    fontSize: 14,
  },
  historyTotalBadge: {
    color: '#A3CBB1',
    fontSize: 12,
    fontWeight: '600',
  },
  listContainer: {
    paddingHorizontal: 16,
    paddingBottom: 32,
    gap: 20,
  },
  groupCard: {
    gap: 8,
  },
  dateGroupTitle: {
    color: '#E0F2F1',
    fontSize: 14,
    fontWeight: '800',
    marginLeft: 4,
  },
  itemsBox: {
    borderRadius: 16,
    overflow: 'hidden',
    paddingVertical: 4,
    borderWidth: 1,
    borderColor: 'rgba(128, 203, 196, 0.2)',
    elevation: 4,
  },
  historyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    minHeight: 46,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.04)',
  },
  timeText: {
    color: '#A3CBB1',
    fontSize: 12,
    fontWeight: '700',
    width: 68,
    marginLeft: 4,
  },
  queryPressable: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  sparkleIconWrapper: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: 'rgba(128, 203, 196, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  queryTitle: {
    flex: 1,
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },
  domainSubtext: {
    color: '#A3CBB1',
    fontSize: 12,
    fontWeight: '400',
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
    paddingTop: 40,
    gap: 12,
  },
  emptyIconCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: 'rgba(128, 203, 196, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(128, 203, 196, 0.3)',
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '800',
  },
  emptySubtitle: {
    fontSize: 13,
    fontWeight: '500',
    textAlign: 'center',
    lineHeight: 18,
  },
});