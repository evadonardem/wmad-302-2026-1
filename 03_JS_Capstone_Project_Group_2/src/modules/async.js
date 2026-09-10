/**
 * [ROLE C] Async & Storage Module - Student Starter Template
 */

export async function fetchProvinces() {
  // TODO: Fetch provinces from https://psgc.gitlab.io/api/provinces.json
  // Include offline fallback array.
  return [];
}

export async function fetchCitiesMunicipalities(provinceCode) {
  // TODO: Fetch cities/municipalities for the given province code from PSGC API with offline fallback.
  return [];
}

export function getOfflineQueue() {
  // TODO: Retrieve stored applications from localStorage key 'ebarangay_offline_applications'
  return [];
}

export function saveToOfflineQueue(appData) {
  // TODO: Save application object to localStorage queue
}

export function removeFromOfflineQueue(id) {
  // TODO: Remove application from localStorage queue by id
}