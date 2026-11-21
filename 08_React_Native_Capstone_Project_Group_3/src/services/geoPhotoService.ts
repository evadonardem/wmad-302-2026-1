import axios from 'axios';

// TODO 1.1 [Base Configuration]: Set the fixed PSGC Gitlab API trailing-slash base URL constant.
// Targeted Value: 'https://psgc.gitlab.io/api'
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
  // PSGC sends `false` for places with no province (e.g. Metro Manila cities).
  provinceCode: string | false;
  regionCode: string;
  islandGroupCode?: string;
};

// Extra: used by Quick search autocomplete and Compare.
export type Province = {
  code: string;
  name: string;
  regionCode: string;
  islandGroupCode: string;
};

export type Photo = {
  id: number;
  imageUrl: string;
  photographer: string;
  photographerUrl: string;
  altText: string;
  // Extra: Pexels' average photo color, used as a placeholder while the image loads.
  avgColor?: string;
  // Extra: the searched city/municipality, kept with liked photos for Google Maps.
  place?: string;
};

// Extra: PSGC names read like "City of Baguio"; Pexels finds far more for "Baguio City".
// Also strips parenthetical notes such as "(Capital)".
export const toSearchName = (name: string) => {
  const cleaned = name
    .replace(/\s*\(.*?\)\s*/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
  const match = cleaned.match(/^City of (.+)$/i);
  return match ? `${match[1]} City` : cleaned;
};

// Extra: the service returns [] on failure (TODO 1.4e), so screens can't tell a failed request
// from a search with no results. This remembers why the last photo search failed, if it did.
let lastPhotoSearchError: string | null = null;
export const getLastPhotoSearchError = () => lastPhotoSearchError;

export const getRegions = async () => {
  // TODO 1.2 [Regions Retrieval]: Fetch the full array of regions from the PSGC host.
  // Perform an asynchronous GET request using axios targeting `${PSGC_BASE_URL}/regions/`,
  // return the response data array on success, and return an empty array fallback inside the catch safety layer.
  try {
    const response = await axios.get<Region[]>(`${PSGC_BASE_URL}/regions/`);
    return Array.isArray(response.data) ? response.data : [];
  } catch (error) {
    console.error('Failed to fetch regions:', error);
    return [] as Region[];
  }
};

export const getCitiesMunicipalitiesByRegion = async (regionCode: string) => {
  // TODO 1.3 [Chained Location Population]: Complete the dynamic lookup using string interpolation.
  // a. Validate that a truthy regionCode parameter is provided before generating a network request (return [] otherwise).
  // b. Execute an async GET request hitting the exact trailing-slash path directory:
  //    `${PSGC_BASE_URL}/regions/{regionCode}/cities-municipalities/`
  // c. Return the response data array, with an empty array fallback inside the catch layer.
  if (!regionCode) {
    return [] as City[];
  }

  try {
    const response = await axios.get<City[]>(
      `${PSGC_BASE_URL}/regions/${regionCode}/cities-municipalities/`
    );
    return Array.isArray(response.data) ? response.data : [];
  } catch (error) {
    console.error(`Failed to fetch cities/municipalities for region ${regionCode}:`, error);
    return [] as City[];
  }
};

// Extra: every city and municipality in the country (for autocomplete). Empty array on failure.
export const getAllCitiesMunicipalities = async () => {
  try {
    const response = await axios.get<City[]>(`${PSGC_BASE_URL}/cities-municipalities/`);
    return Array.isArray(response.data) ? response.data : [];
  } catch (error) {
    console.error('Failed to fetch all cities/municipalities:', error);
    return [] as City[];
  }
};

// Extra: every province (to label autocomplete suggestions). Empty array on failure.
export const getProvinces = async () => {
  try {
    const response = await axios.get<Province[]>(`${PSGC_BASE_URL}/provinces/`);
    return Array.isArray(response.data) ? response.data : [];
  } catch (error) {
    console.error('Failed to fetch provinces:', error);
    return [] as Province[];
  }
};

export const searchPhotosByLocation = async (locationName: string) => {
  // TODO 1.4 [Pexels Query Resolution]: Build the photo search pipeline.
  // a. Create a combined query keyword string: `${locationName} tourist spot`.
  // b. Query the structural Pexels search endpoint: 'https://pexels.com{keyword}&per_page=12'
  //    (use the keyword from step a, URL-encoded, as the query parameter).
  // c. Inject your authentication token securely using an Authorization header configuration
  //    block reading from the PEXELS_API_KEY constant above.
  // d. Map through the resulting 'photos' array in the payload and return streamlined objects
  //    styled exactly like: { id, imageUrl: [large image src URL], photographer, photographerUrl, altText }
  // e. Provide a backup empty array (or placeholder photo array) inside your catch layer shield
  //    to handle error edge cases gracefully.
  const keyword = `${toSearchName(locationName)} tourist spot`;
  lastPhotoSearchError = null;

  if (!PEXELS_API_KEY) {
    lastPhotoSearchError = 'Missing Pexels API key — check EXPO_PUBLIC_PEXELS_API_KEY in your .env file.';
    return [] as Photo[];
  }

  try {
    const response = await axios.get(
      `https://api.pexels.com/v1/search?query=${encodeURIComponent(keyword)}&per_page=12`,
      {
        headers: {
          Authorization: PEXELS_API_KEY ?? '',
        },
      }
    );

    const photos: any[] = response.data?.photos ?? [];

    return photos.map(
      (photo): Photo => ({
        id: photo.id,
        imageUrl: photo.src?.large ?? '',
        photographer: photo.photographer ?? 'Unknown',
        photographerUrl: photo.photographer_url ?? '',
        altText: photo.alt || keyword,
        avgColor: photo.avg_color ?? undefined,
      })
    );
  } catch (error) {
    console.error(`Failed to fetch photos for "${keyword}":`, error);

    if (axios.isAxiosError(error)) {
      const status = error.response?.status;
      if (status === 401 || status === 403) {
        lastPhotoSearchError = 'Pexels rejected the API key. Double-check your .env file.';
      } else if (status === 429) {
        lastPhotoSearchError = 'Pexels rate limit reached. Try again in a little while.';
      } else if (!error.response) {
        lastPhotoSearchError = "Couldn't reach Pexels. Check your internet connection.";
      } else {
        lastPhotoSearchError = `Pexels returned an error (${status}).`;
      }
    } else {
      lastPhotoSearchError = 'Something went wrong while loading photos.';
    }

    return [] as Photo[];
  }
};
