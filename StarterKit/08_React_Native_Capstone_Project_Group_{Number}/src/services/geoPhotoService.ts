import axios from 'axios';

// TODO 1.1 [Base Configuration]: Set the fixed PSGC Gitlab API trailing-slash base URL constant.
// Targeted Value: 'https://psgc.gitlab.io/api'
const PSGC_BASE_URL = '';

// Expo only exposes environment variables prefixed with EXPO_PUBLIC_ (loaded from the .env file).
const PEXELS_API_KEY = process.env.EXPO_PUBLIC_PEXELS_API_KEY;

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

export const getRegions = async () => {
  // TODO 1.2 [Regions Retrieval]: Fetch the full array of regions from the PSGC host.
  // Perform an asynchronous GET request using axios targeting `${PSGC_BASE_URL}/regions/`,
  // return the response data array on success, and return an empty array fallback inside the catch safety layer.
  // [Your code here]
};

export const getCitiesMunicipalitiesByRegion = async (regionCode: string) => {
  // TODO 1.3 [Chained Location Population]: Complete the dynamic lookup using string interpolation.
  // a. Validate that a truthy regionCode parameter is provided before generating a network request (return [] otherwise).
  // b. Execute an async GET request hitting the exact trailing-slash path directory:
  //    `${PSGC_BASE_URL}/regions/{regionCode}/cities-municipalities/`
  // c. Return the response data array, with an empty array fallback inside the catch layer.
  // [Your code here]
};

export const searchPhotosByLocation = async (locationName: string) => {
  // TODO 1.4 [Pexels Query Resolution]: Build the photo search pipeline.
  // a. Create a combined query keyword string: `${locationName} tourist spot`.
  // b. Query the structural Pexels search endpoint: 'https://pexels.com{keyword}&per_page=12'
  //    (use the keyword from step a, URL-encoded, as the query parameter).
  // c. Inject your authentication token securely using an Authorization header configuration
  //    block reading from the PEXELS_API_KEY constant above.
  // d. Map through the resulting 'photos' array in the payload and return streamlined objects
  //    styled exactly like: { id, imageUrl: [large image src URL], photographer, photographerUrl, altText }
  // e. Provide a backup empty array (or placeholder photo array) inside your catch layer shield
  //    to handle error edge cases gracefully.
  // [Your code here]
};
