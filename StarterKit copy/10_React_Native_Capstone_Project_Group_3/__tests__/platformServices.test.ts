/**
 * Tests for the thin device-service wrappers (biometrics, haptics/sounds,
 * receipt PDF, sharing) with the native modules mocked. Jest runs as iOS.
 */
import { Share } from 'react-native';
import * as LocalAuthentication from 'expo-local-authentication';
import * as Haptics from 'expo-haptics';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import { Audio } from 'expo-av';
import { biometricsAvailable, confirmWithBiometrics } from '@/services/biometrics';
import { haptic, playSeasonSound } from '@/services/feedback';
import { shareReceipt } from '@/services/receipt';
import { buildSharedListUrl, shareLink } from '@/services/share';
import type { Order } from '@/types/account';

jest.mock('expo-local-authentication', () => ({
  hasHardwareAsync: jest.fn(),
  isEnrolledAsync: jest.fn(),
  authenticateAsync: jest.fn(),
}));
jest.mock('expo-haptics', () => ({
  impactAsync: jest.fn(() => Promise.resolve()),
  notificationAsync: jest.fn(() => Promise.resolve()),
  ImpactFeedbackStyle: { Light: 'light' },
  NotificationFeedbackType: { Success: 'success', Warning: 'warning' },
}));
jest.mock('expo-print', () => ({
  printToFileAsync: jest.fn(() => Promise.resolve({ uri: 'file:///receipt.pdf' })),
  printAsync: jest.fn(() => Promise.resolve()),
}));
jest.mock('expo-sharing', () => ({
  isAvailableAsync: jest.fn(() => Promise.resolve(true)),
  shareAsync: jest.fn(() => Promise.resolve()),
}));
jest.mock('expo-av', () => ({ Audio: { Sound: { createAsync: jest.fn() } } }));
jest.mock('expo-linking', () => ({
  createURL: jest.fn((path: string, options?: { queryParams?: Record<string, string> }) => {
    const query = new URLSearchParams(options?.queryParams ?? {}).toString();
    return `marketplace://${path.replace(/^\//, '')}${query ? `?${query}` : ''}`;
  }),
}));

const auth = LocalAuthentication as jest.Mocked<typeof LocalAuthentication>;

beforeEach(() => jest.clearAllMocks());

describe('biometrics', () => {
  it('skips the check when no biometrics are enrolled', async () => {
    auth.hasHardwareAsync.mockResolvedValue(true);
    auth.isEnrolledAsync.mockResolvedValue(false);
    expect(await biometricsAvailable()).toBe(false);
    expect(await confirmWithBiometrics('Confirm')).toBe(true);
    expect(auth.authenticateAsync).not.toHaveBeenCalled();
  });

  it('returns the authentication result', async () => {
    auth.hasHardwareAsync.mockResolvedValue(true);
    auth.isEnrolledAsync.mockResolvedValue(true);
    auth.authenticateAsync.mockResolvedValueOnce({ success: true });
    expect(await confirmWithBiometrics('Confirm')).toBe(true);
    auth.authenticateAsync.mockResolvedValueOnce({ success: false, error: 'user_cancel' });
    expect(await confirmWithBiometrics('Confirm')).toBe(false);
    auth.authenticateAsync.mockRejectedValueOnce(new Error('boom'));
    expect(await confirmWithBiometrics('Confirm')).toBe(false);
  });
});

describe('feedback', () => {
  it('uses impact and notification haptics', () => {
    haptic();
    haptic('success');
    expect(Haptics.impactAsync).toHaveBeenCalledWith('light');
    expect(Haptics.notificationAsync).toHaveBeenCalledWith('success');
  });

  it('plays the season sound and never throws', async () => {
    const sound = { setOnPlaybackStatusUpdate: jest.fn(), unloadAsync: jest.fn(() => Promise.resolve()) };
    (Audio.Sound.createAsync as jest.Mock).mockResolvedValueOnce({ sound });
    await playSeasonSound('halloween');
    expect(Audio.Sound.createAsync).toHaveBeenCalledWith(expect.anything(), expect.objectContaining({ shouldPlay: true }));
    // Unloads after playback finishes
    sound.setOnPlaybackStatusUpdate.mock.calls[0][0]({ isLoaded: true, didJustFinish: true });
    expect(sound.unloadAsync).toHaveBeenCalled();

    (Audio.Sound.createAsync as jest.Mock).mockRejectedValueOnce(new Error('autoplay blocked'));
    await expect(playSeasonSound('lively')).resolves.toBeUndefined();
  });
});

describe('receipt', () => {
  it('renders a PDF and opens the share sheet', async () => {
    const order = {
      id: 'local-1',
      cartId: 7,
      userId: 1,
      source: 'local',
      createdAt: null,
      status: 'placed',
      lines: [],
      totalQuantity: 0,
      subtotal: 0,
      productDiscount: 0,
      couponDiscount: 0,
      shippingFee: 0,
      grandTotal: 0,
    } as Order;
    await shareReceipt(order, '#E91E63');
    expect(Print.printToFileAsync).toHaveBeenCalledWith({ html: expect.stringContaining('Order #7') });
    expect(Sharing.shareAsync).toHaveBeenCalledWith('file:///receipt.pdf', expect.objectContaining({ mimeType: 'application/pdf' }));

    (Sharing.isAvailableAsync as jest.Mock).mockResolvedValueOnce(false);
    await shareReceipt(order, '#E91E63');
    expect(Print.printAsync).toHaveBeenCalledWith({ uri: 'file:///receipt.pdf' });
  });
});

describe('share', () => {
  it('builds shared-list links and opens the native share sheet', async () => {
    const url = buildSharedListUrl('cart', [{ id: 3, quantity: 2 }], 'My cart');
    expect(url).toBe('marketplace://shared?kind=cart&items=3x2&title=My+cart');

    const spy = jest.spyOn(Share, 'share').mockResolvedValueOnce({ action: 'sharedAction' });
    expect(await shareLink('Title', 'Look', url)).toBe('shared');
    expect(spy).toHaveBeenCalledWith(expect.objectContaining({ message: `Look\n${url}` }));

    spy.mockRejectedValueOnce(new Error('dismissed'));
    expect(await shareLink('Title', 'Look', url)).toBe('cancelled');
  });
});
