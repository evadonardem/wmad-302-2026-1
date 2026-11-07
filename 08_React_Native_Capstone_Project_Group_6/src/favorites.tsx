import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import type { Photo } from '@/services/geoPhotoService';

const FAVORITES_KEY = 'lakbay:favorites';
const LIKES_KEY = 'lakbay:liked-photos';

type FavoritesValue = {
  favorites: Photo[];
  likedPhotos: Photo[];
  toggleFavorite: (photo: Photo) => void;
  toggleLike: (photo: Photo) => void;
};

const FavoritesContext = createContext<FavoritesValue>({
  favorites: [],
  likedPhotos: [],
  toggleFavorite: () => {},
  toggleLike: () => {},
});

const readPhotos = async (key: string): Promise<Photo[]> => {
  const value = await AsyncStorage.getItem(key);
  if (!value) return [];
  const parsed: unknown = JSON.parse(value);
  if (
    !Array.isArray(parsed) ||
    !parsed.every(
      (photo): photo is Photo =>
        typeof photo === 'object' &&
        photo !== null &&
        'id' in photo &&
        typeof photo.id === 'number' &&
        'imageUrl' in photo &&
        typeof photo.imageUrl === 'string' &&
        'photographer' in photo &&
        typeof photo.photographer === 'string' &&
        'photographerUrl' in photo &&
        typeof photo.photographerUrl === 'string' &&
        'altText' in photo &&
        typeof photo.altText === 'string',
    )
  ) {
    throw new Error(`Saved photo data for ${key} is invalid.`);
  }
  return parsed;
};

export function FavoritesProvider({ children }: { children: ReactNode }) {
  const [favorites, setFavorites] = useState<Photo[]>([]);
  const [likedPhotos, setLikedPhotos] = useState<Photo[]>([]);

  useEffect(() => {
    let active = true;
    Promise.all([readPhotos(FAVORITES_KEY), readPhotos(LIKES_KEY)])
      .then(([savedFavorites, savedLikes]) => {
        if (active) {
          setFavorites(savedFavorites);
          setLikedPhotos(savedLikes);
        }
      })
      .catch((error: unknown) => {
        console.error('Unable to load saved photos:', error);
      });
    return () => {
      active = false;
    };
  }, []);

  const toggleCollection = useCallback(
    (photo: Photo, collection: Photo[], setCollection: (photos: Photo[]) => void, key: string) => {
      const exists = collection.some((item) => item.id === photo.id);
      const next = exists
        ? collection.filter((item) => item.id !== photo.id)
        : [photo, ...collection];
      setCollection(next);
      AsyncStorage.setItem(key, JSON.stringify(next)).catch((error: unknown) => {
        console.error(`Unable to save photos to ${key}:`, error);
      });
    },
    [],
  );

  const toggleFavorite = useCallback(
    (photo: Photo) => toggleCollection(photo, favorites, setFavorites, FAVORITES_KEY),
    [favorites, toggleCollection],
  );
  const toggleLike = useCallback(
    (photo: Photo) => toggleCollection(photo, likedPhotos, setLikedPhotos, LIKES_KEY),
    [likedPhotos, toggleCollection],
  );

  const value = useMemo(
    () => ({ favorites, likedPhotos, toggleFavorite, toggleLike }),
    [favorites, likedPhotos, toggleFavorite, toggleLike],
  );

  return <FavoritesContext.Provider value={value}>{children}</FavoritesContext.Provider>;
}

export const useFavorites = () => useContext(FavoritesContext);
