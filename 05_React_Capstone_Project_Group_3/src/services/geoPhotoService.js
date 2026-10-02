import axios from 'axios';

const PSGC_BASE_URL = 'https://psgc.gitlab.io/api';
const COMMONS_API_URL = 'https://commons.wikimedia.org/w/api.php';

export const getRegions = async () => {
  try {
    const response = await axios.get(`${PSGC_BASE_URL}/regions/`);

    return Array.isArray(response.data) ? response.data : [];
  } catch (error) {
    console.error('Error loading regions:', error);
    return [];
  }
};

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

export const searchPhotosByLocation = async (locationName) => {
  if (!locationName) return [];

  try {
    const response = await axios.get(COMMONS_API_URL, {
      params: {
        action: 'query',
        format: 'json',
        origin: '*',
        generator: 'search',
        gsrsearch: `${locationName} Philippines filetype:bitmap`,
        gsrnamespace: 6,
        gsrlimit: 12,
        prop: 'imageinfo',
        iiprop: 'url|extmetadata',
        iiurlwidth: 600,
      },
    });

    const pages = Object.values(response.data?.query?.pages || {});

    return pages
      .filter((page) => page.imageinfo?.[0]?.thumburl)
      .map((page) => {
        const info = page.imageinfo[0];
        const artist = info.extmetadata?.Artist?.value || 'Unknown';

        return {
          id: page.pageid,
          imageUrl: info.thumburl,
          photographer: artist.replace(/<[^>]*>/g, '').trim() || 'Unknown',
          photographerUrl: info.descriptionurl,
          altText: `${locationName} tourist spot`,
        };
      });
  } catch (error) {
    console.error('Error searching photos:', error);
    return [];
  }
};