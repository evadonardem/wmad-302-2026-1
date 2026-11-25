
import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  ReactNode,
} from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

type ThemeMode = 'light' | 'dark';

interface ThemeContextType {
  isDark: boolean;
  themeMode: ThemeMode;
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [themeMode, setThemeMode] = useState<ThemeMode>('light');
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    const loadTheme = async () => {
      try {
        const savedTheme = await AsyncStorage.getItem('cookbook-theme');

        if (savedTheme === 'dark' || savedTheme === 'light') {
          setThemeMode(savedTheme);
        }
      } catch (error) {
        console.log('Unable to load theme:', error);
      } finally {
        setIsLoaded(true);
      }
    };

    loadTheme();
  }, []);

  const toggleTheme = async () => {
    const newTheme: ThemeMode =
      themeMode === 'light' ? 'dark' : 'light';

    setThemeMode(newTheme);

    try {
      await AsyncStorage.setItem('cookbook-theme', newTheme);
    } catch (error) {
      console.log('Unable to save theme:', error);
    }
  };

  if (!isLoaded) {
    return null;
  }

  return (
    <ThemeContext.Provider
      value={{
        isDark: themeMode === 'dark',
        themeMode,
        toggleTheme,
      }}
    >
      {children}
    </ThemeContext.Provider>
  );
}

export function useThemeMode() {
  const context = useContext(ThemeContext);

  if (!context) {
    throw new Error('useThemeMode must be used inside ThemeProvider');
  }

  return context;
}
