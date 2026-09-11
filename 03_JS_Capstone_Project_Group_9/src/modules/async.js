/**
 * [ROLE C] Async & Storage Module - Student Starter Template
 */

const OFFLINE_KEY = 'ebarangay_offline_applications';

export async function fetchProvinces() {
  try {
    const response = await fetch('https://psgc.gitlab.io/api/provinces.json');
    if (!response.ok) {
      throw new Error('Network response was not ok');
    }
    const data = await response.json();
    return data.sort((a, b) => a.name.localeCompare(b.name));
  } catch (error) {
    console.error('Failed to fetch provinces, using fallback:', error);
    return [
      { code: '013300000', name: 'Ilocos Norte' },
      { code: '015500000', name: 'Ilocos Sur' },
      { code: '012800000', name: 'Pangasinan' }
    ];
  }
}

export async function fetchCitiesMunicipalities(provinceCode) {
  try {
    const response = await fetch(`https://psgc.gitlab.io/api/provinces/${provinceCode}/cities-municipalities.json`);
    if (!response.ok) {
      throw new Error('Network response was not ok');
    }
    const data = await response.json();
    return data.sort((a, b) => a.name.localeCompare(b.name));
  } catch (error) {
    console.error('Failed to fetch cities/municipalities, using fallback:', error);
    return [
      { code: '000000000', name: 'Sample City' }
    ];
  }
}

export function getOfflineQueue() {
  const stored = localStorage.getItem(OFFLINE_KEY);
  return stored ? JSON.parse(stored) : [];
}

export function saveToOfflineQueue(appData) {
  const queue = getOfflineQueue();
  queue.push(appData);
  localStorage.setItem(OFFLINE_KEY, JSON.stringify(queue));
}

export function removeFromOfflineQueue(id) {
  const queue = getOfflineQueue();
  const updatedQueue = queue.filter(item => item.id !== id);
  localStorage.setItem(OFFLINE_KEY, JSON.stringify(updatedQueue));
}