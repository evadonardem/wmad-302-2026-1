import axios from 'axios';

// TODO 1.1 [Base Configuration]
const PSGC_BASE_URL = 'https://psgc.gitlab.io/api';

// Vite exposes environment variables on the import.meta.env object
const PEXELS_API_KEY = import.meta.env.VITE_PEXELS_API_KEY;

export const getRegions = async () => {
  // TODO 1.2 [Regions Retrieval]
  try {
    const response = await axios.get(`${PSGC_BASE_URL}/regions/`);
    return response.data;
  } catch (error) {
    console.error('Failed to fetch regions:', error);
    return [];
  }
};

export const getCitiesMunicipalitiesByRegion = async (regionCode) => {
  // TODO 1.3 [Chained Location Population]
  if (!regionCode) return [];

  const paths = [
    `${PSGC_BASE_URL}/regions/${regionCode}/cities-municipalities/`,
    `${PSGC_BASE_URL}/regions/${regionCode}/cities-municipalities.json`,
  ];

  for (const url of paths) {
    try {
      const response = await axios.get(url);
      if (Array.isArray(response.data)) return response.data;
    } catch (error) {
      console.error('Failed to fetch cities/municipalities from', url, error);
    }
  }
  return [];
};

export const searchPhotosByLocation = async (locationName) => {
   // TODO 1.4 [Pexels Query Resolution]
  try {
    // a. Combined keyword string
    const keyword = `${locationName} tourist spot`;

    // b + c. Pexels search endpoint with the authorization header
    const response = await axios.get('https://api.pexels.com/v1/search', {
      params: { query: keyword, per_page: 12 },
      headers: { Authorization: PEXELS_API_KEY },
    });

     // d. Streamlined photo objects
    return response.data.photos.map((photo) => ({
      id: photo.id,
      imageUrl: photo.src.large,
      photographer: photo.photographer,
      photographerUrl: photo.photographer_url,
      altText: photo.alt || keyword,
    }));
  } catch (error) {
     // e. Backup empty array so the UI never crashes
    console.error('Failed to fetch photos:', error);
    return [];
  }
};