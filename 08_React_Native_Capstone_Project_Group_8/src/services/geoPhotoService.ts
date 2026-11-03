
// ======================================
// API CONFIGURATION
// ======================================

const PSGC_BASE_URL = 'https://psgc.gitlab.io/api';
const PEXELS_SEARCH_URL = 'https://api.pexels.com/v1/search';

declare const process: {
  env: {
    EXPO_PUBLIC_PEXELS_API_KEY?: string;
  };
};

const PEXELS_API_KEY = process.env.EXPO_PUBLIC_PEXELS_API_KEY;

// ======================================
// TYPES
// ======================================

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

export type TouristAttraction = {
  id: string;
  name: string;
  location: string;
  description: string;
  searchQuery: string;
  imageUrl: string;
  photographer: string;
  photographerUrl: string;
};

// ======================================
// TOURIST ATTRACTION DATABASE
// ======================================

const TOURIST_ATTRACTIONS: Record<
  string,
  Omit<TouristAttraction, 'imageUrl' | 'photographer' | 'photographerUrl'>[]
> = {
  'baguio-city': [
    {
      id: 'burnham-park',
      name: 'Burnham Park',
      location: 'Baguio City, Benguet',
      description:
        'A famous city park featuring a scenic lake, gardens, walking paths, and recreational activities.',
      searchQuery: 'Burnham Park Baguio City Philippines',
    },
    {
      id: 'mines-view-park',
      name: 'Mines View Park',
      location: 'Baguio City, Benguet',
      description:
        'A popular viewpoint offering beautiful scenery of the mountains and surrounding mining areas.',
      searchQuery: 'Mines View Park Baguio Philippines',
    },
    {
      id: 'the-mansion',
      name: 'The Mansion',
      location: 'Baguio City, Benguet',
      description:
        'A historic landmark known as the official summer residence of the Philippine President.',
      searchQuery: 'The Mansion Baguio Philippines',
    },
    {
      id: 'botanical-garden',
      name: 'Baguio Botanical Garden',
      location: 'Baguio City, Benguet',
      description:
        'A peaceful garden featuring beautiful plants, cultural displays, and relaxing walking paths.',
      searchQuery: 'Baguio Botanical Garden Philippines',
    },
  ],

  'elnido-palawan': [
    {
      id: 'big-lagoon',
      name: 'Big Lagoon',
      location: 'El Nido, Palawan',
      description:
        'A stunning lagoon surrounded by towering limestone cliffs and clear turquoise water.',
      searchQuery: 'Big Lagoon El Nido Palawan Philippines',
    },
    {
      id: 'small-lagoon',
      name: 'Small Lagoon',
      location: 'El Nido, Palawan',
      description:
        'A beautiful lagoon known for its emerald water, limestone formations, and kayaking experiences.',
      searchQuery: 'Small Lagoon El Nido Palawan',
    },
    {
      id: 'nacpan-beach',
      name: 'Nacpan Beach',
      location: 'El Nido, Palawan',
      description:
        'A long stretch of golden sand and beautiful blue water, ideal for relaxing by the beach.',
      searchQuery: 'Nacpan Beach El Nido Palawan',
    },
    {
      id: 'seven-commandos',
      name: 'Seven Commandos Beach',
      location: 'El Nido, Palawan',
      description:
        'A tropical beach featuring white sand, clear water, and beautiful island scenery.',
      searchQuery: 'Seven Commandos Beach El Nido',
    },
  ],

  'boracay-island': [
    {
      id: 'white-beach',
      name: 'White Beach',
      location: 'Boracay Island, Aklan',
      description:
        'Boracay’s famous beach featuring powdery white sand, crystal-clear water, and spectacular sunsets.',
      searchQuery: 'White Beach Boracay Philippines',
    },
    {
      id: 'puka-beach',
      name: 'Puka Shell Beach',
      location: 'Boracay Island, Aklan',
      description:
        'A beautiful beach known for its natural shell fragments, peaceful atmosphere, and blue waters.',
      searchQuery: 'Puka Shell Beach Boracay Philippines',
    },
    {
      id: 'diniwid-beach',
      name: 'Diniwid Beach',
      location: 'Boracay Island, Aklan',
      description:
        'A smaller and quieter beach surrounded by rocky cliffs and tropical scenery.',
      searchQuery: 'Diniwid Beach Boracay Philippines',
    },
    {
      id: 'willys-rock',
      name: "Willy's Rock",
      location: 'Boracay Island, Aklan',
      description:
        'A famous volcanic rock formation with a small religious shrine beside White Beach.',
      searchQuery: "Willy's Rock Boracay Philippines",
    },
  ],

  'mt-apo': [
    {
      id: 'mt-apo-summit',
      name: 'Mt. Apo Summit',
      location: 'Davao Region, Mindanao',
      description:
        'The highest mountain in the Philippines, offering challenging trekking routes and spectacular mountain views.',
      searchQuery: 'Mount Apo summit Philippines',
    },
    {
      id: 'lake-venado',
      name: 'Lake Venado',
      location: 'Mt. Apo, Mindanao',
      description:
        'A scenic high-altitude lake surrounded by mountain landscapes and popular among trekkers.',
      searchQuery: 'Lake Venado Mount Apo Philippines',
    },
    {
      id: 'boulder-face',
      name: 'Boulder Face',
      location: 'Mt. Apo, Mindanao',
      description:
        'A remarkable rocky landscape along one of the mountain climbing routes.',
      searchQuery: 'Mount Apo boulder face Philippines',
    },
    {
      id: 'mt-apo-trails',
      name: 'Mt. Apo Trails',
      location: 'Mt. Apo, Mindanao',
      description:
        'Mountain trails passing through forests, grasslands, and volcanic landscapes.',
      searchQuery: 'Mount Apo hiking trail Philippines',
    },
  ],

  'siargao-island': [
    {
      id: 'cloud-9',
      name: 'Cloud 9',
      location: 'General Luna, Siargao',
      description:
        'A world-famous surfing destination known for its powerful waves and iconic wooden boardwalk.',
      searchQuery: 'Cloud 9 Siargao Philippines surfing',
    },
    {
      id: 'sugba-lagoon',
      name: 'Sugba Lagoon',
      location: 'Del Carmen, Siargao',
      description:
        'A beautiful lagoon surrounded by mangrove forests and clear turquoise water.',
      searchQuery: 'Sugba Lagoon Siargao Philippines',
    },
    {
      id: 'magpupungko-rock-pools',
      name: 'Magpupungko Rock Pools',
      location: 'Pilar, Siargao',
      description:
        'Natural tidal pools featuring clear water and unique rock formations, best visited at suitable low tide.',
      searchQuery: 'Magpupungko Rock Pools Siargao',
    },
    {
      id: 'naked-island',
      name: 'Naked Island',
      location: 'Siargao, Surigao del Norte',
      description:
        'A small sandbar surrounded by clear blue water, perfect for island-hopping stops.',
      searchQuery: 'Naked Island Siargao Philippines',
    },
  ],
};

// ======================================
// PEXELS PHOTO SEARCH
// ======================================

const searchPexels = async (query: string) => {
  if (!PEXELS_API_KEY) {
    throw new Error(
      'Pexels API key is missing. Check your .env file.'
    );
  }

  const params = new URLSearchParams({
    query,
    per_page: '5',
    orientation: 'landscape',
  });

  const response = await fetch(
    `${PEXELS_SEARCH_URL}?${params.toString()}`,
    {
      headers: {
        Authorization: PEXELS_API_KEY,
      },
    }
  );

  if (!response.ok) {
    throw new Error(`Pexels request failed: ${response.status}`);
  }

  const data = await response.json();

  return data.photos || [];
};

// ======================================
// PSGC: GET REGIONS
// ======================================

export const getRegions = async (): Promise<Region[]> => {
  try {
    const response = await fetch(`${PSGC_BASE_URL}/regions/`);

    if (!response.ok) {
      throw new Error(`PSGC request failed: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Error fetching regions:', error);
    return [];
  }
};

// ======================================
// PSGC: GET CITIES AND MUNICIPALITIES
// ======================================

export const getCitiesMunicipalitiesByRegion = async (
  regionCode: string
): Promise<City[]> => {
  if (!regionCode) return [];

  try {
    const response = await fetch(
      `${PSGC_BASE_URL}/regions/${regionCode}/cities-municipalities/`
    );

    if (!response.ok) {
      throw new Error(`PSGC request failed: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Error fetching cities/municipalities:', error);
    return [];
  }
};

// ======================================
// SEARCH PHOTOS BY LOCATION
// ======================================

export const searchPhotosByLocation = async (
  locationName: string
): Promise<Photo[]> => {
  try {
    const photos = await searchPexels(
      `${locationName} tourist attractions Philippines`
    );

    return photos.map((photo: any) => ({
      id: photo.id,
      imageUrl: photo.src.large,
      photographer: photo.photographer || 'Unknown Photographer',
      photographerUrl: photo.photographer_url || '',
      altText: photo.alt || `${locationName} tourist attraction`,
    }));
  } catch (error) {
    console.error('Error searching photos:', error);
    return [];
  }
};

// ======================================
// GET TOURIST ATTRACTIONS BY DESTINATION
// ======================================

export const getTouristAttractions = async (
  destinationId: string
): Promise<TouristAttraction[]> => {
  const attractions = TOURIST_ATTRACTIONS[destinationId];

  if (!attractions) {
    console.warn(`No tourist attractions found for ${destinationId}`);
    return [];
  }

  const results = await Promise.all(
    attractions.map(async (attraction) => {
      try {
        const photos = await searchPexels(attraction.searchQuery);
        const photo = photos[0];

        return {
          ...attraction,
          imageUrl: photo?.src?.large || '',
          photographer: photo?.photographer || '',
          photographerUrl: photo?.photographer_url || '',
        };
      } catch (error) {
        console.warn(
          `Could not load photo for ${attraction.name}:`,
          error
        );

        return {
          ...attraction,
          imageUrl: '',
          photographer: '',
          photographerUrl: '',
        };
      }
    })
  );

  return results;
};
