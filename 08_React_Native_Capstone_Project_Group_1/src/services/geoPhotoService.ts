import axios from 'axios';

const PSGC_BASE_URL = 'https://psgc.gitlab.io/api';

export interface Photo {
  id: number;
  width: number;
  height: number;
  url: string;
  photographer: string;
  photographerUrl: string;
  photographerId: number;
  avgColor: string;
  imageUrl: string;
  altText: string;
  category?: string;
}

export interface Region {
  code: string;
  name: string;
  regionName?: string;
  islandGroupCode?: string;
}

export interface City {
  code: string;
  name: string;
  regionCode: string;
}

// Fallback API Key if process.env is not set
const FALLBACK_PEXELS_KEY =
  '563492ad6f91700001000001cbe2d3a778e7471881efdfa3a992524a';

function getEnvPexelsKey(): string {
  try {
    if (typeof process !== 'undefined' && process.env) {
      return (
        process.env.EXPO_PUBLIC_PEXELS_API_KEY ||
        process.env.PEXELS_API_KEY ||
        FALLBACK_PEXELS_KEY
      );
    }
  } catch (_e) {
    // Ignore error if process is undefined
  }
  return FALLBACK_PEXELS_KEY;
}

const PHILIPPINES_DISCOVERY_QUERIES = [
  'Philippines beach island paradise',
  'Philippines mountains nature',
  'Philippines waterfalls landscape',
  'Philippines cultural landmarks food',
  'Philippines travel destinations',
];

// Fallback dataset to display when API request fails or offline
const LOCAL_FALLBACK_PHOTOS: Photo[] = [
  {
    id: 101,
    width: 1920,
    height: 1080,
    url: 'https://images.unsplash.com/photo-1518509562904-e7ef99cdcc86?auto=format&fit=crop&w=1200&q=80',
    photographer: 'Roderick Salatan',
    photographerUrl: 'https://images.unsplash.com',
    photographerId: 1001,
    avgColor: '#00695C',
    imageUrl: 'https://images.unsplash.com/photo-1518509562904-e7ef99cdcc86?auto=format&fit=crop&w=1200&q=80',
    altText: 'Stunning aerial view of Legazpi City, Mayon Volcano in Bicol',
  },
  {
    id: 102,
    width: 1920,
    height: 1080,
    url: 'https://images.unsplash.com/photo-1540555700478-4be289fbecef?auto=format&fit=crop&w=1200&q=80',
    photographer: 'Abet Llucer',
    photographerUrl: 'https://images.unsplash.com',
    photographerId: 1002,
    avgColor: '#43A047',
    imageUrl: 'https://images.unsplash.com/photo-1540555700478-4be289fbecef?auto=format&fit=crop&w=1200&q=80',
    altText: 'Boracay White Beach turquoise crystal ocean waters',
  },
  {
    id: 103,
    width: 1920,
    height: 1080,
    url: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=1200&q=80',
    photographer: 'Dennis Futalan',
    photographerUrl: 'https://images.unsplash.com',
    photographerId: 1003,
    avgColor: '#004D40',
    imageUrl: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=1200&q=80',
    altText: 'Baguio City urban landscape surrounded by pine trees',
  },
  {
    id: 104,
    width: 1920,
    height: 1080,
    url: 'https://images.unsplash.com/photo-1519046904884-53103b34b206?auto=format&fit=crop&w=1200&q=80',
    photographer: 'Apollo Tagu',
    photographerUrl: 'https://images.unsplash.com',
    photographerId: 1004,
    avgColor: '#00695C',
    imageUrl: 'https://images.unsplash.com/photo-1519046904884-53103b34b206?auto=format&fit=crop&w=1200&q=80',
    altText: 'El Nido Palawan limestone island lagoons',
  },
  {
    id: 105,
    width: 1920,
    height: 1080,
    url: 'https://images.unsplash.com/photo-1476514525535-ce74f45814ce?auto=format&fit=crop&w=1200&q=80',
    photographer: 'Ferdie Cayanga',
    photographerUrl: 'https://images.unsplash.com',
    photographerId: 1005,
    avgColor: '#1B5E20',
    imageUrl: 'https://images.unsplash.com/photo-1476514525535-ce74f45814ce?auto=format&fit=crop&w=1200&q=80',
    altText: 'Kawasan Falls turquoise blue waterfall in Badian Cebu',
  },
];

export async function getInitialPhilippinePhotos(perPage: number = 40): Promise<Photo[]> {
  const randomQuery =
    PHILIPPINES_DISCOVERY_QUERIES[
      Math.floor(Math.random() * PHILIPPINES_DISCOVERY_QUERIES.length)
    ];
  const photos = await fetchPhotosFromPexels(randomQuery, 1, perPage);
  return photos.length > 0 ? photos : LOCAL_FALLBACK_PHOTOS;
}

export async function searchPhotosByLocation(
  locationName: string,
  category: string = 'All',
  page: number = 1,
  perPage: number = 40,
): Promise<{ photos: Photo[]; totalResults: number; page: number }> {
  const cleanLocation = locationName.trim();
  const cleanCat = category === 'All' ? '' : category;

  let query = `${cleanLocation} ${cleanCat} Philippines`.trim();
  let photos = await fetchPhotosFromPexels(query, page, perPage);

  if (photos.length === 0 && cleanCat) {
    query = `${cleanLocation} Philippines`.trim();
    photos = await fetchPhotosFromPexels(query, page, perPage);
  }

  if (photos.length === 0) {
    query = `${cleanCat || 'tropical island'} Philippines nature travel`.trim();
    photos = await fetchPhotosFromPexels(query, page, perPage);
  }

  const finalPhotos = photos.length > 0 ? photos : LOCAL_FALLBACK_PHOTOS;

  return {
    photos: finalPhotos,
    totalResults: finalPhotos.length,
    page,
  };
}

async function fetchPhotosFromPexels(
  query: string,
  page: number = 1,
  perPage: number = 40,
): Promise<Photo[]> {
  try {
    const apiKey = getEnvPexelsKey();
    const response = await axios.get('https://api.pexels.com/v1/search', {
      params: {
        query,
        page,
        per_page: Math.min(perPage, 80),
      },
      headers: {
        Authorization: apiKey,
      },
      timeout: 8000,
    });

    if (!response.data || !Array.isArray(response.data.photos)) {
      return [];
    }

    return response.data.photos.map((p: any) => ({
      id: p.id,
      width: p.width || 1920,
      height: p.height || 1080,
      url: p.url,
      photographer: p.photographer || 'Pexels Contributor',
      photographerUrl: p.photographer_url || 'https://www.pexels.com',
      photographerId: p.photographer_id || 0,
      avgColor: p.avg_color || '#00695C',
      imageUrl: p.src?.large2x || p.src?.large || p.src?.original || p.src?.medium,
      altText: p.alt || `${query} tourist destination`,
    }));
  } catch (err) {
    console.warn('Pexels API fetch failed or blocked by CORS. Using safe fallbacks:', err);
    return [];
  }
}

export async function getRegions(): Promise<Region[]> {
  try {
    const response = await axios.get(`${PSGC_BASE_URL}/regions/`, { timeout: 6000 });
    if (Array.isArray(response.data)) {
      return response.data.map((r: any) => ({
        code: r.code,
        name: r.name || r.regionName,
        regionName: r.regionName,
        islandGroupCode: r.islandGroupCode,
      }));
    }
  } catch (err) {
    console.warn('PSGC Regions API Exception, returning local list:', err);
  }

  return [
    { code: '010000000', name: 'Region I – Ilocos Region', islandGroupCode: 'luzon' },
    { code: '020000000', name: 'Region II – Cagayan Valley', islandGroupCode: 'luzon' },
    { code: '030000000', name: 'Region III – Central Luzon', islandGroupCode: 'luzon' },
    { code: '040000000', name: 'Region IV-A – CALABARZON', islandGroupCode: 'luzon' },
    { code: '170000000', name: 'MIMAROPA Region', islandGroupCode: 'luzon' },
    { code: '050000000', name: 'Region V – Bicol Region', islandGroupCode: 'luzon' },
    { code: '060000000', name: 'Region VI – Western Visayas', islandGroupCode: 'visayas' },
    { code: '070000000', name: 'Region VII – Central Visayas', islandGroupCode: 'visayas' },
    { code: '080000000', name: 'Region VIII – Eastern Visayas', islandGroupCode: 'visayas' },
    { code: '090000000', name: 'Region IX – Zamboanga Peninsula', islandGroupCode: 'mindanao' },
    { code: '100000000', name: 'Region X – Northern Mindanao', islandGroupCode: 'mindanao' },
    { code: '110000000', name: 'Region XI – Davao Region', islandGroupCode: 'mindanao' },
    { code: '120000000', name: 'Region XII – SOCCSKSARGEN', islandGroupCode: 'mindanao' },
    { code: '130000000', name: 'Region XIII – Caraga', islandGroupCode: 'mindanao' },
    { code: '140000000', name: 'CAR – Cordillera Administrative Region', islandGroupCode: 'luzon' },
    { code: '150000000', name: 'BARMM – Bangsamoro', islandGroupCode: 'mindanao' },
    { code: '160000000', name: 'NCR – National Capital Region', islandGroupCode: 'luzon' },
  ];
}

export async function getCitiesMunicipalitiesByRegion(regionCode: string): Promise<City[]> {
  try {
    const [citiesRes, munRes] = await Promise.all([
      axios.get(`${PSGC_BASE_URL}/regions/${regionCode}/cities/`, { timeout: 6000 }).catch(() => ({ data: [] })),
      axios.get(`${PSGC_BASE_URL}/regions/${regionCode}/municipalities/`, { timeout: 6000 }).catch(() => ({ data: [] })),
    ]);

    const combinedList = [
      ...(Array.isArray(citiesRes.data) ? citiesRes.data : []),
      ...(Array.isArray(munRes.data) ? munRes.data : []),
    ];

    if (combinedList.length > 0) {
      return combinedList.map((c: any) => ({
        code: c.code,
        name: c.name,
        regionCode: regionCode,
      }));
    }
  } catch (err) {
    console.warn(`PSGC Cities API error for region ${regionCode}:`, err);
  }

  const citiesMap: Record<string, City[]> = {
    '140000000': [
      { code: '141102000', name: 'Baguio City', regionCode: '140000000' },
      { code: '141101000', name: 'La Trinidad', regionCode: '140000000' },
      { code: '141103000', name: 'Sagada', regionCode: '140000000' },
      { code: '141104000', name: 'Banaue', regionCode: '140000000' },
    ],
    '010000000': [
      { code: '012801000', name: 'Laoag City', regionCode: '010000000' },
      { code: '012901000', name: 'Vigan City', regionCode: '010000000' },
      { code: '013301000', name: 'San Fernando City (La Union)', regionCode: '010000000' },
    ],
    '070000000': [
      { code: '072217000', name: 'Cebu City', regionCode: '070000000' },
      { code: '072226000', name: 'Lapu-Lapu City', regionCode: '070000000' },
      { code: '071244000', name: 'Panglao (Bohol)', regionCode: '070000000' },
    ],
  };

  return (
    citiesMap[regionCode] || [
      { code: `${regionCode}-1`, name: 'Capital City', regionCode },
      { code: `${regionCode}-2`, name: 'Coastal Town', regionCode },
      { code: `${regionCode}-3`, name: 'Mountain District', regionCode },
    ]
  );
}