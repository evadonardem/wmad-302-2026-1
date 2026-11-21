import { useState } from 'react';
import { Dimensions, Image, StyleSheet, View } from 'react-native';
import QuoteOfTheDay from '@/components/QuoteOfTheDay';
import { useTheme } from '@/theme';

export default function HomeScreen() {
  const theme = useTheme();

  // Extra (random background): a random photo from Lorem Picsum (picsum.photos).
  // A random seed in the URL gives a random photo. It is downloaded first with Image.prefetch,
  // so the old photo stays on screen until the new one is ready.
  const [backgroundUri, setBackgroundUri] = useState<string | null>(null);

  const changeBackground = () => {
    const { width, height } = Dimensions.get('window');
    const size = width > height ? '1920/1080' : '1080/1920';
    const uri = `https://picsum.photos/seed/${Math.floor(Math.random() * 1000000)}/${size}`;
    Image.prefetch(uri)
      .then(() => setBackgroundUri(uri))
      .catch(() => {});
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      {/* Extra: background photo plus a dark tint (stronger in dark mode) so the card stands out */}
      {backgroundUri ? (
        <>
          <Image source={{ uri: backgroundUri }} style={StyleSheet.absoluteFill} resizeMode="cover" />
          <View
            style={[
              StyleSheet.absoluteFill,
              { backgroundColor: theme.mode === 'dark' ? 'rgba(0, 0, 0, 0.45)' : 'rgba(0, 0, 0, 0.15)' },
            ]}
          />
        </>
      ) : null}
      <QuoteOfTheDay onNewQuote={changeBackground} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
  },
});

