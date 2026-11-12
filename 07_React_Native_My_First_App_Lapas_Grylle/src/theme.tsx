import React, { createContext, useContext, useState, ReactNode } from 'react';

export interface Theme {
  background: string;
  cardBg: string;
  text: string;
  subtext: string;
  primary: string;
  chipBg: string;
}

export const lightTheme: Theme = {
  background: '#F5F5F7',
  cardBg: '#FFFFFF',
  text: '#1C1C1E',
  subtext: '#6E6E73',
  primary: '#007AFF',
  chipBg: '#E5E5EA',
};

export const darkTheme: Theme = {
  background: '#000000',
  cardBg: '#1C1C1E',
  text: '#FFFFFF',
  subtext: '#8E8E93',
  primary: '#0A84FF',
  chipBg: '#2C2C2E',
};

interface ThemeContextType {
  theme: Theme;
  isDarkMode: boolean;
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextType>({
  theme: lightTheme,
  isDarkMode: false,
  toggleTheme: () => {},
});

export const ThemeProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [isDarkMode, setIsDarkMode] = useState(false);

  const toggleTheme = () => {
    setIsDarkMode((prev) => !prev);
  };

  const theme = isDarkMode ? darkTheme : lightTheme;

  return (
    <ThemeContext.Provider value={{ theme, isDarkMode, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => useContext(ThemeContext);