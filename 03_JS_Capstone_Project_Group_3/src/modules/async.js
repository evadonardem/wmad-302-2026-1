/**
 * [ROLE C] Async & Storage Module - Student Starter Template
 */

const PSGC_API = 'https://psgc.gitlab.io/api';
const OFFLINE_QUEUE_KEY = 'ebarangay_offline_applications';

const MOCK_PROVINCES = [
  { code: '141100000', name: 'Benguet' },
  { code: '063000000', name: 'Iloilo' },
  { code: '104300000', name: 'Misamis Oriental' },
];

const MOCK_CITIES = {
  '141100000': [
    { code: '141101000', name: 'Baguio City' },
    { code: '141102000', name: 'La Trinidad' }
  ],
  '063000000': [
    { code: '063022000', name: 'Iloilo City' }
  ],
  '104300000': [
    { code: '104322000', name: 'Cagayan de Oro' }
  ],
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