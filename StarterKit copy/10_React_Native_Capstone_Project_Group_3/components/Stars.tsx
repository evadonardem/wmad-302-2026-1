/**
 * Star rating display and input
 */
import React from 'react';
import { TouchableOpacity, View } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useAppTheme } from '@/context/SettingsContext';

export function Stars({ rating, size = 16 }: { rating: number; size?: number }) {
  const { palette } = useAppTheme();
  return (
    <View style={{ flexDirection: 'row' }} accessibilityLabel={`Rated ${rating.toFixed(1)} out of 5`}>
      {[1, 2, 3, 4, 5].map((star) => (
        <MaterialCommunityIcons
          key={star}
          name={rating >= star ? 'star' : rating >= star - 0.5 ? 'star-half-full' : 'star-outline'}
          size={size}
          color={palette.gold}
        />
      ))}
    </View>
  );
}

interface StarRatingInputProps {
  value: number;
  onChange: (value: number) => void;
  size?: number;
}

export function StarRatingInput({ value, onChange, size = 32 }: StarRatingInputProps) {
  const { palette } = useAppTheme();
  return (
    <View style={{ flexDirection: 'row', gap: 4 }} accessibilityRole="adjustable" accessibilityValue={{ min: 0, max: 5, now: value }}>
      {[1, 2, 3, 4, 5].map((star) => (
        <TouchableOpacity
          key={star}
          onPress={() => onChange(star)}
          accessibilityRole="button"
          accessibilityLabel={`${star} star${star > 1 ? 's' : ''}`}
        >
          <MaterialCommunityIcons
            name={value >= star ? 'star' : 'star-outline'}
            size={size}
            color={palette.gold}
          />
        </TouchableOpacity>
      ))}
    </View>
  );
}
