import { Stack } from 'expo-router';
import { PaperProvider } from 'react-native-paper';
import { SearchHistoryProvider } from '@/searchHistory';
import { ThemeModeProvider, useThemeMode } from '@/themeMode';
import { PhotosProvider } from '@/photos';

function RootLayoutNav() {
  const { paperTheme } = useThemeMode();

  return (
    <PaperProvider theme={paperTheme}>
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="history" options={{ headerShown: false }} />
      </Stack>
    </PaperProvider>
  );
}

export default function RootLayout() {
  return (
    <ThemeModeProvider>
      <PhotosProvider>
        <SearchHistoryProvider>
          <RootLayoutNav />
        </SearchHistoryProvider>
      </PhotosProvider>
    </ThemeModeProvider>
  );
}