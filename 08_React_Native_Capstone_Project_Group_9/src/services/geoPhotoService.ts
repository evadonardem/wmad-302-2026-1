import axios from 'axios';

// TODO 1.1 [Base Configuration]
const PSGC_BASE_URL = 'https://psgc.gitlab.io/api';

const PEXELS_SEARCH_URL = 'https://api.pexels.com/v1/search';

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

export const getRegions = async (): Promise<Region[]> => {
  // TODO 1.2 [Regions Retrieval]
  try {
    const response = await axios.get(`${PSGC_BASE_URL}/regions/`);
    return response.data;
  } catch {
    return [];
  }
};

export const getCitiesMunicipalitiesByRegion = async (regionCode: string): Promise<City[]> => {
  // TODO 1.3 [Chained Location Population]
  if (!regionCode) return [];

  try {
    const response = await axios.get(
      `${PSGC_BASE_URL}/regions/${regionCode}/cities-municipalities/`,
    );
    return response.data;
  } catch {
    return [];
  }
};

export const searchPhotosByLocation = async (locationName: string): Promise<Photo[]> => {
  // TODO 1.4 [Pexels Query Resolution]
  const keyword = `${locationName} tourist spot`;

  try {
    const response = await axios.get(PEXELS_SEARCH_URL, {
      params: { query: keyword, per_page: 12 },
      headers: { Authorization: PEXELS_API_KEY ?? '' },
    });

    return (response.data.photos ?? []).map((p: any) => ({
      id: p.id,
      imageUrl: p.src?.large ?? p.src?.original ?? '',
      photographer: p.photographer,
      photographerUrl: p.photographer_url,
      altText: p.alt || `${locationName} tourist spot`,
    }));
  } catch {
    return [];
  }
};