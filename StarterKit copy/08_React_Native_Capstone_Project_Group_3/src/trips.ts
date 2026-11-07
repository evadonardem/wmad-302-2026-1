import { useSyncExternalStore } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { Photo } from '@/services/geoPhotoService';

// Extra feature (not part of the assignment TODOs):
// a trip planner — named trips holding an ordered list of photo spots,
// saved on the device with AsyncStorage. Same pattern as src/favorites.ts.
const STORAGE_KEY = 'lakbayph:trips';

export type TripSpot = Photo & {
  place?: string; // the searched city, when known
};

export type Trip = {
  id: string;
  name: string;
  createdAt: number;
  spots: TripSpot[];
};

let trips: Trip[] = [];
let loadStarted = false;
const listeners = new Set<() => void>();

const notify = () => listeners.forEach((listener) => listener());

const persist = () => {
  AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(trips)).catch((error) =>
    console.error('Failed to save trips:', error)
  );
};

const update = (next: Trip[]) => {
  trips = next;
  notify();
  persist();
};

const loadFromStorage = async () => {
  if (loadStarted) return;
  loadStarted = true;
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEY);
    const stored: unknown = raw ? JSON.parse(raw) : [];
    if (Array.isArray(stored)) {
      // Keep any trip made while loading, then add the saved ones.
      const seen = new Set(trips.map((trip) => trip.id));
      trips = [...trips, ...(stored as Trip[]).filter((trip) => !seen.has(trip.id))];
      notify();
    }
  } catch (error) {
    console.error('Failed to load trips:', error);
  }
};

const subscribe = (listener: () => void) => {
  listeners.add(listener);
  loadFromStorage();
  return () => {
    listeners.delete(listener);
  };
};

const getSnapshot = () => trips;
const getServerSnapshot = (): Trip[] => [];

const newId = () => `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;

export const createTrip = (name: string) => {
  const trip: Trip = { id: newId(), name: name.trim() || 'My trip', createdAt: Date.now(), spots: [] };
  update([trip, ...trips]);
  return trip.id;
};

export const deleteTrip = (tripId: string) => {
  update(trips.filter((trip) => trip.id !== tripId));
};

export const addSpotToTrip = (tripId: string, photo: Photo, place?: string) => {
  update(
    trips.map((trip) =>
      trip.id === tripId && !trip.spots.some((spot) => spot.id === photo.id)
        ? { ...trip, spots: [...trip.spots, { ...photo, place }] }
        : trip
    )
  );
};

export const removeSpotFromTrip = (tripId: string, photoId: number) => {
  update(
    trips.map((trip) =>
      trip.id === tripId ? { ...trip, spots: trip.spots.filter((spot) => spot.id !== photoId) } : trip
    )
  );
};

// Move a spot one position up (-1) or down (+1) inside its trip.
export const moveSpot = (tripId: string, index: number, direction: -1 | 1) => {
  update(
    trips.map((trip) => {
      const target = index + direction;
      if (trip.id !== tripId || target < 0 || target >= trip.spots.length) return trip;
      const spots = [...trip.spots];
      [spots[index], spots[target]] = [spots[target], spots[index]];
      return { ...trip, spots };
    })
  );
};

// Plain-text version of a trip, for the share sheet.
export const tripToText = (trip: Trip) => {
  const lines = trip.spots.map(
    (spot, i) => `${i + 1}. ${spot.place ? `${spot.place} — ` : ''}${spot.altText}\n   📸 ${spot.imageUrl}`
  );
  return [`🧳 ${trip.name} (Lakbay PH)`, '', ...(lines.length ? lines : ['No spots yet.'])].join('\n');
};

export function useTrips() {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}
