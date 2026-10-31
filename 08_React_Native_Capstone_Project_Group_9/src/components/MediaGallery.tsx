import { Pressable, StyleSheet, View } from 'react-native';
import { ActivityIndicator, Card, Text, useTheme } from 'react-native-paper';
import { router } from 'expo-router';
import * as WebBrowser from 'expo-web-browser';
import type { Photo } from '@/services/geoPhotoService';

export default function MediaGallery({ photos, loading }: { photos: Photo[]; loading: boolean }) {
  const theme = useTheme();

  // TODO 3.1 [Loading Skeletal Feedbacks]
  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" animating />
      </View>
    );
  }

  // TODO 3.2 [Boundary Validation Checks]
  if (!photos || photos.length === 0) {
    return (
      <View style={styles.center}>
        <Text variant="bodyMedium" style={{ color: theme.colors.onSurfaceVariant }}>
          No tourist spots found for this area yet.
        </Text>
      </View>
    );
  }

  return (
    // TODO 3.3 [Fluid Layout Architecture]
    <View style={styles.grid}>
      {/* TODO 3.4 [Card Content Loop Mapping] */}
      {photos.map((photo) => (
        <View key={String(photo.id)} style={styles.gridItem}>
          {/* TODO 4.3 [Detail Navigation Trigger] */}
          <Pressable
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
            <Card style={styles.card} elevation={2}>
              {/* TODO 3.5 [Multimedia Presentation Layer] */}
              <Card.Cover
                source={{ uri: photo.imageUrl }}
                accessibilityLabel={photo.altText}
              />

              <Card.Content style={styles.cardContent}>
                <Text variant="labelSmall" style={styles.creditLabel}>
                  📸 Captured by:
                </Text>
                {/* TODO 3.6 [Attribution Links] */}
                <Pressable
                  onPress={() => {
                    if (photo.photographerUrl) {
                      WebBrowser.openBrowserAsync(photo.photographerUrl);
                    }
                  }}
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
          </Pressable>
        </View>
      ))}
      {/* End Loop */}
    </View>
  );
}

const styles = StyleSheet.create({
  center: {
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