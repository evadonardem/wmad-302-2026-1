import React, { createContext, ReactNode, useCallback, useContext, useState } from 'react';
import { Snackbar } from 'react-native-paper';

interface SnackbarContextType {
  show: (message: string) => void;
}

const SnackbarContext = createContext<SnackbarContextType | undefined>(undefined);

export function SnackbarProvider({ children }: { children: ReactNode }) {
  const [message, setMessage] = useState('');

  const show = useCallback((text: string) => setMessage(text), []);

  return (
    <SnackbarContext.Provider value={{ show }}>
      {children}
      <Snackbar visible={message.length > 0} onDismiss={() => setMessage('')} duration={3000}>
        {message}
      </Snackbar>
    </SnackbarContext.Provider>
  );
}

export function useSnackbar(): SnackbarContextType {
  const context = useContext(SnackbarContext);
  if (!context) throw new Error('useSnackbar must be used within a SnackbarProvider');
  return context;
}
