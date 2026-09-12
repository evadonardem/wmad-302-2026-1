/**
 * [ROLE C] Async & Storage Module - Student Starter Template
 */

export async function fetchProvinces() {
  // TODO: Fetch provinces from https://psgc.gitlab.io/api/provinces.json
  // Include offline fallback array.
  
  try {
    const response = await fetch('https://psgc.gitlab.io/api/provinces.json'); 
    
    if (!response.ok) { throw new Error('Failed to fetch provinces'); }

    return await response.json();
  } catch (error) {

    return [{ code: '010000000', name: 'Ilocos Norte' }, 
            { code: '020000000', name: 'Cagayan' }, 
            { code: '030000000', name: 'Bataan' }, 
            { code: '040000000', name: 'Laguna' }, 
            { code: '130000000', name: 'Metro Manila' }];
  }
}

export async function fetchCitiesMunicipalities(provinceCode) {
  // TODO: Fetch cities/municipalities for the given province code from PSGC API with offline fallback.
  try { const response = await fetch(`https://psgc.gitlab.io/api/provinces/${provinceCode}/cities-municipalities.json`); 
    if (!response.ok) { throw new Error('Failed to fetch cities/municipalities'); 
  } 
    return await response.json(); 
  } catch (error) {
  return [];
  }
}

export function getOfflineQueue() {
  // TODO: Retrieve stored applications from localStorage key 'ebarangay_offline_applications'
  const storedData = localStorage.getItem('ebarangay_offline_applications'); 
  if (!storedData) {
  return [];
}
  try { 
    return JSON.parse(storedData); 
  } catch (error) { 
    return []; }
}

export function saveToOfflineQueue(appData) {
  // TODO: Save application object to localStorage queue
  const queue = getOfflineQueue(); 
  queue.push(appData); 
  localStorage.setItem('ebarangay_offline_applications', 
    JSON.stringify(queue)
  );
}

export function removeFromOfflineQueue(id) {
  // TODO: Remove application from localStorage queue by id
  const queue = getOfflineQueue(); 
  const updatedQueue = queue.filter((app) => app.id !== id); 
  localStorage.setItem('ebarangay_offline_applications', 
    JSON.stringify(updatedQueue)
  );
}