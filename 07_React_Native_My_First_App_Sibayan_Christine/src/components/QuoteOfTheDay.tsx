import { useEffect, useRef, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { getRandomQuote, getTags, type Quote } from '@/services/quoteService';
import { useFavorites } from '@/favorites';
import { useTheme } from '@/theme';

export default function QuoteOfTheDay() {
  // TODO 1 [State Initialization]:
  // Define local state variables for:
  // - 'quote': Stores the current quote object (default: empty object)
  // - 'tags': Stores an array of all available category tags (default: empty array)
  // - 'selectedTag': Tracks the active filter tag (default: null)
  const [quote, setQuote] = useState<Partial<Quote>>({});
  const [tags, setTags] = useState<string[]>([]);
  const [selectedTag, setSelectedTag] = useState<string | null>(null);

  // TODO 2 [Reference Hook]:
  // Create a mutable reference named 'selectTagRef' that tracks the active filter
  // without triggering a re-render. Initialize it to null.
  const selectTagRef = useRef<string | null>(null);

  // TODO 3 [Async Request Handler]:
  // Read the current tag, request a quote asynchronously, and update quote state.
  const loadRandomQuoteForTag = async (tag: string | null) => {
    try {
      const result = await getRandomQuote(tag);
      setQuote(result ?? {});
    } catch (error) {
      console.error('Failed to load a random quote:', error);
    }
  };

  const loadRandomQuote = async () => {
    await loadRandomQuoteForTag(selectTagRef.current ?? null);
  };

  // TODO 4 [Async List Population]:
  // Fetch tags asynchronously using getTags() and store them in the tags state.
  // The getTags() call below performs this as part of the initial concurrent request.

  // TODO 5 [Component Lifecycle]:
  // Fetch the initial random quote and tag list concurrently on component mount.
  // The cancellation flag prevents state updates if the component unmounts first.
  useEffect(() => {
    let cancelled = false;

    const initialize = async () => {
      try {
        const [initialQuote, availableTags] = await Promise.all([
          getRandomQuote(null),
          getTags(),
        ]);

        if (!cancelled) {
          setQuote(initialQuote ?? {});
          setTags(availableTags ?? []);
          setSelectedTag(null);
          selectTagRef.current = null;
        }
      } catch (error) {
        if (!cancelled) {
          console.error('Failed to initialize the quote generator:', error);
        }
      }
    };

    void initialize();

    return () => {
      cancelled = true;
    };
  }, []);

  const theme = useTheme();
  const { toggleFavorite, isFavorite } = useFavorites();
  const hasQuote = Boolean(quote.text && quote.author);

  return (
    <View style={[styles.card, { backgroundColor: theme.colors.surface }]}>
      <Text style={[styles.overline, { color: theme.colors.textSecondary }]}>
        Quote of the Day
      </Text>

      {/* TODO 6 [Conditional Chip List]:
          Map through quote.tags and render each tag as a chip.
          Use a unique key and apply active/inactive styles based on selectedTag. */}
      <View style={styles.tagRow}>
        {quote.tags?.map((tag) => (
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

      {/* TODO 7 [Text Content Mapping]:
          Display quote.text inside quotation marks. */}
      <Text style={[styles.quoteText, { color: theme.colors.text }]}>
        {quote.text ? `"${quote.text}"` : 'Loading quote...'}
      </Text>

      {/* TODO 8 [Author Content Mapping]:
          Display quote.author after the long dash separator. */}
      <Text style={[styles.author, { color: theme.colors.textSecondary }]}>
        {quote.author ? `— ${quote.author}` : ''}
      </Text>

      <View style={[styles.divider, { backgroundColor: theme.colors.border }]} />

      <View style={styles.controlsRow}>
        {/* TODO 9 [Reference-Fed Options]:
            The "any" chip resets the selected tag reference and state to null.
            It also requests a quote without a category filter. */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filterRow}
        >
          <Pressable
            style={[
              styles.filterChip,
              selectedTag === null && { backgroundColor: theme.colors.primary },
            ]}
            onPress={() => {
              selectTagRef.current = null;
              setSelectedTag(null);
              void loadRandomQuoteForTag(null);
            }}
          >
            <Text
              style={[
                styles.filterChipText,
                { color: selectedTag === null ? '#ffffff' : theme.colors.text },
              ]}
            >
              any
            </Text>
          </Pressable>

          {/* TODO 10 [Select Option Generation]:
              Map through the tags array to render a filter chip for every tag.
              Update both selectTagRef and selectedTag, then fetch a matching quote. */}
          {tags.map((tag) => (
            <Pressable
              key={tag}
              style={[
                styles.filterChip,
                selectedTag === tag && { backgroundColor: theme.colors.primary },
              ]}
              onPress={() => {
                selectTagRef.current = tag;
                setSelectedTag(tag);
                void loadRandomQuoteForTag(tag);
              }}
            >
              <Text
                style={[
                  styles.filterChipText,
                  { color: selectedTag === tag ? '#ffffff' : theme.colors.text },
                ]}
              >
                {tag}
              </Text>
            </Pressable>
          ))}
        </ScrollView>

        {/* TODO 11 [Action Trigger Binding]:
            Attach an onPress handler to load another quote using the active filter. */}
        <Pressable
          style={[styles.refreshButton, { backgroundColor: theme.colors.primary }]}
          onPress={() => {
            void loadRandomQuote();
          }}
        >
          <Ionicons name="refresh" size={18} color="#ffffff" />
          <Text style={styles.refreshButtonText}>Next Quote</Text>
        </Pressable>

        {/* TODO 24 [Favorite Action]:
            - Render a heart icon, filled when the quote is already a favorite.
            - Call toggleFavorite to add or remove the quote.
            - Navigate to the Favorites tab using Expo Router. */}
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={
            isFavorite(quote as Quote)
              ? 'Remove from favorites'
              : 'Add to favorites'
          }
          disabled={!hasQuote}
          style={styles.favoriteButton}
          onPress={() => {
            if (!hasQuote) return;
            toggleFavorite(quote as Quote);
            router.navigate('/favorites');
          }}
        >
          <Ionicons
            name={isFavorite(quote as Quote) ? 'heart' : 'heart-outline'}
            size={28}
            color={theme.colors.primary}
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