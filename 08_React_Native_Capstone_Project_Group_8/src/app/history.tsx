
import React from 'react';

import {
  Pressable,
  StyleSheet,
  View,
  ScrollView,
} from 'react-native';

import { router } from 'expo-router';

import {
  List,
  Text,
  useTheme,
} from 'react-native-paper';

import { useSearchHistory } from '@/searchHistory';

export default function HistoryScreen() {
  const theme = useTheme();
  const { entries } = useSearchHistory();

  const isDarkMode = theme.dark;

  // ======================================
  // EMERALD THEME COLORS
  // ======================================

  const colors = {
    background: isDarkMode ? '#0B1712' : '#F5FBF7',
    surface: isDarkMode ? '#064332' : '#FFFFFF',
    heading: isDarkMode ? '#D1FAE5' : '#14532D',
    text: isDarkMode ? '#A7F3D0' : '#166534',
    muted: isDarkMode ? '#86A99B' : '#729487',
    primary: isDarkMode ? '#34D399' : '#0D9488',
    border: isDarkMode ? '#176B50' : '#B7E4C7',
  };

  // ======================================
  // RETURN TO PREVIOUS SEARCH
  // ======================================

  const handlePick = (city: string) => {
    router.navigate({
      pathname: '/',
      params: { q: city },
    });
  };

  return (
    <ScrollView
      style={[
        styles.screen,
        { backgroundColor: colors.background },
      ]}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
    >
      {/* PAGE INTRODUCTION */}

      <View style={styles.header}>
        <Text
          variant="titleLarge"
          style={[
            styles.heading,
            { color: colors.heading },
          ]}
        >
          Recent Searches
        </Text>

        <Text
          variant="bodyMedium"
          style={[
            styles.intro,
            { color: colors.muted },
          ]}
        >
          Revisit the destinations you have previously
          searched in LAKBAY PH.
        </Text>
      </View>

      {/* SEARCH HISTORY LIST */}

      {entries.length > 0 && (
        <Text
          variant="labelLarge"
          style={[
            styles.sectionLabel,
            { color: colors.primary },
          ]}
        >
          YOUR SEARCH HISTORY
        </Text>
      )}

      {entries.map((city, index) => (
        <Pressable
          key={`${city}-${index}`}
          onPress={() => handlePick(city)}
          style={({ pressed }) => [
            styles.itemRow,
            {
              backgroundColor: colors.surface,
              borderColor: colors.border,
              opacity: pressed ? 0.75 : 1,
            },
          ]}
        >
          <List.Item
            title={city}
            description="Previously searched"
            titleStyle={[
              styles.itemTitle,
              { color: colors.heading },
            ]}
            descriptionStyle={[
              styles.itemDescription,
              { color: colors.muted },
            ]}
            left={() => (
              <List.Icon
                icon="map-marker"
                color={colors.primary}
                style={styles.leftIcon}
              />
            )}
            right={() => (
              <List.Icon
                icon="arrow-right"
                color={colors.primary}
                style={styles.rightIcon}
              />
            )}
            style={styles.item}
          />
        </Pressable>
      ))}

      {/* EMPTY SEARCH HISTORY */}

      {entries.length === 0 && (
        <View
          style={[
            styles.emptyContainer,
            {
              backgroundColor: colors.surface,
              borderColor: colors.border,
            },
          ]}
        >
          <List.Icon
            icon="history"
            color={colors.primary}
            style={styles.emptyIcon}
          />

          <Text
            variant="titleMedium"
            style={[
              styles.emptyTitle,
              { color: colors.heading },
            ]}
          >
            No Recent Searches
          </Text>

          <Text
            variant="bodyMedium"
            style={[
              styles.emptyDescription,
              { color: colors.muted },
            ]}
          >
            No destinations have been searched yet.
            Start exploring the Philippines and your
            recent searches will appear here.
          </Text>

          <Pressable
            onPress={() => router.navigate('/')}
            style={[
              styles.exploreButton,
              { backgroundColor: colors.primary },
            ]}
          >
            <Text style={styles.exploreButtonText}>
              Start Exploring →
            </Text>
          </Pressable>
        </View>
      )}

      {/* FOOTER */}

      <Text
        style={[
          styles.footer,
          { color: colors.muted },
        ]}
      >
        Discover more places with LAKBAY PH.
      </Text>
    </ScrollView>
  );
}

// ======================================
// STYLES
// ======================================

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },

  content: {
    width: '100%',
    maxWidth: 800,
    alignSelf: 'center',
    padding: 20,
    paddingBottom: 40,
  },

  // HEADER

  header: {
    marginBottom: 22,
  },

  heading: {
    fontSize: 24,
    fontWeight: '900',
    marginBottom: 8,
  },

  intro: {
    fontSize: 14,
    lineHeight: 22,
  },

  sectionLabel: {
    fontSize: 12,
    fontWeight: '900',
    letterSpacing: 1.2,
    marginBottom: 12,
  },

  // HISTORY ITEMS

  itemRow: {
    borderWidth: 1,
    borderRadius: 14,
    overflow: 'hidden',
    marginBottom: 12,
  },

  item: {
    paddingVertical: 6,
  },

  itemTitle: {
    fontSize: 15,
    fontWeight: '800',
  },

  itemDescription: {
    fontSize: 12,
  },

  leftIcon: {
    marginLeft: 4,
  },

  rightIcon: {
    marginRight: 4,
  },

  // EMPTY STATE

  emptyContainer: {
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 18,
    padding: 25,
    marginTop: 10,
  },

  emptyIcon: {
    marginBottom: 8,
  },

  emptyTitle: {
    fontWeight: '900',
    marginBottom: 10,
    textAlign: 'center',
  },

  emptyDescription: {
    fontSize: 14,
    lineHeight: 23,
    textAlign: 'center',
    marginBottom: 20,
  },

  exploreButton: {
    borderRadius: 12,
    paddingHorizontal: 22,
    paddingVertical: 12,
  },

  exploreButtonText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '800',
  },

  // FOOTER

  footer: {
    fontSize: 12,
    textAlign: 'center',
    marginTop: 28,
  },
});
