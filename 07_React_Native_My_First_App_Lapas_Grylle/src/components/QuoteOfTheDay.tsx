import { useEffect, useRef, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { getRandomQuote, getTags } from '@/services/quoteService';
import { useFavorites } from '@/favorites';
import { useTheme } from '@/theme';

export default function QuoteOfTheDay() {
  const [quote, setQuote] = useState({ text: '', author: '', tags: [] as string[] });
  const [tags, setTags] = useState<string[]>([]);
  const [selectedTag, setSelectedTag] = useState<string | null>(null);

  const selectTagRef = useRef<string | null>(null);
  const theme = useTheme();
  const { toggleFavorite, isFavorite } = useFavorites();

  const loadRandomQuote = async () => {
    const tag = selectTagRef.current ?? null;
    const nextQuote = await getRandomQuote(tag);
    setQuote(nextQuote);
    setSelectedTag(tag);
  };

  const loadTags = async () => {
    const availableTags = await getTags();
    setTags(availableTags);
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      void Promise.all([loadRandomQuote(), loadTags()]);
    }, 0);
    return () => clearTimeout(timer);
  }, []);

  return (
    <View style={[styles.card, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}>
      <View style={styles.cardHeader}>
        <View style={[styles.quoteIcon, { backgroundColor: `${theme.colors.primary}15` }]}>
          <Ionicons name="chatbubble-ellipses" size={20} color={theme.colors.primary} />
        </View>
        <View>
          <Text style={[styles.overline, { color: theme.colors.primary }]}>Daily note</Text>
          <Text style={[styles.cardTitle, { color: theme.colors.text }]}>Quote of the Day</Text>
        </View>
      </View>

      <View style={styles.tagRow}>
        {quote.tags.map((t) => (
          <View
            key={t}
            style={[
              styles.chip,
              { backgroundColor: selectedTag === t ? theme.colors.primary : `${theme.colors.primary}15` },
            ]}
          >
            <Text style={[styles.chipText, { color: selectedTag === t ? '#ffffff' : theme.colors.primary }]}>
              {t}
            </Text>
          </View>
        ))}
      </View>

      <Text style={[styles.quoteText, { color: theme.colors.text }]}>
        &quot;{quote.text}&quot;
      </Text>

      <Text style={[styles.author, { color: theme.colors.textSecondary }]}>
        — {quote.author}
      </Text>

      <View style={[styles.divider, { backgroundColor: theme.colors.border }]} />

      {/* Filter Row */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterRow}>
        <Pressable
          style={[
            styles.filterChip,
            {
              backgroundColor: selectedTag === null ? theme.colors.primary : 'transparent',
              borderColor: selectedTag === null ? theme.colors.primary : theme.colors.border,
            },
          ]}
          onPress={() => {
            selectTagRef.current = null;
            setSelectedTag(null);
            loadRandomQuote();
          }}
        >
          <Text style={[styles.filterChipText, { color: selectedTag === null ? '#ffffff' : theme.colors.textSecondary }]}>
            any
          </Text>
        </Pressable>
        {tags.map((t) => (
          <Pressable
            key={t}
            style={[
              styles.filterChip,
              {
                backgroundColor: selectedTag === t ? theme.colors.primary : 'transparent',
                borderColor: selectedTag === t ? theme.colors.primary : theme.colors.border,
              },
            ]}
            onPress={() => {
              selectTagRef.current = t;
              setSelectedTag(t);
              loadRandomQuote();
            }}
          >
            <Text style={[styles.filterChipText, { color: selectedTag === t ? '#ffffff' : theme.colors.textSecondary }]}>
              {t}
            </Text>
          </Pressable>
        ))}
      </ScrollView>

      {/* Action Buttons */}
      <View style={styles.actionsRow}>
        <Pressable
          style={[styles.refreshButton, { backgroundColor: theme.colors.primary }]}
          onPress={loadRandomQuote}
        >
          <Ionicons name="refresh" size={18} color="#ffffff" />
          <Text style={styles.refreshButtonText}>Next Quote</Text>
        </Pressable>

        <Pressable
          style={[styles.favoriteButton, { backgroundColor: `${theme.colors.accent}15` }]}
          onPress={() => {
            toggleFavorite(quote);
            router.navigate('/favorites');
          }}
        >
          <Ionicons
            name={isFavorite(quote) ? 'heart' : 'heart-outline'}
            size={22}
            color={theme.colors.accent}
          />
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    width: '100%',
    borderRadius: 24,
    padding: 24,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.05,
    shadowRadius: 20,
    elevation: 8,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    marginBottom: 20,
  },
  quoteIcon: {
    width: 48,
    height: 48,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 16,
  },
  overline: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 1.5,
    textTransform: 'uppercase',
    marginBottom: 2,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '800',
  },
  tagRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginBottom: 16,
  },
  chip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  chipText: {
    fontSize: 12,
    fontWeight: '700',
  },
  quoteText: {
    fontSize: 24,
    fontWeight: '700',
    fontStyle: 'italic',
    lineHeight: 34,
    textAlign: 'center',
    marginBottom: 12,
    marginTop: 8,
  },
  author: {
    fontSize: 15,
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: 24,
  },
  divider: {
    height: 1,
    width: '100%',
    marginBottom: 20,
  },
  filterRow: {
    gap: 8,
    paddingBottom: 20,
  },
  filterChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1.5,
  },
  filterChipText: {
    fontSize: 13,
    fontWeight: '700',
  },
  actionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  refreshButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 16,
    borderRadius: 16,
  },
  refreshButtonText: {
    color: '#ffffff',
    fontSize: 15,
    fontWeight: '700',
  },
  favoriteButton: {
    width: 52,
    height: 52,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 16,
  },
});