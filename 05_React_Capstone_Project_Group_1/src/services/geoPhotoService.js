import axios from 'axios';

// TODO 1.1 [Base Configuration]: Set the PSGC API base URL.
const PSGC_BASE_URL = 'https://psgc.gitlab.io/api';

const PEXELS_API_KEY = import.meta.env.VITE_PEXELS_API_KEY;

export const getRegions = async () => {
  // TODO 1.2 [Regions Retrieval]: Fetch and return all regions.
  try {
    const response = await axios.get(`${PSGC_BASE_URL}/regions/`);
    return response.data;
  } catch (error) {
    console.error('Error fetching regions:', error);
    return [];
  }
};

export const getCitiesMunicipalitiesByRegion = async (regionCode) => {
  // TODO 1.3 [Chained Location Population]: Fetch cities based on the selected region.
  if (!regionCode) {
    return [];
  }

  try {
    const response = await axios.get(
      `${PSGC_BASE_URL}/regions/${regionCode}/cities-municipalities/`
    );

    return response.data;
  } catch (error) {
    console.error('Error fetching cities/municipalities:', error);
    return [];
  }
};

export const searchPhotosByLocation = async (locationName) => {
  // TODO 1.4 [Pexels Query Resolution]: Search Pexels and return formatted photo data.
  if (!locationName) {
    return [];
  }

  const query = `${locationName} tourist spot`;

  console.log('Searching Pexels for:', query);

  try {
    const response = await axios.get(
      'https://api.pexels.com/v1/search',
      {
        params: {
          query: query,
          per_page: 50,
        },
        headers: {
          Authorization: PEXELS_API_KEY,
        },
      }
    );

    console.log('Pexels API response:', response.data);
    console.log('Number of photos:', response.data.photos?.length);

    return response.data.photos.map((photo) => ({
      id: photo.id,
      imageUrl: photo.src.large,
      photographer: photo.photographer,
      photographerUrl: photo.photographer_url,

      // Use the selected location only for the location overlay.
      placeName: locationName,

      // Keep the original Pexels image description.
      altText: photo.alt || `${locationName} tourist spot`,
    }));
  } catch (error) {
    console.error(
      'Pexels API Error:',
      error.response?.status,
      error.response?.data || error.message
    );

    return [];
  }
};