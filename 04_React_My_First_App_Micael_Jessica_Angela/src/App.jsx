import { Container, createTheme, CssBaseline, ThemeProvider } from '@mui/material'
import './App.css'
import QuoteOfTheDay from './components/QuoteOfTheDay'
import { DarkMode, LightMode, Palette, Print, Share } from '@mui/icons-material';
import { useState } from 'react';
import GeneralSettings from './components/GeneralSettings';

const theme = (mode = 'light') => createTheme({
  palette: {
    mode,
    primary: {
      main: mode === 'dark' ? '#ffffff' : '#141414',
    },
    background: {
      default: mode === 'dark' ? '#121212' : '#ffffff',
      paper: mode === 'dark' ? '#1e1e1e' : '#ffffff',
    },
  },
});

function App() {
  const [isDarkMode, setIsDarkMode] = useState(false);

  const actions = [
    {
      icon: isDarkMode ? <LightMode /> : <DarkMode />,
      name: isDarkMode ? 'Light Mode' : 'Dark Mode',
      onClick: () => setIsDarkMode(currMode => !currMode)
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
        bgcolor: 'background.default',
      }}>
        <QuoteOfTheDay />
        <GeneralSettings actions={actions} />
      </Container>
    </ThemeProvider>
  )
}

export default App