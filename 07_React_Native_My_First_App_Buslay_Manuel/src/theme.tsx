import {createContext, useContext, type Dispatch, type ReactNode, type SetStateAction,} from 'react';

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

export const createTheme = (config?: {
  palette?: { mode?: ThemeMode };
}): Theme => {
  const mode: ThemeMode = config?.palette?.mode ?? 'light';

  return {
    mode,
    colors: {
      light: {
        background: '#FAF5F6',
        surface: '#FFFFFF',
        text: '#35141F',
        textSecondary: '#896773',
        primary: '#800020',
        accent: '#A63A5B',
        border: '#E8D5DC',
      },
      dark: {
        background: '#1A1014',
        surface: '#291820',
        text: '#FFF0F4',
        textSecondary: '#C9A6B3',
        primary: '#B84D6D',
        accent: '#D77A96',
        border: '#4A2B38',
      },
    }[mode],
  };
};

const ThemeContext = createContext<Theme>(
  createTheme({ palette: { mode: 'light' } }),
);

export function ThemeProvider({
  theme,
  children,
}: {
  theme: Theme;
  children: ReactNode;
}) {
  return (
    <ThemeContext.Provider value={theme}>
      {children}
    </ThemeContext.Provider>
  );
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

export function ThemeModeProvider({
  value,
  children,
}: {
  value: ThemeModeValue;
  children: ReactNode;
}) {
  return (
    <ThemeModeContext.Provider value={value}>
      {children}
    </ThemeModeContext.Provider>
  );
}

export const useThemeMode = () => useContext(ThemeModeContext);