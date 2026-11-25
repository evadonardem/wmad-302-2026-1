import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Platform } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useDesignMode } from '@/context/DesignModeContext';

export function DesignModeToggle() {
  const { mode, setMode, isCrimson } = useDesignMode();

  return (
    <View
      style={[
        styles.wrapper,
        isCrimson ? styles.wrapperCrimson : styles.wrapperGlass,
      ]}
    >
      <Text style={[styles.label, { color: isCrimson ? '#CBD5E1' : '#475569' }]}>
        Theme:
      </Text>
      <View
        style={[
          styles.pillGroup,
          {
            backgroundColor: isCrimson ? 'rgba(10, 10, 15, 0.85)' : 'rgba(226, 232, 240, 0.75)',
            borderColor: isCrimson ? 'rgba(255,255,255,0.12)' : 'rgba(255,255,255,0.9)',
          },
        ]}
      >
        <TouchableOpacity
          onPress={() => setMode('glass')}
          activeOpacity={0.85}
          style={[
            styles.optionBtn,
            mode === 'glass' && styles.optionBtnGlassActive,
          ]}
        >
          <MaterialCommunityIcons
            name="weather-sunny"
            size={14}
            color={mode === 'glass' ? '#1E293B' : '#94A3B8'}
          />
          <Text
            style={[
              styles.optionText,
              { color: mode === 'glass' ? '#1E293B' : '#94A3B8' },
            ]}
          >
            Glass
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => setMode('crimson')}
          activeOpacity={0.85}
          style={[
            styles.optionBtn,
            mode === 'crimson' && styles.optionBtnCrimsonActive,
          ]}
        >
          <MaterialCommunityIcons
            name="fire"
            size={14}
            color={mode === 'crimson' ? '#FFFFFF' : isCrimson ? '#94A3B8' : '#64748B'}
          />
          <Text
            style={[
              styles.optionText,
              {
                color:
                  mode === 'crimson'
                    ? '#FFFFFF'
                    : isCrimson
                      ? '#94A3B8'
                      : '#64748B',
              },
            ]}
          >
            Crimson
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 14,
    borderWidth: 1,
    gap: 8,
    ...(Platform.OS === 'web'
      ? ({ backdropFilter: 'blur(16px)', WebkitBackdropFilter: 'blur(16px)' } as object)
      : {}),
  },
  wrapperGlass: {
    backgroundColor: 'rgba(255, 255, 255, 0.78)',
    borderColor: 'rgba(255, 255, 255, 0.95)',
  },
  wrapperCrimson: {
    backgroundColor: 'rgba(18, 18, 26, 0.86)',
    borderColor: 'rgba(225, 29, 72, 0.48)',
  },
  label: {
    fontSize: 12,
    fontWeight: '700',
  },
  pillGroup: {
    flexDirection: 'row',
    borderRadius: 10,
    padding: 2,
    borderWidth: 1,
  },
  optionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  optionBtnGlassActive: {
    backgroundColor: '#FBBF24',
  },
  optionBtnCrimsonActive: {
    backgroundColor: '#E11D48',
  },
  optionText: {
    fontSize: 12,
    fontWeight: '800',
  },
});
