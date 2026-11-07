import axios from 'axios';

const PSGC_BASE_URL = 'https://psgc.gitlab.io/api';

// Expo only exposes environment variables prefixed with EXPO_PUBLIC_ (loaded from the .env file).
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
};

const FALLBACK_IMAGES = [
  {
    imageUrl:
      'https://images.unsplash.com/photo-1518509562904-e7ef99cdcc86?auto=format&fit=crop&w=1200&q=80',
    photographer: 'Unsplash',
    photographerUrl: 'https://unsplash.com',
  },
  {
    imageUrl:
      'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=1200&q=80',
    photographer: 'Unsplash',
    photographerUrl: 'https://unsplash.com',
  },
  {
    imageUrl:
      'https://images.unsplash.com/photo-1537996194471-e657df975ab4?auto=format&fit=crop&w=1200&q=80',
    photographer: 'Unsplash',
    photographerUrl: 'https://unsplash.com',
  },
  {
    imageUrl:
      'https://images.unsplash.com/photo-1500534623283-312aade485b7?auto=format&fit=crop&w=1200&q=80',
    photographer: 'Unsplash',
    photographerUrl: 'https://unsplash.com',
  },
];

const getFallbackPhotos = (locationName: string): Photo[] =>
  FALLBACK_IMAGES.map((image, index) => ({
    id: -(index + 1),
    ...image,
    altText: `${locationName} travel inspiration`,
  }));

export const getRegions = async () => {
  try {
    const response = await axios.get<Region[]>(`${PSGC_BASE_URL}/regions/`);
    return response.data;
  } catch (error) {
    console.warn('Unable to load Philippine regions.', error);
    return [];
  }
};

export const getCitiesMunicipalitiesByRegion = async (regionCode: string) => {
  if (!regionCode) return [];

  try {
    const response = await axios.get<City[]>(
      `${PSGC_BASE_URL}/regions/${encodeURIComponent(regionCode)}/cities-municipalities/`,
    );
    return response.data;
  } catch (error) {
    console.warn(`Unable to load cities for region ${regionCode}.`, error);
    return [];
  }
};

export const searchPhotosByLocation = async (locationName: string) => {
  const trimmedLocation = locationName.trim();
  if (!trimmedLocation) {
    return [];
  }

  if (!PEXELS_API_KEY) {
    console.warn('Pexels API key is not configured. Using fallback photos.');
    return getFallbackPhotos(trimmedLocation);
  }

  try {
    const response = await axios.get<{ photos?: {
      id: number;
      photographer?: string;
      photographer_url?: string;
      alt?: string;
      src?: { large?: string; large2x?: string; medium?: string };
    }[] }>('https://api.pexels.com/v1/search', {
      params: { query: `${trimmedLocation} tourist spot`, per_page: 12 },
      headers: { Authorization: PEXELS_API_KEY },
    });

    const photos = (response.data.photos ?? [])
      .filter((photo) => photo.src?.large || photo.src?.large2x || photo.src?.medium)
      .map((photo) => ({
        id: photo.id,
        imageUrl: photo.src?.large ?? photo.src?.large2x ?? photo.src?.medium ?? '',
        photographer: photo.photographer ?? 'Unknown photographer',
        photographerUrl: photo.photographer_url ?? '',
        altText: photo.alt ?? `${trimmedLocation} tourist spot`,
      }));

    if (photos.length === 0) {
      console.warn(`No photos found for ${trimmedLocation}. Using fallback photos.`);
      return getFallbackPhotos(trimmedLocation);
    }

    return photos;
  } catch (error) {
    console.warn(`Unable to load photos for ${trimmedLocation}. Using fallback photos.`, error);
    return getFallbackPhotos(trimmedLocation);
  }
};
