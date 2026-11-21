import { useEffect, useState } from 'react';
import { searchPhotosByLocation, type Photo } from '@/services/geoPhotoService';

// Extra: featured Philippines photos from Pexels, shared by the header and Quick search.
// The request is made once per app session and reused by every component that asks.
const FEATURED_QUERY = 'Philippines';

let featuredRequest: Promise<Photo[]> | null = null;

const shuffle = (items: Photo[]) => {
  const copy = [...items];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
};

export function useFeaturedPhotos() {
  const [featured, setFeatured] = useState<Photo[]>([]);

  useEffect(() => {
    let cancelled = false;

    const request =
      featuredRequest ??
      searchPhotosByLocation(FEATURED_QUERY).then((results) => {
        // If Pexels couldn't be reached, allow a fresh try next time.
        if (results.length === 0) {
          featuredRequest = null;
        }
        return shuffle(results);
      });
    featuredRequest = request;

    request.then((results) => {
      if (!cancelled) {
        setFeatured(results);
      }
    });

    return () => {
      cancelled = true;
    };
  }, []);

  return featured;
}