import { useEffect, useState } from 'react';
import { Stack } from 'expo-router';
import { PaperProvider } from 'react-native-paper';
import { SearchHistoryProvider } from '@/searchHistory';
import { ThemeModeProvider, useThemeMode } from '@/themeMode';
import { PhotosProvider } from '@/photos';

function AppContent() {
  const { paperTheme } = useThemeMode();

  return (
    <PaperProvider theme={paperTheme}>
      <Stack screenOptions={{ headerShown: false }} />
    </PaperProvider>
  );
}

export default function RootLayout() {
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  if (!isMounted) {
    return null;
  }

  return (
    <ThemeModeProvider>
      <PhotosProvider>
        <SearchHistoryProvider>
          <AppContent />
        </SearchHistoryProvider>
      </PhotosProvider>
    </ThemeModeProvider>
  );
}