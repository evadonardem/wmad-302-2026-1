import React, { useEffect, useState } from 'react';
import {Alert,Dimensions,Pressable,ScrollView,Share,StyleSheet,TextInput,TouchableOpacity,View,} from 'react-native';
import { Image } from 'expo-image';
import { Redirect, Stack, router, useLocalSearchParams } from 'expo-router';
import { Icon, IconButton, Text, useTheme } from 'react-native-paper';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as WebBrowser from 'expo-web-browser';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { usePhotos } from '@/photos';

interface CommentItem {
  id: string;
  author: string;
  text: string;
  isUser: boolean;
  avatarBg: string;
}

const { width: windowWidth } = Dimensions.get('window');
const STORAGE_FAVORITES_KEY = 'LAKBAY_FAVORITE_PHOTOS';

// Standardized storage accessor using globalThis
const getFavoritesFromStorage = async (): Promise<any[]> => {
  try {
    const item = await AsyncStorage.getItem(STORAGE_FAVORITES_KEY);
    if (item) return JSON.parse(item);
  } catch (e) {
    console.error('Storage read error:', e);
  }
  const memoryStore = (globalThis as any).__LAKBAY_FAVORITES_MEMORY__;
  return Array.isArray(memoryStore) ? memoryStore : [];
};

const saveFavoritesToStorage = async (list: any[]) => {
  (globalThis as any).__LAKBAY_FAVORITES_MEMORY__ = list;
  try {
    await AsyncStorage.setItem(STORAGE_FAVORITES_KEY, JSON.stringify(list));
  } catch (e) {
    console.error('Storage write error:', e);
  }
};

export default function PhotoDetailScreen() {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const photoContext = usePhotos() as any;
  const photos = photoContext?.photos || [];

  const {
    id: rawId,
    imageUrl: rawImageUrl,
    photographer: rawPhotographer,
    photographerUrl: rawPhotographerUrl,
    altText: rawAltText,
  } = useLocalSearchParams<{
    id?: string;
    imageUrl?: string;
    photographer?: string;
    photographerUrl?: string;
    altText?: string;
  }>();

  const id = Array.isArray(rawId) ? rawId[0] ?? '' : rawId ?? '';
  const imageUrl = Array.isArray(rawImageUrl)
    ? rawImageUrl[0] ?? ''
    : rawImageUrl ?? '';
  const photographer = Array.isArray(rawPhotographer)
    ? rawPhotographer[0] ?? ''
    : rawPhotographer ?? '';
  const photographerUrl = Array.isArray(rawPhotographerUrl)
    ? rawPhotographerUrl[0] ?? ''
    : rawPhotographerUrl ?? '';
  const altText = Array.isArray(rawAltText)
    ? rawAltText[0] ?? ''
    : rawAltText ?? '';

  // Local interaction states
  const [likeCount, setLikeCount] = useState<number>(35);
  const [isLiked, setIsLiked] = useState<boolean>(false);
  const [commentText, setCommentText] = useState<string>('');
  const [isBookmarked, setIsBookmarked] = useState<boolean>(false);

  // Tags for "More like this"
  const tagChips = [
    'Daanbantayan',
    'Coastal Cebu',
    'Aerial Views',
    'Bangka Boats',
    'Beach Town',
    'Philippines Eco-Tourism',
    'Coastal Life',
    'Abyss',
    'Deep Water',
  ];

  // Comment List State
  const [comments, setComments] = useState<CommentItem[]>([
    {
      id: 'default-1',
      author: 'Andybelle',
      text: 'This destination looks absolutely stunning!',
      isUser: false,
      avatarBg: '#8E24AA',
    },
  ]);

  const isWide = windowWidth >= 768;

  // Sync bookmark status on screen mount
  useEffect(() => {
    let active = true;
    const checkBookmarkStatus = async () => {
      const list = await getFavoritesFromStorage();
      if (active) {
        const found = list.some(
          (item) => String(item.id) === String(id) || item.imageUrl === imageUrl
        );
        setIsBookmarked(found);
      }
    };
    checkBookmarkStatus();
    return () => {
      active = false;
    };
  }, [id, imageUrl]);

  if (!imageUrl || !photographer) {
    return <Redirect href="/" />;
  }

  // Position of the current photo inside the shared result set (for prev/next)
  const currentIndex = photos ? photos.findIndex((p: any) => String(p.id) === id) : -1;

  const goToAdjacentPhoto = (offset: number) => {
    if (!photos || photos.length === 0) return;
    const targetIndex = currentIndex + offset;

    if (
      currentIndex === -1 ||
      targetIndex < 0 ||
      targetIndex >= photos.length
    ) {
      return;
    }

    const target = photos[targetIndex];

    router.replace({
      pathname: '/photo/[id]',
      params: {
        id: String(target.id),
        imageUrl: target.imageUrl || target.src?.large || target.url,
        photographer: target.photographer,
        photographerUrl: target.photographerUrl,
        altText: target.altText || target.alt,
      },
    });
  };

  const handleOpenPhotographer = () => {
    if (photographerUrl) {
      WebBrowser.openBrowserAsync(photographerUrl).catch((error) => {
        console.error('Unable to open photographer profile:', error);
      });
    }
  };

  const handleShare = async () => {
    try {
      const message = [
        `Check out this tourist spot photo: ${altText || 'Tourist spot'}`,
        `Photographer: ${photographer}`,
        photographerUrl
          ? `Photographer profile: ${photographerUrl}`
          : '',
        `Photo: ${imageUrl}`,
      ]
        .filter(Boolean)
        .join('\n');

      await Share.share({
        title: altText || 'Tourist Spot',
        message,
        url: imageUrl,
      });
    } catch (error) {
      console.error('Unable to share this photo:', error);
    }
  };

  const handleToggleLike = () => {
    setIsLiked((prev) => !prev);
    setLikeCount((prev) => (isLiked ? prev - 1 : prev + 1));
  };

  const handleToggleBookmark = async () => {
    const photoToSave = {
      id: id || Date.now().toString(),
      imageUrl,
      photographer,
      photographerUrl,
      altText,
    };

    let list = await getFavoritesFromStorage();
    const existsIndex = list.findIndex(
      (item) => String(item.id) === String(photoToSave.id) || item.imageUrl === photoToSave.imageUrl
    );

    if (existsIndex >= 0) {
      list.splice(existsIndex, 1);
      setIsBookmarked(false);
      Alert.alert('Removed', 'Photo removed from your favorites collection.');
    } else {
      list.unshift(photoToSave);
      setIsBookmarked(true);
      Alert.alert('Saved!', 'Photo has been saved to your favorites collection!');
    }

    await saveFavoritesToStorage(list);

    const toggleFn =
      photoContext?.toggleFavorite ||
      photoContext?.addFavorite ||
      photoContext?.saveFavorite;

    if (typeof toggleFn === 'function') {
      toggleFn(photoToSave);
    }
  };

  const handleClose = () => {
    if (router.canGoBack()) {
      router.back();
    } else {
      router.replace('/(tabs)');
    }
  };

  // Add a new comment as "You"
  const handleAddComment = () => {
    const trimmed = commentText.trim();
    if (!trimmed) return;

    const newCommentItem: CommentItem = {
      id: Date.now().toString(),
      author: 'You',
      text: trimmed,
      isUser: true,
      avatarBg: '#00695C',
    };

    setComments((prev) => [...prev, newCommentItem]);
    setCommentText('');
  };

  // Delete a user comment by ID
  const handleDeleteComment = (commentId: string) => {
    setComments((prev) => prev.filter((item) => item.id !== commentId));
  };

  return (
    <View style={styles.modalOverlayContainer}>
      <Stack.Screen options={{ headerShown: false }} />

      {/* Dimmed Modal Backdrop */}
      <Pressable style={styles.backdrop} onPress={handleClose} />

      {/* FLOATING WHITE MODAL CARD */}
      <View
        style={[
          styles.modalCard,
          {
            flexDirection: isWide ? 'row' : 'column',
            maxWidth: isWide ? 1040 : '96%',
            maxHeight: isWide ? '88%' : '90%',
          },
        ]}
      >
        {/* LEFT SECTION: IMAGE PREVIEW */}
        <View style={[styles.imageSection, { flex: isWide ? 1.25 : undefined, height: isWide ? '100%' : 320 }]}>
          <Image
            source={{ uri: imageUrl }}
            style={styles.heroImage}
            contentFit="cover"
            transition={200}
            accessibilityLabel={altText}
          />

          {/* Top Left Floating Circle Back Button */}
          <TouchableOpacity
            onPress={handleClose}
            style={styles.circleBackButton}
            accessibilityRole="button"
            accessibilityLabel="Close photo modal"
          >
            <Icon source="arrow-left" size={20} color="#000000" />
          </TouchableOpacity>

          {/* Bottom Right Floating Overlay Controls */}
          <View style={styles.bottomRightOverlayControls}>
            <TouchableOpacity style={styles.circleOverlayButton}>
              <Icon source="arrow-expand-all" size={16} color="#000000" />
            </TouchableOpacity>
            <TouchableOpacity style={styles.circleOverlayButton}>
              <Icon source="magnify-plus-outline" size={16} color="#000000" />
            </TouchableOpacity>
          </View>
        </View>

        {/* RIGHT SECTION: DETAILS, METADATA & COMMENTS PANEL */}
        <ScrollView
          style={[styles.contentPanel, { flex: isWide ? 1 : undefined }]}
          contentContainerStyle={styles.contentContainer}
          showsVerticalScrollIndicator={false}
        >
          {/* TOP RIGHT ACTION BUTTONS ROW: INFO, HEART LIKE & SHARE */}
          <View style={styles.topActionsRow}>
            <TouchableOpacity style={styles.iconChipButton}>
              <Icon source="information-outline" size={18} color="#000000" />
            </TouchableOpacity>

            <TouchableOpacity style={styles.iconChipButtonWithText} onPress={handleToggleLike}>
              <Icon
                source={isLiked ? 'heart' : 'heart-outline'}
                size={18}
                color={isLiked ? '#D32F2F' : '#000000'}
              />
              <Text style={styles.chipText}>{likeCount}</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.iconChipButtonWithText} onPress={handleShare}>
              <Icon source="share-variant-outline" size={18} color="#000000" />
              <Text style={styles.chipText}>2</Text>
            </TouchableOpacity>
          </View>

          {/* Photographer Profile Line */}
          <View style={styles.photographerRow}>
            <Icon source="account" size={16} color="#004D40" />
            <TouchableOpacity onPress={handleOpenPhotographer}>
              <Text style={styles.photographerNameText}>
                {photographer || 'Koji Kamei'}{' '}
                <Text style={styles.viewProfileText}>(View Profile)</Text>
              </Text>
            </TouchableOpacity>
          </View>

          {/* Main Title */}
          <Text style={styles.mainTitleText}>
            {altText ||
              "Stunning aerial shot of Daanbantayan's coastline, showcasing crystal-clear waters and vibrant town."}
          </Text>

          {/* Detailed Description */}
          <Text style={styles.descriptionText}>
            High-resolution aerial view of Daanbantayan coastline, Cebu, Philippines, featuring native bangka boats anchored in turquoise water, a detailed view of the beachside town center, and dense foliage, dated from Jun 30, 2020.
          </Text>

          {/* METADATA GRID ROW */}
          <View style={styles.metadataGridRow}>
            <View style={styles.metaItem}>
              <Text style={styles.metaLabel}>License</Text>
              <View style={styles.metaValueRow}>
                <Icon source="check-circle-outline" size={14} color="#00695C" />
                <Text style={styles.metaValueText}>Free</Text>
              </View>
            </View>

            <View style={styles.metaItem}>
              <Text style={styles.metaLabel}>Dimensions</Text>
              <Text style={styles.metaValueText}>4000×6000</Text>
            </View>

            <View style={styles.metaItem}>
              <Text style={styles.metaLabel}>Aspect Ratio</Text>
              <Text style={styles.metaValueText}>2:3</Text>
            </View>

            <View style={styles.metaItem}>
              <Text style={styles.metaLabel}>Colors</Text>
              <View style={styles.colorPaletteBar}>
                <View style={[styles.paletteSegment, { backgroundColor: '#1A6482' }]} />
                <View style={[styles.paletteSegment, { backgroundColor: '#38A0A6' }]} />
                <View style={[styles.paletteSegment, { backgroundColor: '#8BC3C4' }]} />
                <View style={[styles.paletteSegment, { backgroundColor: '#BDE0E1' }]} />
              </View>
            </View>

            <View style={styles.metaItem}>
              <Text style={styles.metaLabel}>Date</Text>
              <Text style={styles.metaValueText}>Jun 30, 2020</Text>
            </View>

            <View style={styles.metaItem}>
              <Text style={styles.metaLabel}>Downloads</Text>
              <Text style={styles.metaValueText}>551</Text>
            </View>

            <View style={styles.metaItem}>
              <Text style={styles.metaLabel}>Views</Text>
              <Text style={styles.metaValueText}>273.6K</Text>
            </View>
          </View>

          {/* Comments Section */}
          <Text style={styles.sectionHeaderTitle}>Comments & Community</Text>

          {/* More like this Section */}
          <Text style={styles.sectionHeaderTitle}>More like this</Text>

          {/* Tag Chips Horizontal Scroll */}
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.tagChipsScrollView}>
            {tagChips.map((tag) => (
              <TouchableOpacity key={tag} style={styles.tagChip}>
                <Text style={styles.tagChipText}>{tag}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>

          {/* Bottom Split Layout: Comment Box Left + Grid Preview Right */}
          <View style={styles.bottomSplitRow}>
            <View style={styles.bottomLeftCol}>
              {/* Comment Input Pill */}
              <View style={styles.commentInputPill}>
                <TextInput
                  placeholder="Add a comment to share your thoughts"
                  placeholderTextColor="#757575"
                  value={commentText}
                  onChangeText={setCommentText}
                  onSubmitEditing={handleAddComment}
                  style={styles.commentTextInput}
                />
                <View style={styles.commentIconsRight}>
                  <TouchableOpacity style={styles.inputIconButton}>
                    <Icon source="emoticon-happy-outline" size={16} color="#004D40" />
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.inputIconButton}>
                    <Icon source="image-outline" size={16} color="#004D40" />
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.inputIconButton} onPress={handleAddComment}>
                    <Icon source="navigation" size={16} color="#004D40" />
                  </TouchableOpacity>
                </View>
              </View>

              {/* Action Button: Open Maps */}
              <TouchableOpacity style={styles.openMapsButton} onPress={handleOpenPhotographer}>
                <Icon source="map-marker-outline" size={16} color="#004D40" />
                <Text style={styles.openMapsBtnText}>Open Maps</Text>
              </TouchableOpacity>
            </View>

            {/* Related Grid Preview */}
            <View style={styles.bottomRightGrid}>
              <View style={styles.gridRow}>
                <Image
                  source={{ uri: 'https://images.pexels.com/photos/3601425/pexels-photo-3601425.jpeg' }}
                  style={styles.gridThumb}
                />
                <Image
                  source={{ uri: 'https://images.pexels.com/photos/3225517/pexels-photo-3225517.jpeg' }}
                  style={styles.gridThumb}
                />
                <Image
                  source={{ uri: 'https://images.pexels.com/photos/1001682/pexels-photo-1001682.jpeg' }}
                  style={styles.gridThumbTall}
                />
              </View>
            </View>
          </View>
        </ScrollView>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  modalOverlayContainer: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.65)',
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  backdrop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  modalCard: {
    width: '100%',
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    overflow: 'hidden',
    elevation: 20,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.35,
    shadowRadius: 18,
    zIndex: 10,
  },
  imageSection: {
    position: 'relative',
    backgroundColor: '#000000',
  },
  heroImage: {
    width: '100%',
    height: '100%',
  },
  circleBackButton: {
    position: 'absolute',
    top: 16,
    left: 16,
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 4,
  },
  bottomRightOverlayControls: {
    position: 'absolute',
    bottom: 16,
    right: 16,
    flexDirection: 'column',
    gap: 8,
  },
  circleOverlayButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 4,
  },
  contentPanel: {
    backgroundColor: '#FFFFFF',
  },
  contentContainer: {
    padding: 24,
    gap: 12,
  },
  topActionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: 8,
    marginBottom: 4,
  },
  iconChipButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  iconChipButtonWithText: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    gap: 4,
  },
  chipText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#000000',
  },
  photographerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  photographerNameText: {
    fontSize: 13,
    fontWeight: '800',
    color: '#004D40',
  },
  viewProfileText: {
    textDecorationLine: 'underline',
    fontWeight: '700',
  },
  mainTitleText: {
    fontSize: 18,
    fontWeight: '900',
    color: '#000000',
    lineHeight: 24,
  },
  descriptionText: {
    fontSize: 12,
    color: '#616161',
    lineHeight: 17,
  },
  metadataGridRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: '#EEEEEE',
    marginVertical: 4,
  },
  metaItem: {
    gap: 2,
  },
  metaLabel: {
    fontSize: 10,
    color: '#757575',
    fontWeight: '600',
  },
  metaValueRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  metaValueText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#000000',
  },
  colorPaletteBar: {
    flexDirection: 'row',
    height: 8,
    width: 44,
    borderRadius: 4,
    overflow: 'hidden',
    marginTop: 2,
  },
  paletteSegment: {
    flex: 1,
  },
  sectionHeaderTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: '#000000',
    marginTop: 4,
  },
  tagChipsScrollView: {
    flexDirection: 'row',
    marginVertical: 2,
  },
  tagChip: {
    backgroundColor: '#F5F5F5',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 16,
    marginRight: 6,
  },
  tagChipText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#424242',
  },
  bottomSplitRow: {
    flexDirection: 'row',
    gap: 16,
    marginTop: 6,
  },
  bottomLeftCol: {
    flex: 1,
    gap: 10,
  },
  commentInputPill: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#B2DFDB',
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 4,
    backgroundColor: '#F4FBF7',
  },
  commentTextInput: {
    flex: 1,
    fontSize: 11,
    color: '#000000',
    paddingVertical: 4,
  },
  commentIconsRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  inputIconButton: {
    padding: 2,
  },
  openMapsButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#00695C',
    paddingVertical: 8,
    borderRadius: 20,
    gap: 6,
  },
  openMapsBtnText: {
    color: '#00695C',
    fontSize: 12,
    fontWeight: '800',
  },
  bottomRightGrid: {
    width: 140,
    height: 100,
  },
  gridRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 4,
  },
  gridThumb: {
    width: 42,
    height: 42,
    borderRadius: 6,
  },
  gridThumbTall: {
    width: 42,
    height: 88,
    borderRadius: 6,
  },
});