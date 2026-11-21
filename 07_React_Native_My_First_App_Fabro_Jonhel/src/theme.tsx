import { createContext, useContext, type Dispatch, type ReactNode, type SetStateAction } from 'react';

// Pre-built theme infrastructure (not part of the assignment).
// Students call createTheme() with a palette mode in TODO 13 and wrap their
// screen with ThemeProvider in TODO 16 — this file itself does not need editing.
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
        background: '#f4f6f8',
        surface: '#ffffff',
        text: '#1a1d21',
        textSecondary: '#6b7280',
        primary: '#1976d2',
        accent: '#2e7d32',
        border: '#e0e4e8',
      },
      dark: {
        background: '#121417',
        surface: '#1e2126',
        text: '#f2f4f7',
        textSecondary: '#9aa3ad',
        primary: '#90caf9',
        accent: '#66bb6a',
        border: '#2c313a',
      },
    }[mode],
  };
};

const ThemeContext = createContext<Theme>(createTheme({ palette: { mode: 'light' } }));

export function ThemeProvider({ theme, children }: { theme: Theme; children: ReactNode }) {
  return <ThemeContext.Provider value={theme}>{children}</ThemeContext.Provider>;
}

export const useTheme = () => useContext(ThemeContext);

// Cross-screen theme mode bridge: the root layout (src/app/_layout.tsx) owns the
// isDarkMode state (TODO 14) and provides it here, so screens like Settings can
// flip it without prop drilling. Pre-built — does not need editing.
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
}

export const useThemeMode = () => useContext(ThemeModeContext);
