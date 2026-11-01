// TODO 1.1 [Base Configuration]: Set the fixed PSGC Gitlab API trailing-slash base URL constant.
// Targeted Value: 'https://psgc.gitlab.io/api'
const PSGC_BASE_URL = 'https://psgc.gitlab.io/api';

// Expo only exposes environment variables prefixed with EXPO_PUBLIC_ (loaded from the .env file).
declare const process: { env: { EXPO_PUBLIC_PEXELS_API_KEY?: string } };
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
    // TODO 1.2 ✅ COMPLETED — Regions Retrieval
    try {
        const response = await fetch(`${PSGC_BASE_URL}/regions/`);
        if (!response.ok) throw new Error(`PSGC request failed: ${response.status}`);
        return await response.json();
    } catch (error) {
        console.error('Error fetching regions:', error);
        return [];
    }
};

export const getCitiesMunicipalitiesByRegion = async (regionCode: string): Promise<City[]> => {
     // TODO 1.3 ✅ COMPLETED — Chained Location Population
  if (!regionCode) {
        return [];
    }
    try {
        const response = await fetch(`${PSGC_BASE_URL}/regions/${regionCode}/cities-municipalities/`);
        if (!response.ok) throw new Error(`PSGC request failed: ${response.status}`);
        return await response.json();
    } catch (error) {
        console.error('Error fetching cities/municipalities:', error);
        return [];
    }
};

export const searchPhotosByLocation = async (locationName: string): Promise<Photo[]> => {
    // TODO 1.4 ✅ COMPLETED — Pexels Query Resolution
    const keyword = `${locationName} tourist spot`;
    try {
        const headers: Record<string, string> = {};
        if (PEXELS_API_KEY) headers.Authorization = PEXELS_API_KEY;
        const response = await fetch(`https://pexels.com/search/${encodeURIComponent(keyword)}?per_page=12`, { headers });
        if (!response.ok) throw new Error(`Pexels request failed: ${response.status}`);
        const data = await response.json();
        return data.photos.map((photo: any) => ({
            id: photo.id,
            imageUrl: photo.src.large,
            photographer: photo.photographer,
            photographerUrl: photo.photographer_url,
            altText: photo.alt
        }));
    } catch (error) {
        console.error('Error searching photos:', error);
        return [];
    }
};
