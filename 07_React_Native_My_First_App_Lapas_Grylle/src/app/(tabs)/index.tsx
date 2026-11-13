import { StyleSheet, Text, View, SafeAreaView, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import QuoteOfTheDay from '@/components/QuoteOfTheDay';
import { useTheme } from '@/theme';

export default function HomeScreen() {
  const theme = useTheme();

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        
        <View style={styles.intro}>
          <View style={[styles.eyebrowBadge, { backgroundColor: `${theme.colors.primary}15` }]}>
            <Ionicons name="moon" size={14} color={theme.colors.primary} />
            <Text style={[styles.eyebrowText, { color: theme.colors.primary }]}>Daily Inspiration</Text>
          </View>
          
          <Text 
            style={[styles.title, { color: theme.colors.text }]}
            numberOfLines={1}
            adjustsFontSizeToFit
          >
            Pause. Breathe. Read.
          </Text>
          
          <Text style={[styles.subtitle, { color: theme.colors.textSecondary }]}>
            A moment of clarity for your busy mind. Find the words you didn&apos;t know you needed today.
          </Text>
        </View>
        
        <View style={styles.quoteWrapper}>
          <QuoteOfTheDay />
        </View>

      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    width: '100%',
  },
  scrollContent: {
    paddingHorizontal: 24,
    paddingTop: 20,
    paddingBottom: 40,
  },
  intro: {
    gap: 14,
    marginBottom: 32,
  },
  eyebrowBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  eyebrowText: {
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  title: {
    fontSize: 34,
    fontWeight: '900',
    letterSpacing: -1,
    lineHeight: 42,
    width: '100%',
  },
  subtitle: {
    fontSize: 16,
    lineHeight: 24,
    maxWidth: '95%',
  },
  quoteWrapper: {
    marginTop: 8,
  }
});