import axios from 'axios';

const PSGC_BASE_URL = '/api-psgc/';
const PEXELS_API_KEY = import.meta.env.VITE_PEXELS_API_KEY;
const PEXELS_BASE_URL = 'https://api.pexels.com/v1/';

// Cache — stores cities we've loaded
const citiesCache = {};
let allRegionsList = [];

// Preload ALL cities in background — runs once at startup
const preloadAllCities = async () => {
  if (allRegionsList.length === 0) return; // Wait until regions loaded
  
  console.log('🔄 Preloading cities in background...');
  for (const region of allRegionsList) {
    // Skip if already cached
    if (citiesCache[region.code]) continue;
    
    try {
      const response = await axios.get(
        `${PSGC_BASE_URL}regions/${region.code}/cities-municipalities/`
      );
      citiesCache[region.code] = response.data;
      console.log('✅ Preloaded:', region.name);
    } catch (e) {
      console.log('⚠️ Could not preload:', region.name);
    }
  }
};

export const getRegions = async () => {
  try {
    const response = await axios.get(`${PSGC_BASE_URL}regions/`);
    allRegionsList = response.data;
    // Start preloading ALL cities silently in background
    preloadAllCities();
    return response.data;
  } catch (error) {
    console.error('Error fetching regions:', error);
    return [];
  }
};

export const getCitiesMunicipalitiesByRegion = async (regionCode) => {
  if (!regionCode) return [];

  // Instant from cache ✅
  if (citiesCache[regionCode]) {
    console.log('⚡ From cache');
    return citiesCache[regionCode];
  }

  try {
    console.log('📡 Fetching...');
    const response = await axios.get(
      `${PSGC_BASE_URL}regions/${regionCode}/cities-municipalities/`
    );
    citiesCache[regionCode] = response.data;
    return response.data;
  } catch (error) {
    console.error('Error fetching cities:', error);
    return [];
  }
};

export const searchPhotosByLocation = async (locationName) => {
  const query = `${locationName} tourist spot`;
  try {
    const response = await axios.get(`${PEXELS_BASE_URL}search`, {
      headers: { Authorization: PEXELS_API_KEY },
      params: { query, per_page: 12 }
    });
    return response.data.photos.map((photo) => ({
      id: photo.id,
      imageUrl: photo.src.large,
      photographer: photo.photographer,
      photographerUrl: photo.photographer_url,
      altText: photo.alt || 'Tourist spot image'
    }));
  } catch (error) {
    console.error('Error fetching photos:', error);
    return [];
  }
};