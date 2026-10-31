import { createContext, useContext, type Dispatch, type ReactNode, type SetStateAction } from 'react';

// Pre-built app-wide theme bridge (not part of the assignment).
// The root layout owns the isDarkMode state and mounts PaperProvider there, so every
// route (both tabs AND the photo modal) follows the same MD3 light/dark palette.
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

// ---- Cream / olive palette (used by the Search screen and LocationForm) ----
const LIGHT_PALETTE = {
  bg: '#f5e9d7',
  card: '#fbf3e6',
  field: '#f5ecdc',
  border: '#cdbfa3',
  text: '#3b3a2a',
  textSoft: '#6f6a55',
  accent: '#7a8b4f',
};

const DARK_PALETTE = {
  bg: '#1f1d16',
  card: '#2b281e',
  field: '#35311f',
  border: '#5a5338',
  text: '#f1e8d3',
  textSoft: '#bdb494',
  accent: '#93a65f',
};

export function usePalette() {
  const { isDarkMode } = useThemeMode();
  return isDarkMode ? DARK_PALETTE : LIGHT_PALETTE;
}
