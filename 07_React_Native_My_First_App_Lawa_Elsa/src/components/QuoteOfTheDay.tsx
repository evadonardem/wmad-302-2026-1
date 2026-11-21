import { useEffect, useRef, useState } from 'react';
import {
  Animated,
  Image,
  ImageBackground,
  Platform,
  Pressable,
  ScrollView,
  Share,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useFonts, PlayfairDisplay_400Regular_Italic } from '@expo-google-fonts/playfair-display';
import { DancingScript_700Bold } from '@expo-google-fonts/dancing-script';
import { getRandomQuote, getTags, type Quote } from '@/services/quoteService';
import { useFavorites } from '@/favorites';
import { useTheme } from '@/theme';

const photoFor = (text: string | undefined, salt: string, w: number, h: number) => {
  const s = `${text ?? 'quote'}${salt}`;
  let hash = 0;
  for (let i = 0; i < s.length; i++) hash = (hash * 31 + s.charCodeAt(i)) | 0;
  return `https://picsum.photos/seed/${Math.abs(hash)}/${w}/${h}`;
};

const BG_SIZE = { w: 1000, h: 800 };
const CARD_SIZE = { w: 600, h: 600 };

const preload = (uris: string[]) =>
  Promise.race([
    Promise.all(uris.map((u) => Image.prefetch(u).catch(() => false))),
    new Promise((resolve) => setTimeout(resolve, 2500)),
  ]);

export default function QuoteOfTheDay() {
  // TODO 1 [State Initialization]: Define local state variables for:
  // - 'quote': Stores the current quote object (default: empty object)
  // - 'tags': Stores an array of all available category tags (default: empty array)
  // - 'selectedTag': Tracks the string name of the active filter tag (default: null)
  const [quote, setQuote] = useState<Quote>({} as Quote);
  const [tags, setTags] = useState<string[]>([]);
  const [selectedTag, setSelectedTag] = useState<string | null>(null);
  const [note, setNote] = useState('');

  // TODO 2 [Reference Hook]: Create a React mutable reference named 'selectTagRef' that tracks
  // the currently selected filter tag value without triggering a re-render when it changes.
  // Initialize it to null (meaning "any" tag). Hint: useRef<string | null>(null)
  const selectTagRef = useRef<string | null>(null);

  // Extra feature: the NEXT quote (and its photos) is prepared in the background,
  // so pressing "Next Quote" shows everything instantly.
  const nextRef = useRef<{ tag: string | null; quote: Quote } | null>(null);
  const prefetchId = useRef(0);

  const prefetchNext = async (tag: string | null) => {
    const id = ++prefetchId.current;
    const result = await getRandomQuote(tag);
    if (result.author === 'System') return; // don't keep the error fallback
    await preload([
      photoFor(result.text, 'bg', BG_SIZE.w, BG_SIZE.h),
      photoFor(result.text, 'card', CARD_SIZE.w, CARD_SIZE.h),
    ]);
    // keep it only if it is still the latest request and the filter did not change
    if (id === prefetchId.current && (selectTagRef.current ?? null) === tag) {
      nextRef.current = { tag, quote: result };
    }
  };

  const loadRandomQuote = async () => {
    // TODO 3 [Async Request Handler]:
    // a. Read the current tag value from 'selectTagRef' (fallback to null if undefined)
    // b. Call 'getRandomQuote(tag)' asynchronously with that value
    // c. Update both your 'quote' state and 'selectedTag' state with the returned values
    const tag = selectTagRef.current ?? null;
    let result: Quote;

    const ready = nextRef.current;
    if (ready && ready.tag === tag) {
      // instant: the quote and photos were prepared earlier
      result = ready.quote;
      nextRef.current = null;
    } else {
      result = await getRandomQuote(tag);
    }

    setQuote(result);
    setSelectedTag(tag);

    // prepare the following quote in the background
    prefetchNext(tag);
  };

  const loadTags = async () => {
    // TODO 4 [Async List Population]: Fetch tags asynchronously using
    // 'getTags()' and store them into your tags state array
    const result = await getTags();
    setTags(result);
  };

  useEffect(() => {
    // TODO 5 [Component Lifecycle]: Execute both 'loadRandomQuote' and
    // 'loadTags' when the component mounts
    loadRandomQuote();
    loadTags();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const theme = useTheme();
  // Used by TODO 24 below.
  const { toggleFavorite, isFavorite } = useFavorites();

  // Extra feature: custom fonts (the app still works with default fonts while they load)
  const [fontsLoaded] = useFonts({
    PlayfairDisplay_400Regular_Italic,
    DancingScript_700Bold,
  });

  // Extra feature: fade-in animation every time the quote changes
  const fade = useRef(new Animated.Value(1)).current;
  useEffect(() => {
    fade.setValue(0);
    Animated.timing(fade, {
      toValue: 1,
      duration: 400,
      useNativeDriver: Platform.OS !== 'web',
    }).start();
  }, [quote.text, fade]);

  // Extra feature: share the current quote (share sheet on phone, clipboard fallback on web)
  const shareQuote = async () => {
    const message = `"${quote.text}" — ${quote.author}`;
    try {
      await Share.share({ message });
    } catch (e) {
      if ((e as Error)?.name === 'AbortError') return;
      try {
        await (globalThis as any).navigator?.clipboard?.writeText(message);
        setNote('Copied to clipboard');
        setTimeout(() => setNote(''), 2000);
      } catch {
        // nothing else to try
      }
    }
  };

  // When the filter changes, drop the prepared quote and prepare a new one for that filter
  const changeFilter = (tag: string | null) => {
    selectTagRef.current = tag;
    setSelectedTag(tag);
    nextRef.current = null;
    prefetchNext(tag);
  };

  const overlayColor = theme.mode === 'dark' ? 'rgba(0,0,0,0.7)' : 'rgba(15,25,40,0.5)';
  const buttonTextColor = theme.mode === 'dark' ? '#0b1a2b' : '#ffffff';

  return (
    <View style={styles.root}>
      {/* Full-screen photo background + dark overlay */}
      <ImageBackground
        source={{ uri: photoFor(quote.text, 'bg', BG_SIZE.w, BG_SIZE.h) }}
        style={StyleSheet.absoluteFill}
        resizeMode="cover"
      >
        <View style={styles.pageOverlay} />
      </ImageBackground>

      <View style={styles.card}>
        {/* The card has its own photo too, with an overlay so the text is always readable */}
        <ImageBackground
          source={{ uri: photoFor(quote.text, 'card', CARD_SIZE.w, CARD_SIZE.h) }}
          style={styles.cardInner}
          resizeMode="cover"
        >
          <View style={[StyleSheet.absoluteFill, { backgroundColor: overlayColor }]} />

          <Text style={styles.overline}>Quote of the Day</Text>

          <View style={styles.tagRow}>
            {/* TODO 6 [Conditional Chip List]: Map through 'quote.tags'. For each tag 't':
                - Render a tag chip <View> with a unique key containing a <Text> label={t}
                - Apply styles.chipActive if 'selectedTag' matches 't', otherwise styles.chipInactive
                - Give the chip styles.chip for spacing */}
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

          <Animated.View style={{ opacity: fade }}>
            {/* TODO 7 [Text Content Mapping]: Bind 'quote.text' directly
                inside the quotation marks below */}
            <Text
              style={[
                styles.quoteText,
                fontsLoaded && { fontFamily: 'PlayfairDisplay_400Regular_Italic', fontStyle: 'normal' },
              ]}
            >
              {`"${quote.text ?? ''}"`}
            </Text>

            {/* TODO 8 [Author Content Mapping]: Bind 'quote.author' after
                the long dash separator symbol */}
            <Text
              style={[
                styles.author,
                fontsLoaded && { fontFamily: 'DancingScript_700Bold' },
              ]}
            >
              — {quote.author}
            </Text>
          </Animated.View>

          <View style={[styles.divider, { backgroundColor: 'rgba(255,255,255,0.35)' }]} />

          <View style={styles.controlsRow}>
            {/* TODO 9 [Reference-Fed Options]: No dropdown exists in React Native — instead, every
                filter chip you render below must write the tapped tag into 'selectTagRef.current'
                (and into your 'selectedTag' state so the colors update) inside its onPress handler.
                The "any" chip resets both to null. */}
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterRow}>
              {/* Base option: filtering by any tag. Wire its onPress so it
                  clears the selection. */}
              <Pressable
                style={[styles.filterChip, selectedTag === null && styles.filterChipActive]}
                onPress={() => changeFilter(null)}
              >
                <Text style={styles.filterChipText}>any</Text>
              </Pressable>

              {/* TODO 10 [Select Option Generation]: Map through your 'tags' state array to render a
                  filter chip <Pressable> for each tag 't', with label={t} and an onPress handler
                  that updates both 'selectTagRef' and 'selectedTag' (see TODO 9). */}
              {tags.map((t) => (
                <Pressable
                  key={t}
                  style={[styles.filterChip, selectedTag === t && styles.filterChipActive]}
                  onPress={() => changeFilter(t)}
                >
                  <Text style={styles.filterChipText}>{t}</Text>
                </Pressable>
              ))}
            </ScrollView>

            {/* TODO 11 [Action Trigger Binding]: Attach an 'onPress'
                listener to trigger 'loadRandomQuote' */}
            <Pressable
              style={[styles.refreshButton, { backgroundColor: theme.colors.primary }]}
              onPress={loadRandomQuote}
            >
              <Ionicons name="refresh" size={18} color={buttonTextColor} />
              <Text style={[styles.refreshButtonText, { color: buttonTextColor }]}>Next Quote</Text>
            </Pressable>

            {/* TODO 24 [Favorite Action]: Render a heart <Pressable style={styles.favoriteButton}> below
                the Next Quote button that:
                - shows Ionicons "heart-outline" (or "heart" when the current quote is already favorited —
                  useFavorites() also exposes isFavorite(quote))
                - onPress calls toggleFavorite(quote) to save/remove the current quote
                - then jumps to the Favorites tab with router.navigate('/favorites') */}
            <View style={styles.bottomRow}>
              <Text style={styles.note}>{note}</Text>

              <View style={styles.iconRow}>
                <Pressable style={styles.favoriteButton} onPress={shareQuote}>
                  <Ionicons name="share-social-outline" size={24} color="#ffffff" />
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
                    color={isFavorite(quote) ? '#ff5a6e' : '#ffffff'}
                  />
                </Pressable>
              </View>
            </View>
          </View>
        </ImageBackground>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    backgroundColor: '#1b2430',
  },
  pageOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.35)',
  },
  card: {
  maxWidth: 500,
  width: '100%',
  borderRadius: 22,
  padding: 6,
  backgroundColor: 'rgba(255,255,255,0.22)',
  borderWidth: 1,
  borderColor: 'rgba(255,255,255,0.4)',
  elevation: 5,
  shadowColor: '#000',
  shadowOffset: { width: 0, height: 4 },
  shadowOpacity: 0.25,
  shadowRadius: 12,
},
cardInner: {
  borderRadius: 16,
  overflow: 'hidden',
  padding: 24,
},
  overline: {
    fontSize: 12,
    letterSpacing: 2,
    textTransform: 'uppercase',
    textAlign: 'center',
    marginBottom: 16,
    color: 'rgba(255,255,255,0.8)',
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
    fontSize: 22,
    fontStyle: 'italic',
    lineHeight: 32,
    textAlign: 'center',
    marginBottom: 12,
    color: '#ffffff',
    textShadowColor: 'rgba(0,0,0,0.5)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 4,
  },
  author: {
    fontSize: 18,
    textAlign: 'right',
    marginBottom: 16,
    color: '#ffd9a0',
    textShadowColor: 'rgba(0,0,0,0.5)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
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
    borderColor: 'rgba(255,255,255,0.6)',
    backgroundColor: 'rgba(255,255,255,0.12)',
  },
  filterChipActive: {
    backgroundColor: '#2e7d32',
    borderColor: '#2e7d32',
  },
  filterChipText: {
    fontSize: 13,
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
  bottomRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  note: {
    color: 'rgba(255,255,255,0.85)',
    fontSize: 12,
  },
  iconRow: {
    flexDirection: 'row',
    gap: 8,
  },
  favoriteButton: {
    padding: 10,
    borderRadius: 24,
    backgroundColor: 'rgba(255,255,255,0.18)',
  },
});