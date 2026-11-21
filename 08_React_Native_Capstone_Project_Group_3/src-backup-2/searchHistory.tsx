import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Pre-built search history store (not part of the assignment).
// The Search dashboard records each successful search (TODO 5.1) and the History screen
// renders the entries (TODO 5.2) and hands one back to Search (TODO 5.3).
// Extra: entries are now saved with AsyncStorage, so history survives closing the app,
// and clearHistory() empties it.
const MAX_ENTRIES = 10;
const STORAGE_KEY = 'lakbayph:searchHistory';

type SearchHistoryValue = {
  entries: string[];
  recordSearch: (city: string) => void;
  clearHistory: () => void;
};

const SearchHistoryContext = createContext<SearchHistoryValue>({
  entries: [],
  recordSearch: () => {},
  clearHistory: () => {},
});

export function SearchHistoryProvider({ children }: { children: ReactNode }) {
  const [entries, setEntries] = useState<string[]>([]);
  const [hydrated, setHydrated] = useState(false);

  // Load saved history once when the app starts.
  useEffect(() => {
    let cancelled = false;

    AsyncStorage.getItem(STORAGE_KEY)
      .then((raw) => {
        if (cancelled) return;
        const stored: unknown = raw ? JSON.parse(raw) : [];
        if (Array.isArray(stored)) {
          // Keep any searches made while loading at the front, then the saved ones.
          setEntries((current) => {
            const merged = [...current];
            for (const city of stored as string[]) {
              if (!merged.some((e) => e.toLowerCase() === city.toLowerCase())) {
                merged.push(city);
              }
            }
            return merged.slice(0, MAX_ENTRIES);
          });
        }
      })
      .catch((error) => console.error('Failed to load search history:', error))
      .finally(() => {
        if (!cancelled) setHydrated(true);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  // Save whenever the list changes (after the first load, so we never overwrite it with []).
  useEffect(() => {
    if (!hydrated) return;
    AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(entries)).catch((error) =>
      console.error('Failed to save search history:', error)
    );
  }, [entries, hydrated]);

  const value = useMemo(
    () => ({
      entries,
      recordSearch: (city: string) => {
        const trimmed = city.trim();
        if (!trimmed) return;
        setEntries((prev) => [trimmed, ...prev.filter((e) => e.toLowerCase() !== trimmed.toLowerCase())].slice(0, MAX_ENTRIES));
      },
      clearHistory: () => setEntries([]),
    }),
    [entries],
  );

  return <SearchHistoryContext.Provider value={value}>{children}</SearchHistoryContext.Provider>;
}

export const useSearchHistory = () => useContext(SearchHistoryContext);
