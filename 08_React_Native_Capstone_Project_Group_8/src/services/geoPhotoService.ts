// TODO 1.1 ✅ COMPLETED
const PSGC_BASE_URL = 'https://psgc.gitlab.io/api';

// Expo only exposes environment variables prefixed with EXPO_PUBLIC_ (loaded from the .env file).
declare const process: { env: { EXPO_PUBLIC_PEXELS_API_KEY?: string } };
const PEXELS_API_KEY = process.env.EXPO_PUBLIC_PEXELS_API_KEY;
// ✅ ADDED: Correct Pexels base endpoint
const PEXELS_SEARCH_URL = 'https://api.pexels.com/v1/search';

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
  // TODO 1.2 ✅ COMPLETED
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
  // TODO 1.3 ✅ COMPLETED
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
  // TODO 1.4 ✅ CORRECTED — Fixed Pexels endpoint
  const keyword = `${locationName} tourist spot`;
  try {
    const headers: Record<string, string> = {};
    if (PEXELS_API_KEY) headers.Authorization = PEXELS_API_KEY;

    // ✅ FIXED: Use correct Pexels API endpoint
    const params = new URLSearchParams({
      query: keyword,
      per_page: '12'
    });
    const response = await fetch(`${PEXELS_SEARCH_URL}?${params}`, { headers });

    if (!response.ok) throw new Error(`Pexels request failed: ${response.status}`);
    const data = await response.json();

    return data.photos.map((photo: any) => ({
      id: photo.id,
      imageUrl: photo.src.large,
      photographer: photo.photographer,
      photographerUrl: photo.photographer_url,
      // ✅ IMPROVED: Fallback alt text
      altText: photo.alt || `${locationName} tourist spot`
    }));
  } catch (error) {
    console.error('Error searching photos:', error);
    return [];
  }
};