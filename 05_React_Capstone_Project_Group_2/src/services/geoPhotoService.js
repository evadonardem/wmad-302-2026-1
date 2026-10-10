import axios from 'axios';

const PSGC_BASE_URL = 'https://psgc.gitlab.io/api';

// Vite exposes environment variables on the import.meta.env object
const PEXELS_API_KEY = import.meta.env.VITE_PEXELS_API_KEY;

export const getRegions = async () => {
  try {
    const { data } = await axios.get(`${PSGC_BASE_URL}/regions/`);
    return Array.isArray(data) ? data : [];
  } catch (error) {
    console.error('Unable to load Philippine regions.', error);
    return [];
  }
};

export const getCitiesMunicipalitiesByRegion = async (regionCode) => {
  if (!regionCode) {
    return [];
  }

  try {
    const { data } = await axios.get(
      `${PSGC_BASE_URL}/regions/${encodeURIComponent(regionCode)}/cities-municipalities/`,
    );
    return Array.isArray(data) ? data : [];
  } catch (error) {
    console.error(`Unable to load cities for region ${regionCode}.`, error);
    return [];
  }
};

export const searchPhotosByLocation = async (locationName) => {
  if (!locationName?.trim() || !PEXELS_API_KEY) {
    if (!PEXELS_API_KEY) {
      console.error('VITE_PEXELS_API_KEY is not configured.');
    }
    return [];
  }

  try {
    const { data } = await axios.get('https://api.pexels.com/v1/search', {
      params: {
        query: `${locationName.trim()} tourist spot`,
        per_page: 12,
      },
      headers: {
        Authorization: PEXELS_API_KEY,
      },
    });

    return (data.photos ?? []).map((photo) => ({
      id: photo.id,
      imageUrl: photo.src.large,
      photographer: photo.photographer,
      photographerUrl: photo.photographer_url,
      altText: photo.alt || `${locationName} tourist spot`,
    }));
  } catch (error) {
    console.error(`Unable to load photos for ${locationName}.`, error);
    return [];
  }
};
