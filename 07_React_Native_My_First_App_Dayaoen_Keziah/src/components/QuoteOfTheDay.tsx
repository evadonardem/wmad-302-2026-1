import { useEffect, useRef, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { getRandomQuote, getTags, type Quote } from '@/services/quoteService';
import { useFavorites } from '@/favorites';
import { useTheme } from '@/theme';

export default function QuoteOfTheDay() {
  // TODO 1: state for the current quote, all tags, and the active tag.
  const [quote, setQuote] = useState<Quote>({ text: '', author: '', tags: [] });
  const [tags, setTags] = useState<string[]>([]);
  const [selectedTag, setSelectedTag] = useState<string | null>(null);

  // TODO 2: mutable ref tracking the active filter tag (no re-render on change).
  const selectTagRef = useRef<string | null>(null);

  const loadRandomQuote = async () => {
    // TODO 3: read the tag from the ref, request a quote, update state.
    const tag = selectTagRef.current ?? null;
    const result = await getRandomQuote(tag);
    // Guard: never let an undefined/invalid result replace the quote state.
    if (result) {
      setQuote({ ...result, tags: result.tags ?? [] });
    }
    setSelectedTag(tag);
  };

  const loadTags = async () => {
    // TODO 4: fetch category tags into state.
    const result = await getTags();
    setTags(Array.isArray(result) ? result : []);
  };

  useEffect(() => {
    // TODO 5: on mount, load the quote and the tags concurrently.
    Promise.all([loadRandomQuote(), loadTags()]);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const theme = useTheme();
  const { toggleFavorite, isFavorite } = useFavorites();

  // Shared by the filter chips (TODO 9 / 10): write to the ref and to state.
  const selectTag = (tag: string | null) => {
    selectTagRef.current = tag;
    setSelectedTag(tag);
  };

  const activeChipText = theme.mode === 'dark' ? '#121417' : '#ffffff';
  const favorited = isFavorite(quote);

  return (
    <View style={[styles.card, { backgroundColor: theme.colors.surface }]}>
      <Text style={[styles.overline, { color: theme.colors.textSecondary }]}>
        Quote of the Day
      </Text>

      <View style={styles.tagRow}>
        {/* TODO 6: chip for each tag on the current quote */}
        {quote.tags?.map((t) => (
          <View
            key={t}
            style={[styles.chip, selectedTag === t ? styles.chipActive : styles.chipInactive]}
          >
            <Text style={styles.chipText}>{t}</Text>
          </View>
        ))}
      </View>

      {/* TODO 7 */}
      <Text style={[styles.quoteText, { color: theme.colors.text }]}>
        {`"${quote.text}"`}
      </Text>

      {/* TODO 8 */}
      <Text style={[styles.author, { color: theme.colors.textSecondary }]}>
        {`— ${quote.author}`}
      </Text>

      <View style={[styles.divider, { backgroundColor: theme.colors.border }]} />

      <View style={styles.controlsRow}>
        {/* TODO 9: chips write the tapped tag into selectTagRef.current and selectedTag */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterRow}>
          <Pressable
            style={[
              styles.filterChip,
              selectedTag === null && { backgroundColor: theme.colors.primary, borderColor: theme.colors.primary },
            ]}
            onPress={() => selectTag(null)}
          >
            <Text
              style={[
                styles.filterChipText,
                { color: selectedTag === null ? activeChipText : theme.colors.text },
              ]}
            >
              any
            </Text>
          </Pressable>
          {/* TODO 10: one filter chip per available tag */}
          {tags.map((t) => (
            <Pressable
              key={t}
              style={[
                styles.filterChip,
                selectedTag === t && { backgroundColor: theme.colors.primary, borderColor: theme.colors.primary },
              ]}
              onPress={() => selectTag(t)}
            >
              <Text
                style={[
                  styles.filterChipText,
                  { color: selectedTag === t ? activeChipText : theme.colors.text },
                ]}
              >
                {t}
              </Text>
            </Pressable>
          ))}
        </ScrollView>

        {/* TODO 11 */}
        <Pressable
          style={[styles.refreshButton, { backgroundColor: theme.colors.primary }]}
          onPress={loadRandomQuote}
        >
          <Ionicons name="refresh" size={18} color="#ffffff" />
          <Text style={styles.refreshButtonText}>Next Quote</Text>
        </Pressable>

        {/* TODO 24: favorite the quote, then jump to the Favorites tab */}
        <Pressable
          style={styles.favoriteButton}
          onPress={() => {
            toggleFavorite(quote);
            router.navigate('/favorites');
          }}
          accessibilityLabel={favorited ? 'Remove from favorites' : 'Add to favorites'}
        >
          <Ionicons
            name={favorited ? 'heart' : 'heart-outline'}
            size={28}
            color={favorited ? '#e53935' : theme.colors.textSecondary}
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
