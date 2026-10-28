import { useEffect, useRef, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { getRandomQuote, getTags } from '@/services/quoteService';
import { useFavorites } from '@/favorites';
import { useTheme, useThemeMode } from '@/theme';

export default function QuoteOfTheDay() {
  const [quote, setQuote] = useState({ text: '', author: '', tags: [] as string[] });
  const [tags, setTags] = useState<string[]>([]);
  const [selectedTag, setSelectedTag] = useState<string | null>(null);

  const selectTagRef = useRef<string | null>(null);

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

  const theme = useTheme();
  const { isDarkMode } = useThemeMode();
  const { toggleFavorite, isFavorite } = useFavorites();

  // Dark mode: brighter secondary text and borders so everything stays readable,
  // and fainter backdrop circles so they don't wash out the text on top.
  const softText = isDarkMode ? '#d1d5db' : theme.colors.textSecondary;
  const lineColor = isDarkMode ? '#4b5563' : theme.colors.border;
  const blobAlpha = isDarkMode ? ['12', '0E', '0A'] : ['26', '20', '14'];
  const ringAlpha = isDarkMode ? '2A' : '33';

  return (
    <View style={[styles.card, { backgroundColor: theme.colors.surface }]}>
      {/* Backdrop design: soft circles and rings behind the card content */}
      <View pointerEvents="none" style={styles.backdrop}>
        <View style={[styles.blob, styles.blobTop, { backgroundColor: `${theme.colors.primary}${blobAlpha[0]}` }]} />
        <View style={[styles.blob, styles.blobBottom, { backgroundColor: `${theme.colors.accent}${blobAlpha[1]}` }]} />
        <View style={[styles.blob, styles.blobSide, { backgroundColor: `${theme.colors.primary}${blobAlpha[2]}` }]} />
        <View style={[styles.ring, { borderColor: `${theme.colors.accent}${ringAlpha}` }]} />
        <View style={[styles.ringSmall, { borderColor: `${theme.colors.primary}${ringAlpha}` }]} />
      </View>

      <View style={styles.cardHeader}>
        <View style={[styles.quoteIcon, { backgroundColor: `${theme.colors.primary}18` }]}>
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
              { backgroundColor: selectedTag === t ? theme.colors.primary : `${theme.colors.primary}18` },
            ]}
          >
            <Text style={[styles.chipText, { color: selectedTag === t ? '#ffffff' : theme.colors.primary }]}>
              {t}
            </Text>
          </View>
        ))}
      </View>

      <Text style={[styles.quoteText, { color: theme.colors.text }]}>
        {`"${quote.text}"`}
      </Text>

      <Text style={[styles.author, { color: softText }]}>
        — {quote.author}
      </Text>

      <View style={[styles.divider, { backgroundColor: lineColor }]} />

      <View style={styles.controlsRow}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterRow}>
          {/* Base option: filtering by any tag. Wire its onPress so it clears the selection. */}
          <Pressable
            style={[
              styles.filterChip,
              {
                backgroundColor: selectedTag === null ? theme.colors.primary : theme.colors.surface,
                borderColor: selectedTag === null ? theme.colors.primary : lineColor,
              },
            ]}
            onPress={() => {
              selectTagRef.current = null;
              setSelectedTag(null);
            }}
          >
            <Text style={[styles.filterChipText, { color: selectedTag === null ? '#ffffff' : softText }]}>
              any
            </Text>
          </Pressable>
          {tags.map((t) => (
            <Pressable
              key={t}
              style={[
                styles.filterChip,
                {
                  backgroundColor: selectedTag === t ? theme.colors.primary : theme.colors.surface,
                  borderColor: selectedTag === t ? theme.colors.primary : lineColor,
                },
              ]}
              onPress={() => {
                selectTagRef.current = t;
                setSelectedTag(t);
              }}
            >
              <Text style={[styles.filterChipText, { color: selectedTag === t ? '#ffffff' : softText }]}>
                {t}
              </Text>
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
          style={[styles.favoriteButton, { backgroundColor: theme.colors.surface }]}
          onPress={() => {
            toggleFavorite(quote);
            router.navigate('/favorites');
          }}
          accessibilityRole="button"
          accessibilityLabel="Save quote to favorites"
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
    padding: 22,
    borderWidth: 1,
    borderColor: '#ffffff18',
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 10,
  },
  backdrop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    borderRadius: 16,
    overflow: 'hidden',
  },
  blob: {
    position: 'absolute',
    borderRadius: 999,
  },
  blobTop: {
    width: 190,
    height: 190,
    top: -70,
    right: -60,
  },
  blobBottom: {
    width: 220,
    height: 220,
    bottom: -100,
    left: -70,
  },
  blobSide: {
    width: 120,
    height: 120,
    top: '45%',
    right: -50,
  },
  ring: {
    position: 'absolute',
    width: 90,
    height: 90,
    borderRadius: 45,
    borderWidth: 2,
    top: '30%',
    left: 14,
  },
  ringSmall: {
    position: 'absolute',
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: 2,
    bottom: '22%',
    right: 24,
  },
  overline: {
    fontSize: 12,
    letterSpacing: 2,
    textTransform: 'uppercase',
    textAlign: 'center',
    marginBottom: 2,
    fontWeight: '800',
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 20,
  },
  quoteIcon: {
    width: 42,
    height: 42,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 14,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '800',
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
  chipText: {
    fontSize: 12,
    fontWeight: '700',
  },
  quoteText: {
    fontSize: 22,
    fontWeight: '600',
    fontStyle: 'italic',
    lineHeight: 30,
    textAlign: 'center',
    marginBottom: 10,
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
    minHeight: 34,
    justifyContent: 'center',
  },
  filterChipText: {
    fontSize: 13,
  },
  refreshButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
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