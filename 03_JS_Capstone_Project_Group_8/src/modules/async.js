/**
 * [ROLE C] Async & Storage Module - Student Starter Template
 */
const STORAGE_KEY = "ebarangay_offline_applications";

export async function fetchProvinces() {
  
  const fallbackProvinces = [
    {
      code: "140000000",
      name: "Cordillera Administrative Region"
    },
    {
      code: "150000000",
      name: "Bangsamoro Autonomous Region in Muslim Mindanao"
    }
  ];

  try {
    const response = await fetch(
      "https://psgc.gitlab.io/api/provinces.json"
    );

    if (!response.ok) {
      throw new Error("Failed to fetch provinces");
    }

    const provinces = await response.json();

    return provinces.sort((a, b) =>
      a.name.localeCompare(b.name)
    );
  } catch (error) {
    console.log("Using offline province data.");

    return fallbackProvinces.sort((a, b) =>
      a.name.localeCompare(b.name)
    );
  }
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