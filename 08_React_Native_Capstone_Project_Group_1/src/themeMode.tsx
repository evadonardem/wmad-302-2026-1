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
