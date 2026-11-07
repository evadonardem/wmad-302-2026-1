import { Platform } from 'react-native';
import * as WebBrowser from 'expo-web-browser';
import type { Photo } from '@/services/geoPhotoService';
import { shareText } from '@/utils/shareText';

// Extra: Download and Share actions for a single photo.

// Pexels' official download link for a photo (redirects to the full-size file).
const pexelsDownloadUrl = (photo: Photo) => `https://www.pexels.com/photo/${photo.id}/download/`;

export async function downloadPhoto(photo: Photo): Promise<'downloaded' | 'opened' | 'failed'> {
  const fileName = `lakbay-ph-${photo.id}.jpg`;

  try {
    if (Platform.OS === 'web') {
      try {
        // Fetch the image and save it as a real file via a temporary download link.
        const response = await fetch(photo.imageUrl);
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        const blob = await response.blob();
        const objectUrl = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = objectUrl;
        link.download = fileName;
        document.body.appendChild(link);
        link.click();
        link.remove();
        setTimeout(() => URL.revokeObjectURL(objectUrl), 1000);
        return 'downloaded';
      } catch (error) {
        // If the browser blocks the direct download, open Pexels' download page instead.
        console.warn('Direct download failed, opening Pexels instead:', error);
        window.open(pexelsDownloadUrl(photo), '_blank', 'noopener');
        return 'opened';
      }
    }

    // Phones: open Pexels' download page in the in-app browser (no extra native packages needed).
    await WebBrowser.openBrowserAsync(pexelsDownloadUrl(photo));
    return 'opened';
  } catch (error) {
    console.error('Download failed:', error);
    return 'failed';
  }
}

export function sharePhoto(photo: Photo) {
  const message = [
    photo.altText,
    `📸 ${photo.photographer} on Pexels`,
    photo.imageUrl,
    '— shared from Lakbay PH',
  ].join('\n');

  return shareText(message, 'Tourist spot from Lakbay PH');
}
