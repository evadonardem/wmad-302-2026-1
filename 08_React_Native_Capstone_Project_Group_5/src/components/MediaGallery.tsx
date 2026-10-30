import { Pressable, StyleSheet, View } from 'react-native';
import { ActivityIndicator, Card, Text, useTheme } from 'react-native-paper';
import { router } from 'expo-router';
import * as WebBrowser from 'expo-web-browser';
import type { Photo } from '@/services/geoPhotoService';

export default function MediaGallery({ photos, loading }: { photos: Photo[]; loading: boolean }) {
  const theme = useTheme();

  // TODO 3.1 [Loading Skeletal Feedbacks]: If the 'loading' prop evaluates true, return a visual
  // waiting feedback layout instead of the gallery.
  // Pro Tip: render a Paper <ActivityIndicator /> (or loop mock placeholder Views) to show a
  // clean visual waiting state while photos are being fetched.
  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator animating size="large" />
      </View>
    );
  }

  // TODO 3.2 [Boundary Validation Checks]: If the photos array contains no records, return a
  // fallback layout displaying a simple status message like:
  // "No tourist spots found for this area yet."
  if (!photos || photos.length === 0) {
    return (
      <View style={styles.centered}>
        <Text variant="bodyMedium" style={{ color: theme.colors.onSurfaceVariant }}>
          No tourist spots found for this area yet.
        </Text>
      </View>
    );
  }

  return (
    // TODO 3.3 [Fluid Layout Architecture]: Build a responsive wrapping grid using flexbox
    // (the RN substitute for MUI <Grid> breakpoints): a row container with flexWrap enabled,
    // then map across your structured 'photos' payload elements inside it.
    <View style={styles.grid}>
      {/* TODO 3.4 [Card Content Loop Mapping]: Loop across the photo elements with a unique key,
          wrapping each one in a grid cell View (styles.gridItem) containing the Card template below. */}
      {/* [Your map loop here] */}
      {/* TODO 4.3 [Detail Navigation Trigger]: Make each grid cell (or its Card) pressable so a tap
          pushes the photo detail route (a DYNAMIC segment) with router.push:
            router.push({ pathname: '/photo/[id]', params: { id: String(photo.id), imageUrl: photo.imageUrl, photographer: photo.photographer, photographerUrl: photo.photographerUrl, altText: photo.altText } })
          Pass every field the detail screen needs — route params travel as strings, and the id
          becomes part of the URL path (/photo/12345?...). */}
      {photos.map((photo) => (
        <View key={photo.id} style={styles.gridItem}>
          <Card
            style={styles.card}
            elevation={2}
            onPress={() =>
              router.push({
                pathname: '/photo/[id]',
                params: {
                  id: String(photo.id),
                  imageUrl: photo.imageUrl,
                  photographer: photo.photographer,
                  photographerUrl: photo.photographerUrl,
                  altText: photo.altText,
                },
              })
            }
          >
            {/* TODO 3.5 [Multimedia Presentation Layer]: Render a Paper <Card.Cover /> image block.
                Set its source to {{ uri: photo.imageUrl }} and bind 'photo.altText' as the
                accessibilityLabel for the image asset. */}
            <Card.Cover source={{ uri: photo.imageUrl }} accessibilityLabel={photo.altText} />

            <Card.Content style={styles.cardContent}>
              <Text variant="labelSmall" style={styles.creditLabel}>
                📸 Captured by:
              </Text>
              {/* TODO 3.6 [Attribution Links]: Render the photographer credit as a Pressable Text.
                  Display 'photo.photographer' and, on press, open 'photo.photographerUrl' in the
                  device browser using WebBrowser.openBrowserAsync (RN has no <a> hyperlinks). */}
              <Pressable
                onPress={() => {
                  if (photo.photographerUrl) {
                    WebBrowser.openBrowserAsync(photo.photographerUrl);
                  }
                }}
                accessibilityRole="link"
                accessibilityLabel={`Open ${photo.photographer}'s profile`}
              >
                <Text
                  variant="bodyMedium"
                  style={{ color: theme.colors.primary, textDecorationLine: 'underline' }}
                >
                  {photo.photographer}
                </Text>
              </Pressable>
            </Card.Content>
          </Card>
        </View>
      ))}
      {/* End Loop */}
    </View>
  );
}

const styles = StyleSheet.create({
  centered: {
    width: '100%',
    alignItems: 'center',
    paddingVertical: 32,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    width: '100%',
  },
  gridItem: {
    flexGrow: 1,
    flexBasis: '30%',
    minWidth: 240,
  },
  card: {
    width: '100%',
    overflow: 'hidden',
  },
  cardContent: {
    paddingBottom: 12,
  },
  creditLabel: {
    opacity: 0.7,
  },
});