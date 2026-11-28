/**
 * Offline cache for read-only API calls. Successful responses are saved to
 * AsyncStorage; when the network is unavailable the last saved copy is returned,
 * so products you have already browsed still load offline.
 */
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';

const PREFIX = 'api_cache:';
const INDEX_KEY = 'api_cache_index';
/** Oldest entries are removed beyond this many cached responses. */
export const MAX_CACHE_ENTRIES = 80;

/** Network failures (no response) and server errors use the cache; 4xx errors do not. */
export function isOfflineError(error: unknown): boolean {
  if (!axios.isAxiosError(error)) return false;
  return !error.response || error.response.status >= 500;
}

async function remember(key: string, data: unknown): Promise<void> {
  try {
    const index: string[] = JSON.parse((await AsyncStorage.getItem(INDEX_KEY)) ?? '[]');
    const next = [key, ...index.filter((k) => k !== key)];
    const evicted = next.slice(MAX_CACHE_ENTRIES);
    await AsyncStorage.setItem(PREFIX + key, JSON.stringify(data));
    await AsyncStorage.setItem(INDEX_KEY, JSON.stringify(next.slice(0, MAX_CACHE_ENTRIES)));
    if (evicted.length > 0) await AsyncStorage.multiRemove(evicted.map((k) => PREFIX + k));
  } catch {
    // Caching is best effort
  }
}

export async function readCache<T>(key: string): Promise<T | null> {
  try {
    const value = await AsyncStorage.getItem(PREFIX + key);
    return value ? (JSON.parse(value) as T) : null;
  } catch {
    return null;
  }
}

/** Runs `fetcher`; caches the result, or falls back to the cached copy when offline. */
export async function withOfflineCache<T>(key: string, fetcher: () => Promise<T>): Promise<T> {
  try {
    const data = await fetcher();
    remember(key, data);
    return data;
  } catch (error) {
    if (isOfflineError(error)) {
      const cached = await readCache<T>(key);
      if (cached !== null) return cached;
    }
    throw error;
  }
}

/** Stable cache key for a path + params. */
export function cacheKey(path: string, params: object = {}): string {
  const entries = Object.entries(params)
    .filter(([, value]) => value !== undefined)
    .sort(([a], [b]) => a.localeCompare(b));
  return entries.length ? `${path}?${entries.map(([k, v]) => `${k}=${String(v)}`).join('&')}` : path;
}
