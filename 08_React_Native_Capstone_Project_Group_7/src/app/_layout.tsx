import { useMemo, useState } from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { MD3DarkTheme, MD3LightTheme, PaperProvider } from 'react-native-paper';
import {
  Poppins_400Regular,
  Poppins_600SemiBold,
  Poppins_800ExtraBold,
  useFonts,
} from '@expo-google-fonts/poppins';
import { PhotosProvider } from '@/photos';
import { SearchHistoryProvider } from '@/searchHistory';
import { ThemeModeProvider } from '@/themeMode';

const lightTheme = {
  ...MD3LightTheme,
  roundness: 4,
  colors: {
    ...MD3LightTheme.colors,
    primary: '#0F766E',
    onPrimary: '#FFFFFF',
    primaryContainer: '#CCFBF1',
    onPrimaryContainer: '#042F2E',
    secondary: '#7C3AED',
    secondaryContainer: '#EDE9FE',
    background: '#F0FDFA',
    surface: '#FFFFFF',
    surfaceVariant: '#E2F5F1',
    onSurfaceVariant: '#3F5F5B',
    outline: '#7BA9A3',
  },
};

const darkTheme = {
  ...MD3DarkTheme,
  roundness: 4,
  colors: {
    ...MD3DarkTheme.colors,
    primary: '#2DD4BF',
    onPrimary: '#042F2E',
    primaryContainer: '#115E59',
    onPrimaryContainer: '#CCFBF1',
    secondary: '#A78BFA',
    secondaryContainer: '#3B2A73',
    background: '#071A19',
    surface: '#0E2A28',
    surfaceVariant: '#173F3B',
    onSurfaceVariant: '#A7D3CD',
    outline: '#4E8C85',
  },
};

export default function RootLayout() {
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [fontsLoaded] = useFonts({ Poppins_400Regular, Poppins_600SemiBold, Poppins_800ExtraBold });

  const theme = isDarkMode ? darkTheme : lightTheme;
  const modeValue = useMemo(() => ({ isDarkMode, setIsDarkMode }), [isDarkMode]);

  if (!fontsLoaded) return null;

  return (
    <ThemeModeProvider value={modeValue}>
      <PhotosProvider>
        <SearchHistoryProvider>
          <PaperProvider theme={theme}>
            <StatusBar style={isDarkMode ? 'light' : 'dark'} />
            <Stack
              screenOptions={{
                headerShown: false,
                headerStyle: { backgroundColor: theme.colors.surface },
                headerTintColor: theme.colors.primary,
                headerTitleStyle: { fontWeight: '700', color: theme.colors.onSurface },
                contentStyle: { backgroundColor: theme.colors.background },
              }}
            >
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