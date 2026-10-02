import axios from 'axios';

const PSGC_BASE_URL = 'https://psgc.gitlab.io/api';
const PEXELS_API_URL = 'https://api.pexels.com/v1/search';

const PEXELS_API_KEY = import.meta.env.VITE_PEXELS_API_KEY;

// Get all regions
export const getRegions = async () => {
  try {
    const response = await axios.get(
      `${PSGC_BASE_URL}/regions/`
    );

    return Array.isArray(response.data) ? response.data : [];
  } catch (error) {
    console.error('Error loading regions:', error);
    return [];
  }
};

// Get cities and municipalities in a region
export const getCitiesMunicipalitiesByRegion = async (regionCode) => {
  if (!regionCode) return [];

  try {
    const response = await axios.get(
      `${PSGC_BASE_URL}/regions/${regionCode}/cities-municipalities/`
    );

    return Array.isArray(response.data) ? response.data : [];
  } catch (error) {
    console.error('Error loading cities:', error);
    return [];
  }
};

// Search tourist photos using Pexels
export const searchPhotosByLocation = async (locationName) => {
  if (!locationName || !PEXELS_API_KEY) {
    return [];
  }

  try {
    const response = await axios.get(PEXELS_API_URL, {
      params: {
        query: `${locationName} tourist spot Philippines`,
        per_page: 12,
      },
      headers: {
        Authorization: PEXELS_API_KEY,
      },
    });

    const photos = response.data.photos || [];

    return photos.map((photo) => ({
      id: photo.id,
      imageUrl: photo.src.large,
      photographer: photo.photographer,
      photographerUrl: photo.photographer_url,
      altText: photo.alt || `${locationName} tourist spot`,
    }));
  } catch (error) {
    console.error('Error searching photos:', error);
    return [];
  }
};