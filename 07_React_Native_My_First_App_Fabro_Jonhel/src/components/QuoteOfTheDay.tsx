import { useEffect, useRef, useState } from 'react';
import { Animated, Easing, Platform, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { getRandomQuote, getTags } from '@/services/quoteService';
import { useFavorites } from '@/favorites';
import { useTheme } from '@/theme';

export default function QuoteOfTheDay({ onNewQuote }: { onNewQuote?: () => void }) {
  
  type Quote = Awaited<ReturnType<typeof getRandomQuote>>;
  const [quote, setQuote] = useState<Quote>({} as Quote);
  const [tags, setTags] = useState<string[]>([]);
  const [selectedTag, setSelectedTag] = useState<string | null>(null);

  
  const selectTagRef = useRef<string | null>(null);

  // Extra (flip card): 0 = card faces you, 1 or -1 = card turned sideways, so it can't be seen.
  const flip = useRef(new Animated.Value(0)).current;
  const isFlipping = useRef(false);
  const rotateY = flip.interpolate({ inputRange: [-1, 0, 1], outputRange: ['-90deg', '0deg', '90deg'] });
  const turnCard = (toValue: number) =>
    new Promise<void>((resolve) => {
      Animated.timing(flip, {
        toValue,
        duration: 250,
        easing: toValue === 0 ? Easing.out(Easing.ease) : Easing.in(Easing.ease),
        useNativeDriver: Platform.OS !== 'web',
      }).start(() => resolve());
    });

  const loadRandomQuote = async () => {
   
    if (isFlipping.current) return; // Extra: ignore extra taps while the card is mid-flip
    isFlipping.current = true; // Extra
    const tag = selectTagRef.current ?? null;
    const turning = turnCard(1); // Extra: flip the card away while the quote loads
    const result = await getRandomQuote(tag);
    await turning; // Extra: wait until the card is sideways before swapping the text
    setQuote(result);
    setSelectedTag(tag);
    onNewQuote?.(); // Extra: let the Home screen pick a new background photo
    flip.setValue(-1); // Extra: jump to the other side (still sideways, so the jump can't be seen)
    await turnCard(0); // Extra: flip the card back to face you, now showing the new quote
    isFlipping.current = false; // Extra
  };

  const loadTags = async () => {
   
    const result = await getTags();
    setTags(result);
  };

  useEffect(() => {
    
    loadRandomQuote();
    loadTags();
  }, []);

  const theme = useTheme();
  
  const { toggleFavorite, isFavorite } = useFavorites();

  return (
    
    <Animated.View style={[styles.card, { backgroundColor: theme.colors.surface }, { transform: [{ perspective: 1000 }, { rotateY }] }]}>
      <Text style={[styles.overline, { color: theme.colors.textSecondary }]}>
        Quote of the Day
      </Text>

      <View style={styles.tagRow}>
        
        {quote.tags?.map((t: string) => (
          <View key={t} style={[styles.chip, selectedTag === t ? styles.chipActive : styles.chipInactive]}>
            <Text style={styles.chipText}>{t}</Text>
          </View>
        ))}
      </View>

      
      <Text style={[styles.quoteText, { color: theme.colors.text }]}>
        {'"' + (quote.text ?? '') + '"'}
      </Text>

      
      <Text style={[styles.author, { color: theme.colors.textSecondary }]}>
        — {quote.author}
      </Text>

      <View style={[styles.divider, { backgroundColor: theme.colors.border }]} />

      <View style={styles.controlsRow}>
       
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterRow}>
         
          <Pressable style={styles.filterChip} onPress={() => { selectTagRef.current = null; setSelectedTag(null); }}>
            <Text style={styles.filterChipText}>any</Text>
          </Pressable>
          
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

        
        <Pressable style={[styles.refreshButton, { backgroundColor: theme.colors.primary }]} onPress={loadRandomQuote}>
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
          <Ionicons name={isFavorite(quote) ? 'heart' : 'heart-outline'} size={28} color={theme.colors.primary} />
        </Pressable>
      </View>
    </Animated.View>
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
