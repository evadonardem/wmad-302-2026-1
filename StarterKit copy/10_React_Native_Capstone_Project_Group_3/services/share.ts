/**
 * Sharing helpers: native share sheet on iOS/Android, Web Share API or the
 * clipboard on web. Links open the app via deep links (marketplace://…).
 */
import { Platform, Share } from 'react-native';
import * as Linking from 'expo-linking';
import { encodeShareItems, ShareKind, SharedItem } from '@/utils/share';

/** The parts of the browser Navigator API used for sharing on web. */
interface WebNavigator {
  share?: (data: { title?: string; text?: string; url?: string }) => Promise<void>;
  clipboard?: { writeText: (text: string) => Promise<void> };
}

export type ShareOutcome = 'shared' | 'copied' | 'cancelled';

export async function shareLink(title: string, message: string, url: string): Promise<ShareOutcome> {
  try {
    if (Platform.OS === 'web') {
      const nav = (globalThis as { navigator?: WebNavigator }).navigator;
      if (nav?.share) {
        await nav.share({ title, text: message, url });
        return 'shared';
      }
      if (nav?.clipboard) {
        await nav.clipboard.writeText(`${message} ${url}`);
        return 'copied';
      }
      return 'cancelled';
    }
    await Share.share({ title, message: `${message}\n${url}`, url });
    return 'shared';
  } catch {
    return 'cancelled'; // user closed the share sheet
  }
}

/** Link that opens the Shared screen with these products. */
export function buildSharedListUrl(kind: ShareKind, items: SharedItem[], title?: string): string {
  return Linking.createURL('/shared', {
    queryParams: { kind, items: encodeShareItems(items), ...(title ? { title } : {}) },
  });
}
