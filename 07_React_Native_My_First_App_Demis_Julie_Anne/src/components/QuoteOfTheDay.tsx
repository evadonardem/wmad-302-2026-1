import { useEffect, useRef, useState } from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { getRandomQuote, getTags, type Quote } from '@/services/quoteService';
import { useFavorites } from '@/favorites';

const PURPLE = {
  card: '#4a1d82',
  chip: '#9c27b0',
  chipActive: '#2e7d32',
  button: '#2a00b3',
  text: '#ffffff',
  textSoft: '#d9c7f5',
  border: '#7b4cc2',
  menu: '#3a1568',
};

export default function QuoteOfTheDay() {
  const [quote, setQuote] = useState<Quote>({ text: '', author: '', tags: [] });
  const [tags, setTags] = useState<string[]>([]);
  const [selectedTag, setSelectedTag] = useState<string | null>(null);
  const [menuOpen, setMenuOpen] = useState(false);

  const selectTagRef = useRef<string | null>(null);

  const loadRandomQuote = async (tag: string | null = selectTagRef.current) => {
    const newQuote = await getRandomQuote(tag);
    setQuote(newQuote);
  };

  const loadTags = async () => {
    const newTags = await getTags();
    setTags(newTags);
  };

  useEffect(() => {
    loadRandomQuote();
    loadTags();
  }, []);

  const chooseTag = (tag: string | null) => {
    selectTagRef.current = tag;
    setSelectedTag(tag);
    setMenuOpen(false);
    loadRandomQuote(tag);
  };

  const { toggleFavorite, isFavorite } = useFavorites();

  return (
    <View style={styles.card}>
      <Text style={styles.overline}>Quote of the Day</Text>

      <View style={styles.tagRow}>
        {quote.tags?.map((t) => (
          <View key={t} style={styles.chip}>
            <Text style={styles.chipText}>{t}</Text>
          </View>
        ))}
      </View>

      <Text style={styles.quoteText}>{`"${quote.text ?? ''}"`}</Text>
      <Text style={styles.author}>{`— ${quote.author ?? ''}`}</Text>

      <View style={styles.divider} />

      <View style={styles.controlsRow}>
        {/* one dropdown button for all categories */}
        <Pressable style={styles.dropdown} onPress={() => setMenuOpen(true)}>
          <Text style={styles.dropdownText} numberOfLines={1}>
            {selectedTag ?? 'any'}
          </Text>
          <Ionicons name="chevron-down" size={18} color="#ffffff" />
        </Pressable>

        <Pressable style={styles.refreshButton} onPress={() => loadRandomQuote()}>
          <Ionicons name="refresh" size={18} color="#ffffff" />
          <Text style={styles.refreshButtonText}>Next Quote</Text>
        </Pressable>
      </View>

      <Pressable
        style={styles.favoriteButton}
        onPress={() => {
          if (!quote.text) return;
          toggleFavorite(quote);
          router.navigate('/favorites');
        }}
      >
        <Ionicons
          name={quote.text && isFavorite(quote) ? 'heart' : 'heart-outline'}
          size={28}
          color="#ff6b8a"
        />
      </Pressable>

      {/* category picker */}
      <Modal
        visible={menuOpen}
        transparent
        animationType="fade"
        onRequestClose={() => setMenuOpen(false)}
      >
        <Pressable style={styles.backdrop} onPress={() => setMenuOpen(false)}>
          <View style={styles.menu}>
            <Text style={styles.menuTitle}>Choose a category</Text>
            <ScrollView>
              <Pressable
                style={[styles.menuItem, selectedTag === null && styles.menuItemActive]}
                onPress={() => chooseTag(null)}
              >
                <Text style={styles.menuItemText}>any</Text>
              </Pressable>
              {tags.map((t) => (
                <Pressable
                  key={t}
                  style={[styles.menuItem, selectedTag === t && styles.menuItemActive]}
                  onPress={() => chooseTag(t)}
                >
                  <Text style={styles.menuItemText}>{t}</Text>
                </Pressable>
              ))}
            </ScrollView>
          </View>
        </Pressable>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    width: '100%',
    maxWidth: 520,
    alignSelf: 'center',
    padding: 16,
    borderRadius: 12,
    gap: 8,
    backgroundColor: PURPLE.card,
  },
  overline: {
    fontSize: 12,
    textTransform: 'uppercase',
    letterSpacing: 1,
    color: PURPLE.textSoft,
  },
  tagRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  chip: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
    backgroundColor: PURPLE.chip,
  },
  chipText: {
    fontSize: 12,
    color: PURPLE.text,
  },
  quoteText: {
    fontSize: 20,
    fontStyle: 'italic',
    lineHeight: 28,
    color: PURPLE.text,
  },
  author: {
    fontSize: 14,
    textAlign: 'right',
    color: PURPLE.textSoft,
  },
  divider: {
    height: 1,
    marginVertical: 8,
    backgroundColor: PURPLE.border,
  },
  controlsRow: {
    flexDirection: 'row',
    gap: 10,
  },
  dropdown: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: PURPLE.border,
  },
  dropdownText: {
    color: PURPLE.text,
    fontSize: 14,
    flexShrink: 1,
  },
  refreshButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 10,
    borderRadius: 8,
    backgroundColor: PURPLE.button,
  },
  refreshButtonText: {
    color: '#ffffff',
    fontWeight: '600',
  },
  favoriteButton: {
    alignSelf: 'center',
    padding: 4,
  },
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  menu: {
    width: '100%',
    maxWidth: 360,
    maxHeight: 380,
    borderRadius: 12,
    padding: 12,
    backgroundColor: PURPLE.menu,
  },
  menuTitle: {
    color: PURPLE.textSoft,
    fontSize: 12,
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 8,
  },
  menuItem: {
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 8,
  },
  menuItemActive: {
    backgroundColor: PURPLE.chip,
  },
  menuItemText: {
    color: PURPLE.text,
    fontSize: 15,
  },
});