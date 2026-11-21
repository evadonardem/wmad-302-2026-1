import { Platform, Share } from 'react-native';

// Extra: share plain text with the phone's share sheet.
// On the web, uses the browser's share sheet when available, otherwise copies to the clipboard.
// Returns what happened so the screen can show a short message.
export async function shareText(message: string, title?: string): Promise<'shared' | 'copied' | 'failed'> {
  try {
    if (Platform.OS === 'web') {
      const nav = typeof navigator !== 'undefined' ? navigator : undefined;
      if (nav?.share) {
        await nav.share({ title, text: message });
        return 'shared';
      }
      if (nav?.clipboard) {
        await nav.clipboard.writeText(message);
        return 'copied';
      }
      return 'failed';
    }

    await Share.share({ message, title });
    return 'shared';
  } catch (error) {
    // Closing the share sheet without sharing also lands here on the web.
    console.warn('Share cancelled or failed:', error);
    return 'failed';
  }
}
