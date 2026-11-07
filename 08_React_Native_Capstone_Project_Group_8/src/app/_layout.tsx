
import React, { useState } from 'react';

import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';

import {
  MD3DarkTheme,
  MD3LightTheme,
  PaperProvider,
} from 'react-native-paper';

import { PhotosProvider } from '@/photos';
import { SearchHistoryProvider } from '@/searchHistory';
import { ThemeModeProvider } from '@/themeMode';

export default function RootLayout() {
  const [isDarkMode, setIsDarkMode] = useState(false);

  // ======================================
  // DYNAMIC PAPER THEME
  // ======================================

  const theme = isDarkMode
    ? MD3DarkTheme
    : MD3LightTheme;

  // ======================================
  // EMERALD HEADER COLORS
  // ======================================

  const headerBackground = isDarkMode
    ? '#064332'
    : '#D8F3DC';

  const headerText = isDarkMode
    ? '#6EE7B7'
    : '#0D6B50';

  const headerBorder = isDarkMode
    ? '#176B50'
    : '#B7E4C7';

  const headerTint = isDarkMode
    ? '#6EE7B7'
    : '#0D6B50';

  return (
    <ThemeModeProvider
      value={{ isDarkMode, setIsDarkMode }}
    >
      <PhotosProvider>
        <SearchHistoryProvider>
          <PaperProvider theme={theme}>
            <StatusBar
  style={isDarkMode ? 'light' : 'dark'}
/>

            <Stack
              screenOptions={{
                headerShown: false,
              }}
            >
              {/* MAIN TABS NAVIGATION */}

              <Stack.Screen
                name="(tabs)"
              />

              {/* PHOTO DETAIL SCREEN */}

              <Stack.Screen
                name="photo/[id]"
                options={{
                  headerShown: true,
                  presentation: 'modal',
                  title: 'Tourist Spot',

                  headerStyle: {
                    backgroundColor: headerBackground,
                  },

                  headerTintColor: headerTint,

                  headerTitleStyle: {
                    color: headerText,
                    fontWeight: '800',
                    fontSize: 18,
                  },

                  headerShadowVisible: false,

                  headerBackTitle: 'Back',
                }}
              />

              {/* RECENT SEARCHES SCREEN */}

              <Stack.Screen
                name="history"
                options={{
                  headerShown: true,
                  title: 'Recent Searches',

                  headerStyle: {
                    backgroundColor: headerBackground,
                  },

                  headerTintColor: headerTint,

                  headerTitleStyle: {
                    color: headerText,
                    fontWeight: '800',
                    fontSize: 18,
                  },

                  headerShadowVisible: false,

                  headerBackTitle: 'Back',
                }}
              />
            </Stack>
          </PaperProvider>
        </SearchHistoryProvider>
      </PhotosProvider>
    </ThemeModeProvider>
  );
}
