import React, { useEffect, useRef } from 'react';
import { Animated, Easing, Image, View } from 'react-native';
import { Recipe } from '@/types/recipe';
import { styles } from './floatingRecipePhotosStyles';

interface FloatingRecipePhotosProps {
  recipes: Recipe[];
  compact?: boolean;
}

const photoStyles = [
  styles.photoOne,
  styles.photoTwo,
  styles.photoThree,
] as const;
const compactPhotoStyles = [
  styles.photoOneCompact,
  styles.photoTwoCompact,
  styles.photoThreeCompact,
] as const;

export function FloatingRecipePhotos({ recipes, compact = false }: FloatingRecipePhotosProps) {
  const motionValues = useRef([
    new Animated.Value(0),
    new Animated.Value(0),
    new Animated.Value(0),
  ]).current;

  useEffect(() => {
    const animations = motionValues.map((motion, index) => {
      const duration = 2200 + index * 250;
      const animation = Animated.loop(
        Animated.sequence([
          Animated.delay(index * 280),
          Animated.timing(motion, {
            toValue: 1,
            duration,
            easing: Easing.inOut(Easing.sin),
            useNativeDriver: true,
            isInteraction: false,
          }),
          Animated.timing(motion, {
            toValue: 0,
            duration,
            easing: Easing.inOut(Easing.sin),
            useNativeDriver: true,
            isInteraction: false,
          }),
        ])
      );
      animation.start();
      return animation;
    });

    return () => animations.forEach((animation) => animation.stop());
  }, [motionValues]);

  return (
    <View
      pointerEvents="none"
      style={[styles.collage, compact ? styles.collageCompact : styles.collageWide]}
    >
      {recipes.slice(0, 3).map((recipe, index) => {
        const motion = motionValues[index];
        if (!motion) return null;

        return (
          <Animated.View
            key={recipe.id}
            style={[
              styles.photo,
              photoStyles[index],
              compact && compactPhotoStyles[index],
              {
                transform: [
                  {
                    translateY: motion.interpolate({
                      inputRange: [0, 1],
                      outputRange: [0, index % 2 === 0 ? -9 : 9],
                    }),
                  },
                  {
                    rotate: motion.interpolate({
                      inputRange: [0, 1],
                      outputRange: ['-4deg', '4deg'],
                    }),
                  },
                ],
              },
            ]}
          >
            <Image
              accessible={false}
              source={{ uri: recipe.image }}
              style={styles.photoImage}
              resizeMode="cover"
            />
          </Animated.View>
        );
      })}
    </View>
  );
}

