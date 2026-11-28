/**
 * Add-to-cart animation: the product image flies in an arc from the tapped
 * button to the Cart tab, with a haptic tap and (optionally) the theme sound.
 * Wrap the signed-in app with <FlyToCartProvider> and call `useFlyToCart()`.
 */
import React, { createContext, ReactNode, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { Image, StyleSheet, useWindowDimensions, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, {
  Easing,
  runOnJS,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import { useSettings } from '@/context/SettingsContext';
import { haptic, playSeasonSound } from '@/services/feedback';

export interface Point {
  x: number;
  y: number;
}

interface Flight {
  id: number;
  image: string;
  from: Point;
}

type FlyFn = (image: string, from?: Point) => void;

/** Outside the provider (e.g. in tests) flying is a no-op. */
const FlyToCartContext = createContext<FlyFn>(() => undefined);

const SIZE = 56;

function FlyingImage({ flight, target, onDone }: { flight: Flight; target: Point; onDone: (id: number) => void }) {
  const progress = useSharedValue(0);

  useEffect(() => {
    progress.value = withTiming(1, { duration: 650, easing: Easing.inOut(Easing.quad) }, (finished) => {
      if (finished) runOnJS(onDone)(flight.id);
    });
  }, [flight.id, onDone, progress]);

  const style = useAnimatedStyle(() => {
    const p = progress.value;
    const x = flight.from.x + (target.x - flight.from.x) * p;
    // Parabolic arc that rises 120px above the straight line
    const y = flight.from.y + (target.y - flight.from.y) * p - Math.sin(p * Math.PI) * 120;
    return {
      opacity: 1 - p * 0.4,
      transform: [{ translateX: x - SIZE / 2 }, { translateY: y - SIZE / 2 }, { scale: 1 - p * 0.65 }, { rotate: `${p * 360}deg` }],
    };
  });

  return (
    <Animated.View style={[styles.flyer, style]}>
      <Image source={{ uri: flight.image }} style={styles.image} resizeMode="contain" />
    </Animated.View>
  );
}

export function FlyToCartProvider({ children }: { children: ReactNode }) {
  const { width, height } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const { settings, season } = useSettings();
  const reduceMotion = useReducedMotion();
  const [flights, setFlights] = useState<Flight[]>([]);
  const nextId = useRef(0);

  // Cart is the 4th of 5 tabs
  const target = useMemo(() => ({ x: width * 0.7, y: height - insets.bottom - 30 }), [width, height, insets.bottom]);

  const fly = useCallback<FlyFn>(
    (image, from) => {
      haptic('light');
      if (settings.sounds) playSeasonSound(season);
      if (reduceMotion || !image) return;
      nextId.current += 1;
      const start = from ?? { x: width / 2, y: height / 2 };
      setFlights((prev) => [...prev.slice(-3), { id: nextId.current, image, from: start }]);
    },
    [settings.sounds, season, reduceMotion, width, height]
  );

  const finish = useCallback((id: number) => setFlights((prev) => prev.filter((flight) => flight.id !== id)), []);

  return (
    <FlyToCartContext.Provider value={fly}>
      {children}
      <View style={StyleSheet.absoluteFill} pointerEvents="none">
        {flights.map((flight) => (
          <FlyingImage key={flight.id} flight={flight} target={target} onDone={finish} />
        ))}
      </View>
    </FlyToCartContext.Provider>
  );
}

export function useFlyToCart(): FlyFn {
  return useContext(FlyToCartContext);
}

const styles = StyleSheet.create({
  flyer: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: SIZE,
    height: SIZE,
    borderRadius: SIZE / 2,
    backgroundColor: '#FFFFFF',
    padding: 6,
    shadowColor: '#000',
    shadowOpacity: 0.25,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 3 },
    elevation: 6,
  },
  image: {
    width: '100%',
    height: '100%',
  },
});
