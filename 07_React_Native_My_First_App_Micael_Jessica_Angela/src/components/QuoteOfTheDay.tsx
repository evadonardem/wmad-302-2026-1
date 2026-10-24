import { useEffect, useRef, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { getRandomQuote, getTags } from '@/services/quoteService';
import type { Quote } from '@/services/quoteService';
import { useFavorites } from '@/favorites';
import { useTheme } from '@/theme';

function isQuote(value: unknown): value is Quote {
  return (
    typeof value === 'object' &&
    value !== null &&
    'text' in value &&
    typeof value.text === 'string' &&
    'author' in value &&
    typeof value.author === 'string' &&
    'tags' in value &&
    Array.isArray(value.tags) &&
    value.tags.every((tag) => typeof tag === 'string')
  );
}

export default function QuoteOfTheDay() {
  // TODO 1 [State Initialization]: Define local state variables for:
  // - 'quote': Stores the current quote object (default: empty object)
  // - 'tags': Stores an array of all available category tags (default: empty array)
  // - 'selectedTag': Tracks the string name of the active filter tag (default: null)
  // [Your code here]
    const [quote, setQuote] = useState<Quote | null>(null);
    const [tags, setTags] = useState<string[]>([]);
    const [selectedTag, setSelectedTag] = useState<string | null>(null); // Add <string | null>

  // TODO 2 [Reference Hook]: Create a React mutable reference named 'selectTagRef' that tracks
  // the currently selected filter tag value without triggering a re-render when it changes.
  // Initialize it to null (meaning "any" tag). Hint: useRef<string | null>(null)
  // [Your code here]
    const selectTagRef = useRef<string | null>(null);

  const loadRandomQuote = async () => {
    // TODO 3 [Async Request Handler]:
    // a. Read the current tag value from 'selectTagRef' (fallback to null if undefined)
    // b. Call 'getRandomQuote(tag)' asynchronously with that value
    // c. Update both your 'quote' state and 'selectedTag' state with the returned values
    // [Your code here]
    const tag = selectTagRef.current ?? null;
    const data = await getRandomQuote(tag);
    setQuote(isQuote(data) ? data : null);
    setSelectedTag(tag);
  };

  const loadTags = async () => {
    // TODO 4 [Async List Population]: Fetch tags asynchronously using 'getTags()' and store them into your tags state array
    // [Your code here]
    const fetchedTags = await getTags();
    setTags(fetchedTags ?? []);
  };

  useEffect(() => {
    // TODO 5 [Component Lifecycle]: Execute both 'loadRandomQuote' and 'loadTags' when the component mounts
    // [Your code here]
    loadRandomQuote();
    loadTags();
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
        {quote?.tags.map((t) => (
          <View
            key={t}
            style={[
              styles.chip,
              selectedTag?.toLowerCase() === t.toLowerCase()
                ? styles.chipActive
                : styles.chipInactive,
            ]}
          >
            <Text style={styles.chipText}>{t}</Text>
          </View>
        ))}
      </View>

      {/* TODO 7 [Text Content Mapping]: Bind 'quote.text' directly inside the quotation marks below */}
      <Text style={[styles.quoteText, { color: theme.colors.text }]}>
        {'"'}
        {quote?.text ?? ''}
        {'"'}
      </Text>

      {/* TODO 8 [Author Content Mapping]: Bind 'quote.author' after the long dash separator symbol */}
      <Text style={[styles.author, { color: theme.colors.textSecondary }]}>
        — {quote?.author ?? ''}
      </Text>

      <View style={[styles.divider, { backgroundColor: theme.colors.border }]} />

      <View style={styles.controlsRow}>
        {/* TODO 9 [Reference-Fed Options]: No dropdown exists in React Native — instead, every
            filter chip you render below must write the tapped tag into 'selectTagRef.current'
            (and into your 'selectedTag' state so the colors update) inside its onPress handler.
            The "any" chip resets both to null. */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterRow}>
          {/* Base option: filtering by any tag. Wire its onPress so it clears the selection. */}
          <Pressable
            style={styles.filterChip}
            onPress={() => {
              selectTagRef.current = null;
              setSelectedTag(null);
            }}
          >
            <Text style={styles.filterChipText}>any</Text>
          </Pressable>
          {/* TODO 10 [Select Option Generation]: Map through your 'tags' state array to render a
              filter chip <Pressable> for each tag 't', with label={t} and an onPress handler
              that updates both 'selectTagRef' and 'selectedTag' (see TODO 9). */}
          {tags.map((t) => (
            <Pressable
              key={t}
              style={styles.filterChip}
              onPress={() => {
                selectTagRef.current = t;
                setSelectedTag(t);
              }}
            >
              <Text style={styles.filterChipText}>{t}</Text>
            </Pressable>
          ))}
        </ScrollView>

        {/* TODO 11 [Action Trigger Binding]: Attach an 'onPress' listener to trigger 'loadRandomQuote' */}
        <Pressable
          style={[styles.refreshButton, { backgroundColor: theme.colors.primary }]}
          onPress={loadRandomQuote}
        >
          <Ionicons name="refresh" size={18} color="#ffffff" />
          <Text style={styles.refreshButtonText}>Next Quote</Text>
        </Pressable>

        {/* TODO 24 [Favorite Action]: Render a heart <Pressable style={styles.favoriteButton}> below
            the Next Quote button that:
            - shows Ionicons "heart-outline" (or "heart" when the current quote is already favorited —
              useFavorites() also exposes isFavorite(quote))
            - onPress calls toggleFavorite(quote) to save/remove the current quote
            - then jumps to the Favorites tab with router.navigate('/favorites') */}
        {quote && (
          <Pressable
            style={styles.favoriteButton}
            onPress={() => {
              toggleFavorite(quote);
              router.navigate('/favorites');
            }}
            accessibilityRole="button"
            accessibilityLabel={
              isFavorite(quote) ? 'Remove quote from favorites' : 'Add quote to favorites'
            }
          >
            <Ionicons
              name={isFavorite(quote) ? 'heart' : 'heart-outline'}
              size={24}
              color={isFavorite(quote) ? '#e53935' : theme.colors.textSecondary}
            />
          </Pressable>
        )}
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
