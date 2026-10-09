/**
 * [ROLE C] Async & Storage Module - Student Starter Template
 */

const FALLBACK_PROVINCES = [
  { code: '045600000', name: 'Rizal' },
  { code: '031400000', name: 'Bulacan' },
  { code: '042100000', name: 'Cavite' }
];

const FALLBACK_CITIES = [
  { code: '045601000', name: 'Antipolo City' },
  { code: '045602000', name: 'Taytay' }
];

const STORAGE_KEY = 'ebarangay_offline_applications';

export async function fetchProvinces() {
  // TODO: Fetch provinces from https://psgc.gitlab.io/api/provinces.json
  // Include offline fallback array.
  try {
    const response = await fetch('https://psgc.gitlab.io/api/provinces/');
    if (!response.ok) throw new Error('Network response failed');
    const data = await response.json();
    return data.sort((a, b) => a.name.localeCompare(b.name));
  } catch (error) {
    console.warn('Using offline fallback for provinces:', error);
    return FALLBACK_PROVINCES;
  }
}

export async function fetchCitiesMunicipalities(provinceCode) {
  // TODO: Fetch cities/municipalities for the given province code from PSGC API with offline fallback.
  if (!provinceCode) return [];
  try {
    const response = await fetch(`https://psgc.gitlab.io/api/provinces/${provinceCode}/cities-municipalities/`);
    if (!response.ok) throw new Error('Network response failed');
    const data = await response.json();
    return data.sort((a, b) => a.name.localeCompare(b.name));
  } catch (error) {
    console.warn('Using offline fallback for cities:', error);
    return FALLBACK_CITIES;
  }
}

export function getOfflineQueue() {
  // TODO: Retrieve stored applications from localStorage key 'ebarangay_offline_applications'
  const data = localStorage.getItem(STORAGE_KEY);
  return data ? JSON.parse(data) : [];
}

export function saveToOfflineQueue(appData) {
  // TODO: Save application object to localStorage queue
  const currentQueue = getOfflineQueue();
  currentQueue.push(appData);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(currentQueue));
}

export function removeFromOfflineQueue(id) {
  // TODO: Remove application from localStorage queue by id
  const currentQueue = getOfflineQueue();
  const updatedQueue = currentQueue.filter(app => app.id !== id);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedQueue));
}