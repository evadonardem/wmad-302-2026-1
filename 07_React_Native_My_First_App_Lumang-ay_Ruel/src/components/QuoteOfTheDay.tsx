import { useCallback, useEffect, useRef, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { getRandomQuote, getTags } from '@/services/quoteService';
import type { Quote } from '@/services/quoteService';
import { useFavorites } from '@/favorites';
import { useTheme } from '@/theme';

export default function QuoteOfTheDay() {
  const [quote, setQuote] = useState<Quote>({ text: '', author: '', tags: [] });
  const [tags, setTags] = useState<string[]>([]);
  const [selectedTag, setSelectedTag] = useState<string | null>(null);
  const selectTagRef = useRef<string | null>(null);

  const loadRandomQuote = useCallback(async () => {
    const tag = selectTagRef.current ?? null;
    const nextQuote = await getRandomQuote(tag);
    setQuote(nextQuote);
    if (selectTagRef.current === tag) {
      setSelectedTag(tag);
    }
  }, []);

  const loadTags = useCallback(async () => {
    const availableTags = await getTags();
    setTags(availableTags);
  }, []);

  useEffect(() => {
    void Promise.resolve().then(() => {
      void loadRandomQuote();
      void loadTags();
    });
  }, [loadRandomQuote, loadTags]);

  const theme = useTheme();
  const { isFavorite, toggleFavorite } = useFavorites();

  return (
    <View style={[styles.card, { backgroundColor: theme.colors.surface }]}>
      <Text style={[styles.overline, { color: theme.colors.textSecondary }]}>
        Quote of the Day
      </Text>

      <View style={styles.tagRow}>
        {quote.tags.map((tag) => (
          <View
            key={tag}
            style={[
              styles.chip,
              selectedTag === tag ? styles.chipActive : styles.chipInactive,
            ]}
          >
            <Text style={styles.chipText}>{tag}</Text>
          </View>
        ))}
      </View>

      <Text style={[styles.quoteText, { color: theme.colors.text }]}>
        {`"${quote.text}"`}
      </Text>

      <Text style={[styles.author, { color: theme.colors.textSecondary }]}>
        — {quote.author}
      </Text>

      <View style={[styles.divider, { backgroundColor: theme.colors.border }]} />

      <View style={styles.controlsRow}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterRow}>
          <Pressable
            accessibilityRole="button"
            accessibilityState={{ selected: selectedTag === null }}
            onPress={() => {
              selectTagRef.current = null;
              setSelectedTag(null);
            }}
            style={[
              styles.filterChip,
              selectedTag === null && { backgroundColor: theme.colors.primary, borderColor: theme.colors.primary },
            ]}
          >
            <Text style={[styles.filterChipText, selectedTag === null && styles.selectedFilterChipText]}>
              any
            </Text>
          </Pressable>
          {tags.map((tag) => {
            const isSelected = selectedTag === tag;
            return (
              <Pressable
                key={tag}
                accessibilityRole="button"
                accessibilityState={{ selected: isSelected }}
                onPress={() => {
                  selectTagRef.current = tag;
                  setSelectedTag(tag);
                }}
                style={[
                  styles.filterChip,
                  isSelected && { backgroundColor: theme.colors.primary, borderColor: theme.colors.primary },
                ]}
              >
                <Text style={[styles.filterChipText, isSelected && styles.selectedFilterChipText]}>
                  {tag}
                </Text>
              </Pressable>
            );
          })}
        </ScrollView>

        <Pressable
          accessibilityRole="button"
          onPress={() => void loadRandomQuote()}
          style={[styles.refreshButton, { backgroundColor: theme.colors.primary }]}
        >
          <Ionicons name="refresh" size={18} color="#ffffff" />
          <Text style={styles.refreshButtonText}>Next Quote</Text>
        </Pressable>

        <Pressable
          accessibilityRole="button"
          accessibilityLabel={isFavorite(quote) ? 'Remove from favorites' : 'Add to favorites'}
          disabled={!quote.text}
          onPress={() => {
            toggleFavorite(quote);
            router.navigate('/favorites');
          }}
          style={styles.favoriteButton}
        >
          <Ionicons
            name={isFavorite(quote) ? 'heart' : 'heart-outline'}
            size={24}
            color={theme.colors.accent}
          />
        </Pressable>
      </View>
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
  divider: {
    height: 1,
    marginBottom: 16,
  },
  controlsRow: {
    gap: 12,
  },
  filterRow: {
    gap: 8,
    alignItems: 'center',
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
  selectedFilterChipText: {
    color: '#ffffff',
  },
  refreshButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 12,
    borderRadius: 12,
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
