import { useEffect, useState } from 'react';
import { Modal, Platform, Pressable, Share, StyleSheet, View, useWindowDimensions } from 'react-native';
import { Image } from 'expo-image';
import { ActivityIndicator, Card, Icon, IconButton, Text, useTheme } from 'react-native-paper';
import { router } from 'expo-router';
import * as WebBrowser from 'expo-web-browser';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as FileSystem from 'expo-file-system/legacy';
import * as MediaLibrary from 'expo-media-library';
import type { Photo } from '@/services/geoPhotoService';

const SERIF = Platform.select({ ios: 'Georgia', android: 'serif', default: 'Georgia, "Times New Roman", serif' });

// Photos shown per page
const PAGE_SIZE = 9;

const FAVORITES_KEY = 'phnavyra:favorites';

// Saves the photo: in the browser it downloads the file, on a phone it saves it into the photo gallery
async function downloadPhoto(photo: Photo): Promise<string> {
  try {
    if (Platform.OS === 'web') {
      const response = await fetch(photo.imageUrl);
      const blob = await response.blob();
      const doc = (globalThis as any).document;
      const link = doc.createElement('a');
      link.href = (globalThis as any).URL.createObjectURL(blob);
      link.download = `phnavyra-${photo.id}.jpg`;
      doc.body.appendChild(link);
      link.click();
      doc.body.removeChild(link);
      return 'Downloaded!';
    }
    const permission = await MediaLibrary.requestPermissionsAsync(true);
    if (!permission.granted) {
      return 'Allow photo access to save pictures.';
    }
    const file = await FileSystem.downloadAsync(photo.imageUrl, `${FileSystem.cacheDirectory}phnavyra-${photo.id}.jpg`);
    await MediaLibrary.saveToLibraryAsync(file.uri);
    return 'Saved to your gallery!';
  } catch (error) {
    console.warn('Download failed:', error);
    // Last resort: open the picture so it can be saved by hand
    WebBrowser.openBrowserAsync(photo.imageUrl);
    return 'Opened the photo to save it by hand.';
  }
}

// Small icon + label button used in the popup
function ActionButton({
  icon,
  label,
  color,
  background,
  onPress,
}: {
  icon: string;
  label: string;
  color: string;
  background: string;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={label}
      style={[styles.action, { backgroundColor: background }]}
    >
      {/* the icon only draws; the whole button is the touch area */}
      {/* FIX: uses Paper's plain <Icon> instead of <IconButton>, so there is no <button> nested inside this button on web */}
      <View style={styles.actionIcon}>
        <Icon source={icon} color={color} size={22} />
      </View>
      <Text style={[styles.actionLabel, { color }]}>{label}</Text>
    </Pressable>
  );
}

export default function MediaGallery({
  photos,
  loading,
  recommendations = [],
  searchedName = '',
  regionName = '',
}: {
  photos: Photo[];
  loading: boolean;
  // Fallback photos from other municipalities of the same region (used when 'photos' is empty)
  recommendations?: Photo[];
  searchedName?: string;
  regionName?: string;
}) {
  const theme = useTheme();
  const { width } = useWindowDimensions();

  // Current page (0 = first); a new search starts again on page 1
  const [page, setPage] = useState(0);
  const [selected, setSelected] = useState<number | null>(null);
  const { height } = useWindowDimensions();

  // Favorites (kept on the device) and the "show only favorites" switch
  const [favorites, setFavorites] = useState<Photo[]>([]);
  const [favoritesLoaded, setFavoritesLoaded] = useState(false);
  const [showFavorites, setShowFavorites] = useState(false);
  const [notice, setNotice] = useState('');

  useEffect(() => {
    AsyncStorage.getItem(FAVORITES_KEY)
      .then((value) => {
        if (value) {
          setFavorites(JSON.parse(value));
        }
      })
      .catch(() => undefined)
      .finally(() => setFavoritesLoaded(true));
  }, []);

  useEffect(() => {
    if (favoritesLoaded) {
      AsyncStorage.setItem(FAVORITES_KEY, JSON.stringify(favorites)).catch(() => undefined);
    }
  }, [favorites, favoritesLoaded]);

  useEffect(() => {
    if (!notice) {
      return undefined;
    }
    const timer = setTimeout(() => setNotice(''), 2500);
    return () => clearTimeout(timer);
  }, [notice]);

  const isFavorite = (photo: Photo) => favorites.some((f) => f.id === photo.id);
  const toggleFavorite = (photo: Photo) => {
    const already = isFavorite(photo);
    setFavorites((current) => (already ? current.filter((f) => f.id !== photo.id) : [photo, ...current]));
    setNotice(already ? 'Removed from favorites' : 'Added to favorites ♥');
  };

  useEffect(() => {
    setPage(0);
    setSelected(null);
  }, [photos, recommendations, showFavorites]);

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator animating size="large" />
        <Text variant="bodyMedium" style={{ color: theme.colors.onSurfaceVariant, marginTop: 12 }}>
          Finding tourist spots…
        </Text>
      </View>
    );
  }

  // Nothing found for the search, but spots from other places of the same region are ready to suggest
  const isRecommending = !showFavorites && photos.length === 0 && recommendations.length > 0;
  const list = showFavorites ? favorites : isRecommending ? recommendations : photos;

  // Switch bar: all photos / favorites (always visible, so favorites can be opened even before a search)
  const favoriteBar = (
    <View style={styles.favoriteBar}>
      <Pressable
        onPress={() => setShowFavorites(false)}
        style={[styles.favoriteChip, !showFavorites && { backgroundColor: theme.colors.primary }]}
        accessibilityRole="button"
      >
        <Text style={{ color: !showFavorites ? theme.colors.onPrimary : theme.colors.onSurface, fontWeight: '700' }}>
          All photos
        </Text>
      </Pressable>
      <Pressable
        onPress={() => setShowFavorites(true)}
        style={[styles.favoriteChip, showFavorites && { backgroundColor: theme.colors.secondary }]}
        accessibilityRole="button"
      >
        <Text style={{ color: showFavorites ? theme.colors.onSecondary : theme.colors.onSurface, fontWeight: '700' }}>
          ♥ Favorites ({favorites.length})
        </Text>
      </Pressable>
    </View>
  );

  if (!list || list.length === 0) {
    return (
      <View>
        {favoriteBar}
        <View style={[styles.empty, { borderColor: theme.colors.outlineVariant }]}>
          <Text style={styles.emptyIcon}>{showFavorites ? '♥' : '🧭'}</Text>
          <Text variant="bodyMedium" style={{ color: theme.colors.onSurfaceVariant, textAlign: 'center' }}>
            {showFavorites
              ? 'No favorites yet. Tap the heart on a photo to save it here.'
              : 'No tourist spots found for this area yet.'}
          </Text>
        </View>
      </View>
    );
  }

  // Columns follow the screen width: 1 on phones, 2 on tablets, 3 on desktops (every card has the same size)
  const isWide = width >= 820 && width > height;
  const columns = width >= 900 ? 3 : width >= 560 ? 2 : 1;
  const itemWidth = `${100 / columns}%` as `${number}%`;

  const pageCount = Math.max(1, Math.ceil(list.length / PAGE_SIZE));
  const safePage = Math.min(page, pageCount - 1);
  const pageStart = safePage * PAGE_SIZE;
  const pagePhotos = list.slice(pageStart, pageStart + PAGE_SIZE);
  const selectedPhoto = selected !== null ? (list[selected] ?? null) : null;

  return (
    <View>
      {favoriteBar}
      {isRecommending && (
        <View style={[styles.recoBox, { backgroundColor: theme.colors.secondaryContainer, borderColor: theme.colors.secondary }]}>
          <Text style={[styles.recoTitle, { color: theme.colors.onSecondaryContainer }]}>
            🧭 No photos found for {searchedName}
          </Text>
          <Text variant="bodyMedium" style={{ color: theme.colors.onSecondaryContainer, textAlign: 'center' }}>
            You may like these tourist spots from other places in {regionName || 'the same region'}.
          </Text>
        </View>
      )}
      <View style={styles.grid}>
        {pagePhotos.map((photo) => (
          <View key={photo.id} style={[styles.gridItem, { width: itemWidth }]}>
            <Card style={[styles.card, { backgroundColor: theme.colors.surface }]} elevation={3}>
              <View>
                <Pressable
                  onPress={() => setSelected(pageStart + pagePhotos.indexOf(photo))}
                  accessibilityRole="button"
                  accessibilityLabel={`Open photo: ${photo.altText}`}
                >
                  <Card.Cover source={{ uri: photo.imageUrl }} accessibilityLabel={photo.altText} style={styles.cover} />
                  {/* Caption on a dark band at the bottom of the photo */}
                  <View pointerEvents="none" style={styles.captionBand}>
                    <Text numberOfLines={2} style={styles.captionText}>
                      {photo.altText}
                    </Text>
                  </View>
                </Pressable>
                <IconButton
                  icon={isFavorite(photo) ? 'heart' : 'heart-outline'}
                  iconColor={isFavorite(photo) ? '#FF5A7A' : '#FFFFFF'}
                  containerColor="rgba(0,0,0,0.45)"
                  size={22}
                  style={styles.heart}
                  onPress={() => toggleFavorite(photo)}
                  accessibilityLabel={isFavorite(photo) ? 'Remove from favorites' : 'Add to favorites'}
                />
              </View>

              <Card.Content style={styles.cardContent}>
                <View style={[styles.goldBar, { backgroundColor: theme.colors.secondary }]} />
                {photo.place ? (
                  <Text numberOfLines={1} style={[styles.placeLabel, { color: theme.colors.primary }]}>
                    📍 {photo.place}
                  </Text>
                ) : null}
                <Text variant="labelSmall" style={styles.creditLabel}>
                  📸 Captured by:
                </Text>
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
                    numberOfLines={1}
                    style={{ color: theme.colors.primary, textDecorationLine: 'underline', fontWeight: '600' }}
                  >
                    {photo.photographer}
                  </Text>
                </Pressable>
              </Card.Content>
            </Card>
          </View>
        ))}
      </View>

      {/* Page buttons: previous / page numbers / next, centred below the photos */}
      {pageCount > 1 && (
        <View style={styles.pagerWrap}>
          <View style={styles.pager}>
            <IconButton
              icon="chevron-left"
              mode="contained-tonal"
              disabled={safePage === 0}
              onPress={() => setPage(safePage - 1)}
              accessibilityLabel="Previous page"
            />
            {Array.from({ length: pageCount }, (_, i) => (
              <Pressable
                key={i}
                onPress={() => setPage(i)}
                accessibilityRole="button"
                accessibilityLabel={`Page ${i + 1}`}
                style={[
                  styles.pageNumber,
                  i === safePage && { backgroundColor: theme.colors.primary },
                ]}
              >
                <Text
                  style={{
                    color: i === safePage ? theme.colors.onPrimary : theme.colors.onSurface,
                    fontWeight: '700',
                    fontFamily: SERIF,
                  }}
                >
                  {i + 1}
                </Text>
              </Pressable>
            ))}
            <IconButton
              icon="chevron-right"
              mode="contained-tonal"
              disabled={safePage >= pageCount - 1}
              onPress={() => setPage(safePage + 1)}
              accessibilityLabel="Next page"
            />
          </View>
          <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant }}>
            Page {safePage + 1} of {pageCount} · Photos {pageStart + 1}–{Math.min(pageStart + PAGE_SIZE, list.length)} of{' '}
            {list.length}
          </Text>
        </View>
      )}

      <Modal visible={selectedPhoto !== null} transparent animationType="fade" onRequestClose={() => setSelected(null)}>
        <View style={styles.backdrop}>
          <Pressable style={StyleSheet.absoluteFill} onPress={() => setSelected(null)} accessibilityLabel="Close photo" />
          {selectedPhoto && (
            <View
              style={[
                styles.popup,
                isWide && styles.popupWide,
                { height: Math.min(height * 0.9, isWide ? 560 : 720), backgroundColor: theme.colors.surface, borderTopColor: theme.colors.secondary },
              ]}
            >
              <View style={isWide ? styles.popupImageWide : styles.popupImageBox}>
                <Image
                  source={{ uri: selectedPhoto.imageUrl }}
                  style={StyleSheet.absoluteFill}
                  contentFit="cover"
                  transition={200}
                  accessibilityLabel={selectedPhoto.altText}
                />
                {notice ? (
                  <View style={styles.noticePill}>
                    <Text style={styles.noticeText}>{notice}</Text>
                  </View>
                ) : null}
              </View>

              <View style={[styles.popupBody, isWide && styles.popupBodyWide]}>
                {/* DESIGN: soft background shapes (they only draw, they never catch touches) */}
                <View pointerEvents="none" style={[styles.decoCircleBig, { backgroundColor: theme.colors.primary }]} />
                <View pointerEvents="none" style={[styles.decoCircleSmall, { backgroundColor: theme.colors.secondary }]} />
                <View pointerEvents="none" style={[styles.decoRing, { borderColor: theme.colors.secondary }]} />

                {/* DESIGN: little landscape (sun + mountains) along the bottom of the panel, wide screens only */}
                {isWide && (
                  <View pointerEvents="none" style={styles.landscape}>
                    <View style={[styles.sun, { backgroundColor: theme.colors.secondary }]} />
                    <View style={[styles.mountain, styles.mountainBack, { borderBottomColor: theme.colors.primary }]} />
                    <View style={[styles.mountain, styles.mountainSmall, { borderBottomColor: theme.colors.primary }]} />
                    <View style={[styles.mountain, styles.mountainFront, { borderBottomColor: theme.colors.primary }]} />
                  </View>
                )}

                {/* DESIGN: small label above the caption (wide screens only, phones keep the compact layout) */}
                {isWide && (
                  <View style={styles.eyebrowRow}>
                    <View style={[styles.eyebrowDot, { backgroundColor: theme.colors.secondary }]} />
                    <Text style={[styles.eyebrowText, { color: theme.colors.primary }]}>
                      {selectedPhoto.place ? `${selectedPhoto.place.toUpperCase()} · PHILIPPINES` : 'TOURIST SPOT · PHILIPPINES'}
                    </Text>
                  </View>
                )}

                <Text variant="titleMedium" numberOfLines={isWide ? 6 : 2} style={[styles.popupCaption, { color: theme.colors.onSurface }]}>
                  {selectedPhoto.altText}
                </Text>

                {/* DESIGN: gold divider with a diamond in the middle (wide screens only) */}
                {isWide && (
                  <View style={styles.dividerRow}>
                    <View style={[styles.dividerGold, { backgroundColor: theme.colors.secondary }]} />
                    <View style={[styles.dividerDiamond, { backgroundColor: theme.colors.secondary }]} />
                    <View style={[styles.dividerLine, { backgroundColor: theme.colors.outlineVariant }]} />
                  </View>
                )}

                <View style={[styles.popupPager, { backgroundColor: theme.colors.primaryContainer }]}>
                  <IconButton
                    icon="chevron-left"
                    iconColor={theme.colors.onPrimaryContainer}
                    size={22}
                    style={styles.pagerArrow}
                    disabled={selected === 0}
                    onPress={() => setSelected((selected ?? 0) - 1)}
                    accessibilityLabel="Previous photo"
                  />
                  <Pressable
                    style={styles.popupCredit}
                    onPress={() => {
                      if (selectedPhoto.photographerUrl) {
                        WebBrowser.openBrowserAsync(selectedPhoto.photographerUrl);
                      }
                    }}
                    accessibilityRole="link"
                  >
                    <Text numberOfLines={1} style={{ color: theme.colors.onPrimaryContainer, fontWeight: '700', textAlign: 'center' }}>
                      📸 Captured by {selectedPhoto.photographer}
                    </Text>
                  </Pressable>
                  <IconButton
                    icon="chevron-right"
                    iconColor={theme.colors.onPrimaryContainer}
                    size={22}
                    style={styles.pagerArrow}
                    disabled={selected === list.length - 1}
                    onPress={() => setSelected((selected ?? 0) + 1)}
                    accessibilityLabel="Next photo"
                  />
                </View>

                {/* Favorite / Download / Share / Full page */}
                <View style={styles.actions}>
                  <ActionButton
                    icon={isFavorite(selectedPhoto) ? 'heart' : 'heart-outline'}
                    label={isFavorite(selectedPhoto) ? 'Saved' : 'Favorite'}
                    color={isFavorite(selectedPhoto) ? '#FFFFFF' : theme.colors.onSurface}
                    background={isFavorite(selectedPhoto) ? '#E0446A' : theme.colors.surfaceVariant}
                    onPress={() => toggleFavorite(selectedPhoto)}
                  />
                  <ActionButton
                    icon="download"
                    label="Download"
                    color={theme.colors.onPrimary}
                    background={theme.colors.primary}
                    onPress={async () => setNotice(await downloadPhoto(selectedPhoto))}
                  />
                  <ActionButton
                    icon="share-variant"
                    label="Share"
                    color={theme.colors.onSecondary}
                    background={theme.colors.secondary}
                    onPress={async () => {
                      try {
                        await Share.share({
                          title: 'Tourist Spot',
                          message: `Check out this tourist spot photo by ${selectedPhoto.photographer}${selectedPhoto.photographerUrl ? `: ${selectedPhoto.photographerUrl}` : ''}`,
                          url: selectedPhoto.photographerUrl || selectedPhoto.imageUrl,
                        });
                      } catch (error) {
                        console.warn('Share failed or was cancelled:', error);
                      }
                    }}
                  />
                  <ActionButton
                    icon="open-in-new"
                    label="Full page"
                    color={theme.colors.onSurface}
                    background={theme.colors.surfaceVariant}
                    onPress={() => {
                      const photo = selectedPhoto;
                      setSelected(null);
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
                    }}
                  />
                </View>

                {/* DESIGN: footer with the photo counter and the app name (wide screens only) */}
                {isWide && (
                  <View style={styles.footerRow}>
                    <View style={[styles.counterPill, { backgroundColor: theme.colors.primaryContainer }]}>
                      <Text style={[styles.counterText, { color: theme.colors.onPrimaryContainer }]}>
                        📍 Photo {(selected ?? 0) + 1} of {list.length}
                      </Text>
                    </View>
                    <Text style={[styles.brandText, { color: theme.colors.primary }]}>PH NAVYRA</Text>
                  </View>
                )}
              </View>

              {/* Close (X): pinned to the upper-right corner of the whole popup, on top of everything else */}
              <IconButton
                icon="close"
                iconColor="#FFFFFF"
                containerColor="rgba(0,0,0,0.55)"
                size={22}
                style={styles.popupClose}
                onPress={() => setSelected(null)}
                accessibilityLabel="Close photo"
              />
            </View>
          )}
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  centered: {
    width: '100%',
    alignItems: 'center',
    paddingVertical: 32,
  },
  empty: {
    width: '100%',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 32,
    paddingHorizontal: 16,
    borderRadius: 24,
    borderWidth: 1.5,
    borderStyle: 'dashed',
  },
  emptyIcon: {
    fontSize: 40,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: -8,
  },
  gridItem: {
    padding: 8,
  },
  card: {
    width: '100%',
    overflow: 'hidden',
    borderRadius: 20,
  },
  cover: {
    height: undefined,
    aspectRatio: 4 / 3,
    borderRadius: 0,
  },
  captionBand: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    paddingHorizontal: 14,
    paddingTop: 22,
    paddingBottom: 10,
    backgroundColor: 'rgba(4,20,24,0.55)',
  },
  captionText: {
    color: '#FFFFFF',
    fontSize: 13,
    lineHeight: 17,
    fontWeight: '600',
    textShadowColor: 'rgba(0,0,0,0.8)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
  cardContent: {
    paddingTop: 12,
    paddingBottom: 14,
  },
  goldBar: {
    width: 36,
    height: 3,
    borderRadius: 2,
    marginBottom: 8,
  },
  placeLabel: {
    fontWeight: '800',
    fontSize: 12,
    marginBottom: 4,
  },
  recoBox: {
    alignItems: 'center',
    gap: 4,
    padding: 16,
    marginBottom: 14,
    borderRadius: 20,
    borderWidth: 1.5,
  },
  recoTitle: {
    fontFamily: SERIF,
    fontWeight: '800',
    fontSize: 17,
    textAlign: 'center',
  },
  creditLabel: {
    opacity: 0.7,
  },
  backdrop: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    backgroundColor: 'rgba(3,12,15,0.78)',
  },
  popup: {
    width: '100%',
    maxWidth: 560,
    borderRadius: 24,
    borderTopWidth: 4,
    overflow: 'hidden',
    elevation: 24,
  },
  popupWide: {
    maxWidth: 980,
    flexDirection: 'row',
  },
  popupImageBox: {
    flex: 1,
    minHeight: 140,
    backgroundColor: '#0E1A1F',
  },
  popupImageWide: {
    flex: 3,
    backgroundColor: '#0E1A1F',
  },
  popupBody: {
    padding: 14,
    gap: 10,
    overflow: 'hidden',
  },
  popupBodyWide: {
    flex: 2,
    padding: 24,
    paddingBottom: 100, // leaves room for the landscape at the bottom
    gap: 14,
    justifyContent: 'center',
  },
  // DESIGN: background shapes
  decoCircleBig: {
    position: 'absolute',
    width: 220,
    height: 220,
    borderRadius: 110,
    right: -80,
    top: -70,
    opacity: 0.1,
  },
  decoCircleSmall: {
    position: 'absolute',
    width: 90,
    height: 90,
    borderRadius: 45,
    left: -30,
    bottom: 120,
    opacity: 0.18,
  },
  decoRing: {
    position: 'absolute',
    width: 130,
    height: 130,
    borderRadius: 65,
    borderWidth: 2,
    right: 30,
    top: 70,
    opacity: 0.35,
  },
  // DESIGN: sun + mountains
  landscape: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    height: 100,
    overflow: 'hidden',
  },
  sun: {
    position: 'absolute',
    right: 60,
    bottom: 38,
    width: 46,
    height: 46,
    borderRadius: 23,
    opacity: 0.9,
  },
  mountain: {
    position: 'absolute',
    bottom: -1,
    width: 0,
    height: 0,
    backgroundColor: 'transparent',
    borderStyle: 'solid',
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
  },
  mountainBack: {
    right: -10,
    borderLeftWidth: 100,
    borderRightWidth: 100,
    borderBottomWidth: 95,
    opacity: 0.18,
  },
  mountainSmall: {
    right: 140,
    borderLeftWidth: 60,
    borderRightWidth: 60,
    borderBottomWidth: 55,
    opacity: 0.32,
  },
  mountainFront: {
    left: -30,
    borderLeftWidth: 120,
    borderRightWidth: 120,
    borderBottomWidth: 80,
    opacity: 0.26,
  },
  // DESIGN: label above the caption
  eyebrowRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  eyebrowDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  eyebrowText: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 1.6,
  },
  // DESIGN: divider under the caption
  dividerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  dividerGold: {
    width: 40,
    height: 3,
    borderRadius: 2,
  },
  dividerDiamond: {
    width: 8,
    height: 8,
    transform: [{ rotate: '45deg' }],
  },
  dividerLine: {
    flex: 1,
    height: 1,
  },
  // DESIGN: footer under the action buttons
  footerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  counterPill: {
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 999,
  },
  counterText: {
    fontSize: 12,
    fontWeight: '700',
  },
  brandText: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 2,
    opacity: 0.8,
  },
  popupCaption: {
    fontFamily: SERIF,
    fontWeight: '700',
    lineHeight: 22,
  },
  popupPager: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 18,
  },
  pagerArrow: {
    margin: 0,
  },
  popupCredit: {
    flex: 1,
    paddingVertical: 8,
  },
  actions: {
    flexDirection: 'row',
    gap: 8,
  },
  action: {
    flex: 1,
    alignItems: 'center',
    borderRadius: 16,
    paddingBottom: 6,
  },
  actionIcon: {
    marginTop: 10,
    marginBottom: 4,
  },
  actionLabel: {
    fontSize: 11,
    fontWeight: '700',
  },
  noticePill: {
    position: 'absolute',
    left: 12,
    bottom: 12,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
    backgroundColor: 'rgba(0,0,0,0.7)',
  },
  noticeText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 12,
  },
  popupClose: {
    position: 'absolute',
    top: 8,
    right: 8,
    margin: 0,
    zIndex: 10,
    elevation: 10,
  },
  heart: {
    position: 'absolute',
    top: 6,
    right: 6,
    margin: 0,
  },
  favoriteBar: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
    marginBottom: 12,
  },
  favoriteChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: 'rgba(128,128,128,0.35)',
  },
  pagerWrap: {
    alignItems: 'center',
    gap: 4,
    marginTop: 16,
  },
  pager: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  pageNumber: {
    minWidth: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
});