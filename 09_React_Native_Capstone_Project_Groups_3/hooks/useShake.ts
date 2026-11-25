/**
 * Calls onShake when the phone is shaken (uses the accelerometer).
 * Does nothing on devices/web without an accelerometer.
 */
import { useEffect, useRef } from 'react';
import { Accelerometer } from 'expo-sensors';

const SHAKE_FORCE = 2.2; // in g; normal movement stays well below this
const COOLDOWN_MS = 1500;

export function useShake(onShake: () => void, enabled = true) {
  const callback = useRef(onShake);
  callback.current = onShake;

  useEffect(() => {
    if (!enabled) return;
    let cancelled = false;
    let subscription: { remove: () => void } | null = null;
    let lastShake = 0;

    Accelerometer.isAvailableAsync()
      .then((available) => {
        if (!available || cancelled) return;
        Accelerometer.setUpdateInterval(150);
        subscription = Accelerometer.addListener(({ x, y, z }) => {
          const force = Math.sqrt(x * x + y * y + z * z);
          const now = Date.now();
          if (force > SHAKE_FORCE && now - lastShake > COOLDOWN_MS) {
            lastShake = now;
            callback.current();
          }
        });
      })
      .catch(() => {
        // No accelerometer - shake is simply not available
      });

    return () => {
      cancelled = true;
      subscription?.remove();
    };
  }, [enabled]);
}
