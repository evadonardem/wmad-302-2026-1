import { Pressable, StyleSheet, View } from 'react-native';
import { ActivityIndicator, Card, Text, useTheme } from 'react-native-paper';
import { router } from 'expo-router';
import * as WebBrowser from 'expo-web-browser';
import type { Photo } from '@/services/geoPhotoService';

export default function MediaGallery({ photos, loading }: { photos: Photo[]; loading: boolean }) {
  const theme = useTheme();
  if (loading) {
    return (
      <View style={[styles.state, { backgroundColor: theme.colors.surfaceVariant }]}>
        <ActivityIndicator size="large" />
        <Text variant="titleMedium" style={styles.stateTitle}>Finding beautiful places</Text>
        <Text variant="bodySmall" style={styles.stateBody}>Curating your next adventure...</Text>
      </View>
    );
  }

  if (!photos || photos.length === 0) {
    return (
      <View style={[styles.state, { backgroundColor: theme.colors.surfaceVariant }]}>
        <Text style={styles.stateIcon}>◌</Text>
        <Text variant="titleMedium" style={styles.stateTitle}>Your gallery is waiting</Text>
        <Text variant="bodyMedium" style={styles.stateBody}>Choose a destination above to reveal its beautiful spots.</Text>
      </View>
    );
  }

  return (
    <View style={styles.grid}>
      {photos.map((photo) => (
        <View key={photo.id} style={styles.gridItem}>
          <Card
            style={styles.card}
            elevation={2}
            onPress={() => router.push({
              pathname: '/photo/[id]',
              params: {
                id: String(photo.id),
                imageUrl: photo.imageUrl,
                photographer: photo.photographer,
                photographerUrl: photo.photographerUrl,
                altText: photo.altText,
              },
            })}
          >
            <Card.Cover source={{ uri: photo.imageUrl }} accessibilityLabel={photo.altText} />
            <Card.Content style={styles.cardContent}>
              <Text variant="labelSmall" style={[styles.creditLabel, { color: theme.colors.onSurfaceVariant }]}>CAPTURED BY</Text>
              <Pressable
                disabled={!photo.photographerUrl}
                onPress={() => WebBrowser.openBrowserAsync(photo.photographerUrl)}
                accessibilityRole="link"
              >
                <Text variant="bodyMedium" style={[styles.credit, { color: theme.colors.primary }]}>{photo.photographer}</Text>
              </Pressable>
            </Card.Content>
          </Card>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
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
    borderRadius: 18,
    backgroundColor: '#FFFFFF',
  },
  cardContent: {
    paddingBottom: 12,
  },
  creditLabel: {
    opacity: 0.7,
    letterSpacing: 1,
    marginBottom: 3,
  },
  credit: {
    fontWeight: '600',
  },
  state: {
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 28,
    paddingVertical: 44,
    width: '100%',
    borderRadius: 22,
  },
  stateIcon: {
    fontSize: 42,
    color: '#E58B2A',
    lineHeight: 48,
  },
  stateTitle: {
    fontWeight: '800',
  },
  stateBody: {
    textAlign: 'center',
    opacity: 0.7,
  },
});
