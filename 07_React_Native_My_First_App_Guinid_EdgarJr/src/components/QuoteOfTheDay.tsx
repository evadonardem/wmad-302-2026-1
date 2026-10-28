import { useEffect, useRef, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { getRandomQuote, getTags } from '@/services/quoteService';
import { useFavorites } from '@/favorites';
import { useTheme } from '@/theme';

export default function QuoteOfTheDay() {
  // TODO 1 [State Initialization]: Define local state variables for:
  // - 'quote': Stores the current quote object (default: empty object)
  // - 'tags': Stores an array of all available category tags (default: empty array)
  // - 'selectedTag': Tracks the string name of the active filter tag (default: null)
const [quote, setQuote] = useState({
  text: '',
  author: '',
  tags: [] as string[],
});
const [tags, setTags] = useState<string[]>([]);
const [selectedTag, setSelectedTag] = useState<string | null>(null);

  // TODO 2 [Reference Hook]: Create a React mutable reference named 'selectTagRef' that tracks
  // the currently selected filter tag value without triggering a re-render when it changes.
  // Initialize it to null (meaning "any" tag). Hint: useRef<string | null>(null)
  const selectTagRef = useRef<string | null>(null);

  const loadRandomQuote = async () => {
    // TODO 3 [Async Request Handler]:
    // a. Read the current tag value from 'selectTagRef' (fallback to null if undefined)
    // b. Call 'getRandomQuote(tag)' asynchronously with that value
    // c. Update both your 'quote' state and 'selectedTag' state with the returned values
    const tag = selectTagRef.current ?? null;
    const nextQuote = await getRandomQuote(tag);
    setQuote(nextQuote);
    setSelectedTag(nextQuote.tags[0] ?? null);
  };

  // const loadTags = async () => {
  //   // TODO 4 [Async List Population]: Fetch tags asynchronously using 'getTags()' and store them into your tags state array
  //   const availableTags = await getTags();
  //   setTags(availableTags);
  // };

  useEffect(() => {
    // TODO 4 [Async List Population]: Fetch tags asynchronously using 'getTags()' and store them into your tags state array
    // TODO 5 [Component Lifecycle]: Execute both 'loadRandomQuote' and 'loadTags' when the component mounts

    let cancelled = false;

    getRandomQuote(null).then((nextQuote) => {
      if (cancelled) return;
      setQuote(nextQuote);
      setSelectedTag(nextQuote.tags[0] ?? null);
    });

    getTags().then((availableTags) => {
      if (cancelled) return;
      setTags(availableTags);
    });

    return () => {
      cancelled = true;
    };
  }, []);

  const theme = useTheme();
  // Used by TODO 24 below.
  const { toggleFavorite, isFavorite } = useFavorites();

  return (
    <View style={[styles.card, { backgroundColor: theme.colors.surface }]}>
      <Text style={[styles.overline, { color: theme.colors.textSecondary }]}>
        Quote of the Day
      </Text>

      <View style={styles.tagRow}>
        {/* TODO 6 [Conditional Chip List]: Map through 'quote.tags'. For each tag 't':
            - Render a tag chip <View> with a unique key containing a <Text> label={t}
            - Apply styles.chipActive if 'selectedTag' matches 't', otherwise styles.chipInactive
            - Give the chip styles.chip for spacing */}
        {quote.tags.map((t, index) => (
          <View key={`${t}-${index}`} style={[styles.chip, selectedTag === t ? styles.chipActive : styles.chipInactive]}>
            <Text style={styles.chipText}>{t}</Text>
          </View>
        ))}
      </View>

      {/* TODO 7 [Text Content Mapping]: Bind 'quote.text' directly inside the quotation marks below */}
      <Text style={[styles.quoteText, { color: theme.colors.text }]}>
        {'"' + quote.text + '"'}
      </Text>

      {/* TODO 8 [Author Content Mapping]: Bind 'quote.author' after the long dash separator symbol */}
      <Text style={[styles.author, { color: theme.colors.textSecondary }]}>
        {'— ' + quote.author}
      </Text>

      <View style={[styles.divider, { backgroundColor: theme.colors.border }]} />

      <View style={styles.controlsRow}>
        {/* TODO 9 [Reference-Fed Options]: No dropdown exists in React Native — instead, every
            filter chip you render below must write the tapped tag into 'selectTagRef.current'
            (and into your 'selectedTag' state so the colors update) inside its onPress handler.
            The "any" chip resets both to null. */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterRow}>
          {/* Base option: filtering by any tag. Wire its onPress so it clears the selection. */}
          <Pressable style={[styles.filterChip, selectedTag === null && { backgroundColor: theme.colors.border }]} onPress={() => { selectTagRef.current = null; setSelectedTag(null); }}>
            <Text style={[styles.filterChipText, { color: theme.colors.text }]}>any</Text>
          </Pressable>
          {/* TODO 10 [Select Option Generation]: Map through your 'tags' state array to render a
              filter chip <Pressable> for each tag 't', with label={t} and an onPress handler
              that updates both 'selectTagRef' and 'selectedTag' (see TODO 9). */}
          {tags.map((t) => (
            <Pressable key={t} style={[styles.filterChip, selectedTag === t && { backgroundColor: theme.colors.border }]} onPress={() => { selectTagRef.current = t; setSelectedTag(t); }}>
              <Text style={[styles.filterChipText, { color: theme.colors.text }]}>{t}</Text>
            </Pressable>
          ))}
        </ScrollView>

        {/* TODO 11 [Action Trigger Binding]: Attach an 'onPress' listener to trigger 'loadRandomQuote' */}
        <Pressable onPress={loadRandomQuote} style={[styles.refreshButton, { backgroundColor: theme.colors.primary }]}>
          <Ionicons name="refresh" size={18} color="#ffffff" />
          <Text style={styles.refreshButtonText}>Next Quote</Text>
        </Pressable>

        {/* TODO 24 [Favorite Action]: Render a heart <Pressable style={styles.favoriteButton}> below
            the Next Quote button that:
            - shows Ionicons "heart-outline" (or "heart" when the current quote is already favorited —
              useFavorites() also exposes isFavorite(quote))
            - onPress calls toggleFavorite(quote) to save/remove the current quote
            - then jumps to the Favorites tab with router.navigate('/favorites') */}
        <Pressable
          style={[styles.favoriteButton, { backgroundColor: theme.colors.surface }]}
          disabled={!quote.text}
          onPress={() => {
            if (!quote.text) return;
            toggleFavorite(quote);
            router.navigate('/favorites');
          }}
        >
          <Ionicons
            name={quote.text && isFavorite(quote) ? 'heart' : 'heart-outline'}
            size={24}
            color={quote.text ? theme.colors.primary : theme.colors.textSecondary}
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
