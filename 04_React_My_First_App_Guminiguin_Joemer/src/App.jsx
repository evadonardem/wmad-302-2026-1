import { Container, createTheme, CssBaseline, ThemeProvider } from '@mui/material'
import './App.css'
import QuoteOfTheDay from './components/QuoteOfTheDay'
import { DarkMode, LightMode, Palette, Print, Share } from '@mui/icons-material';
import { useState } from 'react';
import GeneralSettings from './components/GeneralSettings';

export default function App() {
  const [isDarkMode, setIsDarkMode] = useState(false);

  const theme = createTheme({
    palette: {
      mode: isDarkMode ? 'dark' : 'light',
      primary: {
        main: '#16a34a',
      },
      secondary: {
        main: '#22c55e',
      },
      background: {
        default: isDarkMode ? '#0f172a' : '#f0fdf4',
        paper: isDarkMode ? '#1e293b' : '#ffffff',
      },
    },
  });

  const actions = [
    {
      name: isDarkMode ? 'Light Mode' : 'Dark Mode',
      icon: isDarkMode ? <LightMode /> : <DarkMode />,
      onClick: () => setIsDarkMode((prev) => !prev),
    },
    { icon: <Palette />, name: 'Theme' },
    { icon: <Print />, name: 'Print', onClick: () => window.print() },
    { icon: <Share />, name: 'Share' },
  ];

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Container
        maxWidth={false}
        disableGutters
        sx={{
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'center',
          minHeight: '100vh',
          width: '100vw',
        }}
      >
        <QuoteOfTheDay />
        <GeneralSettings actions={actions} />
      </Container>
    </ThemeProvider>
  );
}