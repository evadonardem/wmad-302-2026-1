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
  
  const fallbackCities = [
    {
      code: "144400000",
      name: "La Trinidad"
    },
    {
      code: "141100000",
      name: "Baguio City"
    }
  ];

  try {
    const response = await fetch(
      `https://psgc.gitlab.io/api/provinces/${provinceCode}/cities-municipalities.json`
    );

    if (!response.ok) {
      throw new Error("Failed to fetch cities/municipalities");
    }

    const cities = await response.json();

    return cities.sort((a, b) =>
      a.name.localeCompare(b.name)
    );
  } catch (error) {
    console.log("Using offline city/municipality data.");

    return fallbackCities.sort((a, b) =>
      a.name.localeCompare(b.name)
    );
  }
}

export function getOfflineQueue() {
  
   const savedData = localStorage.getItem(STORAGE_KEY);

  if (!savedData) {
    return [];
  }

  try {
    return JSON.parse(savedData);
  } catch (error) {
    return [];
  }
}

export function saveToOfflineQueue(appData) {
  // TODO: Save application object to localStorage queue
}

export function removeFromOfflineQueue(id) {
  // TODO: Remove application from localStorage queue by id
}