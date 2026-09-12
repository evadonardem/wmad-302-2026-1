const PSGC_API = 'https://psgc.gitlab.io/api';
const OFFLINE_QUEUE_KEY = 'ebarangay_offline_applications';

const MOCK_PROVINCES = [
  { code: '130000000', name: 'Metro Manila' },
  { code: 'PH-ABR', name: 'Abra' },
  { code: 'PH-CEB', name: 'Cebu' },
];

const MOCK_CITIES = {
  '130000000': [{ code: '133900000', name: 'Manila' }],
  'PH-ABR': [{ code: '140010000', name: 'Bangued' }],
  'PH-CEB': [{ code: '072200000', name: 'Cebu City' }],
};

async function fetchJson(url) {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`PSGC request failed with status ${response.status}`);
  }
  return response.json();
}

function sortByName(items) {
  return items
    .filter((item) => item && item.name && item.code)
    .sort((first, second) => first.name.localeCompare(second.name));
}

export async function fetchProvinces() {
  try {
    const provinces = await fetchJson(`${PSGC_API}/provinces.json`);
    return sortByName(provinces);
  } catch (error) {
    console.warn('Unable to load provinces from PSGC. Using mock data.', error);
    return sortByName([...MOCK_PROVINCES]);
  }
}

export async function fetchCitiesMunicipalities(provinceCode) {
  if (!provinceCode) return [];

  try {
    const cities = await fetchJson(
      `${PSGC_API}/provinces/${encodeURIComponent(provinceCode)}/cities-municipalities.json`,
    );
    return sortByName(cities);
  } catch (error) {
    console.warn('Unable to load cities/municipalities from PSGC. Using mock data.', error);
    return sortByName([...(MOCK_CITIES[provinceCode] || [])]);
  }
}

export function getOfflineQueue() {
  try {
    const storedQueue = localStorage.getItem(OFFLINE_QUEUE_KEY);
    if (!storedQueue) return [];

    const queue = JSON.parse(storedQueue);
    return Array.isArray(queue) ? queue : [];
  } catch (error) {
    console.warn('Unable to read the offline application queue.', error);
    return [];
  }
}

export function saveToOfflineQueue(appData) {
  const queue = getOfflineQueue();
  const nextQueue = [...queue, appData];

  try {
    localStorage.setItem(OFFLINE_QUEUE_KEY, JSON.stringify(nextQueue));
  } catch (error) {
    console.error('Unable to save the offline application queue.', error);
  }

  return nextQueue;
}

export function removeFromOfflineQueue(id) {
  const nextQueue = getOfflineQueue().filter((application) => application.id !== id);

  try {
    localStorage.setItem(OFFLINE_QUEUE_KEY, JSON.stringify(nextQueue));
  } catch (error) {
    console.error('Unable to update the offline application queue.', error);
  }

  return nextQueue;
}