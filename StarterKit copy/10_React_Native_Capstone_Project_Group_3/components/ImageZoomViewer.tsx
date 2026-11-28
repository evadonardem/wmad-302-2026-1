/**
 * Full-screen photo viewer: pinch to zoom, drag to pan when zoomed, double-tap
 * to zoom in/out, arrows (or swipe when not zoomed) to change photo.
 */
import React, { useEffect } from 'react';
import { Image, Modal, StyleSheet, Text, View } from 'react-native';
import { IconButton } from 'react-native-paper';
import { Gesture, GestureDetector, GestureHandlerRootView } from 'react-native-gesture-handler';
import Animated, { runOnJS, useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';

interface ImageZoomViewerProps {
  images: string[];
  index: number;
  visible: boolean;
  onIndexChange: (index: number) => void;
  onClose: () => void;
}

const MAX_SCALE = 4;

export function ImageZoomViewer({ images, index, visible, onIndexChange, onClose }: ImageZoomViewerProps) {
  const scale = useSharedValue(1);
  const savedScale = useSharedValue(1);
  const translateX = useSharedValue(0);
  const translateY = useSharedValue(0);
  const savedX = useSharedValue(0);
  const savedY = useSharedValue(0);

  // Reset zoom whenever the photo changes or the viewer opens
  useEffect(() => {
    scale.value = 1;
    savedScale.value = 1;
    translateX.value = 0;
    translateY.value = 0;
    savedX.value = 0;
    savedY.value = 0;
  }, [index, visible, scale, savedScale, translateX, translateY, savedX, savedY]);

  const go = (delta: number) => {
    const next = index + delta;
    if (next >= 0 && next < images.length) onIndexChange(next);
  };

  const pinch = Gesture.Pinch()
    .onUpdate((event) => {
      scale.value = Math.min(MAX_SCALE, Math.max(1, savedScale.value * event.scale));
    })
    .onEnd(() => {
      savedScale.value = scale.value;
      if (scale.value <= 1) {
        translateX.value = withTiming(0);
        translateY.value = withTiming(0);
        savedX.value = 0;
        savedY.value = 0;
      }
    });

  const pan = Gesture.Pan()
    .onUpdate((event) => {
      if (scale.value > 1) {
        translateX.value = savedX.value + event.translationX;
        translateY.value = savedY.value + event.translationY;
      }
    })
    .onEnd((event) => {
      if (scale.value > 1) {
        savedX.value = translateX.value;
        savedY.value = translateY.value;
      } else if (Math.abs(event.translationX) > 60) {
        // Swipe to the next / previous photo when not zoomed
        runOnJS(go)(event.translationX < 0 ? 1 : -1);
      } else if (event.translationY > 120) {
        runOnJS(onClose)();
      }
    });

  const doubleTap = Gesture.Tap()
    .numberOfTaps(2)
    .onEnd(() => {
      const zoomIn = scale.value <= 1;
      scale.value = withTiming(zoomIn ? 2.5 : 1);
      savedScale.value = zoomIn ? 2.5 : 1;
      if (!zoomIn) {
        translateX.value = withTiming(0);
        translateY.value = withTiming(0);
        savedX.value = 0;
        savedY.value = 0;
      }
    });

  const imageStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: translateX.value }, { translateY: translateY.value }, { scale: scale.value }],
  }));

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <GestureHandlerRootView style={styles.root}>
        <GestureDetector gesture={Gesture.Simultaneous(pinch, pan, doubleTap)}>
          <Animated.View style={[styles.stage, imageStyle]}>
            <Image source={{ uri: images[index] }} style={styles.image} resizeMode="contain" accessibilityIgnoresInvertColors />
          </Animated.View>
        </GestureDetector>
        <IconButton icon="close" iconColor="#FFFFFF" size={28} style={styles.close} onPress={onClose} accessibilityLabel="Close photo" />
        {images.length > 1 && (
          <View style={styles.footer}>
            <IconButton icon="chevron-left" iconColor="#FFFFFF" disabled={index === 0} onPress={() => go(-1)} accessibilityLabel="Previous photo" />
            <Text style={styles.counter}>
              {index + 1} / {images.length}
            </Text>
            <IconButton
              icon="chevron-right"
              iconColor="#FFFFFF"
              disabled={index === images.length - 1}
              onPress={() => go(1)}
              accessibilityLabel="Next photo"
            />
          </View>
        )}
        <Text style={styles.hint}>Pinch or double-tap to zoom</Text>
      </GestureHandlerRootView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.94)',
  },
  stage: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  image: {
    width: '100%',
    height: '80%',
  },
  close: {
    position: 'absolute',
    top: 36,
    right: 12,
  },
  footer: {
    position: 'absolute',
    bottom: 40,
    alignSelf: 'center',
    flexDirection: 'row',
    alignItems: 'center',
  },
  counter: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
    marginHorizontal: 8,
  },
  hint: {
    position: 'absolute',
    bottom: 16,
    alignSelf: 'center',
    color: 'rgba(255, 255, 255, 0.6)',
    fontSize: 12,
  },
});
