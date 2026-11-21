import { useEffect, useSyncExternalStore } from 'react';
import { Image } from 'expo-image';
import type { Photo } from '@/services/geoPhotoService';

// Extra: rotating background photos.
// One shared clock ticks every 4 seconds for the whole app, so every background changes
// at the same moment. Each caller passes an `offset` so they show different photos.
const INTERVAL_MS = 4000;

let tick = 0;
let timer: ReturnType<typeof setInterval> | null = null;
const listeners = new Set<() => void>();

const subscribe = (listener: () => void) => {
  listeners.add(listener);
  if (!timer) {
    timer = setInterval(() => {
      tick += 1;
      listeners.forEach((fn) => fn());
    }, INTERVAL_MS);
  }
  return () => {
    listeners.delete(listener);
    // Stop the clock when no screen is using it.
    if (listeners.size === 0 && timer) {
      clearInterval(timer);
      timer = null;
    }
  };
};

const getTick = () => tick;

export function useSlideshowPhoto(photos: Photo[], offset = 0): Photo | undefined {
  const current = useSyncExternalStore(subscribe, getTick, getTick);

  const count = photos.length;
  const photo = count ? photos[(current + offset) % count] : undefined;
  const upcoming = count ? photos[(current + offset + 1) % count] : undefined;

  // Download the next photo early so the fade is smooth.
  const upcomingUrl = upcoming?.imageUrl;
  useEffect(() => {
    if (upcomingUrl) {
      Image.prefetch(upcomingUrl).catch(() => {});
    }
  }, [upcomingUrl]);

  return photo;
}
