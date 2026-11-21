import { useEffect, useState } from 'react';
import {
  getAllCitiesMunicipalities,
  getProvinces,
  getRegions,
  toSearchName,
} from '@/services/geoPhotoService';

// Extra: a searchable list of every Philippine city and municipality (from PSGC),
// shared by Quick search autocomplete and the Compare screen.
// Downloaded once per app session; every component reuses the same request.
export type PlaceEntry = {
  code: string;
  name: string; // PSGC name, e.g. "City of Baguio"
  displayName: string; // friendly name, e.g. "Baguio City"
  isCity: boolean;
  province?: string;
  regionName?: string;
  regionCode: string;
  islandGroupCode?: string;
};

let indexRequest: Promise<PlaceEntry[]> | null = null;

const buildIndex = async (): Promise<PlaceEntry[]> => {
  const [cities, provinces, regions] = await Promise.all([
    getAllCitiesMunicipalities(),
    getProvinces(),
    getRegions(),
  ]);

  const provinceNames = new Map(provinces.map((province) => [province.code, province.name]));
  const regionsByCode = new Map(regions.map((region) => [region.code, region]));

  return cities
    .map((city) => {
      const region = regionsByCode.get(city.regionCode);
      return {
        code: city.code,
        name: city.name,
        displayName: toSearchName(city.name),
        isCity: city.isCity,
        province:
          typeof city.provinceCode === 'string' ? provinceNames.get(city.provinceCode) : 'Metro Manila',
        regionName: region?.name,
        regionCode: city.regionCode,
        islandGroupCode: city.islandGroupCode ?? region?.islandGroupCode,
      };
    })
    .sort((a, b) => a.displayName.localeCompare(b.displayName));
};

// Best matches first: name starts with the text, then a word starts with it, then contains it.
export const searchPlaces = (places: PlaceEntry[], query: string, limit = 6) => {
  const q = query.trim().toLowerCase();
  if (q.length < 2) return [];

  const scored: { place: PlaceEntry; score: number }[] = [];
  for (const place of places) {
    const display = place.displayName.toLowerCase();
    let score = -1;
    if (display.startsWith(q)) score = 0;
    else if (display.split(/[\s-]+/).some((word) => word.startsWith(q))) score = 1;
    else if (display.includes(q) || place.name.toLowerCase().includes(q)) score = 2;
    if (score >= 0) scored.push({ place, score });
  }

  return scored
    .sort(
      (a, b) =>
        a.score - b.score ||
        Number(b.place.isCity) - Number(a.place.isCity) ||
        a.place.displayName.length - b.place.displayName.length
    )
    .slice(0, limit)
    .map((item) => item.place);
};

// Exact match by friendly or PSGC name (case-insensitive), for text typed without picking a suggestion.
export const findPlace = (places: PlaceEntry[], text: string) => {
  const t = text.trim().toLowerCase();
  if (!t) return null;
  return (
    places.find((place) => place.displayName.toLowerCase() === t || place.name.toLowerCase() === t) ?? null
  );
};

export function usePlaceIndex() {
  const [places, setPlaces] = useState<PlaceEntry[]>([]);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let cancelled = false;

    const request =
      indexRequest ??
      buildIndex().then((entries) => {
        // If PSGC couldn't be reached, allow a fresh try next time.
        if (entries.length === 0) {
          indexRequest = null;
        }
        return entries;
      });
    indexRequest = request;

    request.then((entries) => {
      if (!cancelled) {
        setPlaces(entries);
        setReady(true);
      }
    });

    return () => {
      cancelled = true;
    };
  }, []);

  return { places, ready };
}
