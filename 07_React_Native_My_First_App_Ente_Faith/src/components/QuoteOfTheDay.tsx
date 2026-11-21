import { useFavorites } from '@/favorites';
import { getRandomQuote, getTags } from '@/services/quoteService';
import { useTheme } from '@/theme';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import React, { useEffect, useRef, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

export default function QuoteOfTheDay() {
  const [quote, setQuote] = useState<any>({}); 
  const [tags, setTags] = useState<string[]>([]);
  const [selectedTag, setSelectedTag] = useState<string | null>(null);

  
  const selectTagRef = useRef<string | null>(null);
  const loadRandomQuote = async () => {
    const tag = selectTagRef.current || null;
    const newQuote = await getRandomQuote(tag);
    setQuote(newQuote);
    setSelectedTag(tag); 
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

  const favorited = quote && quote.text ? isFavorite(quote) : false;

  return (
    <View style={[styles.card, { backgroundColor: theme.colors.surface }]}>
      <Text style={[styles.overline, { color: theme.colors.textSecondary }]}>
        Quote of the Day
      </Text>

      <View style={styles.tagRow}>
        {}
        {quote.tags && quote.tags.map((t: string, index: number) => (
          <View 
            key={`${t}-${index}`} 
            style={[
              styles.chip, 
              selectedTag === t ? styles.chipActive : styles.chipInactive
            ]}
          >
            <Text style={styles.chipText}>{t}</Text>
          </View>
        ))}
      </View>

      {}
      <Text style={[styles.quoteText, { color: theme.colors.text }]}>
        "{quote.text || "Loading quote..."}"
      </Text>

      {}
      <Text style={[styles.author, { color: theme.colors.textSecondary }]}>
        — {quote.author || "Unknown"}
      </Text>

      <View style={[styles.divider, { backgroundColor: theme.colors.border }]} />

      <View style={styles.controlsRow}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterRow}>
          
          {}
          <Pressable 
            style={[
              styles.filterChip,
              selectedTag === null && { backgroundColor: theme.colors.surface, borderColor: theme.colors.primary }
            ]}
            onPress={() => {
              selectTagRef.current = null;
              setSelectedTag(null);
              loadRandomQuote();
            }}
          >
            <Text style={[styles.filterChipText, { color: theme.colors.text }]}>any</Text>
          </Pressable>

          {}
          {tags.map((t: string, index: number) => (
            <Pressable 
              key={`${t}-${index}`}
              style={[
                styles.filterChip,
                selectedTag === t && { backgroundColor: theme.colors.surface, borderColor: theme.colors.primary }
              ]}
              onPress={() => {
                selectTagRef.current = t;
                setSelectedTag(t);
                loadRandomQuote(); 
              }}
            >
              <Text style={[styles.filterChipText, { color: theme.colors.text }]}>{t}</Text>
            </Pressable>
          ))}
          
        </ScrollView>

        {}
        <Pressable 
          style={[styles.refreshButton, { backgroundColor: theme.colors.primary }]}
          onPress={loadRandomQuote}
        >
          <Ionicons name="refresh" size={18} color="#ffffff" />
          <Text style={styles.refreshButtonText}>Next Quote</Text>
        </Pressable>

        {}
        <Pressable 
          style={styles.favoriteButton}
          onPress={() => {
            toggleFavorite(quote);
            router.navigate('/favorites');
          }}
        >
          <Ionicons 
            name={favorited ? "heart" : "heart-outline"} 
            size={28} 
            color="#e91e63" 
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