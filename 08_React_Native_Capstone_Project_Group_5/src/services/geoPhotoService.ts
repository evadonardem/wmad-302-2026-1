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
  provinceCode: string;
  regionCode: string;
};

export type Photo = {
  id: number;
  imageUrl: string;
  photographer: string;
  photographerUrl: string;
  altText: string;
  sourceUrl?: string;
};

export const getRegions = async () => {
  // TODO 1.2 [Regions Retrieval]: Fetch the full array of regions from the PSGC host.
  // Perform an asynchronous GET request using axios targeting `${PSGC_BASE_URL}/regions/`,
  // return the response data array on success, and return an empty array fallback inside the catch safety layer.
  try {
    const response = await axios.get<Region[]>(`${PSGC_BASE_URL}/regions/`);
    return Array.isArray(response.data) ? response.data : [];
  } catch (error) {
    console.warn('Failed to fetch regions:', error);
    return [];
  }
};

export const getCitiesMunicipalitiesByRegion = async (regionCode: string) => {
  // TODO 1.3 [Chained Location Population]: Complete the dynamic lookup using string interpolation.
  // a. Validate that a truthy regionCode parameter is provided before generating a network request (return [] otherwise).
  // b. Execute an async GET request hitting the exact trailing-slash path directory:
  //    `${PSGC_BASE_URL}/regions/{regionCode}/cities-municipalities/`
  // c. Return the response data array, with an empty array fallback inside the catch layer.
  if (!regionCode) {
    return [];
  }

  try {
    const response = await axios.get<City[]>(
      `${PSGC_BASE_URL}/regions/${regionCode}/cities-municipalities/`,
    );
    return Array.isArray(response.data) ? response.data : [];
  } catch (error) {
    console.warn(`Failed to fetch cities/municipalities for region ${regionCode}:`, error);
    return [];
  }
};

// ---------------------------------------------------------------------------------------------
// Place check: Pexels has no location data, so a photo only counts as "from" a place when its own
// caption / page address says so. The three helpers below read that text.
// ---------------------------------------------------------------------------------------------

// Lower-case, no accents, no punctuation ("Sto. Tomas" -> "santo tomas", "Peñablanca" -> "penablanca")
const normalizeText = (text: string) =>
  text
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/\bsto\b/g, 'santo')
    .replace(/\bsta\b/g, 'santa')
    .replace(/\bmt\b/g, 'mount')
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();

// The part of a place name that photographers actually write ("City of Davao" / "Davao City" -> "davao")
const placeCore = (name: string) =>
  normalizeText(name.replace(/\(.*?\)/g, ' '))
    .replace(/^(island garden city of|city of|municipality of)\s+/, '')
    .replace(/\s+city$/, '')
    .trim();

// Words that name the region ("Davao Region" -> "davao", "Central Visayas" -> "central visayas")
const regionKeywords = (regionName?: string) => {
  if (!regionName) {
    return [] as string[];
  }
  const full = normalizeText(regionName.replace(/\(.*?\)/g, ' '));
  const short = full.replace(/\b(administrative|autonomous|region|peninsula)\b/g, ' ').replace(/\s+/g, ' ').trim();
  const keys = [full, short].filter((key) => key.length > 2);
  if (/national capital/.test(full) || /\bncr\b/.test(full)) {
    keys.push('metro manila', 'ncr');
  }
  return [...new Set(keys)];
};

const PHILIPPINES_RE = /\b(philippines|philippine|filipino|filipina|pilipinas|pinoy)\b/;

// Caption + address of a Pexels photo (".../photo/white-sand-beach-in-boracay-123/")
const rawPhotoText = (photo: any) => {
  const slug = String(photo.url ?? '').split('/photo/')[1] ?? '';
  return ` ${normalizeText(`${photo.alt ?? ''} ${slug.replace(/-\d+\/?$/, '')}`)} `;
};

export const searchPhotosByLocation = async (locationName: string, regionName?: string) => {
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
  try {
    // "Philippines" is added to the search so Pexels ranks Philippine photos first; 80 is the most
    // Pexels returns in one request, which leaves enough photos after the place check below.
    const keyword = `${locationName} Philippines tourist spot`;
    // NOTE: the real Pexels search route is https://api.pexels.com/v1/search?query=...
    // (the URL in the README appendix lost its path when it was pasted).
    const response = await axios.get(
      `https://api.pexels.com/v1/search?query=${encodeURIComponent(keyword)}&per_page=80`,
      {
        headers: {
          Authorization: PEXELS_API_KEY ?? '',
        },
      },
    );

    const rawPhotos: any[] = response.data?.photos ?? [];

    // Keep a photo only when its own text proves both things:
    //  1. it names the chosen city / municipality, and
    //  2. it is Philippine (says "Philippines" / "Filipino" ...) or names the chosen region.
    // Everything else is dropped, so the gallery never shows another country or another town
    // that happens to share a name.
    const core = placeCore(locationName);
    const regionKeys = regionKeywords(regionName);
    const isCountrySearch = core === 'philippines';

    const verified = rawPhotos.filter((photo) => {
      const text = rawPhotoText(photo);
      const isPhilippine = PHILIPPINES_RE.test(text) || regionKeys.some((key) => text.includes(` ${key} `));
      if (isCountrySearch) {
        return PHILIPPINES_RE.test(text);
      }
      const namesPlace = core.length > 0 && text.includes(` ${core} `);
      return namesPlace && isPhilippine;
    });

    return verified.map((photo) => ({
      id: photo.id,
      imageUrl: photo.src?.large ?? photo.src?.original ?? '',
      photographer: photo.photographer ?? 'Unknown',
      photographerUrl: photo.photographer_url ?? '',
      altText: photo.alt || `${locationName} tourist spot`,
      sourceUrl: photo.url ?? '',
    }));
  } catch (error) {
    console.warn(`Failed to fetch photos for "${locationName}":`, error);
    return [];
  }
};