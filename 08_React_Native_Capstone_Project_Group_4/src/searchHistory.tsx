import React, { createContext, useContext, useEffect, useState } from 'react';
import { Platform } from 'react-native';

interface SearchHistoryContextType {
  history: string[];
  addSearch: (query: string) => void;
  clearHistory: () => void;
}

const STORAGE_KEY = 'LAKBAY_PH_SEARCH_HISTORY';

// Global cache fallback
let globalHistoryCache: string[] = [];

const SearchHistoryContext = createContext<SearchHistoryContextType>({
  history: [],
  addSearch: () => {},
  clearHistory: () => {},
});

export function SearchHistoryProvider({ children }: { children: React.ReactNode }) {
  const [history, setHistory] = useState<string[]>(globalHistoryCache);

  useEffect(() => {
    try {
      if (Platform.OS === 'web' && typeof window !== 'undefined') {
        const saved = localStorage.getItem(STORAGE_KEY);
        if (saved) {
          const parsed = JSON.parse(saved);
          globalHistoryCache = parsed;
          setHistory(parsed);
        }
      }
    } catch (e) {
      console.error('Failed to load search history:', e);
    }
  }, []);

  const addSearch = (query: string) => {
    if (!query || !query.trim()) return;
    const cleanQuery = query.trim();

    const filtered = globalHistoryCache.filter(
      (item) => item.toLowerCase() !== cleanQuery.toLowerCase()
    );
    const updated = [cleanQuery, ...filtered].slice(0, 20);

    globalHistoryCache = updated;
    setHistory([...updated]);

    try {
      if (Platform.OS === 'web' && typeof window !== 'undefined') {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
      }
    } catch (e) {
      console.error('Failed to save search history:', e);
    }
  };

  const clearHistory = () => {
    globalHistoryCache = [];
    setHistory([]);
    try {
      if (Platform.OS === 'web' && typeof window !== 'undefined') {
        localStorage.removeItem(STORAGE_KEY);
      }
    } catch (e) {
      console.error('Failed to clear search history:', e);
    }
  };

  return (
    <SearchHistoryContext.Provider value={{ history, addSearch, clearHistory }}>
      {children}
    </SearchHistoryContext.Provider>
  );
}

export function useSearchHistory() {
  return useContext(SearchHistoryContext);
}