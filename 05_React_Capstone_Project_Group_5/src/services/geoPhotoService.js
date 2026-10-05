import axios from 'axios';

// TODO 1.1 [Base Configuration]: Use the fixed PSGC Gitlab API trailing-slash structure format
const PSGC_BASE_URL = 'https://psgc.gitlab.io/api';

// Vite exposes environment variables on the import.meta.env object
const PEXELS_API_KEY = import.meta.env.VITE_PEXELS_API_KEY;

export const getRegions = async () => {
  // TODO 1.2 [Regions Retrieval]: Fetch the full array of regions from the PSGC host.
  // Perform an asynchronous GET request using axios, catch errors smoothly, and return the dataset array.
  // Targeted Path Format: `${PSGC_BASE_URL}/regions/`

  try {
    const response = await axios.get(`${PSGC_BASE_URL}/regions/`);
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
      `${PSGC_BASE_URL}/regions/${regionCode}/cities-municipalities/`
    );

    return response.data;
  } catch (error) {
    console.error('Error fetching cities and municipalities:', error);
    return [];
  }
};

export const getProvinceByCode = async (provinceCode) => {
  if (!provinceCode) {
    return null;
  }

  try {
    const response = await axios.get(`${PSGC_BASE_URL}/provinces/${provinceCode}/`);
    return response.data;
  } catch (error) {
    console.error('Error fetching province:', error);
    return null;
  }
};

// Pexels allows at most 80 photos per request, so 'total' photos are fetched page by page.
// 'total' is optional (default 100 = two requests of 50 photos).
export const searchPhotosByLocation = async (locationName, total = 100) => {
  // TODO 1.4 [Pexels Query Resolution]: Formulate the dynamic target endpoint string URL.
  // a. Create a combined query keyword string: "[locationName] tourist spot".
  // b. Query the structural Pexels endpoint path: 'https://pexels.com[keyword]&per_page=12'.
  // c. Ensure you inject your authentication token securely using an authorization header parameter configuration block.
  // d. Map through the resulting array and return streamlined objects styled exactly like: 
  //    { id, imageUrl: [large image src URL], photographer, photographerUrl, altText }
  // e. Provide a backup structural object array inside your catch layer shield to handle error edge cases.

  if (!locationName) {
    return [];
  }

  try {
    const query = `${locationName} tourist spot`;

    // e.g. total = 100 -> 2 pages of 50 photos
    const pages = Math.ceil(total / 80);
    const perPage = Math.ceil(total / pages);

    const responses = await Promise.allSettled(
      Array.from({ length: pages }, (_, index) =>
        axios.get('https://api.pexels.com/v1/search', {
          params: { query, per_page: perPage, page: index + 1 },
          headers: {
            Authorization: PEXELS_API_KEY
          }
        })
      )
    );

    // A page that fails is skipped, the other pages are still used
    const photos = responses.flatMap((result) => {
      if (result.status === 'fulfilled') return result.value.data.photos;
      console.error('Error fetching a page of photos:', result.reason);
      return [];
    });

    return photos.map((photo) => ({
      id: photo.id,
      imageUrl: photo.src.large,
      photographer: photo.photographer,
      photographerUrl: photo.photographer_url,
      altText: photo.alt,
      highResUrl: photo.src.large2x,
      width: photo.width,
      height: photo.height,
      sourceUrl: photo.url
    }));
  } catch (error) {
    console.error('Error fetching photos:', error);
    return [];
  }
};