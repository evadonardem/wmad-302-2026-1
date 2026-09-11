/*
 * [ROLE C] Async & Storage Module
 */

const OFFLINE_QUEUE_KEY = 'ebarangay_offline_applications';


// Offline fallback for cities/municipalities
function getOfflineCities(provinceCode) {
  return [
    {
      code: `${provinceCode}-OFFLINE-1`,
      name: 'Offline City/Municipality 1'
    },
    {
      code: `${provinceCode}-OFFLINE-2`,
      name: 'Offline City/Municipality 2'
    }
  ].sort((a, b) =>
    a.name.localeCompare(b.name)
  );
}


// Fetch all provinces from PSGC API
export async function fetchProvinces() {
  try {
    const response = await fetch(
      'https://psgc.gitlab.io/api/provinces.json'
    );

    if (!response.ok) {
      throw new Error('Failed to fetch provinces');
    }

    const provinces = await response.json();

    return provinces.sort((a, b) =>
      a.name.localeCompare(b.name)
    );

  } catch (error) {
    console.warn(
      'Unable to fetch provinces. Using offline fallback.',
      error
    );

    return [
      { code: 'PH-ABR', name: 'Abra' },
      { code: 'PH-AGN', name: 'Agusan del Norte' },
      { code: 'PH-AGS', name: 'Agusan del Sur' },
      { code: 'PH-ALB', name: 'Albay' },
      { code: 'PH-ANT', name: 'Antique' },
      { code: 'PH-APA', name: 'Apayao' },
      { code: 'PH-AUR', name: 'Aurora' },
      { code: 'PH-BAS', name: 'Basilan' },
      { code: 'PH-BAN', name: 'Bataan' },
      { code: 'PH-BTN', name: 'Batanes' },
      { code: 'PH-BTG', name: 'Batangas' },
      { code: 'PH-BEN', name: 'Benguet' },
      { code: 'PH-BIL', name: 'Biliran' },
      { code: 'PH-BOH', name: 'Bohol' },
      { code: 'PH-QUI', name: 'Quirino' }
    ].sort((a, b) =>
      a.name.localeCompare(b.name)
    );
  }
}


// Fetch cities/municipalities for a province
export async function fetchCitiesMunicipalities(provinceCode) {
  if (!provinceCode) {
    return [];
  }

  try {
    const response = await fetch(
      `https://psgc.gitlab.io/api/provinces/${provinceCode}/cities-municipalities.json`
    );

    if (!response.ok) {
      throw new Error(
        'Failed to fetch cities/municipalities'
      );
    }

    const cities = await response.json();

    return cities.sort((a, b) =>
      a.name.localeCompare(b.name)
    );

  } catch (error) {
    console.warn(
      'Unable to fetch cities/municipalities. Using offline fallback.',
      error
    );

    return getOfflineCities(provinceCode);
  }
}


// Get applications saved for offline use
export function getOfflineQueue() {
  try {
    const storedData =
      localStorage.getItem(OFFLINE_QUEUE_KEY);

    if (!storedData) {
      return [];
    }

    const queue = JSON.parse(storedData);

    return Array.isArray(queue) ? queue : [];

  } catch (error) {
    console.warn(
      'Unable to read offline queue.',
      error
    );

    return [];
  }
}


// Save an application to the offline queue
export function saveToOfflineQueue(appData) {
  try {
    const queue = getOfflineQueue();

    queue.push(appData);

    localStorage.setItem(
      OFFLINE_QUEUE_KEY,
      JSON.stringify(queue)
    );

    return queue;

  } catch (error) {
    console.warn(
      'Unable to save application to offline queue.',
      error
    );

    return [];
  }
}


// Remove an application from the offline queue
export function removeFromOfflineQueue(id) {
  try {
    const queue = getOfflineQueue();

    const updatedQueue = queue.filter(
      application => application.id !== id
    );

    localStorage.setItem(
      OFFLINE_QUEUE_KEY,
      JSON.stringify(updatedQueue)
    );

    return updatedQueue;

  } catch (error) {
    console.warn(
      'Unable to remove application from offline queue.',
      error
    );

    return [];
  }
}