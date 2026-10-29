import { useEffect, useRef, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { getRandomQuote, getTags, type Quote } from '@/services/quoteService';
import { useFavorites } from '@/favorites';
import { useTheme } from '@/theme';



export default function QuoteOfTheDay() {
  // TODO 1
  const [quote, setQuote] = useState<Quote>({ text: '', author: '', tags: [] });
  const [tags, setTags] = useState<string[]>([]);
  const [selectedTag, setSelectedTag] = useState<string | null>(null);

  // TODO 2
  const selectTagRef = useRef<string | null>(null);

  const loadRandomQuote = async () => {
    // TODO 3
    const tag = selectTagRef.current ?? null;
    const newQuote = await getRandomQuote(tag);
    setQuote(newQuote);
    setSelectedTag(tag);
  };

  const loadTags = async () => {
    // TODO 4
    const newTags = await getTags();
    setTags(newTags);
  };

  useEffect(() => {
    // TODO 5
    loadRandomQuote();
    loadTags();
  }, []);

  const chooseTag = (tag: string | null) => {
    selectTagRef.current = tag;
    setSelectedTag(tag);
  };

  const theme = useTheme();
  const { toggleFavorite, isFavorite } = useFavorites();

  return (
    <View style={[styles.card, { backgroundColor: theme.colors.surface }]}>
      <Text style={[styles.overline, { color: theme.colors.textSecondary }]}>
        Quote of the Day
      </Text>

      <View style={styles.tagRow}>
        {/* TODO 6 */}
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
        {`"${quote.text ?? ''}"`}
      </Text>

      {/* TODO 8 */}
      <Text style={[styles.author, { color: theme.colors.textSecondary }]}>
        {`— ${quote.author ?? ''}`}
      </Text>

      <View style={[styles.divider, { backgroundColor: theme.colors.border }]} />

      <View style={styles.controlsRow}>
        {/* TODO 9 */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filterRow}
        >
          <Pressable
            style={[
              styles.filterChip,
              selectedTag === null && { borderColor: theme.colors.primary },
            ]}
            onPress={() => chooseTag(null)}
          >
            <Text style={[styles.filterChipText, { color: theme.colors.text }]}>any</Text>
          </Pressable>

          {/* TODO 10 */}
          {tags.map((t) => (
            <Pressable
              key={t}
              style={[
                styles.filterChip,
                selectedTag === t && { borderColor: theme.colors.primary },
              ]}
              onPress={() => chooseTag(t)}
            >
              <Text style={[styles.filterChipText, { color: theme.colors.text }]}>{t}</Text>
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

        {/* TODO 24 */}
        <Pressable
          style={styles.favoriteButton}
          onPress={() => {
            toggleFavorite(quote);
            router.navigate('/favorites');
          }}
        >
          <Ionicons
            name={quote.text && isFavorite(quote) ? 'heart' : 'heart-outline'}
            size={28}
            color="#e53935"
          />
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    padding: 16,
    borderRadius: 12,
    gap: 8,
  },
  overline: {
    fontSize: 12,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  tagRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  chip: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
    borderWidth: 1,
  },
  chipActive: {
    backgroundColor: '#2563eb',
    borderColor: '#2563eb',
  },
  chipInactive: {
    backgroundColor: 'transparent',
    borderColor: '#9ca3af',
  },
  chipText: {
    fontSize: 12,
    color: '#6b7280',
  },
  quoteText: {
    fontSize: 20,
    fontStyle: 'italic',
    lineHeight: 28,
  },
  author: {
    fontSize: 14,
    textAlign: 'right',
  },
  divider: {
    height: 1,
    marginVertical: 8,
  },
  controlsRow: {
    gap: 12,
  },
  filterRow: {
    gap: 8,
    paddingVertical: 4,
  },
  filterChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  filterChipText: {
    fontSize: 13,
  },
  refreshButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 10,
    borderRadius: 8,
  },
  refreshButtonText: {
    color: '#ffffff',
    fontWeight: '600',
  },
  favoriteButton: {
    alignSelf: 'center',
    padding: 4,
  },
});