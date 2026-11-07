
import React from 'react';
import { Animated, Pressable, StyleSheet, View } from 'react-native';
import {
  ActivityIndicator,
  Card,
  Text,
  useTheme,
} from 'react-native-paper';
import { router } from 'expo-router';
import * as WebBrowser from 'expo-web-browser';
import type { Photo } from '@/services/geoPhotoService';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

export default function MediaGallery({
  photos,
  loading,
  locationName,
}: {
  photos: Photo[];
  loading: boolean;
  locationName: string;
}) {
  const theme = useTheme();
  const isDark = theme.dark;

  const colors = {
    card: isDark ? '#064332' : '#D8F3DC',
    border: isDark ? '#176B50' : '#B7E4C7',
    text: isDark ? '#D1FAE5' : '#14532D',
    secondaryText: isDark ? '#A7F3D0' : '#166534',
    accent: isDark ? '#34D399' : '#0D9488',
    disabled: isDark ? '#86A99B' : '#729487',
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator
          animating={true}
          size="large"
          color={colors.accent}
        />
        <Text style={[styles.loadingText, { color: colors.secondaryText }]}>
          Finding beautiful spots...
        </Text>
      </View>
    );
  }

  if (!photos || photos.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <Text
          variant="bodyLarge"
          style={[styles.emptyText, { color: colors.text }]}
        >
          Ready to explore?
        </Text>

        <Text
          variant="bodyMedium"
          style={[styles.emptySubtext, { color: colors.secondaryText }]}
        >
          Search a place above or pick a region
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.grid}>
      {photos.map((photo, index) => (
        <AnimatedGridItem
          key={photo.id}
          photo={photo}
          index={index}
          colors={colors}
          locationName={locationName}
        />
      ))}
    </View>
  );
}

function AnimatedGridItem({
  photo,
  index,
  colors,
  locationName,
}: {
  photo: Photo;
  index: number;
  locationName: string;
  colors: {
    card: string;
    border: string;
    text: string;
    secondaryText: string;
    accent: string;
    disabled: string;
  };
}) {
  const fadeAnim = React.useRef(new Animated.Value(0)).current;
  const scaleAnim = React.useRef(new Animated.Value(0.94)).current;
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
            {
              scale: Animated.multiply(scaleAnim, pressScale),
            },
          ],
        },
      ]}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      onPress={() => {
        router.push({
          pathname: '/photo/[id]',
          params: {
            id: String(photo.id),
            imageUrl: photo.imageUrl,
            photographer: photo.photographer || '',
            photographerUrl: photo.photographerUrl || '',
            altText: photo.altText || '',
            locationName: locationName || 'Philippines',
          },
        });
      }}
    >
      <Card
        style={[
          styles.card,
          {
            backgroundColor: colors.card,
            borderColor: colors.border,
          },
        ]}
        elevation={2}
      >
        <Card.Cover
          source={{ uri: photo.imageUrl }}
          accessibilityLabel={photo.altText || 'Photo'}
          style={styles.cardImage}
        />

        <Card.Content style={styles.cardContent}>
          <Text
            variant="labelSmall"
            style={[
              styles.creditLabel,
              { color: colors.secondaryText },
            ]}
          >
            📸 Captured by:
          </Text>

          <Pressable
            onPress={async () => {
              if (photo.photographerUrl) {
                await WebBrowser.openBrowserAsync(
                  photo.photographerUrl,
                );
              }
            }}
            disabled={!photo.photographerUrl}
          >
            <Text
              variant="bodyMedium"
              style={[
                styles.photographerName,
                {
                  color: photo.photographerUrl
                    ? colors.accent
                    : colors.disabled,
                  textDecorationLine: photo.photographerUrl
                    ? 'underline'
                    : 'none',
                },
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
    opacity: 0.8,
  },

  emptyContainer: {
    paddingVertical: 48,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
    gap: 8,
  },

  emptyText: {
    opacity: 0.9,
    textAlign: 'center',
    fontWeight: '600',
  },

  emptySubtext: {
    opacity: 0.8,
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
    borderWidth: 1,
  },

  cardImage: {
    height: 160,
  },

  cardContent: {
    paddingBottom: 12,
    paddingTop: 8,
  },

  creditLabel: {
    opacity: 0.9,
    marginBottom: 2,
  },

  photographerName: {
    fontWeight: '600',
  },
});
