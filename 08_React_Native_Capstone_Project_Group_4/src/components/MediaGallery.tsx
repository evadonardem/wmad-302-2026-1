import { useState } from 'react';
import {
  ActivityIndicator,
  Modal,
  Pressable,
  StyleSheet,
  View,
} from 'react-native';
import { Button, Card, Text, useTheme } from 'react-native-paper';
import { Image } from 'expo-image';
import type { Photo } from '@/services/geoPhotoService';

interface MediaGalleryProps {
  photos: Photo[];
  loading: boolean;
}

export default function MediaGallery({ photos, loading }: MediaGalleryProps) {
  const theme = useTheme();
  const [selectedPhoto, setSelectedPhoto] = useState<Photo | null>(null);
  const [isQuickViewVisible, setIsQuickViewVisible] = useState(false);
  const [isFullViewVisible, setIsFullViewVisible] = useState(false);
  const [isDownloadModalVisible, setIsDownloadModalVisible] = useState(false);
  const [hoveredId, setHoveredId] = useState<number | null>(null);

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
        <Text style={[styles.loadingText, { color: theme.colors.onSurfaceVariant }]}>
          Searching paradise spots...
        </Text>
      </View>
    );
  }

  if (!photos || photos.length === 0) {
    return (
      <View style={styles.centerContainer}>
        <Text style={[styles.emptyText, { color: theme.colors.onSurfaceVariant }]}>
          No tourist spots found for this area yet.
        </Text>
      </View>
    );
  }

  const handleCardPress = (photo: Photo) => {
    setSelectedPhoto(photo);
    setIsQuickViewVisible(true);
  };

  const handleShare = async () => {
    if (!selectedPhoto) return;
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'Lakbay PH - Tourist Spot',
          text: `Check out this amazing spot captured by ${selectedPhoto.photographer}!`,
          url: selectedPhoto.imageUrl,
        });
      } catch (err) {
        console.log('Error sharing:', err);
      }
    } else {
      navigator.clipboard.writeText(selectedPhoto.imageUrl);
      alert('Link copied to clipboard!');
    }
  };

  // Dynamic Image Downloading Function batay sa napiling Quality/Device Size
  const executeDownload = (qualityLabel: string, width?: number, height?: number) => {
    if (!selectedPhoto) return;

    let targetUrl = selectedPhoto.imageUrl;

    // Kunin ang base Pexels image URL at baguhin ang URL params para sa custom dimensions/quality
    if (targetUrl.includes('pexels.com')) {
      const baseUrl = targetUrl.split('?')[0];
      if (width && height) {
        targetUrl = `${baseUrl}?auto=compress&cs=tinysrgb&w=${width}&h=${height}&fit=crop`;
      } else if (qualityLabel === '4k') {
        targetUrl = `${baseUrl}?auto=compress&cs=tinysrgb&w=3840&h=2160`;
      }
    }

    const link = document.createElement('a');
    link.href = targetUrl;
    link.download = `lakbay-ph-${qualityLabel}-${selectedPhoto.id}.jpg`;
    link.target = '_blank';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    setIsDownloadModalVisible(false);
  };

  return (
    <View style={styles.container}>
      <Text style={[styles.sectionTitle, { color: theme.colors.onSurface }]}>
        📍 Explore All Tourist Spots
      </Text>

      {/* GALLERY GRID */}
      <View style={styles.grid}>
        {photos.map((photo) => {
          const isHovered = hoveredId === photo.id;
          return (
            <Pressable
              key={photo.id}
              style={[
                styles.cardWrapper,
                isHovered && styles.cardHovered,
              ]}
              onPress={() => handleCardPress(photo)}
              //@ts-ignore
              onMouseEnter={() => setHoveredId(photo.id)}
              //@ts-ignore
              onMouseLeave={() => setHoveredId(null)}
            >
              <Card style={[styles.card, { backgroundColor: theme.colors.surface }]}>
                <Image
                  source={{ uri: photo.imageUrl }}
                  style={styles.cardImage}
                  contentFit="cover"
                  transition={300}
                />
                <Card.Content style={styles.cardContent}>
                  <Text style={styles.capturedByText} numberOfLines={1}>
                    📷 Captured by:{' '}
                    <Text style={{ fontWeight: '700', color: theme.colors.primary }}>
                      {photo.photographer}
                    </Text>
                  </Text>
                </Card.Content>
              </Card>
            </Pressable>
          );
        })}
      </View>

      {/* QUICK PREVIEW MODAL */}
      <Modal
        visible={isQuickViewVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setIsQuickViewVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.quickViewCard, { backgroundColor: theme.colors.elevation.level3 }]}>
            {selectedPhoto && (
              <>
                <Image
                  source={{ uri: selectedPhoto.imageUrl }}
                  style={styles.quickViewImage}
                  contentFit="cover"
                />
                <View style={styles.modalContentPadding}>
                  <Text style={[styles.modalTitle, { color: theme.colors.onSurface }]}>
                    Tourist Spot Preview
                  </Text>
                  <Text style={[styles.photographerSub, { color: theme.colors.onSurfaceVariant }]}>
                    Captured by: {selectedPhoto.photographer}
                  </Text>

                  {/* ACTION BUTTONS */}
                  <View style={styles.actionRow}>
                    <Button
                      mode="outlined"
                      icon="share-variant"
                      onPress={handleShare}
                      style={styles.actionBtn}
                    >
                      Share
                    </Button>
                    <Button
                      mode="outlined"
                      icon="download"
                      onPress={() => setIsDownloadModalVisible(true)}
                      style={styles.actionBtn}
                    >
                      Download
                    </Button>
                    <Button
                      mode="contained"
                      icon="fullscreen"
                      onPress={() => {
                        setIsQuickViewVisible(false);
                        setIsFullViewVisible(true);
                      }}
                      style={[styles.actionBtn, styles.fullViewBtn]}
                    >
                      Full View
                    </Button>
                  </View>

                  <Button
                    mode="text"
                    onPress={() => setIsQuickViewVisible(false)}
                    style={{ marginTop: 8 }}
                  >
                    Close
                  </Button>
                </View>
              </>
            )}
          </View>
        </View>
      </Modal>

      {/* DOWNLOAD QUALITY & DEVICE SELECTION MODAL */}
      <Modal
        visible={isDownloadModalVisible}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setIsDownloadModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.downloadOptionCard, { backgroundColor: theme.colors.elevation.level4 }]}>
            <Text style={[styles.downloadModalTitle, { color: theme.colors.onSurface }]}>
              📥 Choose Download Quality & Device Size
            </Text>
            <Text style={[styles.downloadModalSub, { color: theme.colors.onSurfaceVariant }]}>
              Select the best image resolution for your needs:
            </Text>

            <View style={styles.optionsList}>
              {/* 4K ULTRA HD */}
              <Button
                mode="contained-tonal"
                icon="crown"
                onPress={() => executeDownload('4k_ultra_hd')}
                style={styles.downloadOptionBtn}
                contentStyle={styles.optionBtnContent}
              >
                4K Ultra HD (Maximum Quality)
              </Button>

              {/* PC / DESKTOP VIEW */}
              <Button
                mode="contained-tonal"
                icon="monitor"
                onPress={() => executeDownload('pc_desktop_1080p', 1920, 1080)}
                style={styles.downloadOptionBtn}
                contentStyle={styles.optionBtnContent}
              >
                PC / Desktop Size (1920 x 1080)
              </Button>

              {/* ANDROID / MOBILE VIEW */}
              <Button
                mode="contained-tonal"
                icon="cellphone"
                onPress={() => executeDownload('android_mobile', 1080, 1920)}
                style={styles.downloadOptionBtn}
                contentStyle={styles.optionBtnContent}
              >
                Android / Mobile Size (1080 x 1920)
              </Button>

              {/* COMPACT STANDARD */}
              <Button
                mode="contained-tonal"
                icon="image-outline"
                onPress={() => executeDownload('standard_sd', 800, 600)}
                style={styles.downloadOptionBtn}
                contentStyle={styles.optionBtnContent}
              >
                Standard Quality (Fast Download)
              </Button>
            </View>

            <Button
              mode="text"
              onPress={() => setIsDownloadModalVisible(false)}
              style={{ marginTop: 12 }}
            >
              Cancel
            </Button>
          </View>
        </View>
      </Modal>

      {/* FULL VIEW LIGHTBOX MODAL */}
      <Modal
        visible={isFullViewVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setIsFullViewVisible(false)}
      >
        <View style={styles.fullViewOverlay}>
          <Pressable
            style={styles.closeFullBtn}
            onPress={() => setIsFullViewVisible(false)}
          >
            <Text style={styles.closeFullText}>✕ Close Full View</Text>
          </Pressable>

          {selectedPhoto && (
            <Image
              source={{ uri: selectedPhoto.imageUrl }}
              style={styles.fullScreenImage}
              contentFit="contain"
            />
          )}
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
    marginTop: 12,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '800',
    marginBottom: 18,
    letterSpacing: 0.5,
  },
  centerContainer: {
    padding: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 15,
  },
  emptyText: {
    fontSize: 15,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
    width: '100%',
  },
  cardWrapper: {
    width: 'calc(25% - 12px)' as any,
    minWidth: 240,
    flexGrow: 1,
    transitionProperty: 'transform, shadow',
    transitionDuration: '0.25s',
  },
  cardHovered: {
    transform: [{ scale: 1.04 }],
    zIndex: 10,
  },
  card: {
    borderRadius: 16,
    overflow: 'hidden',
    elevation: 3,
  },
  cardImage: {
    width: '100%',
    height: 180,
  },
  cardContent: {
    paddingVertical: 10,
    paddingHorizontal: 12,
  },
  capturedByText: {
    fontSize: 12,
  },
  // MODAL STYLES
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  quickViewCard: {
    width: '100%',
    maxWidth: 520,
    borderRadius: 20,
    overflow: 'hidden',
  },
  quickViewImage: {
    width: '100%',
    height: 280,
  },
  modalContentPadding: {
    padding: 20,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '800',
    marginBottom: 4,
  },
  photographerSub: {
    fontSize: 14,
    marginBottom: 20,
  },
  actionRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 8,
  },
  actionBtn: {
    flex: 1,
    minWidth: 110,
    borderRadius: 10,
  },
  fullViewBtn: {
    borderRadius: 10,
  },
  // DOWNLOAD MODAL STYLES
  downloadOptionCard: {
    width: '100%',
    maxWidth: 460,
    borderRadius: 24,
    padding: 24,
  },
  downloadModalTitle: {
    fontSize: 18,
    fontWeight: '800',
    marginBottom: 6,
  },
  downloadModalSub: {
    fontSize: 13,
    marginBottom: 18,
  },
  optionsList: {
    gap: 10,
  },
  downloadOptionBtn: {
    borderRadius: 12,
  },
  optionBtnContent: {
    height: 48,
    justifyContent: 'flex-start',
  },
  // FULL SCREEN LIGHTBOX STYLES
  fullViewOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.95)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeFullBtn: {
    position: 'absolute',
    top: 30,
    right: 30,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 30,
    zIndex: 20,
  },
  closeFullText: {
    color: '#ffffff',
    fontWeight: '700',
    fontSize: 14,
  },
  fullScreenImage: {
    width: '95%',
    height: '85%',
  },
});