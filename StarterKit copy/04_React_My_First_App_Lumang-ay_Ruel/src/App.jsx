import { Container, createTheme, CssBaseline, ThemeProvider } from '@mui/material'
import './App.css'
import QuoteOfTheDay from './components/QuoteOfTheDay'
import { DarkMode, LightMode, Palette, Print, Share } from '@mui/icons-material';
import { useState } from 'react';
import GeneralSettings from './components/GeneralSettings';

const theme = (mode = 'light') =>
  createTheme({
    palette: {
      mode,
      primary: {
        main: mode === 'dark' ? '#90caf9' : '#1976d2',
      },
      secondary: {
        main: mode === 'dark' ? '#f48fb1' : '#9c27b0',
      },
    },
  });

function App() {
  const [isDarkMode, setIsDarkMode] = useState(false);

  const actions = [
    {
      name: isDarkMode ? 'Light Mode' : 'Dark Mode',
      icon: isDarkMode ? <LightMode /> : <DarkMode />,
      onClick: () => setIsDarkMode((prev) => !prev),
    },
    { icon: <Palette />, name: 'Theme' },
    { icon: <Print />, name: 'Print' },
    { icon: <Share />, name: 'Share' },
  ];

  return (
    <ThemeProvider theme={theme(isDarkMode ? 'dark' : 'light')}>
      <CssBaseline />
      <Container sx={{
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        minHeight: '95vh',
        width: '100vw',
      }}>
        <QuoteOfTheDay />
        <GeneralSettings actions={actions} />
      </Container>
    </ThemeProvider>
  )
}

export default App
