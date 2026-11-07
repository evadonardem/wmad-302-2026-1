import { StyleSheet, View } from 'react-native';
import { Image } from 'expo-image';
import { Text, useTheme } from 'react-native-paper';
import type { Photo } from '@/services/geoPhotoService';
import { useFeaturedPhotos } from '@/hooks/useFeaturedPhotos';

// Extra feature (not part of the assignment TODOs):
// the "Lakbay PH" title banner with a photo from the Pexels API behind it.
export default function HeroHeader({ backgroundPhoto }: { backgroundPhoto?: Photo }) {
  const theme = useTheme();
  const featured = useFeaturedPhotos();

  // The current search's top photo, otherwise the first featured Philippines photo.
  const photo = backgroundPhoto ?? featured[0];
  const hasPhoto = !!photo?.imageUrl;

  return (
    <View style={[styles.banner, hasPhoto && styles.bannerWithPhoto]}>
      {hasPhoto && photo && (
        <>
          <Image
            source={{ uri: photo.imageUrl }}
            style={StyleSheet.absoluteFill}
            contentFit="cover"
            transition={500}
            accessibilityLabel={photo.altText}
          />
          <View style={[StyleSheet.absoluteFill, styles.overlay]} pointerEvents="none" />
        </>
      )}

      <Text
        variant="headlineMedium"
        style={[styles.title, { color: hasPhoto ? '#FFFFFF' : theme.colors.onBackground }]}
      >
        🇵🇭 Lakbay PH
      </Text>
      <Text
        variant="bodyLarge"
        style={[styles.subtitle, { color: hasPhoto ? 'rgba(255, 255, 255, 0.9)' : theme.colors.onSurfaceVariant }]}
      >
        Explore tourist spots across regions, cities, and municipalities in the Philippines
      </Text>

      {/* Pexels asks apps to credit the photographer */}
      {hasPhoto && photo && (
        <Text variant="labelSmall" style={styles.credit} numberOfLines={1}>
          📸 {photo.photographer} on Pexels
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  banner: {
    width: '100%',
    marginBottom: 20,
    justifyContent: 'center',
  },
  bannerWithPhoto: {
    minHeight: 200,
    borderRadius: 20,
    overflow: 'hidden',
    paddingHorizontal: 20,
    paddingTop: 28,
    paddingBottom: 32,
  },
  overlay: {
    backgroundColor: 'rgba(0, 0, 0, 0.45)',
  },
  title: {
    fontWeight: 'bold',
    textAlign: 'center',
    textShadowColor: 'rgba(0, 0, 0, 0.35)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 4,
  },
  subtitle: {
    textAlign: 'center',
    marginTop: 4,
  },
  credit: {
    position: 'absolute',
    right: 12,
    bottom: 8,
    color: 'rgba(255, 255, 255, 0.8)',
  },
});
