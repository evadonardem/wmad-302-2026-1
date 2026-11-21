import { Linking, Platform } from 'react-native';

// Extra: open places in Google Maps.
// Uses Google's public Maps URLs, so no API key is needed. On phones this opens the
// Google Maps app when it's installed, otherwise the browser.

const withCountry = (place: string) => (/philippines/i.test(place) ? place : `${place}, Philippines`);

const openUrl = async (url: string) => {
  try {
    if (Platform.OS === 'web') {
      window.open(url, '_blank', 'noopener');
    } else {
      await Linking.openURL(url);
    }
    return true;
  } catch (error) {
    console.error('Could not open Google Maps:', error);
    return false;
  }
};

// One place, e.g. "Baguio City" → Google Maps search for "Baguio City, Philippines".
export const openInMaps = (place: string) =>
  openUrl(`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(withCountry(place))}`);

// Several places in order → Google Maps directions from the first to the last, stopping at the rest.
export const openRouteInMaps = (places: string[]) => {
  const stops = places.map((place) => place.trim()).filter(Boolean).map(withCountry);
  if (stops.length === 0) return Promise.resolve(false);
  if (stops.length === 1) return openInMaps(stops[0]);

  const origin = encodeURIComponent(stops[0]);
  const destination = encodeURIComponent(stops[stops.length - 1]);
  const middle = stops.slice(1, -1);
  const waypoints = middle.length ? `&waypoints=${encodeURIComponent(middle.join('|'))}` : '';

  return openUrl(
    `https://www.google.com/maps/dir/?api=1&origin=${origin}&destination=${destination}${waypoints}`
  );
};
