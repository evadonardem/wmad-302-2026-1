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
// IMAGE CACHE AND PEXELS REQUEST CONTROL
// ======================================

// These caches keep successfully loaded photos available while the app is running.
// They prevent repeated navigation and refreshes from requesting the same photos.
const pexelsSearchCache = new Map<string, any[]>();
const attractionCache = new Map<string, TouristAttraction[]>();
const destinationImageCache = new Map<string, string>();

// Pexels can return HTTP 429 when too many requests arrive together.
// Queue requests and leave a short gap between them.
let pexelsRequestQueue: Promise<void> = Promise.resolve();
let lastPexelsRequestTime = 0;
const PEXELS_REQUEST_GAP_MS = 800;

const wait = (milliseconds: number) =>
  new Promise((resolve) => setTimeout(resolve, milliseconds));

// Used only when Pexels has no cached photo available.
const FALLBACK_IMAGE_URL =
  'https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?w=1200&q=80';

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

type AttractionInfo = Omit<
  TouristAttraction,
  'imageUrl' | 'photographer' | 'photographerUrl'
>;

// ======================================
// HELPER FOR DESTINATION ATTRACTIONS
// ======================================

const createAttractions = (
  destinationId: string,
  destinationName: string,
  location: string,
  places: string[]
): AttractionInfo[] => {
  return places.map((place, index) => ({
    id: `${destinationId}-attraction-${index + 1}`,
    name: place,
    location,
    description:
      `${place} is one of the places worth exploring when visiting ${destinationName}. ` +
      'Enjoy the scenery and discover what makes this destination special.',
    searchQuery: `${place} ${destinationName} Philippines`,
  }));
};

// ======================================
// TOURIST ATTRACTION DATABASE
// 30 DESTINATIONS / 6 ATTRACTIONS EACH
// ======================================

const TOURIST_ATTRACTIONS: Record<string, AttractionInfo[]> = {
  // 1. BAGUIO CITY
  'baguio-city': [
    {
      id: 'burnham-park',
      name: 'Burnham Park',
      location: 'Baguio City, Benguet',
      description: 'A famous city park featuring a scenic lake, gardens, walking paths, and recreational activities.',
      searchQuery: 'Burnham Park Baguio City Philippines',
    },
    {
      id: 'mines-view-park',
      name: 'Mines View Park',
      location: 'Baguio City, Benguet',
      description: 'A popular viewpoint offering beautiful scenery of the mountains and surrounding mining areas.',
      searchQuery: 'Mines View Park Baguio Philippines',
    },
    {
      id: 'the-mansion',
      name: 'The Mansion',
      location: 'Baguio City, Benguet',
      description: 'A historic landmark known as the official summer residence of the Philippine President.',
      searchQuery: 'The Mansion Baguio Philippines',
    },
    {
      id: 'botanical-garden',
      name: 'Baguio Botanical Garden',
      location: 'Baguio City, Benguet',
      description: 'A peaceful garden featuring beautiful plants, cultural displays, and relaxing walking paths.',
      searchQuery: 'Baguio Botanical Garden Philippines',
    },
    ...createAttractions('baguio-city-extra', 'Baguio City', 'Baguio City, Benguet', [
      'Camp John Hay',
      'Wright Park',
    ]),
  ],

  // 2. EL NIDO
  'elnido-palawan': [
    {
      id: 'big-lagoon',
      name: 'Big Lagoon',
      location: 'El Nido, Palawan',
      description: 'A stunning lagoon surrounded by towering limestone cliffs and clear turquoise water.',
      searchQuery: 'Big Lagoon El Nido Palawan Philippines',
    },
    {
      id: 'small-lagoon',
      name: 'Small Lagoon',
      location: 'El Nido, Palawan',
      description: 'A beautiful lagoon known for its emerald water, limestone formations, and kayaking experiences.',
      searchQuery: 'Small Lagoon El Nido Palawan',
    },
    {
      id: 'nacpan-beach',
      name: 'Nacpan Beach',
      location: 'El Nido, Palawan',
      description: 'A long stretch of golden sand and beautiful blue water, ideal for relaxing by the beach.',
      searchQuery: 'Nacpan Beach El Nido Palawan',
    },
    {
      id: 'seven-commandos',
      name: 'Seven Commandos Beach',
      location: 'El Nido, Palawan',
      description: 'A tropical beach featuring white sand, clear water, and beautiful island scenery.',
      searchQuery: 'Seven Commandos Beach El Nido',
    },
    ...createAttractions('elnido-palawan-extra', 'El Nido', 'El Nido, Palawan', [
      'Secret Lagoon',
      'Shimizu Island',
    ]),
  ],

  // 3. BORACAY ISLAND
  'boracay-island': [
    {
      id: 'white-beach',
      name: 'White Beach',
      location: 'Boracay Island, Aklan',
      description: 'Boracay’s famous beach featuring powdery white sand, crystal-clear water, and spectacular sunsets.',
      searchQuery: 'White Beach Boracay Philippines',
    },
    {
      id: 'puka-beach',
      name: 'Puka Shell Beach',
      location: 'Boracay Island, Aklan',
      description: 'A beautiful beach known for its natural shell fragments, peaceful atmosphere, and blue waters.',
      searchQuery: 'Puka Shell Beach Boracay Philippines',
    },
    {
      id: 'diniwid-beach',
      name: 'Diniwid Beach',
      location: 'Boracay Island, Aklan',
      description: 'A smaller and quieter beach surrounded by rocky cliffs and tropical scenery.',
      searchQuery: 'Diniwid Beach Boracay Philippines',
    },
    {
      id: 'willys-rock',
      name: "Willy's Rock",
      location: 'Boracay Island, Aklan',
      description: 'A famous volcanic rock formation with a small religious shrine beside White Beach.',
      searchQuery: "Willy's Rock Boracay Philippines",
    },
    ...createAttractions('boracay-island-extra', 'Boracay Island', 'Boracay Island, Aklan', [
      'Ilig-Iligan Beach',
      'Mount Luho Viewpoint',
    ]),
  ],

  // 4. MT. APO
  'mt-apo': [
    {
      id: 'mt-apo-summit',
      name: 'Mt. Apo Summit',
      location: 'Davao Region, Mindanao',
      description: 'The highest mountain in the Philippines, offering challenging trekking routes and spectacular mountain views.',
      searchQuery: 'Mount Apo summit Philippines',
    },
    {
      id: 'lake-venado',
      name: 'Lake Venado',
      location: 'Mt. Apo, Mindanao',
      description: 'A scenic high-altitude lake surrounded by mountain landscapes and popular among trekkers.',
      searchQuery: 'Lake Venado Mount Apo Philippines',
    },
    {
      id: 'boulder-face',
      name: 'Boulder Face',
      location: 'Mt. Apo, Mindanao',
      description: 'A remarkable rocky landscape along one of the mountain climbing routes.',
      searchQuery: 'Mount Apo boulder face Philippines',
    },
    {
      id: 'mt-apo-trails',
      name: 'Mt. Apo Trails',
      location: 'Mt. Apo, Mindanao',
      description: 'Mountain trails passing through forests, grasslands, and volcanic landscapes.',
      searchQuery: 'Mount Apo hiking trail Philippines',
    },
    ...createAttractions('mt-apo-extra', 'Mt. Apo', 'Davao Region, Mindanao', [
      'Mossy Forest',
      'Tudaya Falls',
    ]),
  ],

  // 5. SIARGAO ISLAND
  'siargao-island': [
    {
      id: 'cloud-9',
      name: 'Cloud 9',
      location: 'General Luna, Siargao',
      description: 'A world-famous surfing destination known for its powerful waves and iconic wooden boardwalk.',
      searchQuery: 'Cloud 9 Siargao Philippines surfing',
    },
    {
      id: 'sugba-lagoon',
      name: 'Sugba Lagoon',
      location: 'Del Carmen, Siargao',
      description: 'A beautiful lagoon surrounded by mangrove forests and clear turquoise water.',
      searchQuery: 'Sugba Lagoon Siargao Philippines',
    },
    {
      id: 'magpupungko-rock-pools',
      name: 'Magpupungko Rock Pools',
      location: 'Pilar, Siargao',
      description: 'Natural tidal pools featuring clear water and unique rock formations, best visited at suitable low tide.',
      searchQuery: 'Magpupungko Rock Pools Siargao',
    },
    {
      id: 'naked-island',
      name: 'Naked Island',
      location: 'Siargao, Surigao del Norte',
      description: 'A small sandbar surrounded by clear blue water, perfect for island-hopping stops.',
      searchQuery: 'Naked Island Siargao Philippines',
    },
    ...createAttractions('siargao-island-extra', 'Siargao Island', 'Siargao, Surigao del Norte', [
      'Daku Island',
      'Guyam Island',
    ]),
  ],

  // 6. VIGAN CITY
  'vigan-city': createAttractions('vigan-city', 'Vigan City', 'Vigan City, Ilocos Sur', [
    'Calle Crisologo',
    'Bantay Bell Tower',
    'Plaza Salcedo',
    'Syquia Mansion Museum',
    'Vigan Cathedral',
    'Pagburnayan Jar Factory',
  ]),

  // 7. SAGADA
  'sagada': createAttractions('sagada', 'Sagada', 'Sagada, Mountain Province', [
    'Hanging Coffins',
    'Sumaguing Cave',
    'Bomod-ok Falls',
    'Echo Valley',
    'Kiltepan Viewpoint',
    'Lake Danum',
  ]),

  // 8. BANAUE
  'banaue': createAttractions('banaue', 'Banaue', 'Banaue, Ifugao', [
    'Banaue Rice Terraces',
    'Batad Rice Terraces',
    'Tappiya Falls',
    'Banaue Viewpoint',
    'Tam-an Village',
    'Banga-an Village',
  ]),

  // 9. BOHOL
  'bohol': createAttractions('bohol', 'Bohol', 'Bohol, Philippines', [
    'Chocolate Hills',
    'Loboc River',
    'Alona Beach',
    'Philippine Tarsier Sanctuary',
    'Panglao Island',
    'Baclayon Church',
  ]),

  // 10. CEBU CITY
  'cebu-city': createAttractions('cebu-city', 'Cebu City', 'Cebu City, Cebu', [
    'Magellan Cross',
    'Basilica Minore del Santo Niño',
    'Fort San Pedro',
    'Temple of Leah',
    'Taoist Temple',
    'Sirao Flower Garden',
  ]),

  // 11. PUERTO PRINCESA
  'puerto-princesa': createAttractions('puerto-princesa', 'Puerto Princesa', 'Puerto Princesa, Palawan', [
    'Puerto Princesa Underground River',
    'Honda Bay',
    'Mitra Ranch',
    'Baker’s Hill',
    'Iwahig Firefly Watching',
    'Palawan Wildlife Rescue and Conservation Center',
  ]),

  // 12. CORON
  'coron': createAttractions('coron', 'Coron', 'Coron, Palawan', [
    'Kayangan Lake',
    'Barracuda Lake',
    'Twin Lagoon',
    'Banul Beach',
    'Skeleton Wreck',
    'Maquinit Hot Spring',
  ]),

  // 13. BATANES
  'batanes': createAttractions('batanes', 'Batanes', 'Batanes, Philippines', [
    'Marlboro Hills',
    'Basco Lighthouse',
    'Valugan Boulder Beach',
    'Morong Beach',
    'Tayid Lighthouse',
    'Chawa View Deck',
  ]),

  // 14. LA UNION
  'la-union': createAttractions('la-union', 'La Union', 'La Union, Philippines', [
    'Urbiztondo Beach',
    'Tangadan Falls',
    'Ma-Cho Temple',
    'Poro Point Lighthouse',
    'Immuki Island',
    'Pebble Beach',
  ]),

  // 15. TAGAYTAY
  'tagaytay': createAttractions('tagaytay', 'Tagaytay', 'Tagaytay, Cavite', [
    'People’s Park in the Sky',
    'Sky Ranch Tagaytay',
    'Picnic Grove',
    'Puzzle Mansion',
    'Our Lady of Lourdes Church',
    'Museo Orlina',
  ]),

  // 16. BATANGAS
  'batangas': createAttractions('batangas', 'Batangas', 'Batangas, Philippines', [
    'Anilao Beach',
    'Masasa Beach',
    'Fortune Island',
    'Taal Heritage Town',
    'Sepoc Beach',
    'Sombrero Island',
  ]),

  // 17. CAMIGUIN
  'camiguin': createAttractions('camiguin', 'Camiguin', 'Camiguin, Philippines', [
    'White Island',
    'Sunken Cemetery',
    'Katibawasan Falls',
    'Ardent Hot Springs',
    'Tuasan Falls',
    'Mantigue Island',
  ]),

  // 18. DAVAO CITY
  'davao-city': createAttractions('davao-city', 'Davao City', 'Davao City, Philippines', [
    'Eden Nature Park',
    'Philippine Eagle Center',
    'People’s Park',
    'Jack’s Ridge',
    'Davao Crocodile Park',
    'Museo Dabawenyo',
  ]),

  // 19. CAGAYAN DE ORO
  'cagayan-de-oro': createAttractions('cagayan-de-oro', 'Cagayan de Oro', 'Cagayan de Oro, Misamis Oriental', [
    'Mapawa Nature Park',
    'Seven Seas Waterpark',
    'Gaston Park',
    'Macahambus Cave',
    'Cagayan de Oro River',
    'Museum of Three Cultures',
  ]),

  // 20. ILOILO CITY
  'iloilo-city': createAttractions('iloilo-city', 'Iloilo City', 'Iloilo City, Philippines', [
    'Molo Church',
    'Jaro Cathedral',
    'Calle Real',
    'Iloilo River Esplanade',
    'Museo Iloilo',
    'Casa Mariquit',
  ]),

  // 21. BACOLOD CITY
  'bacolod-city': createAttractions('bacolod-city', 'Bacolod City', 'Bacolod City, Negros Occidental', [
    'The Ruins',
    'San Sebastian Cathedral',
    'Capitol Park and Lagoon',
    'Negros Museum',
    'Panaad Park and Stadium',
    'Balay Negrense',
  ]),

  // 22. DUMAGUETE
  'dumaguete': createAttractions('dumaguete', 'Dumaguete', 'Dumaguete, Negros Oriental', [
    'Rizal Boulevard',
    'Silliman University',
    'Twin Lakes of Balinsasayao',
    'Casaroro Falls',
    'Pulangbato Falls',
    'Dumaguete Belfry',
  ]),

  // 23. SAMAL ISLAND
  'samal-island': createAttractions('samal-island', 'Samal Island', 'Samal Island, Davao del Norte', [
    'Hagimit Falls',
    'Monfort Bat Sanctuary',
    'Kaputian Beach',
    'Coral Garden Marine Park',
    'Isla Reta Beach',
    'Vanishing Island',
  ]),

  // 24. LAKE SEBU
  'lake-sebu': createAttractions('lake-sebu', 'Lake Sebu', 'Lake Sebu, South Cotabato', [
    'Seven Falls',
    'Lake Sebu',
    'Tboli Cultural Village',
    'Lake Seloton',
    'Lake Lahit',
    'Tboli Museum',
  ]),

  // 25. ZAMBOANGA CITY
  'zamboanga-city': createAttractions('zamboanga-city', 'Zamboanga City', 'Zamboanga City, Philippines', [
    'Great Santa Cruz Island',
    'Fort Pilar',
    'Pasonanca Park',
    'Merloquet Falls',
    'Yakan Weaving Village',
    'Paseo del Mar',
  ]),

  // 26. HUNDRED ISLANDS
  'hundred-islands': createAttractions('hundred-islands', 'Hundred Islands', 'Alaminos, Pangasinan', [
    'Governor Island',
    'Quezon Island',
    'Children’s Island',
    'Marcos Island',
    'Cuenco Island',
    'Pilgrimage Island',
  ]),

  // 27. TAAL VOLCANO
  'taal-volcano': createAttractions('taal-volcano', 'Taal Volcano', 'Batangas, Philippines', [
    'Taal Volcano Viewpoint',
    'Taal Lake',
    'Taal Heritage Town',
    'Taal Basilica',
    'Taal Volcano Island View',
    'Taal Volcano Protected Landscape',
  ]),

  // 28. MAYON VOLCANO
  'mayon-volcano': createAttractions('mayon-volcano', 'Mayon Volcano', 'Albay, Philippines', [
    'Cagsawa Ruins',
    'Mayon Skyline View Deck',
    'Daraga Church',
    'Sumlang Lake',
    'Ligñon Hill Nature Park',
    'Quitinday Green Hills',
  ]),

  // 29. TUBBATAHA REEF
  'tubbataha-reef': createAttractions('tubbataha-reef', 'Tubbataha Reef', 'Sulu Sea, Palawan', [
    'North Atoll',
    'South Atoll',
    'Jessie Beazley Reef',
    'Tubbataha Ranger Station',
    'Bird Islet',
    'Shark Airport',
  ]),

  // 30. APO ISLAND
  'apo-island': createAttractions('apo-island', 'Apo Island', 'Dauin, Negros Oriental', [
    'Apo Island Marine Sanctuary',
    'Apo Island Lighthouse',
    'Apo Island Beach',
    'Apo Island Snorkeling Area',
    'Apo Island Turtle Sanctuary',
    'Rocky Point',
  ]),
};

// ======================================
// PEXELS PHOTO SEARCH WITH CACHE + RETRY
// ======================================

const searchPexels = async (query: string): Promise<any[]> => {
  const normalizedQuery = query.trim().toLowerCase();

  // Return the saved result immediately when this query was already successful.
  const cachedPhotos = pexelsSearchCache.get(normalizedQuery);
  if (cachedPhotos && cachedPhotos.length > 0) {
    return cachedPhotos;
  }

  if (!PEXELS_API_KEY) {
    throw new Error('Pexels API key is missing. Check your .env file.');
  }

  const requestTask = pexelsRequestQueue.then(async () => {
    const elapsed = Date.now() - lastPexelsRequestTime;
    if (elapsed < PEXELS_REQUEST_GAP_MS) {
      await wait(PEXELS_REQUEST_GAP_MS - elapsed);
    }

    const params = new URLSearchParams({
      query,
      per_page: '9',
      orientation: 'landscape',
    });

    const url = `${PEXELS_SEARCH_URL}?${params.toString()}`;

    // Retry temporary rate-limit and server errors up to three times.
    for (let attempt = 0; attempt < 3; attempt += 1) {
      lastPexelsRequestTime = Date.now();

      const response = await fetch(url, {
        method: 'GET',
        headers: {
          Authorization: PEXELS_API_KEY,
        },
      });

      if (response.ok) {
        const data = await response.json();
        const photos = Array.isArray(data.photos) ? data.photos : [];

        if (photos.length > 0) {
          pexelsSearchCache.set(normalizedQuery, photos);
        }

        return photos;
      }

      const canRetry =
        response.status === 429 || response.status >= 500;

      if (!canRetry || attempt === 2) {
        throw new Error(`Pexels request failed: ${response.status}`);
      }

      // Exponential backoff: 1.5 seconds, then 3 seconds.
      await wait(1500 * Math.pow(2, attempt));
    }

    return [];
  });

  // Keep the queue usable even if one request fails.
  pexelsRequestQueue = requestTask.then(
    () => undefined,
    () => undefined
  );

  return requestTask;
};

// Get one image for a popular destination, reusing the cached result.
export const getDestinationImage = async (
  searchQuery: string
): Promise<string> => {
  const cacheKey = searchQuery.trim().toLowerCase();
  const cachedImage = destinationImageCache.get(cacheKey);

  if (cachedImage) {
    return cachedImage;
  }

  try {
    const photos = await searchPexels(searchQuery);
    const imageUrl = photos[0]?.src?.large || FALLBACK_IMAGE_URL;
    destinationImageCache.set(cacheKey, imageUrl);
    return imageUrl;
  } catch (error) {
    console.warn(`Could not load destination image for ${searchQuery}:`, error);
    return FALLBACK_IMAGE_URL;
  }
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
  destinationId: string,
  destinationFallbackImage = FALLBACK_IMAGE_URL
): Promise<TouristAttraction[]> => {
  const attractions = TOURIST_ATTRACTIONS[destinationId];

  if (!attractions) {
    console.warn(`No tourist attractions found for ${destinationId}`);
    return [];
  }

  // Return all six saved attraction records without making new API requests.
  const cachedAttractions = attractionCache.get(destinationId);
  if (cachedAttractions && cachedAttractions.length === attractions.length) {
    return cachedAttractions;
  }

  const results = await Promise.all(
    attractions.map(async (attraction) => {
      try {
        const photos = await searchPexels(attraction.searchQuery);
        const photo = photos[0];

        return {
          ...attraction,
          imageUrl: photo?.src?.large || destinationFallbackImage || FALLBACK_IMAGE_URL,
          photographer: photo?.photographer || '',
          photographerUrl: photo?.photographer_url || '',
        };
      } catch (error) {
        console.warn(
          `Could not load photo for ${attraction.name}:`,
          error
        );

        // Keep a visible image even if this attraction's Pexels request fails.
        return {
          ...attraction,
          imageUrl: destinationFallbackImage || FALLBACK_IMAGE_URL,
          photographer: '',
          photographerUrl: '',
        };
      }
    })
  );

  attractionCache.set(destinationId, results);
  return results;
};
