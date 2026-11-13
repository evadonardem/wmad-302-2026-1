import { createContext, useContext, type Dispatch, type ReactNode, type SetStateAction } from 'react';

export type ThemeMode = 'light' | 'dark';

export type ThemeColors = {
  background: string;
  surface: string;
  text: string;
  textSecondary: string;
  primary: string;
  accent: string;
  border: string;
};

export type Theme = {
  mode: ThemeMode;
  colors: ThemeColors;
};

export const createTheme = (config?: { palette?: { mode?: ThemeMode } }): Theme => {
  const mode: ThemeMode = config?.palette?.mode ?? 'light';
  return {
    mode,
    colors: {
      light: {
        background: '#F3EEFF', // <-- NEW: Soft Light Purple Background
        surface: '#FFFFFF',    // Cards will remain white to pop out against the purple
        text: '#2D264B',       
        textSecondary: '#7A7393',
        primary: '#6B4EE6',    
        accent: '#FF6B6B',     
        border: '#E5DDFC',     // Slightly purple-tinted border
      },
      dark: {
        background: '#0D0914', // <-- NEW: Very dark deep violet background
        surface: '#181226',    // <-- NEW: Slightly lighter deep violet for cards
        text: '#F4F2FA',
        textSecondary: '#A49EB8',
        primary: '#9D84FF',    
        accent: '#FF8B8B',
        border: '#2D2840',
      },
    }[mode],
  };
};

const ThemeContext = createContext<Theme>(createTheme({ palette: { mode: 'light' } }));

export function ThemeProvider({ theme, children }: { theme: Theme; children: ReactNode }) {
  return <ThemeContext.Provider value={theme}>{children}</ThemeContext.Provider>;
}

export const useTheme = () => useContext(ThemeContext);

type ThemeModeValue = {
  isDarkMode: boolean;
  setIsDarkMode: Dispatch<SetStateAction<boolean>>;
};

const ThemeModeContext = createContext<ThemeModeValue>({
  isDarkMode: false,
  setIsDarkMode: () => {},
});

export function ThemeModeProvider({ value, children }: { value: ThemeModeValue; children: ReactNode }) {
  return <ThemeModeContext.Provider value={value}>{children}</ThemeModeContext.Provider>;
};

export const useThemeMode = () => useContext(ThemeModeContext);