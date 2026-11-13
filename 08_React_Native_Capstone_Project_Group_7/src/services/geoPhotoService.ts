import axios from 'axios';
import { useSyncExternalStore } from 'react';
import { Linking, Platform, Share } from 'react-native';
import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';

const PSGC_BASE_URL = 'https://psgc.gitlab.io/api';

const PEXELS_API_KEY = process.env.EXPO_PUBLIC_PEXELS_API_KEY;

export type Region = {
  code: string;
  name: string;
  regionName: string;
  islandGroupCode: string;
  psgcCode: string;
};

export type City = {
  code: string;
  name: string;
  isCity: boolean;
  isMunicipality: boolean;
  provinceCode: string;
  regionCode: string;
};

export type Photo = {
  id: number;
  imageUrl: string;
  photographer: string;
  photographerUrl: string;
  altText: string;
  caption?: string;
  isFavorite?: boolean;
  isLiked?: boolean;
};

export type SavedPhoto = Photo & { location: string };
const photoCache = new Map<string, SavedPhoto>();
export const getCachedPhoto = (id: string) => photoCache.get(id);

export const getRegions = async (): Promise<Region[]> => {
  try {
    const response = await axios.get(`${PSGC_BASE_URL}/regions/`);
    return response.data;
  } catch (error) {
    console.error('Error fetching regions:', error);
    return [];
  }
};

export const getCitiesMunicipalitiesByRegion = async (regionCode: string): Promise<City[]> => {
  if (!regionCode) return [];
  try {
    const response = await axios.get(`${PSGC_BASE_URL}/regions/${regionCode}/cities-municipalities/`);
    return response.data;
  } catch (error) {
    console.error('Error fetching cities:', error);
    return [];
  }
};

export const searchPhotosByLocation = async (locationName: string): Promise<Photo[]> => {
  if (!locationName) return [];

  const apiKey = (PEXELS_API_KEY ?? '').trim();
  if (!apiKey) {
    console.error('Missing EXPO_PUBLIC_PEXELS_API_KEY — check your .env and restart with: npx expo start -c');
    return [];
  }

  const cleanName = locationName.replace(/^City of\s+/i, '').replace(/\s+City$/i, '').trim();
  const keyword = encodeURIComponent(`${cleanName} Philippines`);
  const url = `https://api.pexels.com/v1/search?query=${keyword}&per_page=80`;

  try {
    const response = await axios.get(url, {
      headers: { Authorization: apiKey },
      timeout: 15000,
    });

    const needle = cleanName.toLowerCase();

    const toPhoto = (photo: any): Photo => ({
      id: photo.id,
      imageUrl: photo.src.large,
      photographer: photo.photographer,
      photographerUrl: photo.photographer_url,
      altText: photo.alt || `Tourist spot near ${cleanName}`,
      caption: photo.alt || `Tourist spot near ${cleanName}`,
      isFavorite: false,
      isLiked: false,
    });

    const all: any[] = response.data.photos;
    const matches = all.filter((p) => (p.alt ?? '').toLowerCase().includes(needle));
    const others = all.filter((p) => !(p.alt ?? '').toLowerCase().includes(needle));

    const MIN_RESULTS = 6;
    const filler = matches.length < MIN_RESULTS ? others.slice(0, MIN_RESULTS - matches.length) : [];
          const results = [...matches.slice(0, 12), ...filler].map(toPhoto);
       results.forEach((p) => photoCache.set(String(p.id), { ...p, location: cleanName }));
       return results;
  } catch (error: any) {
    console.error('Error searching photos:', error?.response?.status ?? error?.message);
    return [];
  }
};

type EngagementState = { favorites: ReadonlySet<string>; likes: ReadonlySet<string> };

let engagementState: EngagementState = { favorites: new Set(), likes: new Set() };
const engagementListeners = new Set<() => void>();

function toggleEngagement(kind: keyof EngagementState, id: string) {
  const next = new Set(engagementState[kind]);
  if (next.has(id)) next.delete(id);
  else next.add(id);
  engagementState = { ...engagementState, [kind]: next };
  engagementListeners.forEach((l) => l());
}

const subscribeEngagement = (l: () => void) => {
  engagementListeners.add(l);
  return () => engagementListeners.delete(l);
};
const getEngagement = () => engagementState;

export function useEngagement() {
  const s = useSyncExternalStore(subscribeEngagement, getEngagement, getEngagement);
  return {
    favorites: s.favorites,
    likes: s.likes,
    toggleFavorite: (id: string) => toggleEngagement('favorites', id),
    toggleLike: (id: string) => toggleEngagement('likes', id),
  };
}

export type ActionPhoto = {
  imageUrl: string;
  photographer: string;
  photographerUrl?: string;
  altText?: string;
};

export function openLocation(place?: string) {
  const query = encodeURIComponent(place ? `${place}, Philippines` : 'Philippines');
  const url = `https://www.google.com/maps/search/?api=1&query=${query}`;
  if (Platform.OS === 'web') {
    window.open(url, '_blank');
  } else {
    Linking.openURL(url);
  }
}

export async function sharePhoto(photo: ActionPhoto, place?: string): Promise<string> {
  const caption = photo.altText || 'Tourist spot';
  const where = place ? ` in ${place}` : '';
  try {
    await Share.share({
      title: 'TechCare',
      message: `${caption}${where} — 📸 ${photo.photographer}\n${photo.photographerUrl ?? photo.imageUrl}`,
      url: photo.imageUrl,
    });
    return '';
  } catch {
    return 'Sharing is not supported here.';
  }
}

export async function downloadPhoto(photo: ActionPhoto): Promise<string> {
  const safeName = photo.photographer.replace(/\s+/g, '_').replace(/[^\w-]/g, '');
  const fileName = `techcare_${safeName}_${Date.now()}.jpg`;
  try {
    if (Platform.OS === 'web') {
      try {
        const blob = await (await fetch(photo.imageUrl)).blob();
        const href = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = href;
        a.download = fileName;
        document.body.appendChild(a);
        a.click();
        a.remove();
        URL.revokeObjectURL(href);
      } catch {
        window.open(photo.imageUrl, '_blank');
      }
      return 'Download started';
    }
    const fileUri = `${FileSystem.documentDirectory}${fileName}`;
    const res = await FileSystem.downloadAsync(photo.imageUrl, fileUri);
    if (await Sharing.isAvailableAsync()) {
      await Sharing.shareAsync(res.uri);
    }
    return 'Photo downloaded';
  } catch {
    return 'Download failed. Please try again.';
  }
}