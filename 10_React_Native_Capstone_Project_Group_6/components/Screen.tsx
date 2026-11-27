import React, { ReactNode } from 'react';
import { SafeAreaView, StyleSheet } from 'react-native';
import { useAppTheme } from '@/constants/theme';

export function Screen({ children }: { children: ReactNode }) {
  const theme = useAppTheme();
  return (
    <SafeAreaView style={[styles.screen, { backgroundColor: theme.colors.background }]}>
      {children}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
});
