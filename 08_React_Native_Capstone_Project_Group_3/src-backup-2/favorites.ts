import { useSyncExternalStore } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { Photo } from '@/services/geoPhotoService';

// Extra feature (not part of the assignment TODOs):
// favorite photos, saved on the device with AsyncStorage so they survive app restarts.
// A tiny shared store — any screen can read or change it without adding a Provider.
const STORAGE_KEY = 'lakbayph:favorites';

let favorites: Photo[] = [];
let loadStarted = false;
const listeners = new Set<() => void>();

const notify = () => listeners.forEach((listener) => listener());

const persist = () => {
  AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(favorites)).catch((error) =>
    console.error('Failed to save favorites:', error)
  );
};

const loadFromStorage = async () => {
  if (loadStarted) return;
  loadStarted = true;
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEY);
    const stored: unknown = raw ? JSON.parse(raw) : [];
    if (Array.isArray(stored)) {
      // Keep anything favorited while loading, then add the saved ones.
      const seen = new Set(favorites.map((photo) => photo.id));
      favorites = [...favorites, ...(stored as Photo[]).filter((photo) => !seen.has(photo.id))];
      notify();
    }
  } catch (error) {
    console.error('Failed to load favorites:', error);
  }
};

const subscribe = (listener: () => void) => {
  listeners.add(listener);
  loadFromStorage();
  return () => {
    listeners.delete(listener);
  };
};

const getSnapshot = () => favorites;
const getServerSnapshot = (): Photo[] => [];

export const toggleFavorite = (photo: Photo) => {
  const exists = favorites.some((item) => item.id === photo.id);
  favorites = exists ? favorites.filter((item) => item.id !== photo.id) : [photo, ...favorites];
  notify();
  persist();
};

export const clearFavorites = () => {
  favorites = [];
  notify();
  persist();
};

export function useFavorites() {
  const list = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

  return {
    favorites: list,
    isFavorite: (id: number) => list.some((photo) => photo.id === id),
    toggleFavorite,
    clearFavorites,
  };
}
