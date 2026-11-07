import { useCallback, useState } from 'react';
import { Image, Modal, Pressable, ScrollView, Share, StyleSheet, View } from 'react-native';
import {
  ActivityIndicator,
  Button,
  Card,
  Divider,
  IconButton,
  Text,
  useTheme,
} from 'react-native-paper';
import { router } from 'expo-router';
import * as WebBrowser from 'expo-web-browser';
import type { Photo } from '@/services/geoPhotoService';
import { useFavorites } from '@/favorites';

const PER_PAGE = 6;

function Lightbox({
  photos,
  index,
  placeName,
  onChange,
  onClose,
}: {
  photos: Photo[];
  index: number;
  placeName: string;
  onChange: (i: number) => void;
  onClose: () => void;
}) {
  const photo = photos[index];
  const { favorites, likedPhotos, toggleFavorite, toggleLike } = useFavorites();

  const go = useCallback(
    (d: number) => onChange((index + d + photos.length) % photos.length),
    [index, photos.length, onChange],
  );

  const share = async () => {
    try {
      await Share.share({
        title: placeName,
        message: photo.pageUrl ? `${photo.altText}\n${photo.pageUrl}` : photo.altText,
      });
    } catch {
      /* cancelled */
    }
  };

  // RN can't trigger a file download the way a browser can; open the original so it can be saved.
  const download = () => {
    const url = photo.originalUrl ?? photo.fullUrl ?? photo.imageUrl;
    WebBrowser.openBrowserAsync(url);
  };

  const openDetails = () => {
    onClose();
    router.push({
      pathname: '/photo/[id]',
      params: {
        id: String(photo.id),
        imageUrl: photo.imageUrl,
        photographer: photo.photographer,
        photographerUrl: photo.photographerUrl,
        altText: photo.altText,
      },
    });
  };

  const liked = likedPhotos.some((item) => item.id === photo.id);
  const faved = favorites.some((item) => item.id === photo.id);

  return (
    <Modal visible transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.backdrop}>
        <View style={styles.sheet}>
          <View style={styles.imageWrap}>
            <Image
              source={{ uri: photo.fullUrl ?? photo.imageUrl }}
              accessibilityLabel={photo.altText}
              style={styles.fullImage}
              resizeMode="contain"
            />
            <IconButton
              icon="chevron-left"
              iconColor="#fff"
              containerColor="rgba(0,0,0,.45)"
              accessibilityLabel="Previous photo"
              onPress={() => go(-1)}
              style={styles.arrowLeft}
            />
            <IconButton
              icon="chevron-right"
              iconColor="#fff"
              containerColor="rgba(0,0,0,.45)"
              accessibilityLabel="Next photo"
              onPress={() => go(1)}
              style={styles.arrowRight}
            />
          </View>

          <ScrollView style={styles.info} contentContainerStyle={styles.infoContent}>
            <IconButton
              icon="close"
              iconColor="#fff"
              accessibilityLabel="Close"
              onPress={onClose}
              style={styles.close}
            />
            <Text variant="labelSmall" style={styles.light}>
              {placeName} · {index + 1} of {photos.length}
            </Text>
            <Text variant="titleLarge" style={styles.title}>
              {photo.altText}
            </Text>
            <Divider style={styles.divider} />
            <Text variant="labelSmall" style={styles.light}>
              📸 Captured by:
            </Text>
            <Pressable
              onPress={() => WebBrowser.openBrowserAsync(photo.photographerUrl)}
              accessibilityRole="link"
            >
              <Text variant="bodyMedium" style={styles.link}>
                {photo.photographer}
              </Text>
            </Pressable>

            <View style={styles.actions}>
              <Button mode="contained" icon="download" onPress={download}>
                Download
              </Button>
              <Button mode="outlined" icon="share-variant" textColor="#fff" onPress={share}>
                Share
              </Button>
              <Button
                mode={liked ? 'contained' : 'outlined'}
                icon={liked ? 'thumb-up' : 'thumb-up-outline'}
                textColor={liked ? undefined : '#fff'}
                onPress={() => toggleLike(photo)}
              >
                {liked ? 'Liked' : 'Like'}
              </Button>
              <Button
                mode={faved ? 'contained' : 'outlined'}
                icon={faved ? 'heart' : 'heart-outline'}
                textColor={faved ? undefined : '#fff'}
                onPress={() => toggleFavorite(photo)}
              >
                {faved ? 'Favorited' : 'Favorite'}
              </Button>
              <Button mode="text" icon="open-in-new" textColor="#fff" onPress={openDetails}>
                Open details
              </Button>
            </View>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

export default function MediaGallery({
  photos,
  loading,
  placeName = '',
  errorMessage = '',
}: {
  photos: Photo[];
  loading: boolean;
  placeName?: string;
  errorMessage?: string;
}) {
  const theme = useTheme();
  const { favorites, toggleFavorite } = useFavorites();
  const [openIndex, setOpenIndex] = useState<number | null>(null);
  const [page, setPage] = useState(1);
  const [previousPhotos, setPreviousPhotos] = useState(photos);

  if (previousPhotos !== photos) {
    setPreviousPhotos(photos);
    setOpenIndex(null);
    setPage(1);
  }

  // TODO 3.1 [Loading Skeletal Feedbacks]
  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator animating size="large" />
        <Text
          variant="bodyMedium"
          style={[styles.statusText, { color: theme.colors.onBackground }]}
        >
          Loading photos...
        </Text>
      </View>
    );
  }

  if (errorMessage) {
    return (
      <View style={styles.centered}>
        <Text
          variant="titleMedium"
          style={[styles.statusText, { color: theme.colors.onBackground }]}
        >
          {errorMessage}
        </Text>
      </View>
    );
  }

  // TODO 3.2 [Boundary Validation Checks]
  if (!photos || photos.length === 0) {
    return (
      <View style={styles.centered}>
        <Text
          variant="titleMedium"
          style={[styles.statusText, { color: theme.colors.onBackground }]}
        >
          {placeName
            ? 'No tourist spots found for this area yet.'
            : 'Select a region and city or municipality, then search for photos.'}
        </Text>
      </View>
    );
  }

  const totalPages = Math.ceil(photos.length / PER_PAGE);
  const start = (page - 1) * PER_PAGE;
  const visiblePhotos = photos.slice(start, start + PER_PAGE);

  return (
    <>
      {/* TODO 3.3 [Fluid Layout Architecture] */}
      <View style={styles.grid}>
        {/* TODO 3.4 [Card Content Loop Mapping] */}
        {visiblePhotos.map((photo, i) => (
          <View key={photo.id} style={styles.gridItem}>
            {/* Tap = enlarge (lightbox); "Open details" inside it does the TODO 4.3 router.push */}
            <Card
              style={[styles.card, { backgroundColor: theme.colors.surface }]}
              elevation={2}
            >
              {/* TODO 3.5 [Multimedia Presentation Layer] */}
              <View style={styles.imageContainer}>
                <Pressable
                  onPress={() => setOpenIndex(start + i)}
                  accessibilityRole="button"
                  accessibilityLabel={`Open photo: ${photo.altText}`}
                >
                  <Card.Cover
                    source={{ uri: photo.imageUrl }}
                    accessibilityLabel={photo.altText}
                    style={styles.cardCover}
                  />
                </Pressable>
                <IconButton
                  icon={favorites.some((item) => item.id === photo.id) ? 'heart' : 'heart-outline'}
                  iconColor={favorites.some((item) => item.id === photo.id) ? '#ff4d67' : '#fff'}
                  containerColor="rgba(0,0,0,0.55)"
                  size={20}
                  style={styles.heartButton}
                  onPress={() => toggleFavorite(photo)}
                  accessibilityRole="button"
                  accessibilityLabel={
                    favorites.some((item) => item.id === photo.id)
                      ? `Remove ${photo.altText} from favorites`
                      : `Add ${photo.altText} to favorites`
                  }
                />
              </View>

              <Card.Content style={styles.cardContent}>
                <View style={styles.creditRow}>
                  <Text
                    variant="labelSmall"
                    style={[styles.creditLabel, { color: theme.colors.onSurfaceVariant }]}
                  >
                    Captured by:
                  </Text>
                {/* TODO 3.6 [Attribution Links] */}
                <Pressable
                  onPress={() => WebBrowser.openBrowserAsync(photo.photographerUrl)}
                  accessibilityRole="link"
                  accessibilityLabel={`Open ${photo.photographer}'s profile`}
                >
                  <Text
                    variant="labelSmall"
                    style={[styles.linkDark, { color: theme.colors.primary }]}
                  >
                    {photo.photographer}
                  </Text>
                </Pressable>
                </View>
              </Card.Content>
            </Card>
          </View>
        ))}
      </View>

      {totalPages > 1 && (
        <View style={styles.pagination}>
          <IconButton
            icon="chevron-left"
            disabled={page === 1}
            accessibilityLabel="Previous page"
            onPress={() => setPage((p) => Math.max(1, p - 1))}
          />
          <Text variant="bodyMedium">
            Page {page} of {totalPages}
          </Text>
          <IconButton
            icon="chevron-right"
            disabled={page === totalPages}
            accessibilityLabel="Next page"
            onPress={() => setPage((p) => Math.min(totalPages, p + 1))}
          />
        </View>
      )}

      {openIndex !== null && photos[openIndex] && (
        <Lightbox
          photos={photos}
          index={openIndex}
          placeName={placeName}
          onChange={setOpenIndex}
          onClose={() => setOpenIndex(null)}
        />
      )}
    </>
  );
}

const styles = StyleSheet.create({
  centered: { alignItems: 'center', justifyContent: 'center', paddingVertical: 48, gap: 12 },
  statusText: { textAlign: 'center', maxWidth: 620 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 16, width: '100%' },
  gridItem: { flexGrow: 1, flexBasis: '31%', minWidth: 200 },
  card: { width: '100%', overflow: 'hidden', borderRadius: 5 },
  imageContainer: { position: 'relative' },
  cardCover: { height: 150, borderRadius: 0 },
  heartButton: { position: 'absolute', top: 4, right: 4, margin: 0 },
  cardContent: { paddingTop: 11, paddingBottom: 11, minHeight: 40 },
  creditRow: { flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', gap: 4 },
  creditLabel: { fontSize: 10 },
  linkDark: { textDecorationLine: 'underline', fontWeight: '600', fontSize: 10 },
  pagination: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginTop: 16,
  },

  // Lightbox
  backdrop: { flex: 1, backgroundColor: 'rgba(5,15,25,.92)', justifyContent: 'center' },
  sheet: { flex: 1, paddingTop: 40, paddingBottom: 16 },
  imageWrap: { flex: 1, justifyContent: 'center' },
  fullImage: { width: '100%', height: '100%' },
  arrowLeft: { position: 'absolute', left: 8, top: '45%' },
  arrowRight: { position: 'absolute', right: 8, top: '45%' },
  info: { maxHeight: '40%' },
  infoContent: { padding: 16, gap: 8 },
  close: { position: 'absolute', top: 0, right: 0, zIndex: 1 },
  light: { color: '#fff', opacity: 0.8 },
  title: { color: '#fff', fontWeight: '600', paddingRight: 40 },
  divider: { backgroundColor: 'rgba(255,255,255,.25)', marginVertical: 4 },
  link: { color: '#fff', fontWeight: '600', textDecorationLine: 'underline' },
  actions: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 8 },
});
