import axios from 'axios';

// TODO 1.1 [Base Configuration]
const PSGC_BASE_URL = 'https://psgc.gitlab.io/api';

const PSGC_PATHS = {
  regions: '/regions/',
  citiesByRegion: (regionCode: string) => `/regions/${regionCode}/cities-municipalities/`,
  allCities: '/cities-municipalities/', // feeds the top search bar
  provinces: '/provinces/', //             lets "Batanes", "Palawan" etc. be searched
};

const PHOTO_SEARCH_URL = 'https://commons.wikimedia.org/w/api.php';
const PHOTO_RESULTS_PER_PAGE = 24;
const NON_PHOTO_TITLE =
  /\b(flag|logo|seal|coat of arms|locator|map|historical marker|plaque|emblem|school|document|poster)\b/i;

type CommonsMetadata = { value?: string };
type CommonsImageInfo = {
  url?: string;
  thumburl?: string;
  descriptionurl?: string;
  responsiveUrls?: Record<string, string>;
  extmetadata?: {
    Artist?: CommonsMetadata;
    Credit?: CommonsMetadata;
    ImageDescription?: CommonsMetadata;
    ObjectName?: CommonsMetadata;
  };
};
type CommonsPage = {
  pageid: number;
  title: string;
  imageinfo?: CommonsImageInfo[];
};
type CommonsSearchResponse = {
  query?: { pages?: CommonsPage[] };
};

const plainText = (value?: string) =>
  (value ?? '')
    .replace(/<[^>]*>/g, '')
    .replace(/&nbsp;/gi, ' ')
    .replace(/&amp;/gi, '&')
    .replace(/&quot;/gi, '"')
    .replace(/&#39;|&apos;/gi, "'")
    .replace(/&lt;/gi, '<')
    .replace(/&gt;/gi, '>')
    .trim();

const mapCommonsPhoto = (page: CommonsPage): Photo | null => {
  const image = page.imageinfo?.[0];
  if (!image?.url || !image.descriptionurl || NON_PHOTO_TITLE.test(page.title)) return null;

  const metadata = image.extmetadata;
  const photographer =
    plainText(metadata?.Artist?.value) ||
    plainText(metadata?.Credit?.value) ||
    'Wikimedia Commons contributor';

  return {
    id: page.pageid,
    imageUrl: image.thumburl ?? image.url,
    fullUrl: image.responsiveUrls?.['2'] ?? image.url,
    originalUrl: image.url,
    photographer,
    photographerUrl: image.descriptionurl,
    altText:
      plainText(metadata?.ImageDescription?.value) ||
      plainText(metadata?.ObjectName?.value) ||
      page.title.replace(/^File:/, '').replace(/\.[^.]+$/, '').replace(/[_-]+/g, ' '),
    pageUrl: image.descriptionurl,
  };
};

const searchCommons = async (query: string): Promise<Photo[]> => {
  const { data } = await axios.get<CommonsSearchResponse>(PHOTO_SEARCH_URL, {
    params: {
      action: 'query',
      generator: 'search',
      gsrsearch: query,
      gsrnamespace: 6,
      gsrlimit: 12,
      prop: 'imageinfo',
      iiprop: 'url|extmetadata',
      iiurlwidth: 1000,
      origin: '*',
      format: 'json',
      formatversion: 2,
    },
  });
  return (data.query?.pages ?? [])
    .map(mapCommonsPhoto)
    .filter((photo): photo is Photo => photo !== null);
};

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
  fullUrl?: string;
  originalUrl?: string;
  photographer: string;
  photographerUrl: string;
  altText: string;
  pageUrl?: string;
};

export type PlaceIndexItem = {
  code: string;
  name: string;
  type: 'Province' | 'City / Municipality';
};

export const getRegions = async (): Promise<Region[]> => {
  // TODO 1.2 [Regions Retrieval]
  const { data } = await axios.get<Region[]>(`${PSGC_BASE_URL}${PSGC_PATHS.regions}`);
  return data;
};

export const getCitiesMunicipalitiesByRegion = async (regionCode: string): Promise<City[]> => {
  // TODO 1.3 [Chained Location Population]
  if (!regionCode) return [];
  const { data } = await axios.get<City[]>(
    `${PSGC_BASE_URL}${PSGC_PATHS.citiesByRegion(regionCode)}`,
  );
  return data;
};

export const getPlaceIndex = async (): Promise<PlaceIndexItem[]> => {
  try {
    const [prov, cities] = await Promise.all([
      axios.get<{ code: string; name: string }[]>(`${PSGC_BASE_URL}${PSGC_PATHS.provinces}`),
      axios.get<{ code: string; name: string }[]>(`${PSGC_BASE_URL}${PSGC_PATHS.allCities}`),
    ]);
    const tag = (
      list: { code: string; name: string }[],
      type: PlaceIndexItem['type'],
    ): PlaceIndexItem[] => list.map((p) => ({ code: p.code, name: p.name, type }));
    return [...tag(prov.data, 'Province'), ...tag(cities.data, 'City / Municipality')].sort((a, b) =>
      a.name.localeCompare(b.name),
    );
  } catch (error) {
    console.error('getPlaceIndex failed:', error);
    return [];
  }
};

export const cleanPlaceName = (name = '') =>
  name.replace(/^(City|Municipality) of\s+/i, '').replace(/\s*\(.*?\)\s*/g, ' ').trim();

export const searchPhotosByLocation = async (locationName: string): Promise<Photo[]> => {
  // TODO 1.4 [Location Photo Search]
  if (!locationName) return [];
  const place = cleanPlaceName(locationName);
  const resultSets = await Promise.all([
    searchCommons(`${place} tourist attraction filetype:bitmap`),
    searchCommons(`${place} landscape Philippines filetype:bitmap`),
    searchCommons(`${place} Philippines filetype:bitmap`),
  ]);
  const uniquePhotos = new Map<number, Photo>();
  for (const photo of resultSets.flat()) {
    if (!uniquePhotos.has(photo.id)) uniquePhotos.set(photo.id, photo);
    if (uniquePhotos.size === PHOTO_RESULTS_PER_PAGE) break;
  }
  return [...uniquePhotos.values()];
};