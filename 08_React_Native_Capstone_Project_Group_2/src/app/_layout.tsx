import { useState } from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { MD3DarkTheme, MD3LightTheme, PaperProvider } from 'react-native-paper';
import { PhotosProvider } from '@/photos';
import { SearchHistoryProvider } from '@/searchHistory';
import { ThemeModeProvider } from '@/themeMode';

export default function RootLayout() {
  const [isDarkMode, setIsDarkMode] = useState(false);

  const baseTheme = isDarkMode ? MD3DarkTheme : MD3LightTheme;
  const theme = {
    ...baseTheme,
    colors: {
      ...baseTheme.colors,
      primary: isDarkMode ? '#F6B94A' : '#E58B2A',
      onPrimary: '#261A0B',
      primaryContainer: isDarkMode ? '#5D421A' : '#FFE4B8',
      onPrimaryContainer: isDarkMode ? '#FFE4B8' : '#4A2A05',
      secondary: isDarkMode ? '#86C8B2' : '#167D68',
      secondaryContainer: isDarkMode ? '#1D4B40' : '#C9F0E3',
      background: isDarkMode ? '#101B1A' : '#F7F9F5',
      surface: isDarkMode ? '#162422' : '#FFFFFF',
      surfaceVariant: isDarkMode ? '#263A36' : '#E8EFEB',
    },
  };

  return (
    <ThemeModeProvider value={{ isDarkMode, setIsDarkMode }}>
      <PhotosProvider>
        <SearchHistoryProvider>
          <PaperProvider theme={theme}>
            <StatusBar style={isDarkMode ? 'light' : 'dark'} />
            <Stack screenOptions={{ headerShown: false }}>
              <Stack.Screen name="(tabs)" />
              {/* The photo detail route opens as a modal with the native header providing Back */}
              <Stack.Screen
                name="photo/[id]"
                options={{ headerShown: true, presentation: 'modal', title: 'Tourist Spot' }}
              />
              {/* Recent searches screen pushes over the tabs with its own native header */}
              <Stack.Screen name="history" options={{ headerShown: true, title: 'Recent Searches' }} />
            </Stack>
          </PaperProvider>
        </SearchHistoryProvider>
      </PhotosProvider>
    </ThemeModeProvider>
  );
}
