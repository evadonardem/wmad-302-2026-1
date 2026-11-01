import { useEffect, useMemo, useRef, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { getRandomQuote, getTags } from '@/services/quoteService';
import { useFavorites } from '@/favorites';
import { useTheme } from '@/theme';
import React from 'react';

// ✅ Stable default — created ONCE, prevents infinite re-render loop
const EMPTY_QUOTE = { text: '', author: '', tags: [] };

export default function QuoteOfTheDay() {
  // ✅ TODO 1 — State (initialized with default, never null)
  const [quote, setQuote] = useState(EMPTY_QUOTE);
  const [tags, setTags] = useState<string[]>([]);
  const [selectedTag, setSelectedTag] = useState<string | null>(null);

  // ✅ TODO 2 — Reference Hook
  const selectTagRef = useRef<string | null>(null);

  // ✅ Stable reference — same object identity across renders
  const activeQuote = useMemo(() => quote ?? EMPTY_QUOTE, [quote]);

  // ✅ Favorites hook — receives stable quote object
  const { toggleFavorite, isFavorite } = useFavorites(activeQuote);

  // ✅ TODO 3 — Async Request Handler
  const loadRandomQuote = async () => {
    const currentTag = selectTagRef.current ?? null;
    const randomQuote = await getRandomQuote(currentTag);
    setQuote(randomQuote);
    setSelectedTag(currentTag);
  };

  // ✅ TODO 4 — Async List Population
  const loadTags = async () => {
    const fetchedTags = await getTags();
    setTags(fetchedTags);
  };

  // ✅ TODO 5 — Component Lifecycle (runs on mount)
  useEffect(() => {
    loadRandomQuote();
    loadTags();
  }, []);

  const theme = useTheme();

  return (
    <View style={[styles.card, { backgroundColor: theme.colors.surface }]}>
      <Text style={[styles.overline, { color: theme.colors.textSecondary }]}>
        Quote of the Day
      </Text>

      {/* ✅ TODO 6 — Conditional Chip List */}
      <View style={styles.tagRow}>
        {quote.tags.map((t) => (
          <View
            key={t}
            style={[
              styles.chip,
              selectedTag === t ? styles.chipActive : styles.chipInactive,
            ]}
          >
            <Text style={styles.chipText}>{t}</Text>
          </View>
        ))}
      </View>

      {/* ✅ TODO 7 — Text Content Mapping */}
      <Text style={[styles.quoteText, { color: theme.colors.text }]}>
        "{quote.text || 'Loading...'}"
      </Text>

      {/* ✅ TODO 8 — Author Content Mapping */}
      <Text style={[styles.author, { color: theme.colors.textSecondary }]}>
        — {quote.author || 'Unknown'}
      </Text>

      {/* ✅ TODO 9 & 10 — Filter Chips (Reference-Fed Options) */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.filterRow}
      >
        {/* "any" chip — resets both ref and state to null */}
        <Pressable
          style={[
            styles.filterChip,
            selectedTag === null && {
              backgroundColor: theme.colors.primary,
              borderColor: theme.colors.primary,
            },
          ]}
          onPress={() => {
            selectTagRef.current = null;
            setSelectedTag(null);
          }}
        >
          <Text
            style={[
              styles.filterChipText,
              selectedTag === null && { color: '#ffffff' },
            ]}
          >
            any
          </Text>
        </Pressable>

        {/* Tag chips — each writes tapped tag to ref + state */}
        {tags.map((t) => (
          <Pressable
            key={t}
            style={[
              styles.filterChip,
              selectedTag === t && {
                backgroundColor: theme.colors.primary,
                borderColor: theme.colors.primary,
              },
            ]}
            onPress={() => {
              selectTagRef.current = t;
              setSelectedTag(t);
            }}
          >
            <Text
              style={[
                styles.filterChipText,
                selectedTag === t && { color: '#ffffff' },
              ]}
            >
              {t}
            </Text>
          </Pressable>
        ))}
      </ScrollView>

      {/* ✅ TODO 11 — Action Trigger Binding (Next Quote) */}
      <Pressable
        style={[styles.refreshButton, { backgroundColor: theme.colors.primary }]}
        onPress={loadRandomQuote}
      >
        <Ionicons name="refresh" size={18} color="#ffffff" />
        <Text style={styles.refreshButtonText}>Next Quote</Text>
      </Pressable>

      {/* ✅ TODO 24 — Favorite Action (Heart Button) */}
      <Pressable
        style={styles.favoriteButton}
        onPress={() => {
          toggleFavorite(quote);
          router.navigate('/favorites');
        }}
      >
        <Ionicons
          name={isFavorite(quote) ? 'heart' : 'heart-outline'}
          size={24}
          color={theme.colors.primary}
        />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    maxWidth: 500,
    width: '100%',
    borderRadius: 16,
    padding: 24,
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 10,
  },
  overline: {
    fontSize: 12,
    letterSpacing: 2,
    textTransform: 'uppercase',
    textAlign: 'center',
    marginBottom: 16,
  },
  tagRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 16,
  },
  chip: {
    marginRight: 4,
    marginBottom: 4,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 16,
  },
  chipActive: {
    backgroundColor: '#2e7d32',
  },
  chipInactive: {
    backgroundColor: '#7b1fa2',
  },
  chipText: {
    color: '#ffffff',
    fontSize: 12,
  },
  quoteText: {
    fontSize: 20,
    fontStyle: 'italic',
    lineHeight: 30,
    textAlign: 'center',
    marginBottom: 12,
  },
  author: {
    fontSize: 15,
    textAlign: 'right',
    marginBottom: 16,
  },
  filterRow: {
    gap: 8,
    alignItems: 'center',
    marginBottom: 16,
  },
  filterChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#bdbdbd',
  },
  filterChipText: {
    fontSize: 13,
  },
  refreshButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 12,
    borderRadius: 12,
    marginBottom: 12,
  },
  refreshButtonText: {
    color: '#ffffff',
    fontSize: 15,
    fontWeight: '600',
  },
  favoriteButton: {
    alignSelf: 'center',
    padding: 10,
    borderRadius: 24,
  },
});