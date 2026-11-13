import axios from 'axios';

const PEXELS_API_KEY = process.env.EXPO_PUBLIC_PEXELS_API_KEY || '';

export interface Photo {
  id: number;
  imageUrl: string;
  photographer: string;
  photographerUrl: string;
  altText: string;
}

export interface Region {
  code: string;
  name: string;
  islandGroup: string;
}

export interface CityMunicipality {
  code: string;
  name: string;
  regionCode: string;
}

// Map ng Island Groups para sa Filtering
const ISLAND_GROUP_MAP: Record<string, string> = {
  '130000000': 'luzon', // NCR
  '140000000': 'luzon', // CAR
  '010000000': 'luzon', // Region I
  '020000000': 'luzon', // Region II
  '030000000': 'luzon', // Region III
  '040000000': 'luzon', // Region IV-A
  '170000000': 'luzon', // MIMAROPA
  '050000000': 'luzon', // Region V
  '060000000': 'visayas', // Region VI
  '070000000': 'visayas', // Region VII
  '080000000': 'visayas', // Region VIII
  '090000000': 'mindanao', // Region IX
  '100000000': 'mindanao', // Region X
  '110000000': 'mindanao', // Region XI
  '120000000': 'mindanao', // Region XII
  '160000000': 'mindanao', // Caraga
  '190000000': 'mindanao', // BARMM
};

// Kumuha ng LAHAT ng Rehiyon sa Pilipinas mula sa Opisyal na PSGC API
export async function getRegions(): Promise<Region[]> {
  try {
    const response = await axios.get('https://psgc.gitlab.io/api/regions/');
    if (Array.isArray(response.data)) {
      return response.data.map((r: any) => ({
        code: r.code,
        name: r.regionName ? `${r.regionName} (${r.name})` : r.name,
        islandGroup: ISLAND_GROUP_MAP[r.code] || 'luzon',
      }));
    }
  } catch (error) {
    console.error('Failed to fetch PSGC regions, falling back to static list:', error);
  }

  // Fallback kung walang internet access sa PSGC API
  return [
    { code: '140000000', name: 'CAR', islandGroup: 'luzon' },
    { code: '130000000', name: 'NCR', islandGroup: 'luzon' },
    { code: '010000000', name: 'Region I', islandGroup: 'luzon' },
    { code: '020000000', name: 'Region II', islandGroup: 'luzon' },
    { code: '030000000', name: 'Region III', islandGroup: 'luzon' },
    { code: '040000000', name: 'CALABARZON', islandGroup: 'luzon' },
    { code: '170000000', name: 'MIMAROPA', islandGroup: 'luzon' },
    { code: '050000000', name: 'Region V', islandGroup: 'luzon' },
    { code: '060000000', name: 'Region VI', islandGroup: 'visayas' },
    { code: '070000000', name: 'Region VII', islandGroup: 'visayas' },
    { code: '080000000', name: 'Region VIII', islandGroup: 'visayas' },
    { code: '090000000', name: 'Region IX', islandGroup: 'mindanao' },
    { code: '100000000', name: 'Region X', islandGroup: 'mindanao' },
    { code: '110000000', name: 'Region XI', islandGroup: 'mindanao' },
    { code: '120000000', name: 'Region XII', islandGroup: 'mindanao' },
    { code: '160000000', name: 'Caraga', islandGroup: 'mindanao' },
    { code: '190000000', name: 'BARMM', islandGroup: 'mindanao' },
  ];
}

// Kumuha ng LAHAT ng Lungsod at Munisipalidad sa napiling Rehiyon
export async function getCitiesMunicipalitiesByRegion(regionCode: string): Promise<CityMunicipality[]> {
  try {
    const [citiesRes, munisRes] = await Promise.all([
      axios.get(`https://psgc.gitlab.io/api/regions/${regionCode}/cities/`),
      axios.get(`https://psgc.gitlab.io/api/regions/${regionCode}/municipalities/`),
    ]);

    const cities = Array.isArray(citiesRes.data) ? citiesRes.data : [];
    const municipalities = Array.isArray(munisRes.data) ? munisRes.data : [];

    const combined = [...cities, ...municipalities].map((item: any) => ({
      code: item.code,
      name: item.name,
      regionCode: regionCode,
    }));

    // I-sort alphabetically
    return combined.sort((a, b) => a.name.localeCompare(b.name));
  } catch (error) {
    console.error('Failed to fetch PSGC cities/municipalities:', error);
    return [];
  }
}

export async function fetchPhotosForLocation(query: string): Promise<Photo[]> {
  if (!PEXELS_API_KEY) {
    console.warn('Pexels API key missing');
  }

  try {
    const response = await axios.get('https://api.pexels.com/v1/search', {
      headers: {
        Authorization: PEXELS_API_KEY,
      },
      params: {
        query: `${query} Philippines tourist spot`,
        per_page: 12,
      },
    });

    if (response.data && response.data.photos) {
      return response.data.photos.map((item: any) => ({
        id: item.id,
        imageUrl: item.src.medium || item.src.large,
        photographer: item.photographer,
        photographerUrl: item.photographer_url,
        altText: item.alt || query,
      }));
    }
    return [];
  } catch (error) {
    console.error('Pexels API fetch error:', error);
    throw error;
  }
}