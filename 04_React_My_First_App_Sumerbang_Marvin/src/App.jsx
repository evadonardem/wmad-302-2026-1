import { Container, createTheme, CssBaseline, ThemeProvider } from '@mui/material'
import './App.css'
import QuoteOfTheDay from './components/QuoteOfTheDay'
import { DarkMode, LightMode, Palette, Print, Share } from '@mui/icons-material';
import { useEffect, useState } from 'react';
import GeneralSettings from './components/GeneralSettings';

// TODO 13 [Dynamic Themes]: Complete the theme creation arrow function.
// It should accept a 'mode' string parameter ('light' or 'dark') and generate an MUI theme object configuration mapping that mode.
const theme = (mode = 'light') => createTheme({
  palette: {
    mode: mode,
    primary: {
      main: '#16a34a',
      light: '#4ade80',
      dark: '#15803d'
    },
    secondary: {
      main: '#22c55e'
    },
    background: {
      default: mode === 'dark' ? '#052e16' : '#f0fdf4',
      paper: mode === 'dark' ? '#0a2f1c' : '#ffffff'
    }
  }
});

function App() {
  // TODO 14 [State Management]: Initialize a boolean React state hook variable named 'isDarkMode' defaulting to false.
  const [isDarkMode, setIsDarkMode] = useState(false);

  // TODO 14.5 [Body Class Sync]: When 'isDarkMode' changes, add/remove 'dark-mode' class on the <body> element
  // This gives CSS a reliable way to detect dark mode and apply high-contrast text styles
  useEffect(() => {
    if (isDarkMode) {
      document.body.classList.add('dark-mode');
    } else {
      document.body.classList.remove('dark-mode');
    }
  }, [isDarkMode]);

  // TODO 15 [Data Actions Mapping]: Populate the 'actions' configuration array below.
  // Ensure the first action toggle object displays a <LightMode /> icon if 'isDarkMode' is true, or a <DarkMode /> icon if false.
  // The 'onClick' function must invert the current boolean state value of 'isDarkMode' upon execution.
  const actions = [
    {
      name: isDarkMode ? 'Light Mode' : 'Dark Mode',
      icon: isDarkMode ? <LightMode /> : <DarkMode />,
      onClick: () => setIsDarkMode(!isDarkMode)
    },
    { icon: <Palette />, name: 'Theme' },
    { icon: <Print />, name: 'Print' },
    { icon: <Share />, name: 'Share' },
  ];

  return (
    // TODO 16 [Theme Binding Layout]: Wrap the children inside a dynamic ThemeProvider passing the calculated theme mode.
    // Configure the layout context matching: mode should resolve to 'dark' if 'isDarkMode' is true, otherwise 'light'.
    <ThemeProvider theme={theme(isDarkMode ? 'dark' : 'light')}>
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
          width: '100%',
          margin: 0,
          padding: 0
        }}
      >
        <QuoteOfTheDay />
        <GeneralSettings actions={actions} />
      </Container>
    </ThemeProvider>
  )
}

export default App;