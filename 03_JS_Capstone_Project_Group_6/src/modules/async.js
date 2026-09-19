/**
 * [ROLE C] Async & Storage Module - Student Starter Template
 */

export async function fetchProvinces() {
  // TODO: Fetch provinces from https://psgc.gitlab.io/api/provinces.json
  // Include offline fallback array.
  
  try{
    const response = await fetch('https://psgc.gitlab.io/api/provinces.json');
    if(!response.ok){
      throw new Error('Failed to fetch provinces');
    }
    const provinces = await response.json();

    localStorage.setItem(
      'provinces', JSON.stringify(provinces)
    );

    return provinces;
  }catch(error){
    console.error('Error fetching provinces:', error);

    const offlineProvinces = localStorage.getItem('provinces');
    if(offlineProvinces){
      return JSON.parse(offlineProvinces);
    }

  }
}

export async function fetchCitiesMunicipalities(provinceCode) {
  // TODO: Fetch cities/municipalities for the given province code from PSGC API with offline fallback.
  try{
    const response = await fetch(`https://psgc.gitlab.io/api/provinces/${provinceCode}/cities-municipalities.json`);
    if(!response.ok){
      throw new Error('Failed to fetch cities/municipalities');
    }
    const citiesMunicipalities = await response.json();

    localStorage.setItem(
      `cities_municipalities_${provinceCode}`, JSON.stringify(citiesMunicipalities)
    );

    return citiesMunicipalities;
  }catch(error){
    console.error('Error fetching cities/municipalities:', error);

    const offlineCitiesMunicipalities = localStorage.getItem(`cities_municipalities_${provinceCode}`);
    if(offlineCitiesMunicipalities){
      return JSON.parse(offlineCitiesMunicipalities);
    }
  }
  return [];
}

export function getOfflineQueue() {
  // TODO: Retrieve stored applications from localStorage key 'ebarangay_offline_applications'
  const offlineQueue = localStorage.getItem('ebarangay_offline_applications');
  if(offlineQueue){
    return JSON.parse(offlineQueue);
  }
  return [];
}

export function saveToOfflineQueue(appData) {
  // TODO: Save application object to localStorage queue
  const offlineQueue = getOfflineQueue();
  offlineQueue.push(appData);
  localStorage.setItem('ebarangay_offline_applications', JSON.stringify(offlineQueue));
}

export function removeFromOfflineQueue(id) {
  // TODO: Remove application from localStorage queue by id
  const offlineQueue = getOfflineQueue();
  const updatedQueue = offlineQueue.filter(app => app.id !== id);
  localStorage.setItem('ebarangay_offline_applications', JSON.stringify(updatedQueue));
}