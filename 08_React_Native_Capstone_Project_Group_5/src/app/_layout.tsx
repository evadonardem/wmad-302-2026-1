import { useState } from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { MD3DarkTheme, MD3LightTheme, PaperProvider } from 'react-native-paper';
import { PhotosProvider } from '@/photos';
import { SearchHistoryProvider } from '@/searchHistory';
import { ThemeModeProvider } from '@/themeMode';

// PH NAVYRA brand palette: deep teal as the main colour, warm gold as the accent
const lightTheme = {
  ...MD3LightTheme,
  roundness: 4,
  colors: {
    ...MD3LightTheme.colors,
    primary: '#0B7A75',
    onPrimary: '#FFFFFF',
    primaryContainer: '#CFEFEA',
    onPrimaryContainer: '#00201E',
    secondary: '#F4B63F',
    onSecondary: '#1B2A2E',
    secondaryContainer: '#FFE7B0',
    onSecondaryContainer: '#3B2A00',
    background: '#F3F8F8',
    surface: '#FFFFFF',
    onSurface: '#14292C',
    surfaceVariant: '#DCEBEA',
    onSurfaceVariant: '#3F5654',
    outline: '#7A9391',
    outlineVariant: '#C5D8D6',
    elevation: {
      level0: 'transparent',
      level1: '#F7FBFA',
      level2: '#F1F8F7',
      level3: '#EBF5F4',
      level4: '#E8F3F2',
      level5: '#E3F0EF',
    },
  },
};

const darkTheme = {
  ...MD3DarkTheme,
  roundness: 4,
  colors: {
    ...MD3DarkTheme.colors,
    primary: '#4DD0C8',
    onPrimary: '#003735',
    primaryContainer: '#00504C',
    onPrimaryContainer: '#9CF1EA',
    secondary: '#F4B63F',
    onSecondary: '#1B2A2E',
    secondaryContainer: '#4D3A00',
    onSecondaryContainer: '#FFE7B0',
    background: '#0E1A1F',
    surface: '#15272E',
    onSurface: '#E3EEEE',
    surfaceVariant: '#223B40',
    onSurfaceVariant: '#B5CBC9',
    outline: '#7F9997',
    outlineVariant: '#33504F',
    elevation: {
      level0: 'transparent',
      level1: '#183037',
      level2: '#1B353C',
      level3: '#1E3A42',
      level4: '#203D45',
      level5: '#234149',
    },
  },
};

export default function RootLayout() {
  const [isDarkMode, setIsDarkMode] = useState(false);

  // Dynamic Paper theme configuration (MD3 light/dark palettes, app-wide)
  const theme = isDarkMode ? darkTheme : lightTheme;

  return (
    <ThemeModeProvider value={{ isDarkMode, setIsDarkMode }}>
      <PhotosProvider>
        <SearchHistoryProvider>
          <PaperProvider theme={theme}>
            <StatusBar style={isDarkMode ? 'light' : 'dark'} />
            <Stack screenOptions={{
              headerShown: false,
              headerStyle: { backgroundColor: theme.colors.surface },
              headerTintColor: theme.colors.onSurface,
              headerTitleStyle: { color: theme.colors.onSurface },
            }}>
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