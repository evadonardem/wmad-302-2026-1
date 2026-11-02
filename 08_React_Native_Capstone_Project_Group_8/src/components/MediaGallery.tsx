import React from 'react';
import { Animated, Pressable, StyleSheet, View } from 'react-native';
import { ActivityIndicator, Card, Text } from 'react-native-paper';
import { router } from 'expo-router';
import * as WebBrowser from 'expo-web-browser';
import type { Photo } from '@/services/geoPhotoService';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

export default function MediaGallery({ photos, loading }: { photos: Photo[]; loading: boolean }) {
  // TODO 3.1 ✅ COMPLETED — Loading Feedback
  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator animating={true} size="large" color="#0d9488" />
        <Text style={styles.loadingText}>Finding beautiful spots...</Text>
      </View>
    );
  }

  // TODO 3.2 ✅ COMPLETED — Empty State
  if (!photos || photos.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <Text variant="bodyLarge" style={styles.emptyText}>
          Ready to explore?
        </Text>
        <Text variant="bodyMedium" style={styles.emptySubtext}>
          Search a place above or pick a region
        </Text>
      </View>
    );
  }

  // TODO 3.3 → 3.6 ✅ COMPLETED — Grid, Mapping, Navigation, Image, Attribution
  return (
    <View style={styles.grid}>
      {photos.map((photo, index) => (
        <AnimatedGridItem key={photo.id} photo={photo} index={index} />
      ))}
    </View>
  );
}

// Separate animated item component
function AnimatedGridItem({ photo, index }: { photo: Photo; index: number }) {
  // Fade-in + entrance animation (kept exactly as you have)
  const fadeAnim = React.useRef(new Animated.Value(0)).current;
  const scaleAnim = React.useRef(new Animated.Value(0.94)).current;

  // ✨ NEW: Press lift effect
  const pressScale = React.useRef(new Animated.Value(1)).current;

  React.useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 600,
        delay: index * 120,
        useNativeDriver: true,
      }),
      Animated.timing(scaleAnim, {
        toValue: 1,
        duration: 500,
        delay: index * 120,
        useNativeDriver: true,
      }),
    ]).start();
  }, [fadeAnim, scaleAnim, index]);

  const handlePressIn = () => {
    Animated.timing(pressScale, {
      toValue: 0.96,
      duration: 150,
      useNativeDriver: true,
    }).start();
  };

  const handlePressOut = () => {
    Animated.timing(pressScale, {
      toValue: 1,
      duration: 200,
      useNativeDriver: true,
    }).start();
  };

  return (
    <AnimatedPressable
      style={[
        styles.gridItem,
        {
          opacity: fadeAnim,
          transform: [
            { scale: Animated.multiply(scaleAnim, pressScale) },
          ],
        },
      ]}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      onPress={() => {
        // TODO 4.3 ✅ COMPLETED — Detail Navigation
        router.push({
          pathname: '/photo/[id]',
          params: {
            id: String(photo.id),
            imageUrl: photo.imageUrl,
            photographer: photo.photographer || '',
            photographerUrl: photo.photographerUrl || '',
            altText: photo.altText || '',
          },
        });
      }}
    >
      <Card style={styles.card} elevation={2}>
        {/* TODO 3.5 ✅ COMPLETED — Photo Image */}
        <Card.Cover
          source={{ uri: photo.imageUrl }}
          accessibilityLabel={photo.altText || 'Photo'}
          style={styles.cardImage}
        />

        <Card.Content style={styles.cardContent}>
          <Text variant="labelSmall" style={styles.creditLabel}>
            📸 Captured by:
          </Text>

          {/* TODO 3.6 ✅ COMPLETED — Photographer Link */}
          <Pressable
            onPress={async () => {
              if (photo.photographerUrl) {
                await WebBrowser.openBrowserAsync(photo.photographerUrl);
              }
            }}
            disabled={!photo.photographerUrl}
          >
            <Text
              variant="bodyMedium"
              style={[
                styles.photographerName,
                !photo.photographerUrl && styles.photographerNameDisabled,
              ]}
            >
              {photo.photographer || 'Unknown Photographer'}
            </Text>
          </Pressable>
        </Card.Content>
      </Card>
    </AnimatedPressable>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    paddingVertical: 48,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  loadingText: {
    opacity: 0.6,
  },
  emptyContainer: {
    paddingVertical: 48,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
    gap: 8,
  },
  emptyText: {
    opacity: 0.8,
    textAlign: 'center',
    fontWeight: '600',
  },
  emptySubtext: {
    opacity: 0.5,
    textAlign: 'center',
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
    borderRadius: 20,
  },
  cardImage: {
    height: 160,
  },
  cardContent: {
    paddingBottom: 12,
    paddingTop: 8,
  },
  creditLabel: {
    opacity: 0.7,
    marginBottom: 2,
  },
  photographerName: {
    color: '#2196F3',
    textDecorationLine: 'underline',
  },
  photographerNameDisabled: {
    color: '#999',
    textDecorationLine: 'none',
  },
});