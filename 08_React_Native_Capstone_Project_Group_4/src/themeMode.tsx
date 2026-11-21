import React, { createContext, useContext, useMemo, useState } from 'react';
import { MD3DarkTheme, MD3LightTheme } from 'react-native-paper';

interface ThemeModeContextType {
  isDarkMode: boolean;
  setIsDarkMode: (val: boolean) => void;
  paperTheme: typeof MD3DarkTheme;
}

const customDarkTheme = {
  ...MD3DarkTheme,
  colors: {
    ...MD3DarkTheme.colors,
    primary: '#00f3ff',
    surface: '#0f172a',
    background: '#0b1329',
  },
};

const customLightTheme = {
  ...MD3LightTheme,
  colors: {
    ...MD3LightTheme.colors,
    primary: '#0284c7',
    surface: '#ffffff',
    background: '#f8fafc',
  },
};

const ThemeModeContext = createContext<ThemeModeContextType>({
  isDarkMode: true,
  setIsDarkMode: () => {},
  paperTheme: customDarkTheme,
});

export function ThemeModeProvider({ children }: { children: React.ReactNode }) {
  const [isDarkMode, setIsDarkMode] = useState(true);

  const paperTheme = useMemo(() => {
    return isDarkMode ? customDarkTheme : customLightTheme;
  }, [isDarkMode]);

  return (
    <ThemeModeContext.Provider value={{ isDarkMode, setIsDarkMode, paperTheme }}>
      {children}
    </ThemeModeContext.Provider>
  );
}

export function useThemeMode() {
  return useContext(ThemeModeContext);
}