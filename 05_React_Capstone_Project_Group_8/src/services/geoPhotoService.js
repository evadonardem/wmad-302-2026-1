import axios from 'axios';

// TODO 1.1 [Base Configuration]: Use the fixed PSGC Gitlab API trailing-slash structure format
const PSGC_BASE_URL = '/api-psgc/';

// Vite exposes environment variables on the import.meta.env object
const PEXELS_API_KEY = import.meta.env.VITE_PEXELS_API_KEY;
const PEXELS_BASE_URL = 'https://api.pexels.com/v1/';

export const getRegions = async () => {
  // TODO 1.2 [Regions Retrieval]: Fetch the full array of regions from the PSGC host.
  // Perform an asynchronous GET request using axios, catch errors smoothly, and return the dataset array.
  // Targeted Path Format: `${PSGC_BASE_URL}/regions/`
  try {
    const response = await axios.get(`${PSGC_BASE_URL}regions/`);
    return response.data;
  } catch (error) {
    console.error('Error fetching regions:', error);
    return [];
  }
};

export const getCitiesMunicipalitiesByRegion = async (regionCode) => {
  // TODO 1.3 [Chained Location Population]: Complete the dynamic lookup using string interpolation.
  // Validate that a truthy regionCode parameter is provided prior to generating network requests.
  // Execute an async GET request hitting the exact trailing-slash path directory.
  // Targeted Path Format: `${PSGC_BASE_URL}/regions/{regionCode}/cities-municipalities/`
  if (!regionCode) {
    return [];
  }
  try {
    const response = await axios.get(
      `${PSGC_BASE_URL}regions/${regionCode}/cities-municipalities/`
    );
    return response.data;
  } catch (error) {
    console.error('Error fetching cities/municipalities:', error);
    return [];
  }
};

export const searchPhotosByLocation = async (locationName) => {
  // TODO 1.4 [Pexels Query Resolution]: Formulate the dynamic target endpoint string URL.
  // a. Create a combined query keyword string: "[locationName] tourist spot".
  // b. Query the structural Pexels endpoint path: 'https://pexels.com[keyword]&per_page=12'.
  // c. Ensure you inject your authentication token securely using an authorization header parameter configuration block.
  // d. Map through the resulting array and return streamlined objects styled exactly like: 
  //    { id, imageUrl: [large image src URL], photographer, photographerUrl, altText }
  // e. Provide a backup structural object array inside your catch layer shield to handle error edge cases.
  const query = `${locationName} tourist spot`;
  try {
    const response = await axios.get(`${PEXELS_BASE_URL}search`, {
      headers: {
        Authorization: PEXELS_API_KEY
      },
      params: {
        query: query,
        per_page: 12
      }
    });
    
    return response.data.photos.map((photo) => ({
      id: photo.id,
      imageUrl: photo.src.large,
      photographer: photo.photographer,
      photographerUrl: photo.photographer_url,
      altText: photo.alt || 'Tourist spot image'
    }));
  } catch (error) {
    console.error('Error fetching photos from Pexels:', error);
    return [];
  }
};
