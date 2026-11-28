/**
 * Receipt PDF: rendered with expo-print and shared with expo-sharing on
 * iOS/Android; on web the browser's print dialog opens ("Save as PDF").
 */
import { Platform } from 'react-native';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import type { Order } from '@/types/account';
import { buildReceiptHtml } from '@/utils/receipt';

export async function shareReceipt(order: Order, accent: string, emoji?: string): Promise<void> {
  const html = buildReceiptHtml(order, accent, emoji);
  if (Platform.OS === 'web') {
    await Print.printAsync({ html });
    return;
  }
  const { uri } = await Print.printToFileAsync({ html });
  if (await Sharing.isAvailableAsync()) {
    await Sharing.shareAsync(uri, { mimeType: 'application/pdf', dialogTitle: `Receipt #${order.cartId}`, UTI: 'com.adobe.pdf' });
  } else {
    await Print.printAsync({ uri });
  }
}
