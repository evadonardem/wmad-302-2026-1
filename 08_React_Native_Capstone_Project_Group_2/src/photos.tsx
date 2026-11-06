import { createContext, useContext, useState, type Dispatch, type ReactNode, type SetStateAction } from 'react';
import type { Photo } from '@/services/geoPhotoService';

// Pre-built shared photo store (not part of the assignment).
// The Search dashboard writes into it and the photo detail screen reads from it
// to power the prev/next viewer — no prop drilling across routes.
type PhotosValue = {
  photos: Photo[];
  setPhotos: Dispatch<SetStateAction<Photo[]>>;
};

const PhotosContext = createContext<PhotosValue>({
  photos: [],
  setPhotos: () => {},
});

export function PhotosProvider({ children }: { children: ReactNode }) {
  const [photos, setPhotos] = useState<Photo[]>([]);

  return <PhotosContext.Provider value={{ photos, setPhotos }}>{children}</PhotosContext.Provider>;
}

export const usePhotos = () => useContext(PhotosContext);
