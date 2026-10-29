import { useState } from 'react';
import { LogBox, Platform } from 'react-native';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { MD3DarkTheme, MD3LightTheme, PaperProvider } from 'react-native-paper';
import { PhotosProvider } from '@/photos';
import { SearchHistoryProvider } from '@/searchHistory';
import { ThemeModeProvider } from '@/themeMode';

// Suppress web animated driver warnings
if (Platform.OS === 'web') {
  LogBox.ignoreLogs(['Animated: `useNativeDriver` is not supported']);
}

export default function RootLayout() {
  const [isDarkMode, setIsDarkMode] = useState(false);

  // Dynamic Paper theme configuration tailored for green gradients
  const customLightTheme = {
    ...MD3LightTheme,
    colors: {
      ...MD3LightTheme.colors,
      primary: '#176B45',
      secondary: '#2E7D32',
      background: '#E2F1D9',
      surface: '#FFFFFF',
      onBackground: '#0D2D1B',
      onSurface: '#0D2D1B',
    },
  };

  const customDarkTheme = {
    ...MD3DarkTheme,
    colors: {
      ...MD3DarkTheme.colors,
      primary: '#5AA875',
      secondary: '#81C784',
      background: '#071B11',
      surface: '#102D1D',
      onBackground: '#F2F8EE',
      onSurface: '#F2F8EE',
    },
  };

  const theme = isDarkMode ? customDarkTheme : customLightTheme;

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
                options={{
                  headerShown: true,
                  presentation: 'modal',
                  title: 'Tourist Spot',
                  headerStyle: {
                    backgroundColor: isDarkMode ? '#102D1D' : '#176B45',
                  },
                  headerTintColor: '#FFFFFF',
                  headerTitleStyle: {
                    fontWeight: 'bold',
                  },
                }}
              />
              {/* Recent searches screen pushes over the tabs with its own native header */}
              <Stack.Screen
                name="history"
                options={{
                  headerShown: true,
                  title: 'Recent Searches',
                  headerStyle: {
                    backgroundColor: isDarkMode ? '#102D1D' : '#176B45',
                  },
                  headerTintColor: '#FFFFFF',
                  headerTitleStyle: {
                    fontWeight: 'bold',
                  },
                }}
              />
            </Stack>
          </PaperProvider>
        </SearchHistoryProvider>
      </PhotosProvider>
    </ThemeModeProvider>
  );
}