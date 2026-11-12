import React, { useState, useEffect, useRef } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ActivityIndicator, ScrollView } from 'react-native';
import { fetchRandomQuote, fetchQuoteTags, Quote, Tag } from '../services/quoteService';
import { useTheme } from '../theme'; // Import Theme Context
import { useRouter } from 'expo-router';

interface QuoteOfTheDayProps {
  onSaveFavorite?: (quote: Quote) => void;
}

export const QuoteOfTheDay: React.FC<QuoteOfTheDayProps> = ({ onSaveFavorite }) => {
  // TODO 1: State management hooks
  const [quote, setQuote] = useState<Quote | null>(null);
  const [tags, setTags] = useState<Tag[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [selectedTag, setSelectedTag] = useState<string>('');

  // TODO 2: Mutable reference (useRef) to track selected tag without triggering extra re-renders
  const activeTagRef = useRef<string>('');
  
  const { theme } = useTheme();
  const router = useRouter();

  // TODO 3 & 4: Concurrent initial load on component mount using useEffect
  useEffect(() => {
    loadInitialData();
  }, []);

  const loadInitialData = async () => {
    setLoading(true);
    const [initialQuote, availableTags] = await Promise.all([
      fetchRandomQuote(),
      fetchQuoteTags(),
    ]);
    setQuote(initialQuote);
    setTags(availableTags);
    setLoading(false);
  };

  // TODO 5 & 6: Fetch quote based on active tag ref
  const handleFetchQuote = async (tag?: string) => {
    setLoading(true);
    const currentTag = tag !== undefined ? tag : activeTagRef.current;
    const newQuote = await fetchRandomQuote(currentTag);
    setQuote(newQuote);
    setLoading(false);
  };

  // TODO 7: Handle category filter chip selection
  const handleSelectTag = (tagName: string) => {
    const nextTag = activeTagRef.current === tagName ? '' : tagName;
    activeTagRef.current = nextTag;
    setSelectedTag(nextTag);
    handleFetchQuote(nextTag);
  };

  // TODO 24: Save favorite & optionally navigate
  const handleSaveFavorite = () => {
    if (quote && onSaveFavorite) {
      onSaveFavorite(quote);
    }
  };

  if (loading && !quote) {
    return (
      <View style={[styles.container, { backgroundColor: theme.background }]}>
        <ActivityIndicator size="large" color={theme.primary} />
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      {/* TODO 8: Render Tag Filter Chips */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipContainer}>
        {tags.map((t) => {
          const isSelected = selectedTag === t.name;
          return (
            <TouchableOpacity
              key={t._id}
              onPress={() => handleSelectTag(t.name)}
              style={[
                styles.chip,
                { backgroundColor: isSelected ? theme.primary : theme.cardBg },
              ]}
            >
              <Text style={{ color: isSelected ? '#FFFFFF' : theme.text }}>
                {t.name}
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      {/* TODO 9 & 10: Display Quote Text & Author */}
      {quote && (
        <View style={[styles.quoteCard, { backgroundColor: theme.cardBg }]}>
          <Text style={[styles.quoteContent, { color: theme.text }]}>
            "{quote.content}"
          </Text>
          <Text style={[styles.quoteAuthor, { color: theme.subtext }]}>
            - {quote.author}
          </Text>

          {/* TODO 11: Render Tag Chips on Card */}
          <View style={styles.tagRow}>
            {quote.tags?.map((tagItem, idx) => (
              <View key={idx} style={[styles.smallChip, { backgroundColor: theme.chipBg }]}>
                <Text style={[styles.smallChipText, { color: theme.text }]}>#{tagItem}</Text>
              </View>
            ))}
          </View>
        </View>
      )}

      {/* Action Buttons */}
      <View style={styles.buttonRow}>
        <TouchableOpacity
          style={[styles.button, { backgroundColor: theme.primary }]}
          onPress={() => handleFetchQuote()}
        >
          <Text style={styles.buttonText}>New Quote</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.button, { backgroundColor: '#E91E63' }]}
          onPress={handleSaveFavorite}
        >
          <Text style={styles.buttonText}>❤️ Favorite</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16, justifyContent: 'center' },
  chipContainer: { maxHeight: 50, marginBottom: 20 },
  chip: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20, marginRight: 8 },
  quoteCard: { padding: 24, borderRadius: 16, marginBottom: 20, elevation: 3 },
  quoteContent: { fontSize: 18, fontStyle: 'italic', marginBottom: 12, textAlign: 'center' },
  quoteAuthor: { fontSize: 14, fontWeight: 'bold', textAlign: 'right', marginBottom: 12 },
  tagRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  smallChip: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 12 },
  smallChipText: { fontSize: 11 },
  buttonRow: { flexDirection: 'row', justifyContent: 'space-around' },
  button: { paddingVertical: 12, paddingHorizontal: 24, borderRadius: 10 },
  buttonText: { color: '#FFF', fontWeight: '600' },
});