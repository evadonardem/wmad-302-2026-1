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
  if (!trimmedLocation || !PEXELS_API_KEY) {
    if (!PEXELS_API_KEY) console.warn('Pexels API key is not configured.');
    return [];
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

    return (response.data.photos ?? [])
      .filter((photo) => photo.src?.large || photo.src?.large2x || photo.src?.medium)
      .map((photo) => ({
        id: photo.id,
        imageUrl: photo.src?.large ?? photo.src?.large2x ?? photo.src?.medium ?? '',
        photographer: photo.photographer ?? 'Unknown photographer',
        photographerUrl: photo.photographer_url ?? '',
        altText: photo.alt ?? `${trimmedLocation} tourist spot`,
      }));
  } catch (error) {
    console.warn(`Unable to load photos for ${trimmedLocation}.`, error);
    return [];
  }
};
