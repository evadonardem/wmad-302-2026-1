import AsyncStorage from '@react-native-async-storage/async-storage';
import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import type { Photo } from '@/services/geoPhotoService';

const FAVORITES_STORAGE_KEY = '@lakbay-ph/favorites';

type FavoritesValue = {
  favorites: Photo[];
  isFavorite: (photoId: number) => boolean;
  toggleFavorite: (photo: Photo) => void;
};

const FavoritesContext = createContext<FavoritesValue>({
  favorites: [],
  isFavorite: () => false,
  toggleFavorite: () => {},
});

export function FavoritesProvider({ children }: { children: ReactNode }) {
  const [favorites, setFavorites] = useState<Photo[]>([]);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    const loadFavorites = async () => {
      try {
        const storedFavorites = await AsyncStorage.getItem(FAVORITES_STORAGE_KEY);
        if (storedFavorites) setFavorites(JSON.parse(storedFavorites) as Photo[]);
      } catch (error) {
        console.warn('Unable to load favorite photos.', error);
      } finally {
        setHydrated(true);
      }
    };

    void loadFavorites();
  }, []);

  useEffect(() => {
    if (!hydrated) return;

    void AsyncStorage.setItem(FAVORITES_STORAGE_KEY, JSON.stringify(favorites)).catch((error) => {
      console.warn('Unable to save favorite photos.', error);
    });
  }, [favorites, hydrated]);

  const isFavorite = (photoId: number) => favorites.some((photo) => photo.id === photoId);

  const toggleFavorite = (photo: Photo) => {
    setFavorites((currentFavorites) =>
      currentFavorites.some((favorite) => favorite.id === photo.id)
        ? currentFavorites.filter((favorite) => favorite.id !== photo.id)
        : [...currentFavorites, photo],
    );
  };

  return (
    <FavoritesContext.Provider value={{ favorites, isFavorite, toggleFavorite }}>
      {children}
    </FavoritesContext.Provider>
  );
}

export const useFavorites = () => useContext(FavoritesContext);
