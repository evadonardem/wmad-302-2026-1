/**
 * Fingerprint / Face ID confirmation (expo-local-authentication).
 * Not available on web; on devices without enrolled biometrics the check is skipped.
 */
import { Platform } from 'react-native';
import * as LocalAuthentication from 'expo-local-authentication';

export async function biometricsAvailable(): Promise<boolean> {
  if (Platform.OS === 'web') return false;
  try {
    return (await LocalAuthentication.hasHardwareAsync()) && (await LocalAuthentication.isEnrolledAsync());
  } catch {
    return false;
  }
}

/** Resolves true when confirmed (or when biometrics are unavailable), false when cancelled/failed. */
export async function confirmWithBiometrics(promptMessage: string): Promise<boolean> {
  if (!(await biometricsAvailable())) return true;
  try {
    const result = await LocalAuthentication.authenticateAsync({ promptMessage, fallbackLabel: 'Use passcode' });
    return result.success;
  } catch {
    return false;
  }
}
