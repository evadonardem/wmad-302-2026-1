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
  sourceUrl?: string;
  // Municipality / city the photo's caption names (set by the region search, shown on the card)
  place?: string;
};

// Extra details that travel with a search: the region's code (to load its municipalities) and whether the
// whole region was chosen without a city
export type SearchOptions = {
  regionCode?: string;
  wholeRegion?: boolean;
};

export const getRegions = async () => {
  try {
    const response = await axios.get<Region[]>(`${PSGC_BASE_URL}/regions/`);
    return Array.isArray(response.data) ? response.data : [];
  } catch (error) {
    console.warn('Failed to fetch regions:', error);
    return [];
  }
};

export const getCitiesMunicipalitiesByRegion = async (regionCode: string) => {
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

// Provinces of a region (their names also prove a photo is from that region, e.g. "Bohol" for Central Visayas)
const getProvincesByRegion = async (regionCode: string) => {
  try {
    const response = await axios.get<{ name: string }[]>(`${PSGC_BASE_URL}/regions/${regionCode}/provinces/`);
    return Array.isArray(response.data) ? response.data : [];
  } catch (error) {
    console.warn(`Failed to fetch provinces for region ${regionCode}:`, error);
    return [];
  }
};

// Every city / municipality of the country (one request, kept in memory). It is used to find names that exist in
// several regions ("Santa Cruz", "San Jose" ...) so they cannot pull in photos from another region.
let allCitiesCache: City[] | null = null;
const getAllCitiesMunicipalities = async () => {
  if (allCitiesCache) {
    return allCitiesCache;
  }
  try {
    const response = await axios.get<City[]>(`${PSGC_BASE_URL}/cities-municipalities/`);
    allCitiesCache = Array.isArray(response.data) ? response.data : [];
  } catch (error) {
    console.warn('Failed to fetch all cities/municipalities:', error);
    allCitiesCache = [];
  }
  return allCitiesCache;
};

// Tourist spots from a whole region and its different municipalities.
// One Pexels request for the region. A photo is kept ONLY when its own caption proves it belongs to the chosen
// region, by naming one of these:
//   1. the region itself ("Central Visayas"),
//   2. a province of the region ("Bohol"),
//   3. a municipality that exists only in this region (a name shared with another region, like "Santa Cruz",
//      does not count by itself).
// 'excludePlace' leaves out the place that was searched, so the result works as a recommendation from OTHER
// municipalities of the same region.
export const searchPhotosByRegion = async (
  regionName: string,
  regionCode?: string,
  excludePlace?: string,
): Promise<Photo[]> => {
  try {
    const keyword = `${regionName} Philippines tourist spot`;
    const [response, cities, provinces, everyCity] = await Promise.all([
      axios.get(`https://api.pexels.com/v1/search?query=${encodeURIComponent(keyword)}&per_page=80`, {
        headers: {
          Authorization: PEXELS_API_KEY ?? '',
        },
      }),
      regionCode ? getCitiesMunicipalitiesByRegion(regionCode) : Promise.resolve([] as City[]),
      regionCode ? getProvincesByRegion(regionCode) : Promise.resolve([]),
      regionCode ? getAllCitiesMunicipalities() : Promise.resolve([] as City[]),
    ]);

    const rawPhotos: any[] = response.data?.photos ?? [];
    const regionKeys = regionKeywords(regionName);
    const excludeCore = excludePlace ? placeCore(excludePlace) : '';

    // Names that also belong to a city / municipality of ANOTHER region
    const usedElsewhere = new Set<string>();
    everyCity.forEach((city) => {
      if (city.regionCode !== regionCode) {
        usedElsewhere.add(placeCore(city.name));
      }
    });

    const provinceKeys = provinces.map((province) => normalizeText(province.name)).filter((key) => key.length >= 4);
    const places = cities
      .map((city) => ({ name: city.name, core: placeCore(city.name) }))
      .filter((place) => place.core.length >= 4 && place.core !== excludeCore && !usedElsewhere.has(place.core));

    const found: Photo[] = [];
    rawPhotos.forEach((photo) => {
      const text = rawPhotoText(photo);
      if (excludeCore && text.includes(` ${excludeCore} `)) {
        return;
      }
      const namesRegion =
        regionKeys.some((key) => text.includes(` ${key} `)) || provinceKeys.some((key) => text.includes(` ${key} `));
      const place = places.find((candidate) => text.includes(` ${candidate.core} `));
      // The region is named directly, or a municipality only this region has is named (and the photo is Philippine)
      if (!(namesRegion || (place && PHILIPPINES_RE.test(text)))) {
        return;
      }
      found.push({
        id: photo.id,
        imageUrl: photo.src?.large ?? photo.src?.original ?? '',
        photographer: photo.photographer ?? 'Unknown',
        photographerUrl: photo.photographer_url ?? '',
        altText: photo.alt || `${regionName} tourist spot`,
        sourceUrl: photo.url ?? '',
        place: place?.name ?? regionName,
      });
    });
    return found;
  } catch (error) {
    console.warn(`Failed to fetch photos for region "${regionName}":`, error);
    return [];
  }
};

export const searchPhotosByLocation = async (locationName: string, regionName?: string) => {
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