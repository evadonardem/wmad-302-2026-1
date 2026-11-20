import React, { createContext, useContext, useState } from 'react';

export type DesignMode = 'glass' | 'crimson';

interface DesignModeContextValue {
  mode: DesignMode;
  isCrimson: boolean;
  setMode: (m: DesignMode) => void;
  toggleMode: () => void;
}

const DesignModeContext = createContext<DesignModeContextValue>({
  mode: 'glass',
  isCrimson: false,
  setMode: () => {},
  toggleMode: () => {},
});

export function DesignModeProvider({ children }: { children: React.ReactNode }) {
  const [mode, setMode] = useState<DesignMode>('glass');
  const toggleMode = () => setMode((prev) => (prev === 'glass' ? 'crimson' : 'glass'));

  return (
    <DesignModeContext.Provider
      value={{ mode, isCrimson: mode === 'crimson', setMode, toggleMode }}
    >
      {children}
    </DesignModeContext.Provider>
  );
}

export function useDesignMode() {
  return useContext(DesignModeContext);
}
