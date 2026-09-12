const OFFLINE_QUEUE_KEY =
  'ebarangay_offline_applications';

const MOCK_PROVINCES = [
  {
    code: '140010000',
    name: 'Abra'
  },
  {
    code: '141100000',
    name: 'Benguet'
  }
];

const MOCK_CITIES_MUNICIPALITIES = [
  {
    code: 'mock-city-001',
    name: 'Sample City'
  },
  {
    code: 'mock-city-002',
    name: 'Sample Municipality'
  }
];

export async function fetchProvinces() {
  try {
    const response = await fetch(
      'https://psgc.gitlab.io/api/provinces.json'
    );

    if (!response.ok) {
      throw new Error(
        'Failed to fetch provinces.'
      );
    }

    const provinces =
      await response.json();

    return provinces.sort((a, b) =>
      a.name.localeCompare(b.name)
    );
  } catch (error) {
    console.error(
      'Province API error:',
      error
    );

    return [
      ...MOCK_PROVINCES
    ].sort((a, b) =>
      a.name.localeCompare(b.name)
    );
  }
}

export async function fetchCitiesMunicipalities(
  provinceCode
) {
  if (!provinceCode) {
    return [];
  }

  try {
    const response = await fetch(
      `https://psgc.gitlab.io/api/provinces/${encodeURIComponent(
        provinceCode
      )}/cities-municipalities.json`
    );

    if (!response.ok) {
      throw new Error(
        'Failed to fetch cities and municipalities.'
      );
    }

    const citiesMunicipalities =
      await response.json();

    return citiesMunicipalities.sort(
      (a, b) =>
        a.name.localeCompare(b.name)
    );
  } catch (error) {
    console.error(
      'Cities/Municipalities API error:',
      error
    );

    return [
      ...MOCK_CITIES_MUNICIPALITIES
    ].sort((a, b) =>
      a.name.localeCompare(b.name)
    );
  }
}

export async function fetchBarangays(
  cityMunicipalityCode
) {
  if (!cityMunicipalityCode) {
    return [];
  }

  try {
    const response = await fetch(
      `https://psgc.gitlab.io/api/cities-municipalities/${encodeURIComponent(
        cityMunicipalityCode
      )}/barangays.json`
    );

    if (!response.ok) {
      throw new Error(
        'Failed to fetch barangays.'
      );
    }

    const barangays =
      await response.json();

    return barangays.sort((a, b) =>
      a.name.localeCompare(b.name)
    );
  } catch (error) {
    console.error(
      'Barangay API error:',
      error
    );

    return [];
  }
}

export function getOfflineQueue() {
  try {
    const storedQueue =
      localStorage.getItem(
        OFFLINE_QUEUE_KEY
      );

    if (!storedQueue) {
      return [];
    }

    const queue =
      JSON.parse(storedQueue);

    return Array.isArray(queue)
      ? queue
      : [];
  } catch (error) {
    console.error(
      'Failed to read offline queue:',
      error
    );

    return [];
  }
}

export function saveToOfflineQueue(
  appData
) {
  try {
    const queue =
      getOfflineQueue();

    queue.push(appData);

    localStorage.setItem(
      OFFLINE_QUEUE_KEY,
      JSON.stringify(queue)
    );

    return queue;
  } catch (error) {
    console.error(
      'Failed to save offline queue:',
      error
    );

    return getOfflineQueue();
  }
}

export function removeFromOfflineQueue(
  id
) {
  try {
    const queue =
      getOfflineQueue();

    const updatedQueue =
      queue.filter(
        (application) =>
          application.id !== id
      );

    localStorage.setItem(
      OFFLINE_QUEUE_KEY,
      JSON.stringify(updatedQueue)
    );

    return updatedQueue;
  } catch (error) {
    console.error(
      'Failed to remove from offline queue:',
      error
    );

    return getOfflineQueue();
  }
}