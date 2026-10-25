import { useEffect, useRef, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { getRandomQuote, getTags, type Quote } from '@/services/quoteService';
import { useFavorites } from '@/favorites';
import { useTheme } from '@/theme';

export default function QuoteOfTheDay() {
  const [quote, setQuote] = useState<Quote>({ text: '', author: '', tags: [] });
  const [tags, setTags] = useState<string[]>([]);
  const [selectedTag, setSelectedTag] = useState<string | null>(null);

  const selectTagRef = useRef<string | null>(null);

  const loadRandomQuote = async () => {
    const currentTag = selectTagRef.current ?? null;
    const fetchedQuote = await getRandomQuote(currentTag);
    setQuote(fetchedQuote);
    setSelectedTag(currentTag);
  };

  const loadTags = async () => {
    const fetchedTags = await getTags();
    setTags(fetchedTags);
  };

  useEffect(() => {
    loadRandomQuote();
    loadTags();
  }, []);

  const theme = useTheme();
  const { toggleFavorite, isFavorite } = useFavorites();

  return (
    <View style={[styles.card, { backgroundColor: theme.colors.surface }]}>
      <Text style={[styles.overline, { color: theme.colors.textSecondary }]}>
        Quote of the Day
      </Text>

      <View style={styles.tagRow}>
        {quote.tags?.map((t) => (
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
            style={styles.filterChip}
            onPress={() => {
              selectTagRef.current = null;
              setSelectedTag(null);
            }}
          >
            <Text style={styles.filterChipText}>any</Text>
          </Pressable>

          {tags.map((t) => (
            <Pressable
              key={t}
              style={[
                styles.filterChip,
                selectedTag === t && { borderColor: theme.colors.primary },
              ]}
              onPress={() => {
                selectTagRef.current = t;
                setSelectedTag(t);
              }}
            >
              <Text style={styles.filterChipText}>{t}</Text>
            </Pressable>
          ))}
        </ScrollView>

        <Pressable
          style={[styles.refreshButton, { backgroundColor: theme.colors.primary }]}
          onPress={loadRandomQuote}
        >
          <Ionicons name="refresh" size={18} color="#ffffff" />
          <Text style={styles.refreshButtonText}>Next Quote</Text>
        </Pressable>

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
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    maxWidth: 520,
    width: '100%',
    alignSelf: 'center',
    borderRadius: 20,
    padding: 28,
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.1,
    shadowRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  overline: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 2.5,
    textTransform: 'uppercase',
    textAlign: 'center',
    marginBottom: 16,
    opacity: 0.8,
  },
  tagRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 6,
    marginBottom: 20,
  },
  chip: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 20,
  },
  chipActive: {
    backgroundColor: '#10b981',
  },
  chipInactive: {
    backgroundColor: '#8b5cf6',
  },
  chipText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '600',
  },
  quoteText: {
    fontSize: 22,
    fontWeight: '500',
    fontStyle: 'italic',
    lineHeight: 34,
    textAlign: 'center',
    marginBottom: 16,
  },
  author: {
    fontSize: 15,
    fontWeight: '600',
    textAlign: 'right',
    marginBottom: 20,
  },
  divider: {
    height: 1,
    marginBottom: 20,
    opacity: 0.5,
  },
  controlsRow: {
    gap: 16,
  },
  filterRow: {
    gap: 8,
    alignItems: 'center',
    paddingVertical: 4,
  },
  filterChip: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#d1d5db',
  },
  filterChipText: {
    fontSize: 13,
    fontWeight: '500',
  },
  refreshButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
    borderRadius: 14,
    elevation: 2,
  },
  refreshButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
  favoriteButton: {
    alignSelf: 'center',
    padding: 12,
    borderRadius: 30,
    backgroundColor: 'rgba(239, 68, 68, 0.08)',
  },
});