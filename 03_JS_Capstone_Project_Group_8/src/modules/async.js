/**
 * [ROLE C] Async & Storage Module - Student Starter Template
 */
const STORAGE_KEY = "ebarangay_offline_applications";

export async function fetchProvinces() {
  // ✅ Added La Union & other provinces as fallback matching API codes
  const fallbackProvinces = [
    { code: "012800000", name: "Ilocos Norte" },
    { code: "012900000", name: "Ilocos Sur" },
    { code: "013300000", name: "La Union" },
    { code: "015500000", name: "Pangasinan" }
  ];
  try {
    const response = await fetch("https://psgc.gitlab.io/api/provinces.json");
    if (!response.ok) throw new Error("Failed to fetch provinces");
    const provinces = await response.json();
    return provinces.sort((a, b) => a.name.localeCompare(b.name));
  } catch (error) {
    console.log("Using offline province data.");
    return fallbackProvinces.sort((a, b) => a.name.localeCompare(b.name));
  }
}

export async function fetchCitiesMunicipalities(provinceCode) {
  const fallbackCities = [
    { code: "013300001", name: "San Fernando City" },
    { code: "013300002", name: "Agoo" },
    { code: "013300003", name: "Aringay" }
  ];
  try {
    const response = await fetch(
      `https://psgc.gitlab.io/api/provinces/${provinceCode}/cities-municipalities.json`
    );
    if (!response.ok) throw new Error("Failed to fetch cities/municipalities");
    const cities = await response.json();
    return cities.sort((a, b) => a.name.localeCompare(b.name));
  } catch (error) {
    console.log("Using offline city/municipality data.");
    return fallbackCities.sort((a, b) => a.name.localeCompare(b.name));
  }
}

export function getOfflineQueue() {
  const savedData = localStorage.getItem(STORAGE_KEY);
  if (!savedData) return [];
  try { return JSON.parse(savedData); }
  catch { return []; }
}

export function saveToOfflineQueue(appData) {
  const queue = getOfflineQueue();
  queue.push(appData);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(queue));
}

export function removeFromOfflineQueue(id) {
  const queue = getOfflineQueue();
  const updatedQueue = queue.filter((item) => item.id !== id);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedQueue)); 
}