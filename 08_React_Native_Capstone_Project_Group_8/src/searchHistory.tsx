import React from 'react';
import { createContext, useContext, useMemo, useState, type ReactNode } from 'react';

const MAX_ENTRIES = 10;

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
  
  const value = useMemo(
    () => ({
      entries,
      recordSearch: (city: string) => {
        const trimmed = city.trim();
        if (!trimmed) return;
        setEntries((prev) => [
          trimmed,
          ...prev.filter((e) => e.toLowerCase() !== trimmed.toLowerCase()),
        ].slice(0, MAX_ENTRIES));
      },
      clearHistory: () => {
        setEntries([]);
      },
    }),
    [entries],
  );

  return (
    <SearchHistoryContext.Provider value={value}>
      {children}
    </SearchHistoryContext.Provider>
  );
}
 
export const useSearchHistory = () => useContext(SearchHistoryContext);