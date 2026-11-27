import React, { ReactNode } from 'react';
import { SafeAreaView, StyleSheet, View } from 'react-native';
import { useSegments } from 'expo-router';
import { useAppTheme } from '@/constants/theme';

export function Screen({ children }: { children: ReactNode }) {
  const theme = useAppTheme();
  const segments = useSegments();
  const hasTabBar = segments.includes('(tabs)');

  return (
    <SafeAreaView
      style={[
        styles.screen,
        { backgroundColor: hasTabBar ? 'transparent' : theme.colors.background },
      ]}
    >
      <View
        style={[
          styles.content,
          {
            backgroundColor: theme.colors.background,
            marginBottom: hasTabBar ? 84 : 0,
          },
        ]}
      >
        {children}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  content: { flex: 1 },
});
