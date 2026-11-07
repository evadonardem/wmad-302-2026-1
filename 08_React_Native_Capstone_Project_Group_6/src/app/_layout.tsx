import { useState } from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { MD3DarkTheme, MD3LightTheme, PaperProvider } from 'react-native-paper';
import { PhotosProvider } from '@/photos';
import { SearchHistoryProvider } from '@/searchHistory';
import { FavoritesProvider } from '@/favorites';
import { ThemeModeProvider } from '@/themeMode';

export default function RootLayout() {
  const [isDarkMode, setIsDarkMode] = useState(false);

  const lightTheme = {
    ...MD3LightTheme,
    colors: {
      ...MD3LightTheme.colors,
      background: '#ffffff',
      surface: '#ffffff',
      surfaceVariant: '#f3f4f3',
    },
  };
  const darkTheme = {
    ...MD3DarkTheme,
    colors: {
      ...MD3DarkTheme.colors,
      background: '#000000',
      surface: '#000000',
      surfaceVariant: '#111111',
    },
  };
  const theme = isDarkMode ? darkTheme : lightTheme;

  return (
    <ThemeModeProvider value={{ isDarkMode, setIsDarkMode }}>
      <PhotosProvider>
        <SearchHistoryProvider>
          <FavoritesProvider>
            <PaperProvider theme={theme}>
              <StatusBar style={isDarkMode ? 'light' : 'dark'} />
              <Stack screenOptions={{ headerShown: false }}>
                <Stack.Screen name="(tabs)" />
                {/* The photo detail route opens as a modal with the native header providing Back */}
                <Stack.Screen
                  name="photo/[id]"
                  options={{ headerShown: true, presentation: 'modal', title: 'Tourist Spot' }}
                />
                <Stack.Screen name="history" options={{ headerShown: true, title: 'Recent Searches' }} />
                <Stack.Screen name="favorites" />
              </Stack>
            </PaperProvider>
          </FavoritesProvider>
        </SearchHistoryProvider>
      </PhotosProvider>
    </ThemeModeProvider>
  );
}
