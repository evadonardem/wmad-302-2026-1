import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  Animated,
  Easing,
  Image,
  Linking,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  Share,
  StyleSheet,
  TouchableOpacity,
  View,
  useWindowDimensions,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import {
  ActivityIndicator,
  Button,
  Chip,
  Icon,
  IconButton,
  Menu,
  Portal,
  Text,
  TextInput,
  useTheme,
} from 'react-native-paper';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { Photo } from '@/services/geoPhotoService';

const STORAGE_SAVED_COLLECTION_KEY = 'LAKBAY_SAVED_COLLECTION_ITEMS';
const STORAGE_LIKED_COLLECTION_KEY = 'LAKBAY_LIKED_COLLECTION_ITEMS';
const STORAGE_LAST_SEARCH_TAG_KEY = 'LAKBAY_LAST_SEARCH_TAG';

// PEXELS API KEY CONFIGURATION
const PEXELS_API_KEY =
  Platform.OS === 'web'
    ? (typeof process !== 'undefined' && process.env?.EXPO_PUBLIC_PEXELS_API_KEY) || 'YOUR_PEXELS_API_KEY'
    : 'YOUR_PEXELS_API_KEY';

export type GalleryPhoto = Partial<Photo> & {
  id: number;
  title?: string;
  location?: string;
  description?: string;
  width?: number;
  height?: number;
  url?: string;
  imageUrl?: string;
  photographer?: string;
  photographerUrl?: string;
  altText?: string;
  camera?: string;
  focal?: string;
  aperture?: string;
  iso?: number | string;
  shutterSpeed?: string;
  takenAt?: string;
  uploadedAt?: string;
  software?: string;
  views?: number;
  likesCount?: number;
  downloadsCount?: number;
  isVideo?: boolean;
};

interface CollageDraft {
  id: string;
  name: string;
  photos: GalleryPhoto[];
}

interface CollageCutout {
  id: string;
  photoUrl: string;
  title: string;
}

interface MediaGalleryProps {
  photos: Photo[];
  loading?: boolean;
  activeCategory?: string;
  onSelectCategory?: (category: string) => void;
  onSearchQueryChange?: (query: string) => void;
  onLoadMore?: () => void;
  hasMoreToLoad?: boolean;
}

const RESOLUTIONS = [
  { label: '144p — Low', scale: 0.15 },
  { label: '240p — Basic', scale: 0.25 },
  { label: '360p — Standard', scale: 0.35 },
  { label: '480p — Medium', scale: 0.5 },
  { label: '720p — HD', scale: 0.75 },
  { label: '1080p — Full HD', scale: 1.0 },
  { label: '4K — Ultra HD', scale: 1.5 },
  { label: 'Original — Highest available quality', scale: 1.0 },
];

const FORMATS = [
  { label: 'JPG / JPEG — smaller file size', ext: 'jpg', factor: 0.8 },
  { label: 'PNG — graphics & transparency', ext: 'png', factor: 1.8 },
  { label: 'WebP — efficient compression', ext: 'webp', factor: 0.55 },
];

const EXTRA_TAG_POOL = [
  'Island Hopping',
  'Tropical Paradise',
  'Heritage Sites',
  'Scuba Diving',
  'Sunsets',
  'Local Food',
  'Marine Sanctuary',
  'White Sand',
  'Volcanic Views',
  'Hidden Gem',
];

export default function MediaGallery({
  photos,
  loading,
  activeCategory = 'All',
  onSelectCategory,
  onLoadMore,
  hasMoreToLoad = true,
}: MediaGalleryProps) {
  const theme = useTheme();
  const { width } = useWindowDimensions();

  const numColumns = useMemo(() => {
    if (width >= 1400) return 6;
    if (width >= 1100) return 5;
    if (width >= 800) return 4;
    if (width >= 550) return 3;
    return 2;
  }, [width]);

  const ASPECT_RATIOS = [0.7, 1.3, 0.85, 1.15, 0.75, 1.4, 0.9, 1.2];

  // PERSISTENT COLLECTIONS: SAVED & LIKED ITEMS STATE (SYNCS DIRECTLY WITH HISTORY.TSX)
  const [savedCollectionItems, setSavedCollectionItems] = useState<GalleryPhoto[]>([]);
  const [likedCollectionItems, setLikedCollectionItems] = useState<GalleryPhoto[]>([]);

  const [likes, setLikes] = useState<Record<number, number>>({});
  const [userLiked, setUserLiked] = useState<Record<number, boolean>>({});
  const [imageResizeModeState, setImageResizeModeState] = useState<'cover' | 'contain'>('cover');

  const [commentsList, setCommentsList] = useState<
    Record<number, Array<{ id: string; user: string; text: string }>>
  >({});
  const [newCommentText, setNewCommentText] = useState('');

  const [cardMenuVisibleId, setCardMenuVisibleId] = useState<number | null>(null);

  const [previewPhoto, setPreviewPhoto] = useState<GalleryPhoto | null>(null);
  const [downloadPhoto, setDownloadPhoto] = useState<GalleryPhoto | null>(null);
  const [detailsPhoto, setDetailsPhoto] = useState<GalleryPhoto | null>(null);

  // VISUAL SCANNER & GENERATION STATE WITH PAGINATION
  const [scanModalVisible, setScanModalVisible] = useState(false);
  const [scanPhoto, setScanPhoto] = useState<GalleryPhoto | null>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [scannedResults, setScannedResults] = useState<GalleryPhoto[]>([]);
  const [scanPage, setScanPage] = useState<number>(1);
  const [isScanLoadingMore, setIsScanLoadingMore] = useState<boolean>(false);
  const scanLineAnim = useRef(new Animated.Value(0)).current;

  // COLLAGE SYSTEM & CANVAS CREATOR STATE
  const [collagePhoto, setCollagePhoto] = useState<GalleryPhoto | null>(null);
  const [collages, setCollages] = useState<CollageDraft[]>([]);
  const [isCreatingCollage, setIsCreatingCollage] = useState(false);
  const [newCollageTitle, setNewCollageTitle] = useState('');

  // FULLSCREEN COLLAGE CREATION TOOL STATE
  const [collageCanvasVisible, setCollageCanvasVisible] = useState(false);
  const [canvasCutouts, setCanvasCutouts] = useState<CollageCutout[]>([]);
  const [canvasStickers, setCanvasStickers] = useState<string[]>([]);

  const [selectedResIndex, setSelectedResIndex] = useState(5);
  const [selectedFormatIndex, setSelectedFormatIndex] = useState(0);
  const [useCustomDim, setUseCustomDim] = useState(false);
  const [customWidth, setCustomWidth] = useState('');
  const [customHeight, setCustomHeight] = useState('');

  // DYNAMIC TAG CHIPS STATE WITH LA TRINIDAD BENGUET PRESET
  const [tagChipsState, setTagChipsState] = useState<string[]>([
    'La Trinidad Benguet',
    'Strawberry Farm',
    'Coastal Cebu',
    'Aerial Views',
    'Bangka Boats',
    'Beach Town',
    'Philippines Eco-Tourism',
    'Coastal Life',
  ]);

  // SELECTED TAG & LIVE PEXELS API STATE (PRESET TO LA TRINIDAD BENGUET)
  const [selectedTag, setSelectedTag] = useState<string>('La Trinidad Benguet');
  const [apiPhotos, setApiPhotos] = useState<GalleryPhoto[]>([]);
  const [isApiLoading, setIsApiLoading] = useState<boolean>(false);
  const [apiPage, setApiPage] = useState<number>(1);
  const [isDownloading, setIsDownloading] = useState<boolean>(false);

  // Load persistent collection and last searched destination on mount
  useEffect(() => {
    let active = true;
    const loadSavedState = async () => {
      try {
        let savedItem: string | null = null;
        let likedItem: string | null = null;
        let savedTag: string | null = null;

        if (Platform.OS === 'web' && typeof window !== 'undefined' && window.localStorage) {
          savedItem = window.localStorage.getItem(STORAGE_SAVED_COLLECTION_KEY);
          likedItem = window.localStorage.getItem(STORAGE_LIKED_COLLECTION_KEY);
          savedTag = window.localStorage.getItem(STORAGE_LAST_SEARCH_TAG_KEY);
        } else {
          savedItem = await AsyncStorage.getItem(STORAGE_SAVED_COLLECTION_KEY);
          likedItem = await AsyncStorage.getItem(STORAGE_LIKED_COLLECTION_KEY);
          savedTag = await AsyncStorage.getItem(STORAGE_LAST_SEARCH_TAG_KEY);
        }

        if (savedItem && active) {
          const parsed = JSON.parse(savedItem);
          setSavedCollectionItems(parsed);
        }

        if (likedItem && active) {
          const parsedLiked: GalleryPhoto[] = JSON.parse(likedItem);
          setLikedCollectionItems(parsedLiked);
          const likedMap: Record<number, boolean> = {};
          parsedLiked.forEach((item) => {
            likedMap[item.id] = true;
          });
          setUserLiked(likedMap);
        }

        if (savedTag && active) {
          setSelectedTag(savedTag);
        }
      } catch (e) {}
    };

    void loadSavedState();
    return () => {
      active = false;
    };
  }, []);

  // Save selected location tag when changed
  const changeSelectedTag = async (newTag: string) => {
    setSelectedTag(newTag);
    try {
      if (Platform.OS === 'web' && typeof window !== 'undefined' && window.localStorage) {
        window.localStorage.setItem(STORAGE_LAST_SEARCH_TAG_KEY, newTag);
      }
      await AsyncStorage.setItem(STORAGE_LAST_SEARCH_TAG_KEY, newTag);
    } catch (e) {}
  };

  // OPEN EXTERNAL LOCATION WEBSITE LINK FOR DESTINATION
  const handleVisitSite = (photo: GalleryPhoto) => {
    const destinationQuery = [photo.title, photo.location, 'Philippines']
      .filter(Boolean)
      .join(' ')
      .trim();

    const locationUrl = `https://www.google.com/search?q=${encodeURIComponent(destinationQuery || 'La Trinidad Benguet Philippines travel guide')}`;

    Linking.openURL(locationUrl).catch((err) =>
      console.error("Couldn't open destination site", err)
    );
  };

  // HELPER FOR PERSISTENT STORAGE SYNC (STORES IMAGES FOR HISTORY.TSX)
  const updateStorageKey = async (key: string, data: GalleryPhoto[]) => {
    try {
      const jsonStr = JSON.stringify(data);
      if (Platform.OS === 'web' && typeof window !== 'undefined' && window.localStorage) {
        window.localStorage.setItem(key, jsonStr);
        window.dispatchEvent(new Event('storage'));
      }
      await AsyncStorage.setItem(key, jsonStr);
    } catch (e) {
      console.error('Failed to persist state:', e);
    }
  };

  // TOGGLE ITEM IN SAVED COLLECTION (SAVED DIRECTLY FOR HISTORY.TSX COLLECTION TAB)
  const toggleSaveToCollection = async (photo: GalleryPhoto) => {
    const safeUrl = photo.url || photo.imageUrl || 'https://images.pexels.com/photos/3601425/pexels-photo-3601425.jpeg';
    const normalizedItem: GalleryPhoto = {
      ...photo,
      url: safeUrl,
      imageUrl: safeUrl,
      title: photo.title || photo.altText || 'La Trinidad Benguet Destination',
      location: photo.location || photo.photographer || 'La Trinidad, Benguet, Philippines',
    };

    let updated: GalleryPhoto[] = [];
    const exists = savedCollectionItems.some((item) => String(item.id) === String(photo.id));

    if (exists) {
      updated = savedCollectionItems.filter((item) => String(item.id) !== String(photo.id));
    } else {
      updated = [normalizedItem, ...savedCollectionItems];
    }

    setSavedCollectionItems(updated);
    await updateStorageKey(STORAGE_SAVED_COLLECTION_KEY, updated);
  };

  const isSavedInCollection = (id: number) =>
    savedCollectionItems.some((item) => String(item.id) === String(id));

  // TOGGLE HEART REACT (SAVED DIRECTLY FOR HISTORY.TSX LIKED COLLECTION TAB)
  const toggleHeartReact = async (id: number, photoTarget?: GalleryPhoto) => {
    const alreadyLiked = !!userLiked[id];
    const nextLiked = !alreadyLiked;

    setUserLiked((prev) => ({ ...prev, [id]: nextLiked }));
    setLikes((prev) => {
      const currentLikes = prev[id] ?? 35;
      return {
        ...prev,
        [id]: nextLiked ? currentLikes + 1 : Math.max(0, currentLikes - 1),
      };
    });

    const target =
      photoTarget ||
      normalizedPhotos.find((p) => p.id === id) ||
      apiPhotos.find((p) => p.id === id) ||
      scannedResults.find((p) => p.id === id) ||
      (previewPhoto?.id === id ? previewPhoto : undefined);

    if (target) {
      const safeUrl = target.url || target.imageUrl || 'https://images.pexels.com/photos/3601425/pexels-photo-3601425.jpeg';
      const normalizedTarget: GalleryPhoto = {
        ...target,
        url: safeUrl,
        imageUrl: safeUrl,
        title: target.title || target.altText || 'La Trinidad Benguet Destination',
        location: target.location || target.photographer || 'La Trinidad, Benguet, Philippines',
      };

      let updatedLiked: GalleryPhoto[];
      if (nextLiked) {
        updatedLiked = likedCollectionItems.some((item) => String(item.id) === String(id))
          ? likedCollectionItems
          : [normalizedTarget, ...likedCollectionItems];
      } else {
        updatedLiked = likedCollectionItems.filter((item) => String(item.id) !== String(id));
      }

      setLikedCollectionItems(updatedLiked);
      await updateStorageKey(STORAGE_LIKED_COLLECTION_KEY, updatedLiked);
    }
  };

  // FETCH LIVE PHOTOS FROM PEXELS API BASED ON CLICKED TAG
  const fetchPexelsPhotos = async (query: string, pageNum: number = 1, isAppend: boolean = false) => {
    try {
      setIsApiLoading(true);
      const response = await fetch(
        `https://api.pexels.com/v1/search?query=${encodeURIComponent(
          query + ' Philippines',
        )}&per_page=10&page=${pageNum}`,
        {
          headers: {
            Authorization: PEXELS_API_KEY,
          },
        },
      );

      if (!response.ok) {
        throw new Error(`Pexels API Error: ${response.statusText}`);
      }

      const data = await response.json();
      const mappedPhotos: GalleryPhoto[] = (data.photos || []).map((p: any) => ({
        id: p.id,
        url: p.src?.medium || p.src?.original,
        imageUrl: p.src?.large || p.src?.original,
        title: p.alt || `${query} Exploration`,
        location: 'La Trinidad, Benguet, Philippines',
        photographer: p.photographer || 'Pexels Contributor',
        photographerUrl: p.photographer_url,
        width: p.width || 4032,
        height: p.height || 3024,
        description: p.alt || `Beautiful photo of ${query} captured in La Trinidad Benguet, Philippines.`,
        camera: 'iPhone 8 Plus',
        focal: '6.6mm',
        aperture: 'f/2.8',
        iso: 50,
        shutterSpeed: '1/121 sec',
        takenAt: 'May 30, 2020',
        uploadedAt: 'October 7th, 2026 at 9:08 PM',
        software: '13.5',
        views: 18,
        likesCount: 0,
        downloadsCount: 0,
      }));

      if (isAppend) {
        setApiPhotos((prev) => [...prev, ...mappedPhotos]);
      } else {
        setApiPhotos(mappedPhotos);
      }
    } catch (error) {
      console.warn('Failed to fetch live photos from Pexels API, using fallback images.', error);
      const fallbackList: GalleryPhoto[] = [
        {
          id: 9901,
          url: 'https://images.pexels.com/photos/3601425/pexels-photo-3601425.jpeg',
          imageUrl: 'https://images.pexels.com/photos/3601425/pexels-photo-3601425.jpeg',
          title: `${query} View`,
          location: 'La Trinidad, Benguet',
          photographer: 'Lakbay PH',
          width: 4032,
          height: 3024,
          camera: 'iPhone 8 Plus',
          focal: '6.6mm',
          aperture: 'f/2.8',
          iso: 50,
          shutterSpeed: '1/121 sec',
          takenAt: 'May 30, 2020',
          uploadedAt: 'October 7th, 2026 at 9:08 PM',
          software: '13.5',
          views: 18,
          likesCount: 0,
          downloadsCount: 0,
        },
      ];
      if (!isAppend) {
        setApiPhotos(fallbackList);
      }
    } finally {
      setIsApiLoading(false);
    }
  };

  useEffect(() => {
    setApiPage(1);
    fetchPexelsPhotos(selectedTag, 1, false);
  }, [selectedTag]);

  // VISUAL SCANNER INITIAL CALL & PAGINATION
  const fetchScannedMatches = async (query: string, pageNum: number, isAppend: boolean) => {
    try {
      if (isAppend) setIsScanLoadingMore(true);
      const response = await fetch(
        `https://api.pexels.com/v1/search?query=${encodeURIComponent(query + ' Philippines')}&per_page=10&page=${pageNum}`,
        { headers: { Authorization: PEXELS_API_KEY } }
      );
      if (!response.ok) throw new Error('Pexels Scan Error');
      const data = await response.json();
      const mapped: GalleryPhoto[] = (data.photos || []).map((p: any) => ({
        id: p.id,
        url: p.src?.medium || p.src?.original,
        imageUrl: p.src?.large || p.src?.original,
        title: p.alt || `Visually Similar ${query}`,
        location: 'La Trinidad, Benguet, Philippines',
        photographer: p.photographer || 'Pexels',
      }));

      if (isAppend) {
        setScannedResults((prev) => [...prev, ...mapped]);
      } else {
        setScannedResults(mapped);
      }
    } catch (e) {
      if (!isAppend) setScannedResults(apiPhotos);
    } finally {
      setIsScanLoadingMore(false);
    }
  };

  const handleStartVisualScan = (photo: GalleryPhoto) => {
    setScanPhoto(photo);
    setScanModalVisible(true);
    setIsScanning(true);
    setScannedResults([]);
    setScanPage(1);

    scanLineAnim.setValue(0);
    const animationLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(scanLineAnim, {
          toValue: 1,
          duration: 1500,
          easing: Easing.inOut(Easing.quad),
          useNativeDriver: true,
        }),
        Animated.timing(scanLineAnim, {
          toValue: 0,
          duration: 1500,
          easing: Easing.inOut(Easing.quad),
          useNativeDriver: true,
        }),
      ]),
    );
    animationLoop.start();

    const searchQuery = photo.title || selectedTag;
    fetchScannedMatches(searchQuery, 1, false).then(() => {
      setTimeout(() => {
        animationLoop.stop();
        setIsScanning(false);
      }, 2000);
    });
  };

  // INFINITE SCROLL HANDLER FOR VISUAL SCANNER MODAL
  const handleScanModalScroll = (event: any) => {
    const { layoutMeasurement, contentOffset, contentSize } = event.nativeEvent;
    const isCloseToBottom = layoutMeasurement.height + contentOffset.y >= contentSize.height - 50;

    if (isCloseToBottom && !isScanning && !isScanLoadingMore && scanPhoto) {
      const nextPage = scanPage + 1;
      setScanPage(nextPage);
      fetchScannedMatches(scanPhoto.title || selectedTag, nextPage, true);
    }
  };

  const handleGenerateMoreTags = () => {
    const nextTags = EXTRA_TAG_POOL.filter((t) => !tagChipsState.includes(t));
    if (nextTags.length > 0) {
      const tagsToAdd = nextTags.slice(0, 3);
      setTagChipsState((prev) => [...prev, ...tagsToAdd]);
    } else {
      alert('All available tags generated!');
    }
  };

  const handleModalScroll = (event: any) => {
    const { layoutMeasurement, contentOffset, contentSize } = event.nativeEvent;
    const isCloseToBottom = layoutMeasurement.height + contentOffset.y >= contentSize.height - 40;

    if (isCloseToBottom && !isApiLoading) {
      const nextPage = apiPage + 1;
      setApiPage(nextPage);
      fetchPexelsPhotos(selectedTag, nextPage, true);
    }
  };

  const palette = theme.dark
    ? {
        surface: '#0A2518',
        text: '#F2F8EE',
        muted: '#A2C4A7',
        border: 'rgba(90, 168, 117, 0.35)',
        primary: '#2E7D32',
        modalBg: '#E8F5E9',
        inputBg: 'rgba(15, 43, 27, 0.85)',
      }
    : {
        surface: '#FFFFFF',
        text: '#0D2D1B',
        muted: '#37474F',
        border: 'rgba(0, 121, 107, 0.35)',
        primary: '#2E7D32',
        modalBg: '#EAF2EC',
        inputBg: '#F5F7F6',
      };

  const categories = [
    'All',
    'Beaches',
    'Mountains',
    'Waterfalls',
    'Landmarks',
    'Food',
    'Culture',
  ];

  const normalizedPhotos: GalleryPhoto[] = useMemo(() => {
    const map = new Map<number, GalleryPhoto>();

    (photos || []).forEach((p) => {
      if (!map.has(p.id)) {
        const safeUrl = p.imageUrl || (p as any).url || 'https://images.pexels.com/photos/3601425/pexels-photo-3601425.jpeg';
        map.set(p.id, {
          ...p,
          url: safeUrl,
          imageUrl: safeUrl,
          title: (p as any).title || p.altText || 'La Trinidad Benguet Destination',
          location: (p as any).location || p.photographer || 'La Trinidad, Benguet',
          description: (p as any).description || p.altText || '',
          width: (p as any).width || 4032,
          height: (p as any).height || 3024,
          camera: (p as any).camera || 'iPhone 8 Plus',
          focal: (p as any).focal || '6.6mm',
          aperture: (p as any).aperture || 'f/2.8',
          iso: (p as any).iso || 50,
          shutterSpeed: (p as any).shutterSpeed || '1/121 sec',
          takenAt: (p as any).takenAt || 'May 30, 2020',
          uploadedAt: (p as any).uploadedAt || 'October 7th, 2026 at 9:08 PM',
          software: (p as any).software || '13.5',
          views: (p as any).views ?? 18,
          likesCount: (p as any).likesCount ?? 0,
          downloadsCount: (p as any).downloadsCount ?? 0,
        });
      }
    });

    return Array.from(map.values());
  }, [photos]);

  const masonryColumns = useMemo(() => {
    const cols: GalleryPhoto[][] = Array.from({ length: numColumns }, () => []);
    normalizedPhotos.forEach((photo, idx) => {
      cols[idx % numColumns].push(photo);
    });
    return cols;
  }, [normalizedPhotos, numColumns]);

  const handleAddComment = (photoId: number) => {
    if (!newCommentText.trim()) return;
    const commentObj = {
      id: String(Date.now()),
      user: 'You',
      text: newCommentText.trim(),
    };

    setCommentsList((prev) => ({
      ...prev,
      [photoId]: [...(prev[photoId] || []), commentObj],
    }));

    setNewCommentText('');
  };

  const handleOpenCollageModal = (photo: GalleryPhoto) => {
    setCollagePhoto(photo);
    setIsCreatingCollage(false);
    setNewCollageTitle('');
  };

  const handleLaunchCollageCanvas = () => {
    if (collagePhoto) {
      setCanvasCutouts([
        {
          id: String(Date.now()),
          photoUrl: collagePhoto.url || 'https://images.pexels.com/photos/3601425/pexels-photo-3601425.jpeg',
          title: collagePhoto.title || 'Cutout 1',
        },
      ]);
    } else {
      setCanvasCutouts([]);
    }
    setCanvasStickers([]);
    setCollagePhoto(null);
    setCollageCanvasVisible(true);
  };

  const handleAddTextSticker = () => {
    setCanvasStickers((prev) => [...prev, '✨ Lakbay PH Vibes']);
  };

  const handleAddMoreCutout = () => {
    if (normalizedPhotos.length > 0) {
      const randomPhoto = normalizedPhotos[Math.floor(Math.random() * normalizedPhotos.length)];
      setCanvasCutouts((prev) => [
        ...prev,
        {
          id: String(Date.now()),
          photoUrl: randomPhoto.url || '',
          title: `Cutout ${prev.length + 1}`,
        },
      ]);
    }
  };

  const handleSaveFinalCollage = () => {
    const newCollage: CollageDraft = {
      id: String(Date.now()),
      name: `Custom Collage ${collages.length + 1}`,
      photos: canvasCutouts.map((c) => ({ id: Number(c.id), url: c.photoUrl, title: c.title })),
    };
    setCollages((prev) => [...prev, newCollage]);
    setCollageCanvasVisible(false);
    alert('Collage saved successfully to your profile!');
  };

  const handleCreateNewCollageSubmit = () => {
    if (!newCollageTitle.trim() || !collagePhoto) return;
    const newCollage: CollageDraft = {
      id: String(Date.now()),
      name: newCollageTitle.trim(),
      photos: [collagePhoto],
    };

    setCollages((prev) => [...prev, newCollage]);
    alert(`Created "${newCollage.name}" and added Pin!`);
    setCollagePhoto(null);
    setIsCreatingCollage(false);
    setNewCollageTitle('');
  };

  const handleAddToExistingCollage = (collageId: string) => {
    if (!collagePhoto) return;
    setCollages((prev) =>
      prev.map((c) =>
        c.id === collageId && !c.photos.some((p) => p.id === collagePhoto.id)
          ? { ...c, photos: [...c.photos, collagePhoto] }
          : c,
      ),
    );
    alert(`Added Pin to collage!`);
    setCollagePhoto(null);
  };

  const handleReportPin = () => {
    alert('Pin reported. Thank you for helping keep the community safe!');
  };

  const openAccountProfile = (item: GalleryPhoto) => {
    if (item.photographerUrl) {
      Linking.openURL(item.photographerUrl);
    } else {
      Linking.openURL(
        `https://www.google.com/search?q=${encodeURIComponent(
          (item.photographer || item.location || 'Philippine Photographer') + ' portfolio',
        )}`,
      );
    }
  };

  const handleSharePhoto = async (photo: GalleryPhoto) => {
    const shareTitle = photo.title || 'La Trinidad Benguet Tourist Destination';
    const shareUrl = photo.url || 'https://pexels.com';
    const shareMessage = `Explore "${shareTitle}" on Lakbay PH: ${shareUrl}`;

    try {
      if (Platform.OS === 'web') {
        if (navigator.share) {
          await navigator.share({
            title: shareTitle,
            text: shareMessage,
            url: shareUrl,
          });
        } else if (navigator.clipboard) {
          await navigator.clipboard.writeText(shareUrl);
          alert('Image link copied to clipboard!');
        } else {
          Linking.openURL(`https://twitter.com/intent/tweet?text=${encodeURIComponent(shareMessage)}`);
        }
      } else {
        await Share.share({
          title: shareTitle,
          message: shareMessage,
          url: shareUrl,
        });
      }
    } catch (err) {
      console.log('Error sharing content:', err);
    }
  };

  const calculatedSpecs = useMemo(() => {
    if (!downloadPhoto) return { width: 1920, height: 1080, sizeStr: '1.2 MB' };
    const baseW = downloadPhoto.width || 1920;
    const baseH = downloadPhoto.height || 1080;

    let targetW = Math.round(baseW * RESOLUTIONS[selectedResIndex].scale);
    let targetH = Math.round(baseH * RESOLUTIONS[selectedResIndex].scale);

    if (useCustomDim) {
      if (parseInt(customWidth, 10)) targetW = parseInt(customWidth, 10);
      if (parseInt(customHeight, 10)) targetH = parseInt(customHeight, 10);
    }

    const formatFactor = FORMATS[selectedFormatIndex].factor;
    const megaPixels = (targetW * targetH) / 1000000;
    const estimatedMB = (megaPixels * 0.35 * formatFactor).toFixed(2);

    return {
      width: targetW,
      height: targetH,
      sizeStr: `${estimatedMB} MB`,
    };
  }, [
    downloadPhoto,
    selectedResIndex,
    selectedFormatIndex,
    useCustomDim,
    customWidth,
    customHeight,
  ]);

  // WORKING DOWNLOAD FUNCTION SAVING TO LAPTOP FILE MANAGER
  const triggerDownload = async (url?: string, filename?: string) => {
    if (!url) return;
    const safeName = filename || 'tourist-destination.jpg';

    try {
      setIsDownloading(true);
      if (Platform.OS === 'web') {
        const response = await fetch(url);
        const blob = await response.blob();
        const blobUrl = URL.createObjectURL(blob);

        const anchor = document.createElement('a');
        anchor.href = blobUrl;
        anchor.download = safeName;
        document.body.appendChild(anchor);
        anchor.click();
        document.body.removeChild(anchor);
        URL.revokeObjectURL(blobUrl);
      } else {
        await Linking.openURL(url);
      }
    } catch (err) {
      console.error('Download failed, falling back to direct link:', err);
      if (Platform.OS === 'web') {
        const anchor = document.createElement('a');
        anchor.href = url;
        anchor.target = '_blank';
        anchor.download = safeName;
        document.body.appendChild(anchor);
        anchor.click();
        document.body.removeChild(anchor);
      } else {
        Linking.openURL(url);
      }
    } finally {
      setIsDownloading(false);
      setDownloadPhoto(null);
    }
  };

  // TODO 3.1 [Loading Skeletal Feedbacks]:
  if (loading && photos.length === 0) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color={palette.primary} />
        <Text style={{ marginTop: 12, color: palette.muted, fontWeight: '600' }}>
          Searching Pexels for La Trinidad Benguet spots...
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* CATEGORY FILTER CHIP TOOLBAR (MY COLLECTION BUTTON REMOVED) */}
      <View style={styles.toolbar}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.categoryScroll}
          style={{ flex: 1 }}
        >
          {categories.map((cat) => {
            const isSelected = activeCategory.toLowerCase() === cat.toLowerCase();
            return (
              <Chip
                key={cat}
                selected={isSelected}
                showSelectedCheck={isSelected}
                onPress={() => onSelectCategory && onSelectCategory(cat)}
                style={[
                  styles.categoryChip,
                  isSelected && { backgroundColor: palette.primary },
                ]}
                textStyle={{
                  color: isSelected ? '#FFFFFF' : palette.text,
                  fontWeight: '700',
                }}
              >
                {cat}
              </Chip>
            );
          })}
        </ScrollView>
      </View>

      {/* TODO 3.2 [Boundary Validation Checks] */}
      {normalizedPhotos.length === 0 && !loading && (
        <View
          style={[
            styles.emptyCard,
            { backgroundColor: palette.surface, borderColor: palette.border },
          ]}
        >
          <Text style={styles.emptyEmoji}>📍</Text>
          <Text style={[styles.emptyTitle, { color: palette.text }]}>
            No photos found for "{activeCategory}".
          </Text>
          <Text style={[styles.emptySubtitle, { color: palette.muted }]}>
            Try selecting a different category or searching a location above.
          </Text>
        </View>
      )}

      {/* TODO 3.3 [Fluid Layout Architecture] & TODO 3.4 [Card Content Loop Mapping] */}
      <View style={styles.masonryRow}>
        {masonryColumns.map((colPhotos, colIdx) => (
          <View key={`col-${colIdx}`} style={styles.masonryCol}>
            {colPhotos.map((item, itemIdx) => {
              const aspectRatio = ASPECT_RATIOS[(item.id + itemIdx) % ASPECT_RATIOS.length];
              const isSaved = isSavedInCollection(item.id);
              const isLiked = !!userLiked[item.id];

              return (
                <View key={item.id} style={styles.pinCard}>
                  <TouchableOpacity
                    activeOpacity={0.9}
                    onPress={() => setPreviewPhoto(item)}
                    style={[styles.imageWrapper, { aspectRatio }]}
                  >
                    {/* TODO 3.5 [Multimedia Presentation Layer] */}
                    <Image
                      source={{ uri: item.url }}
                      style={styles.pinImage}
                      resizeMode="cover"
                      accessibilityLabel={item.altText || item.title}
                    />

                    <LinearGradient
                      colors={['transparent', 'rgba(0,0,0,0.4)', 'rgba(0,0,0,0.85)']}
                      style={styles.insideImageGradient}
                    >
                      <Text numberOfLines={2} style={styles.insidePinTitle}>
                        {item.title}
                      </Text>

                      <Pressable
                        onPress={(e) => {
                          e.stopPropagation?.();
                          openAccountProfile(item);
                        }}
                        style={styles.accountRowPressable}
                      >
                        <Text numberOfLines={1} style={styles.insidePinAccount}>
                          📍 {item.location || 'La Trinidad Benguet'}
                        </Text>
                      </Pressable>

                      <View style={styles.floatingOverlay}>
                        {/* VISIT SITE BUTTON THAT OPENS EXTERNAL DESTINATION WEBSITE */}
                        <TouchableOpacity
                          style={styles.visitSiteBtn}
                          onPress={(e) => {
                            e.stopPropagation?.();
                            handleVisitSite(item);
                          }}
                        >
                          <Icon source="export-variant" size={13} color="#0D2D1B" />
                          <Text style={styles.visitSiteText}>Visit site</Text>
                        </TouchableOpacity>

                        <View style={styles.rightOverlayActions}>
                          {/* SAVE BUTTON (SAVES VISUAL IMAGE FOR HISTORY.TSX) */}
                          <TouchableOpacity
                            style={[
                              styles.iconCircleBtn,
                              isSaved && { backgroundColor: palette.primary },
                            ]}
                            onPress={(e) => {
                              e.stopPropagation?.();
                              void toggleSaveToCollection(item);
                            }}
                          >
                            <Icon
                              source={isSaved ? 'bookmark' : 'bookmark-outline'}
                              size={16}
                              color={isSaved ? '#FFFFFF' : '#0D2D1B'}
                            />
                          </TouchableOpacity>

                          {/* HEART (LIKE) BUTTON (SAVES VISUAL IMAGE FOR HISTORY.TSX) */}
                          <TouchableOpacity
                            style={styles.iconCircleBtn}
                            onPress={(e) => {
                              e.stopPropagation?.();
                              void toggleHeartReact(item.id, item);
                            }}
                          >
                            <Icon
                              source={isLiked ? 'heart' : 'heart-outline'}
                              size={16}
                              color={isLiked ? '#E53935' : '#0D2D1B'}
                            />
                          </TouchableOpacity>

                          {/* OPTIONS MENU */}
                          <Menu
                            visible={cardMenuVisibleId === item.id}
                            onDismiss={() => setCardMenuVisibleId(null)}
                            anchor={
                              <TouchableOpacity
                                style={styles.iconCircleBtn}
                                onPress={(e) => {
                                  e.stopPropagation?.();
                                  setCardMenuVisibleId(item.id);
                                }}
                              >
                                <Icon source="dots-horizontal" size={16} color="#0D2D1B" />
                              </TouchableOpacity>
                            }
                          >
                            <Menu.Item
                              onPress={() => {
                                setCardMenuVisibleId(null);
                                setDownloadPhoto(item);
                              }}
                              title="Download image"
                              leadingIcon="download-outline"
                            />
                            <Menu.Item
                              onPress={() => {
                                setCardMenuVisibleId(null);
                                handleOpenCollageModal(item);
                              }}
                              title="Add to collage"
                              leadingIcon="view-dashboard-outline"
                            />
                            <Menu.Item
                              onPress={() => {
                                setCardMenuVisibleId(null);
                                handleReportPin();
                              }}
                              title="Report Pin"
                              leadingIcon="flag-outline"
                            />
                          </Menu>
                        </View>
                      </View>
                    </LinearGradient>
                  </TouchableOpacity>
                </View>
              );
            })}
          </View>
        ))}
      </View>

      {/* LOAD MORE BUTTON */}
      {normalizedPhotos.length > 0 && onLoadMore && (
        <View style={styles.loadMoreContainer}>
          <Button
            mode="contained"
            buttonColor={palette.primary}
            textColor="#FFFFFF"
            loading={loading}
            disabled={loading || !hasMoreToLoad}
            icon="arrow-down-circle-outline"
            contentStyle={{ paddingVertical: 6, paddingHorizontal: 16 }}
            style={{ borderRadius: 24 }}
            onPress={onLoadMore}
          >
            {loading
              ? 'Fetching Pexels photos...'
              : hasMoreToLoad
                ? 'Load More Photos'
                : 'All Photos Loaded'}
          </Button>
        </View>
      )}

      {/* LARGE EXPANDED PHOTO PREVIEW MODAL */}
      <Portal>
        <Modal
          visible={!!previewPhoto}
          onRequestClose={() => setPreviewPhoto(null)}
          transparent
          animationType="fade"
        >
          {previewPhoto && (
            <View style={styles.modalBackdrop}>
              <View style={[styles.pinterestCardModal, { backgroundColor: palette.surface }]}>
                {/* TOP LEFT BACK BUTTON */}
                <TouchableOpacity
                  style={styles.closeModalCircle}
                  onPress={() => setPreviewPhoto(null)}
                >
                  <Icon source="arrow-left" size={20} color="#0D2D1B" />
                </TouchableOpacity>

                <View style={width >= 750 ? styles.splitRow : styles.splitColumn}>
                  {/* LEFT IMAGE CONTAINER WITH FLOATING BUTTONS */}
                  <View style={styles.leftImageColumn}>
                    <Image
                      source={{ uri: previewPhoto.url }}
                      style={styles.pinterestExpandedImage}
                      resizeMode={imageResizeModeState}
                    />

                    {/* EXPAND / CONTRACT IMAGE SIZE BUTTON */}
                    <TouchableOpacity
                      style={styles.blueExpandBtn}
                      onPress={() =>
                        setImageResizeModeState((prev) =>
                          prev === 'cover' ? 'contain' : 'cover',
                        )
                      }
                    >
                      <Icon
                        source={
                          imageResizeModeState === 'cover'
                            ? 'arrow-expand-all'
                            : 'arrow-collapse-all'
                        }
                        size={18}
                        color="#0D2D1B"
                      />
                    </TouchableOpacity>

                    {/* VISUAL SEARCH SCANNER BUTTON */}
                    <TouchableOpacity
                      style={styles.brownSearchSimilarBtn}
                      onPress={() => handleStartVisualScan(previewPhoto)}
                    >
                      <Icon source="magnify-scan" size={18} color="#0D2D1B" />
                    </TouchableOpacity>
                  </View>

                  {/* RIGHT PANEL */}
                  <ScrollView
                    style={styles.rightDetailColumn}
                    contentContainerStyle={{ gap: 12, paddingBottom: 24 }}
                    onScroll={handleModalScroll}
                    scrollEventThrottle={16}
                  >
                    {/* TOP ACTION BUTTONS ROW */}
                    <View style={styles.topActionsRow}>
                      {/* SAVE TO COLLECTION BUTTON INSIDE PREVIEW MODAL */}
                      <TouchableOpacity
                        style={[
                          styles.iconChipButtonWithText,
                          isSavedInCollection(previewPhoto.id) && { backgroundColor: palette.primary, borderColor: palette.primary },
                        ]}
                        onPress={() => void toggleSaveToCollection(previewPhoto)}
                      >
                        <Icon
                          source={isSavedInCollection(previewPhoto.id) ? 'bookmark' : 'bookmark-outline'}
                          size={16}
                          color={isSavedInCollection(previewPhoto.id) ? '#FFFFFF' : '#000000'}
                        />
                        <Text
                          style={[
                            styles.chipText,
                            isSavedInCollection(previewPhoto.id) && { color: '#FFFFFF' },
                          ]}
                        >
                          {isSavedInCollection(previewPhoto.id) ? 'Saved' : 'Save'}
                        </Text>
                      </TouchableOpacity>

                      <TouchableOpacity
                        style={styles.iconChipButton}
                        onPress={() => setDetailsPhoto(previewPhoto)}
                      >
                        <Icon source="information-outline" size={16} color="#000000" />
                      </TouchableOpacity>

                      <TouchableOpacity
                        style={styles.iconChipButton}
                        onPress={() => setDownloadPhoto(previewPhoto)}
                      >
                        <Icon source="download-outline" size={16} color="#000000" />
                      </TouchableOpacity>

                      <TouchableOpacity
                        style={styles.iconChipButtonWithText}
                        onPress={() => void toggleHeartReact(previewPhoto.id, previewPhoto)}
                      >
                        <Icon
                          source={userLiked[previewPhoto.id] ? 'heart' : 'heart-outline'}
                          size={16}
                          color={userLiked[previewPhoto.id] ? '#E53935' : '#000000'}
                        />
                        <Text style={styles.chipText}>{likes[previewPhoto.id] ?? 35}</Text>
                      </TouchableOpacity>

                      <TouchableOpacity style={styles.iconChipButtonWithText} onPress={() => handleSharePhoto(previewPhoto)}>
                        <Icon source="share-variant-outline" size={16} color="#000000" />
                        <Text style={styles.chipText}>2</Text>
                      </TouchableOpacity>
                    </View>

                    {/* AUTHOR & DESCRIPTION */}
                    <View style={{ gap: 6 }}>
                      <Pressable onPress={() => openAccountProfile(previewPhoto)}>
                        <Text style={[styles.creatorNameClickable, { color: palette.primary }]}>
                          👤 {previewPhoto.location || 'La Trinidad Benguet'} (View Profile)
                        </Text>
                      </Pressable>

                      <Text style={[styles.expandedPinTitle, { color: palette.text }]}>
                        {previewPhoto.title || 'Stunning views in La Trinidad, Benguet'}
                      </Text>
                      <Text style={{ color: palette.muted, fontSize: 13, lineHeight: 18 }}>
                        {previewPhoto.description ||
                          'High-resolution view of La Trinidad, Benguet, Philippines, featuring lush landscapes, vibrant strawberry farms, and mountain backdrops.'}
                      </Text>
                    </View>

                    {/* COMMENTS SECTION HEADER */}
                    <Text style={[styles.sectionHeaderTitle, { color: palette.text }]}>
                      Comments & Community
                    </Text>

                    {/* MORE LIKE THIS SECTION */}
                    <Text style={[styles.sectionHeaderTitle, { color: palette.text }]}>
                      More like this
                    </Text>

                    {/* INTERACTIVE TAG CHIPS */}
                    <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.tagChipsScrollView}>
                      {tagChipsState.map((tag) => {
                        const isSelected = selectedTag === tag;
                        return (
                          <TouchableOpacity
                            key={tag}
                            style={[
                              styles.tagChip,
                              isSelected && { backgroundColor: palette.primary },
                            ]}
                            onPress={() => void changeSelectedTag(tag)}
                          >
                            <Text
                              style={[
                                styles.tagChipText,
                                isSelected && { color: '#FFFFFF', fontWeight: '800' },
                              ]}
                            >
                              {tag}
                            </Text>
                          </TouchableOpacity>
                        );
                      })}

                      <TouchableOpacity style={styles.chevronGenerateBtn} onPress={handleGenerateMoreTags}>
                        <Icon source="chevron-right" size={16} color="#000000" />
                      </TouchableOpacity>
                    </ScrollView>

                    {/* COMMENT INPUT & MAPS */}
                    <View style={{ gap: 8, marginTop: 4 }}>
                      <View
                        style={[
                          styles.orangeCommentInputBox,
                          { backgroundColor: palette.inputBg, borderColor: palette.border },
                        ]}
                      >
                        <TextInput
                          placeholder="Add a comment to share your thoughts"
                          placeholderTextColor={palette.muted}
                          value={newCommentText}
                          onChangeText={setNewCommentText}
                          onSubmitEditing={() => handleAddComment(previewPhoto.id)}
                          underlineColor="transparent"
                          activeUnderlineColor="transparent"
                          textColor={palette.text}
                          style={[styles.commentTextInput, { backgroundColor: palette.inputBg }]}
                        />

                        <View style={styles.commentInputRightIcons}>
                          <TouchableOpacity onPress={() => setNewCommentText((prev) => prev + ' 😊')}>
                            <Icon source="emoticon-happy-outline" size={18} color={palette.muted} />
                          </TouchableOpacity>
                          <TouchableOpacity onPress={() => setNewCommentText((prev) => prev + ' 📌')}>
                            <Icon source="sticker-emoji" size={18} color={palette.muted} />
                          </TouchableOpacity>
                          <TouchableOpacity onPress={() => handleAddComment(previewPhoto.id)}>
                            <Icon source="send" size={18} color={palette.primary} />
                          </TouchableOpacity>
                        </View>
                      </View>

                      <Button
                        mode="outlined"
                        icon="map-marker-outline"
                        onPress={() =>
                          Linking.openURL(
                            `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
                              (previewPhoto.title || '') + ' ' + (previewPhoto.location || 'La Trinidad Benguet'),
                            )}`,
                          )
                        }
                        style={{ borderRadius: 24 }}
                      >
                        Open Maps
                      </Button>
                    </View>

                    {/* LIVE PEXELS API MASONRY GRID */}
                    <View style={styles.expandedRelatedGridContainer}>
                      <Text style={styles.relatedGridSectionHeader}>
                        Live Pexels Gallery for "{selectedTag}" ({apiPhotos.length} photos)
                      </Text>

                      {isApiLoading && apiPhotos.length === 0 ? (
                        <ActivityIndicator size="small" color={palette.primary} style={{ marginVertical: 16 }} />
                      ) : (
                        <View style={styles.relatedMasonryRow}>
                          <View style={styles.relatedMasonryCol}>
                            {apiPhotos
                              .filter((_, idx) => idx % 2 === 0)
                              .map((item) => (
                                <TouchableOpacity
                                  key={`rel-col1-${item.id}`}
                                  activeOpacity={0.85}
                                  style={styles.relatedGridCard}
                                  onPress={() => setPreviewPhoto(item)}
                                >
                                  <Image
                                    source={{ uri: item.url }}
                                    style={styles.relatedGridImage}
                                    resizeMode="cover"
                                  />
                                  <LinearGradient
                                    colors={['transparent', 'rgba(0,0,0,0.7)']}
                                    style={styles.relatedImageGradient}
                                  >
                                    <Text numberOfLines={1} style={styles.relatedImageTitle}>
                                      {item.title}
                                    </Text>
                                  </LinearGradient>
                                </TouchableOpacity>
                              ))}
                          </View>

                          <View style={styles.relatedMasonryCol}>
                            {apiPhotos
                              .filter((_, idx) => idx % 2 === 1)
                              .map((item) => (
                                <TouchableOpacity
                                  key={`rel-col2-${item.id}`}
                                  activeOpacity={0.85}
                                  style={styles.relatedGridCard}
                                  onPress={() => setPreviewPhoto(item)}
                                >
                                  <Image
                                    source={{ uri: item.url }}
                                    style={styles.relatedGridImage}
                                    resizeMode="cover"
                                  />
                                  <LinearGradient
                                    colors={['transparent', 'rgba(0,0,0,0.7)']}
                                    style={styles.relatedImageGradient}
                                  >
                                    <Text numberOfLines={1} style={styles.relatedImageTitle}>
                                      {item.title}
                                    </Text>
                                  </LinearGradient>
                                </TouchableOpacity>
                              ))}
                          </View>
                        </View>
                      )}

                      {/* LIVE API LOAD MORE */}
                      {isApiLoading && apiPhotos.length > 0 && (
                        <ActivityIndicator size="small" color={palette.primary} style={{ marginTop: 12 }} />
                      )}
                    </View>
                  </ScrollView>
                </View>
              </View>
            </View>
          )}
        </Modal>
      </Portal>

      {/* VISUAL SCANNER & GENERATION MODAL OVERLAY WITH MASONRY & INFINITE SCROLL */}
      <Portal>
        <Modal
          visible={scanModalVisible}
          onRequestClose={() => setScanModalVisible(false)}
          transparent
          animationType="fade"
        >
          {scanPhoto && (
            <View style={styles.modalBackdrop}>
              <View style={[styles.scanModalContainer, { backgroundColor: palette.surface }]}>
                <TouchableOpacity
                  style={styles.scanCloseBtn}
                  onPress={() => setScanModalVisible(false)}
                >
                  <Icon source="close" size={20} color={palette.text} />
                </TouchableOpacity>

                <ScrollView
                  showsVerticalScrollIndicator={false}
                  contentContainerStyle={{ paddingBottom: 24 }}
                  onScroll={handleScanModalScroll}
                  scrollEventThrottle={16}
                >
                  <Text style={[styles.scanHeaderTitle, { color: palette.text }]}>
                    Visual Image Scanner & Matcher
                  </Text>
                  <Text style={[styles.scanSubTitle, { color: palette.muted }]}>
                    Scanning image features to generate similar high-resolution visual matches...
                  </Text>

                  <View style={styles.scanImageFrame}>
                    <Image source={{ uri: scanPhoto.url }} style={styles.scanPreviewImage} resizeMode="cover" />

                    {isScanning && (
                      <Animated.View
                        style={[
                          styles.scanLaserLine,
                          {
                            transform: [
                              {
                                translateY: scanLineAnim.interpolate({
                                  inputRange: [0, 1],
                                  outputRange: [0, 240],
                                }),
                              },
                            ],
                          },
                        ]}
                      >
                        <LinearGradient
                          colors={['transparent', '#00E676', 'transparent']}
                          style={{ height: 4, width: '100%' }}
                        />
                      </Animated.View>
                    )}
                  </View>

                  {isScanning ? (
                    <View style={styles.scanningStatusBox}>
                      <ActivityIndicator size="small" color={palette.primary} />
                      <Text style={[styles.scanningStatusText, { color: palette.primary }]}>
                        Analyzing visual patterns & generating matches...
                      </Text>
                    </View>
                  ) : (
                    <View style={styles.scannedResultsContainer}>
                      <Text style={[styles.resultsSectionHeader, { color: palette.primary }]}>
                        Generated Visual Matches ({scannedResults.length} photos)
                      </Text>

                      {/* 2-COLUMN COLLAGE MASONRY LAYOUT */}
                      <View style={styles.relatedMasonryRow}>
                        <View style={styles.relatedMasonryCol}>
                          {scannedResults
                            .filter((_, idx) => idx % 2 === 0)
                            .map((item) => (
                              <TouchableOpacity
                                key={`scan-col1-${item.id}`}
                                activeOpacity={0.85}
                                style={styles.relatedGridCard}
                                onPress={() => {
                                  setScanModalVisible(false);
                                  setPreviewPhoto(item);
                                }}
                              >
                                <Image
                                  source={{ uri: item.url }}
                                  style={styles.relatedGridImage}
                                  resizeMode="cover"
                                />
                                <LinearGradient
                                  colors={['transparent', 'rgba(0,0,0,0.75)']}
                                  style={styles.relatedImageGradient}
                                >
                                  <Text numberOfLines={1} style={styles.relatedImageTitle}>
                                    {item.title}
                                  </Text>
                                </LinearGradient>
                              </TouchableOpacity>
                            ))}
                        </View>

                        <View style={styles.relatedMasonryCol}>
                          {scannedResults
                            .filter((_, idx) => idx % 2 === 1)
                            .map((item) => (
                              <TouchableOpacity
                                key={`scan-col2-${item.id}`}
                                activeOpacity={0.85}
                                style={styles.relatedGridCard}
                                onPress={() => {
                                  setScanModalVisible(false);
                                  setPreviewPhoto(item);
                                }}
                              >
                                <Image
                                  source={{ uri: item.url }}
                                  style={styles.relatedGridImage}
                                  resizeMode="cover"
                                />
                                <LinearGradient
                                  colors={['transparent', 'rgba(0,0,0,0.75)']}
                                  style={styles.relatedImageGradient}
                                >
                                  <Text numberOfLines={1} style={styles.relatedImageTitle}>
                                    {item.title}
                                  </Text>
                                </LinearGradient>
                              </TouchableOpacity>
                            ))}
                        </View>
                      </View>

                      {/* INFINITE SCROLL SPINNER FOR SCANNER */}
                      {isScanLoadingMore && (
                        <ActivityIndicator size="small" color={palette.primary} style={{ marginTop: 16 }} />
                      )}
                    </View>
                  )}
                </ScrollView>
              </View>
            </View>
          )}
        </Modal>
      </Portal>

      {/* PHOTO DETAILS MODAL */}
      <Portal>
        <Modal
          visible={!!detailsPhoto}
          onRequestClose={() => setDetailsPhoto(null)}
          transparent
          animationType="fade"
        >
          {detailsPhoto && (
            <View style={styles.modalBackdrop}>
              <View style={styles.pexelsDetailsDarkCard}>
                <View style={styles.detailsHeaderRow}>
                  <View style={styles.detailsHeaderLeft}>
                    <Image
                      source={{ uri: detailsPhoto.url }}
                      style={styles.detailsHeaderThumbnail}
                      resizeMode="cover"
                    />
                    <View style={{ gap: 2 }}>
                      <Text style={styles.detailsTitleText}>Photo details</Text>
                      <Text style={styles.detailsUploadedText}>
                        Uploaded on {detailsPhoto.uploadedAt || 'October 7th, 2026 at 9:08 PM'}
                      </Text>
                    </View>
                  </View>

                  <TouchableOpacity
                    style={styles.detailsCloseBtn}
                    onPress={() => setDetailsPhoto(null)}
                  >
                    <Icon source="close" size={20} color="#FFFFFF" />
                  </TouchableOpacity>
                </View>

                <View style={styles.detailsStatsRow}>
                  <View style={styles.detailsStatItem}>
                    <Text style={styles.statLabelText}>Views</Text>
                    <Text style={styles.statValueText}>{detailsPhoto.views ?? 18}</Text>
                  </View>
                  <View style={styles.detailsStatItem}>
                    <Text style={styles.statLabelText}>Likes</Text>
                    <Text style={styles.statValueText}>{detailsPhoto.likesCount ?? 0}</Text>
                  </View>
                  <View style={styles.detailsStatItem}>
                    <Text style={styles.statLabelText}>Downloads</Text>
                    <Text style={styles.statValueText}>{detailsPhoto.downloadsCount ?? 0}</Text>
                  </View>
                </View>

                <View style={styles.detailsWhiteCard}>
                  <View style={styles.exifGridRow}>
                    <View style={styles.exifItem}>
                      <Text style={styles.exifLabelText}>Dimensions</Text>
                      <Text style={styles.exifValueText}>
                        {detailsPhoto.width || 4032} x {detailsPhoto.height || 3024}
                      </Text>
                    </View>

                    <View style={styles.exifItem}>
                      <Text style={styles.exifLabelText}>Aspect Ratio</Text>
                      <Text style={styles.exifValueText}>4:3</Text>
                    </View>

                    <View style={styles.exifItem}>
                      <Text style={styles.exifLabelText}>Camera</Text>
                      <Text style={styles.exifValueText}>
                        {detailsPhoto.camera || 'iPhone 8 Plus'}
                      </Text>
                    </View>

                    <View style={styles.exifItem}>
                      <Text style={styles.exifLabelText}>Focal</Text>
                      <Text style={styles.exifValueText}>
                        {detailsPhoto.focal || '6.6mm'}
                      </Text>
                    </View>
                  </View>

                  <View style={styles.exifGridRow}>
                    <View style={styles.exifItem}>
                      <Text style={styles.exifLabelText}>Aperture</Text>
                      <Text style={styles.exifValueText}>
                        {detailsPhoto.aperture || 'f/2.8'}
                      </Text>
                    </View>

                    <View style={styles.exifItem}>
                      <Text style={styles.exifLabelText}>ISO</Text>
                      <Text style={styles.exifValueText}>{detailsPhoto.iso ?? 50}</Text>
                    </View>

                    <View style={styles.exifItem}>
                      <Text style={styles.exifLabelText}>Shutter Speed</Text>
                      <Text style={styles.exifValueText}>
                        {detailsPhoto.shutterSpeed || '1/121 sec'}
                      </Text>
                    </View>

                    <View style={styles.exifItem}>
                      <Text style={styles.exifLabelText}>Taken At</Text>
                      <Text style={styles.exifValueText}>
                        {detailsPhoto.takenAt || 'May 30, 2020'}
                      </Text>
                    </View>
                  </View>

                  <View style={styles.exifGridRow}>
                    <View style={styles.exifItem}>
                      <Text style={styles.exifLabelText}>Software</Text>
                      <Text style={styles.exifValueText}>
                        {detailsPhoto.software || '13.5'}
                      </Text>
                    </View>
                  </View>
                </View>
              </View>
            </View>
          )}
        </Modal>
      </Portal>

      {/* ADD TO COLLAGE MODAL */}
      <Portal>
        <Modal
          visible={!!collagePhoto}
          onRequestClose={() => setCollagePhoto(null)}
          transparent
          animationType="fade"
        >
          {collagePhoto && (
            <View style={styles.modalBackdrop}>
              <View style={[styles.collageModalCard, { backgroundColor: palette.surface }]}>
                <TouchableOpacity
                  style={styles.collageCloseBtn}
                  onPress={() => setCollagePhoto(null)}
                >
                  <Icon source="close" size={20} color={palette.text} />
                </TouchableOpacity>

                <Text style={[styles.collageTitle, { color: palette.text }]}>Add to collage</Text>

                {collages.length === 0 ? (
                  <Text style={[styles.collageEmptySubtext, { color: palette.text }]}>
                    You have no collage drafts yet. Create one to add this Pin.
                  </Text>
                ) : (
                  <ScrollView style={{ maxHeight: 200, marginVertical: 12 }}>
                    {collages.map((item) => (
                      <TouchableOpacity
                        key={item.id}
                        style={[styles.collageItemRow, { borderColor: palette.border }]}
                        onPress={() => handleAddToExistingCollage(item.id)}
                      >
                        <Icon source="view-dashboard-outline" size={20} color={palette.primary} />
                        <View style={{ flex: 1 }}>
                          <Text style={{ fontWeight: '700', color: palette.text }}>{item.name}</Text>
                          <Text style={{ fontSize: 11, color: palette.muted }}>
                            {item.photos.length} Pin{item.photos.length === 1 ? '' : 's'}
                          </Text>
                        </View>
                        <Icon source="plus-circle-outline" size={20} color={palette.primary} />
                      </TouchableOpacity>
                    ))}
                  </ScrollView>
                )}

                {isCreatingCollage ? (
                  <View style={styles.createCollageInputBox}>
                    <TextInput
                      placeholder="Collage Title (e.g., Manila Foodie Escapes)"
                      placeholderTextColor={palette.muted}
                      value={newCollageTitle}
                      onChangeText={setNewCollageTitle}
                      mode="outlined"
                      outlineColor={palette.border}
                      activeOutlineColor={palette.primary}
                      textColor={palette.text}
                      style={{ backgroundColor: palette.surface }}
                    />
                    <View style={styles.collageFormButtonsRow}>
                      <Button mode="text" onPress={() => setIsCreatingCollage(false)}>
                        Cancel
                      </Button>
                      <Button
                        mode="contained"
                        buttonColor={palette.primary}
                        onPress={handleCreateNewCollageSubmit}
                      >
                        Save & Add Pin
                      </Button>
                    </View>
                  </View>
                ) : (
                  <TouchableOpacity
                    style={styles.createCollageBtn}
                    onPress={handleLaunchCollageCanvas}
                  >
                    <View style={styles.plusIconBg}>
                      <Icon source="plus" size={24} color="#0D2D1B" />
                    </View>
                    <Text style={[styles.createCollageBtnText, { color: palette.text }]}>
                      Create a new collage
                    </Text>
                  </TouchableOpacity>
                )}
              </View>
            </View>
          )}
        </Modal>
      </Portal>

      {/* FULLSCREEN PINTEREST COLLAGE CREATION CANVAS TOOL */}
      <Portal>
        <Modal
          visible={collageCanvasVisible}
          onRequestClose={() => setCollageCanvasVisible(false)}
          transparent
          animationType="slide"
        >
          <View style={styles.fullCanvasContainer}>
            {/* CANVAS HEADER NAVBAR */}
            <View style={styles.canvasHeaderBar}>
              <View style={styles.canvasHeaderLeft}>
                <TouchableOpacity
                  style={styles.canvasIconButton}
                  onPress={() => setCollageCanvasVisible(false)}
                >
                  <Icon source="close" size={24} color="#000000" />
                </TouchableOpacity>
                <Text style={styles.canvasTitleText}>Create Collage</Text>
              </View>

              <View style={styles.canvasHeaderRight}>
                <TouchableOpacity style={styles.canvasIconButton}>
                  <Icon source="undo-variant" size={20} color="#000000" />
                </TouchableOpacity>
                <TouchableOpacity style={styles.canvasIconButton}>
                  <Icon source="redo-variant" size={20} color="#000000" />
                </TouchableOpacity>
                <TouchableOpacity style={styles.canvasIconButton}>
                  <Icon source="dots-horizontal" size={20} color="#000000" />
                </TouchableOpacity>
                <TouchableOpacity style={styles.canvasNextButton} onPress={handleSaveFinalCollage}>
                  <Text style={styles.canvasNextButtonText}>Next</Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* MAIN WORKSPACE BODY */}
            <View style={styles.canvasWorkspaceBody}>
              {/* LEFT CUTOUTS SIDEBAR */}
              <View style={styles.canvasSidebar}>
                <Text style={styles.sidebarHeaderTitle}>Cutouts</Text>
                <Text style={styles.sidebarHeaderSub}>
                  Select a cutout to edit or drag to reorder
                </Text>

                <ScrollView showsVerticalScrollIndicator={false} style={{ marginTop: 12 }}>
                  {canvasCutouts.map((cutout, index) => (
                    <View key={cutout.id} style={styles.cutoutLayerRow}>
                      <Icon source="drag-horizontal-variant" size={18} color="#757575" />
                      <Image source={{ uri: cutout.photoUrl }} style={styles.cutoutLayerThumb} />
                      <Text numberOfLines={1} style={styles.cutoutLayerTitle}>
                        {cutout.title || `Cutout ${index + 1}`}
                      </Text>
                      <Icon source="dots-horizontal" size={16} color="#757575" />
                    </View>
                  ))}

                  <View style={styles.cutoutLayerRow}>
                    <Icon source="lock-outline" size={18} color="#757575" />
                    <View style={styles.backgroundGridThumb} />
                    <Text style={styles.cutoutLayerTitle}>Background</Text>
                  </View>
                </ScrollView>
              </View>

              {/* CENTER DOT GRID CANVAS FRAME */}
              <View style={styles.canvasBoardArea}>
                <View style={styles.dotGridBoard}>
                  {/* DISPLAYED CANVAS CUTOUT STICKERS */}
                  {canvasCutouts.map((cutout, idx) => (
                    <View
                      key={cutout.id}
                      style={[
                        styles.canvasPlacedCutout,
                        {
                          top: 40 + idx * 30,
                          left: 30 + idx * 25,
                        },
                      ]}
                    >
                      <Image source={{ uri: cutout.photoUrl }} style={styles.placedCutoutImage} />
                    </View>
                  ))}

                  {/* DISPLAYED TEXT STICKERS */}
                  {canvasStickers.map((sticker, idx) => (
                    <View key={`stick-${idx}`} style={[styles.canvasPlacedSticker, { top: 200 + idx * 40 }]}>
                      <Text style={styles.stickerText}>{sticker}</Text>
                    </View>
                  ))}

                  {canvasCutouts.length === 0 && canvasStickers.length === 0 && (
                    <View style={styles.centerCanvasEmptyHint}>
                      <Icon source="shape-plus" size={32} color="#BDBDBD" />
                      <Text style={styles.canvasEmptyHintText}>
                        Tap the tools below to add photos or stickers
                      </Text>
                    </View>
                  )}
                </View>

                {/* BOTTOM FLOATING CANVAS TOOLBAR */}
                <View style={styles.bottomFloatingToolbar}>
                  <TouchableOpacity style={styles.toolIconCircle} onPress={handleAddTextSticker}>
                    <Text style={styles.textToolIcon}>A</Text>
                  </TouchableOpacity>

                  <TouchableOpacity style={styles.toolIconCircle} onPress={handleAddMoreCutout}>
                    <Icon source="draw" size={20} color="#000000" />
                  </TouchableOpacity>

                  <TouchableOpacity style={styles.toolIconCircle} onPress={handleAddMoreCutout}>
                    <Icon source="image-plus" size={20} color="#000000" />
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          </View>
        </Modal>
      </Portal>

      {/* DOWNLOAD SETTINGS MODAL */}
      <Portal>
        <Modal
          visible={!!downloadPhoto}
          onRequestClose={() => setDownloadPhoto(null)}
          transparent
          animationType="fade"
        >
          {downloadPhoto && (
            <View style={styles.modalBackdrop}>
              <View
                style={[
                  styles.downloadModalCard,
                  { backgroundColor: palette.surface },
                ]}
              >
                <View style={styles.downloadHeader}>
                  <Text variant="titleLarge" style={{ fontWeight: '900', color: palette.text }}>
                    Download image
                  </Text>
                  <IconButton
                    icon="close"
                    size={22}
                    onPress={() => setDownloadPhoto(null)}
                  />
                </View>

                <ScrollView showsVerticalScrollIndicator={false}>
                  <Text style={{ color: palette.muted, marginBottom: 12 }}>
                    Preview and customize your image before downloading.
                  </Text>

                  <View style={styles.selectedDestCard}>
                    <Text style={{ fontWeight: '800', color: palette.text }}>
                      Selected tourist destination:
                    </Text>
                    <Text style={{ fontWeight: '900', color: palette.primary, fontSize: 16 }}>
                      {downloadPhoto.title}, {downloadPhoto.location}
                    </Text>
                  </View>

                  <Text style={styles.sectionLabel}>Resolution / image quality</Text>
                  {RESOLUTIONS.map((res, index) => (
                    <TouchableOpacity
                      key={res.label}
                      style={[
                        styles.radioRow,
                        selectedResIndex === index && {
                          backgroundColor: palette.primary + '18',
                          borderColor: palette.primary,
                        },
                      ]}
                      onPress={() => setSelectedResIndex(index)}
                    >
                      <Text style={{ fontWeight: '700', color: palette.text }}>
                        {res.label}
                      </Text>
                      {selectedResIndex === index && (
                        <Icon source="check-circle" size={18} color={palette.primary} />
                      )}
                    </TouchableOpacity>
                  ))}

                  <Text style={styles.sectionLabel}>Image format</Text>
                  {FORMATS.map((fmt, index) => (
                    <TouchableOpacity
                      key={fmt.ext}
                      style={[
                        styles.radioRow,
                        selectedFormatIndex === index && {
                          backgroundColor: palette.primary + '18',
                          borderColor: palette.primary,
                        },
                      ]}
                      onPress={() => setSelectedFormatIndex(index)}
                    >
                      <Text style={{ fontWeight: '700', color: palette.text }}>
                        {fmt.label}
                      </Text>
                      {selectedFormatIndex === index && (
                        <Icon source="check-circle" size={18} color={palette.primary} />
                      )}
                    </TouchableOpacity>
                  ))}

                  <View style={styles.dimRow}>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.dimLabel}>Width (px)</Text>
                      <TextInput
                        mode="outlined"
                        dense
                        value={useCustomDim ? customWidth : String(calculatedSpecs.width)}
                        onChangeText={setCustomWidth}
                        editable={useCustomDim}
                      />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.dimLabel}>Height (px)</Text>
                      <TextInput
                        mode="outlined"
                        dense
                        value={useCustomDim ? customHeight : String(calculatedSpecs.height)}
                        onChangeText={setCustomHeight}
                        editable={useCustomDim}
                      />
                    </View>
                  </View>

                  <Chip
                    selected={useCustomDim}
                    onPress={() => setUseCustomDim(!useCustomDim)}
                    style={{ marginTop: 10, alignSelf: 'flex-start' }}
                  >
                    Use custom dimensions
                  </Chip>

                  <View style={styles.summaryBox}>
                    <Text style={{ fontWeight: '800', color: palette.text }}>
                      Estimated file size: {calculatedSpecs.sizeStr}
                    </Text>
                    <Text style={{ fontSize: 12, color: palette.muted }}>
                      Selected Quality: {RESOLUTIONS[selectedResIndex].label.split(' ')[0]} ({FORMATS[selectedFormatIndex].ext.toUpperCase()})
                    </Text>
                  </View>

                  <Button
                    mode="contained"
                    icon="download"
                    loading={isDownloading}
                    disabled={isDownloading}
                    buttonColor={palette.primary}
                    style={{ marginTop: 16 }}
                    onPress={() =>
                      triggerDownload(
                        downloadPhoto.url,
                        `${(downloadPhoto.title || 'photo').toLowerCase().replace(/\s+/g, '-')}.${FORMATS[selectedFormatIndex].ext}`,
                      )
                    }
                  >
                    {isDownloading ? 'Saving to Laptop File Manager...' : 'Use these settings & Download'}
                  </Button>
                </ScrollView>
              </View>
            </View>
          )}
        </Modal>
      </Portal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
    zIndex: 1,
  },
  centerContainer: {
    padding: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  toolbar: {
    marginBottom: 16,
    maxWidth: 900,
    alignSelf: 'center',
    width: '100%',
    zIndex: 1,
    elevation: 1,
  },
  categoryScroll: {
    gap: 8,
    paddingVertical: 4,
  },
  categoryChip: {
    borderRadius: 20,
  },
  emptyCard: {
    borderWidth: 1.5,
    borderRadius: 24,
    padding: 30,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginHorizontal: 8,
  },
  emptyEmoji: {
    fontSize: 40,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '800',
    textAlign: 'center',
  },
  emptySubtitle: {
    fontSize: 13,
    textAlign: 'center',
  },
  masonryRow: {
    flexDirection: 'row',
    gap: 10,
    width: '100%',
    zIndex: 1,
  },
  masonryCol: {
    flex: 1,
    gap: 10,
  },
  pinCard: {
    width: '100%',
    borderRadius: 20,
    overflow: 'hidden',
  },
  imageWrapper: {
    width: '100%',
    borderRadius: 20,
    overflow: 'hidden',
    position: 'relative',
    backgroundColor: '#E0E0E0',
  },
  pinImage: {
    width: '100%',
    height: '100%',
  },
  insideImageGradient: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 10,
    paddingTop: 36,
    justifyContent: 'flex-end',
    zIndex: 4,
  },
  insidePinTitle: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '900',
    textShadowColor: 'rgba(0, 0, 0, 0.8)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
    marginBottom: 2,
  },
  accountRowPressable: {
    alignSelf: 'flex-start',
    marginBottom: 8,
  },
  insidePinAccount: {
    color: '#A2E3B2',
    fontSize: 11,
    fontWeight: '800',
    textDecorationLine: 'underline',
  },
  floatingOverlay: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 2,
  },
  visitSiteBtn: {
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 18,
    elevation: 3,
  },
  visitSiteText: {
    color: '#0D2D1B',
    fontWeight: '800',
    fontSize: 11,
  },
  rightOverlayActions: {
    flexDirection: 'row',
    gap: 5,
  },
  iconCircleBtn: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 3,
  },
  loadMoreContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 24,
    marginBottom: 16,
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.65)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 8,
  },
  pinterestCardModal: {
    width: '95%',
    maxWidth: 1400,
    height: '95%',
    maxHeight: 900,
    borderRadius: 24,
    overflow: 'hidden',
    position: 'relative',
    elevation: 12,
  },
  closeModalCircle: {
    position: 'absolute',
    top: 16,
    left: 16,
    zIndex: 10,
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 4,
  },
  splitRow: {
    flexDirection: 'row',
    height: '100%',
  },
  splitColumn: {
    flexDirection: 'column',
    height: 'auto',
  },
  leftImageColumn: {
    flex: 1.4,
    backgroundColor: '#000',
    position: 'relative',
  },
  pinterestExpandedImage: {
    width: '100%',
    height: '100%',
  },
  blueExpandBtn: {
    position: 'absolute',
    bottom: 54,
    right: 14,
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: 'rgba(255, 255, 255, 0.92)',
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 4,
    zIndex: 8,
  },
  brownSearchSimilarBtn: {
    position: 'absolute',
    bottom: 14,
    right: 14,
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: 'rgba(255, 255, 255, 0.92)',
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 4,
    zIndex: 8,
  },
  rightDetailColumn: {
    flex: 1,
    padding: 16,
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
    paddingVertical: 4,
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
  creatorNameClickable: {
    fontSize: 13,
    fontWeight: '900',
    textDecorationLine: 'underline',
  },
  expandedPinTitle: {
    fontSize: 20,
    fontWeight: '900',
    lineHeight: 26,
  },
  sectionHeaderTitle: {
    fontSize: 15,
    fontWeight: '800',
    marginTop: 4,
  },
  tagChipsScrollView: {
    flexDirection: 'row',
    marginVertical: 4,
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
  chevronGenerateBtn: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E0E0E0',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
  },
  orangeCommentInputBox: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 20,
    paddingHorizontal: 12,
    height: 42,
  },
  commentTextInput: {
    flex: 1,
    fontSize: 12,
    height: 38,
  },
  commentInputRightIcons: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  expandedRelatedGridContainer: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#EEEEEE',
  },
  relatedGridSectionHeader: {
    fontSize: 13,
    fontWeight: '800',
    color: '#00695C',
    marginBottom: 8,
  },
  relatedMasonryRow: {
    flexDirection: 'row',
    gap: 8,
    width: '100%',
  },
  relatedMasonryCol: {
    flex: 1,
    gap: 8,
  },
  relatedGridCard: {
    width: '100%',
    height: 140,
    borderRadius: 14,
    overflow: 'hidden',
    position: 'relative',
    backgroundColor: '#E0E0E0',
  },
  relatedGridImage: {
    width: '100%',
    height: '100%',
  },
  relatedImageGradient: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 8,
    justifyContent: 'flex-end',
  },
  relatedImageTitle: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '800',
  },
  scanModalContainer: {
    width: '90%',
    maxWidth: 680,
    maxHeight: '90%',
    borderRadius: 24,
    padding: 24,
    position: 'relative',
    elevation: 12,
  },
  scanCloseBtn: {
    position: 'absolute',
    top: 16,
    right: 16,
    zIndex: 10,
  },
  scanHeaderTitle: {
    fontSize: 18,
    fontWeight: '900',
  },
  scanSubTitle: {
    fontSize: 12,
    marginBottom: 16,
  },
  scanImageFrame: {
    width: '100%',
    height: 250,
    borderRadius: 18,
    overflow: 'hidden',
    position: 'relative',
    backgroundColor: '#000000',
  },
  scanPreviewImage: {
    width: '100%',
    height: '100%',
  },
  scanLaserLine: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 5,
  },
  scanningStatusBox: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    marginVertical: 24,
  },
  scanningStatusText: {
    fontSize: 14,
    fontWeight: '700',
  },
  scannedResultsContainer: {
    marginTop: 20,
  },
  resultsSectionHeader: {
    fontSize: 14,
    fontWeight: '800',
    marginBottom: 10,
  },
  pexelsDetailsDarkCard: {
    width: '90%',
    maxWidth: 620,
    backgroundColor: '#050505',
    borderRadius: 24,
    overflow: 'hidden',
    elevation: 12,
  },
  detailsHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 16,
  },
  detailsHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  detailsHeaderThumbnail: {
    width: 80,
    height: 60,
    borderRadius: 12,
  },
  detailsTitleText: {
    fontSize: 22,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  detailsUploadedText: {
    fontSize: 12,
    color: '#8E8E93',
    fontWeight: '500',
  },
  detailsCloseBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  detailsStatsRow: {
    flexDirection: 'row',
    paddingHorizontal: 24,
    paddingBottom: 20,
    gap: 48,
  },
  detailsStatItem: {
    gap: 4,
  },
  statLabelText: {
    fontSize: 12,
    color: '#8E8E93',
    fontWeight: '600',
  },
  statValueText: {
    fontSize: 22,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  detailsWhiteCard: {
    backgroundColor: '#FFFFFF',
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
    padding: 24,
    gap: 20,
  },
  exifGridRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  exifItem: {
    flex: 1,
    gap: 4,
  },
  exifLabelText: {
    fontSize: 12,
    color: '#8E8E93',
    fontWeight: '600',
  },
  exifValueText: {
    fontSize: 13,
    fontWeight: '800',
    color: '#000000',
  },
  collageModalCard: {
    width: '100%',
    maxWidth: 620,
    borderRadius: 24,
    padding: 24,
    position: 'relative',
    elevation: 10,
  },
  collageCloseBtn: {
    position: 'absolute',
    top: 20,
    left: 20,
    zIndex: 5,
  },
  collageTitle: {
    fontSize: 18,
    fontWeight: '900',
    textAlign: 'center',
    marginTop: 4,
    marginBottom: 20,
  },
  collageEmptySubtext: {
    textAlign: 'center',
    fontSize: 14,
    color: '#333333',
    marginVertical: 24,
  },
  collageItemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderRadius: 12,
    marginBottom: 8,
  },
  createCollageBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    marginTop: 10,
  },
  plusIconBg: {
    width: 48,
    height: 48,
    borderRadius: 14,
    backgroundColor: '#EAEAEA',
    alignItems: 'center',
    justifyContent: 'center',
  },
  createCollageBtnText: {
    fontSize: 15,
    fontWeight: '700',
  },
  createCollageInputBox: {
    marginTop: 10,
    gap: 10,
  },
  collageFormButtonsRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 8,
  },
  fullCanvasContainer: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  canvasHeaderBar: {
    height: 60,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  canvasHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  canvasHeaderRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  canvasIconButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  canvasTitleText: {
    fontSize: 18,
    fontWeight: '800',
    color: '#000000',
  },
  canvasNextButton: {
    backgroundColor: '#E60023',
    paddingHorizontal: 18,
    paddingVertical: 8,
    borderRadius: 20,
  },
  canvasNextButtonText: {
    color: '#FFFFFF',
    fontWeight: '800',
    fontSize: 14,
  },
  canvasWorkspaceBody: {
    flex: 1,
    flexDirection: 'row',
  },
  canvasSidebar: {
    width: 240,
    borderRightWidth: 1,
    borderRightColor: '#E0E0E0',
    padding: 16,
    backgroundColor: '#FAFAFA',
  },
  sidebarHeaderTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: '#000000',
  },
  sidebarHeaderSub: {
    fontSize: 11,
    color: '#757575',
    marginTop: 2,
  },
  cutoutLayerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 8,
    paddingHorizontal: 6,
    borderRadius: 8,
    backgroundColor: '#FFFFFF',
    marginBottom: 6,
    borderWidth: 1,
    borderColor: '#EEEEEE',
  },
  cutoutLayerThumb: {
    width: 28,
    height: 28,
    borderRadius: 4,
  },
  cutoutLayerTitle: {
    flex: 1,
    fontSize: 12,
    fontWeight: '600',
    color: '#000000',
  },
  backgroundGridThumb: {
    width: 28,
    height: 28,
    borderRadius: 4,
    backgroundColor: '#F5F5F5',
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderStyle: 'dashed',
  },
  canvasBoardArea: {
    flex: 1,
    backgroundColor: '#F7F7F7',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  dotGridBoard: {
    width: 380,
    height: 520,
    backgroundColor: '#FAFAFA',
    borderRadius: 24,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    position: 'relative',
    overflow: 'hidden',
    elevation: 3,
  },
  canvasPlacedCutout: {
    position: 'absolute',
    width: 140,
    height: 140,
    borderRadius: 16,
    overflow: 'hidden',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
  },
  placedCutoutImage: {
    width: '100%',
    height: '100%',
  },
  canvasPlacedSticker: {
    position: 'absolute',
    left: 40,
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    elevation: 3,
  },
  stickerText: {
    fontWeight: '800',
    fontSize: 13,
    color: '#000000',
  },
  centerCanvasEmptyHint: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    padding: 24,
  },
  canvasEmptyHintText: {
    fontSize: 12,
    color: '#9E9E9E',
    textAlign: 'center',
    fontWeight: '600',
  },
  bottomFloatingToolbar: {
    position: 'absolute',
    bottom: 24,
    flexDirection: 'row',
    gap: 16,
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 30,
    elevation: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
  },
  toolIconCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  textToolIcon: {
    fontSize: 18,
    fontWeight: '900',
    color: '#000000',
  },
  downloadModalCard: {
    width: '100%',
    maxWidth: 540,
    maxHeight: '90%',
    borderRadius: 24,
    padding: 20,
    elevation: 10,
  },
  downloadHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  selectedDestCard: {
    backgroundColor: 'rgba(0,105,92,0.08)',
    padding: 12,
    borderRadius: 14,
    marginBottom: 16,
  },
  sectionLabel: {
    fontSize: 13,
    fontWeight: '800',
    marginTop: 12,
    marginBottom: 8,
  },
  radioRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    marginBottom: 6,
  },
  dimRow: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 10,
  },
  dimLabel: {
    fontSize: 12,
    fontWeight: '700',
    marginBottom: 4,
  },
  summaryBox: {
    marginTop: 16,
    padding: 14,
    backgroundColor: 'rgba(0,0,0,0.04)',
    borderRadius: 14,
    gap: 4,
  },
});