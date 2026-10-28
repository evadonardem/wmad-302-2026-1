import { useEffect, useRef, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { getRandomQuote, getTags } from '@/services/quoteService';
import { useFavorites } from '@/favorites';
import { useTheme } from '@/theme';
import React from 'react';

export default function QuoteOfTheDay() {
  // Todo 1 [State Management]: Create three pieces of state:
  const [quote, setQuote] = useState({ text: '', author: '', tags: [] }); 
  const [tags, setTags] = useState<string[]>([]);
  const [selectedTag, setSelectedTag] = useState<string | null>(null);

  // TODO 2 [Reference Hook]: Create a React mutable reference named 'selectTagRef' that tracks
  const selectTagRef = useRef<string | null>(null);


  const loadRandomQuote = async () => {
    // TODO 3 [Async Request Handler]:
    const currentTag = selectTagRef.current ?? null;
    const randomQuote = await getRandomQuote(currentTag);
    setQuote(randomQuote);
    setSelectedTag(currentTag);
  };

  const loadTags = async () => {
    // TODO 4 [Async List Population]: Fetch tags asynchronously using 'getTags()' and store them into your tags state array
    const fetchedTags = await getTags();
    setTags(fetchedTags);
  };

  useEffect(() => {
    // TODO 5 [Component Lifecycle]: Execute both 'loadRandomQuote' and 'loadTags' when the component mounts
    loadRandomQuote();
    loadTags();
  }, []);

  const theme = useTheme();
  // Used by TODO 24 below.
  const { toggleFavorite } = useFavorites();

  return (
    
    <View style={[styles.card, { backgroundColor: theme.colors.surface }]}>
      <Text style={[styles.overline, { color: theme.colors.textSecondary }]}>
        Quote of the Day
      </Text>

      <View style={styles.tagRow}>
  {/* TODO 6 [Conditional Chip List] */}
  {quote?.tags?.map((t) => (
    <View
      key={t}
      style={[
        styles.chip,
        (selectedTag === t ? styles.chipActive : styles.chipInactive)
      ]}
    >
      <Text style={styles.chipText}>{t}</Text>
    </View>
  ))}
</View>

      {/* TODO 7 [Text Content Mapping]: Bind 'quote.text' directly inside the quotation marks below */}
<     Text style={[styles.quoteText, { color: theme.colors.text }]}>
        "{quote?.text ?? 'Loading...'}"
      </Text>

      {/* TODO 8 [Author Content Mapping]: Bind 'quote.author' after the long dash separator symbol */}
      <Text style={[styles.author, { color: theme.colors.textSecondary }]}>
     — {quote?.author ?? 'Unknown'}
      </Text>

        {/* TODO 9 [Reference-Fed Options]: No dropdown exists in React Native — instead, every
            filter chip you render below must write the tapped tag into 'selectTagRef.current'
            (and into your 'selectedTag' state so the colors update) inside its onPress handler.
            The "any" chip resets both to null. */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterRow}>
      {/* Base option: filtering by any tag. Wire its onPress so it clears the selection. */}
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

          {/* TODO 10 [Select Option Generation]: Map through your 'tags' state array to render a
              filter chip <Pressable> for each tag 't', with label={t} and an onPress handler
              that updates both 'selectTagRef' and 'selectedTag' (see TODO 9). */}
          {/* [Your code here] */}
        </ScrollView>

        {/* TODO 11 [Action Trigger Binding]: Attach an 'onPress' listener to trigger 'loadRandomQuote' */}
        <Pressable style={[styles.refreshButton, { backgroundColor: theme.colors.primary }]}>
          <Ionicons name="refresh" size={18} color="#ffffff" />
          <Text style={styles.refreshButtonText}>Next Quote</Text>
        </Pressable>

        {/* TODO 24 [Favorite Action]: Render a heart <Pressable style={styles.favoriteButton}> below
            the Next Quote button that:
            - shows Ionicons "heart-outline" (or "heart" when the current quote is already favorited —
              useFavorites() also exposes isFavorite(quote))
            - onPress calls toggleFavorite(quote) to save/remove the current quote
            - then jumps to the Favorites tab with router.navigate('/favorites') */}
        {/* [Your code here] */}
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
