import React, { useState, useEffect } from 'react';
import {
  Container,
  CssBaseline,
  ThemeProvider,
  createTheme,
  Typography,
  Box,
  IconButton,
  Paper,
  AppBar,
  Toolbar,
  Chip,
  Tooltip,
  CircularProgress,
  Fade,
} from '@mui/material';
import { LightMode, DarkMode, TravelExplore } from '@mui/icons-material';
import LocationForm from './components/LocationForm';
import MediaGallery from './components/MediaGallery';
import { searchPhotosByLocation } from './services/geoPhotoService';

export default function App() {
  const [isDarkMode, setIsDarkMode] = useState(true);
  const [photos, setPhotos] = useState([]);
  const [loading, setLoading] = useState(false);
  const [initialSplash, setInitialSplash] = useState(true); // Fullscreen Splash Loader State
  const [activeLocation, setActiveLocation] = useState('City of Baguio');

  // Dynamic Theme Builder
  const theme = createTheme({
    palette: {
      mode: isDarkMode ? 'dark' : 'light',
      primary: {
        main: isDarkMode ? '#38bdf8' : '#0f4c81',
      },
      secondary: {
        main: '#f43f5e',
      },
      background: {
        default: isDarkMode ? '#090d16' : '#f8fafc',
        paper: isDarkMode ? '#131c31' : '#ffffff',
      },
      text: {
        primary: isDarkMode ? '#f8fafc' : '#0f172a',
        secondary: isDarkMode ? '#94a3b8' : '#64748b',
      },
    },
    shape: {
      borderRadius: 16,
    },
    typography: {
      fontFamily: '"Plus Jakarta Sans", "Poppins", sans-serif',
    },
  });

  const handleSearchSubmit = async (locationName) => {
    setLoading(true);
    setActiveLocation(locationName);
    try {
      const results = await searchPhotosByLocation(locationName);
      setPhotos(results);
    } catch (error) {
      console.error('Global search execution error:', error);
      setPhotos([]);
    } finally {
      setLoading(false);
    }
  };

  // Initial Load with Splash Screen delay (1.8s for smooth entrance)
  useEffect(() => {
    const initApp = async () => {
      await handleSearchSubmit('City of Baguio');
      setTimeout(() => {
        setInitialSplash(false);
      }, 1500);
    };
    initApp();
  }, []);

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />

      {/* 🌟 FULLSCREEN INITIAL SPLASH LOADING SCREEN */}
      {initialSplash ? (
        <Box
          sx={{
            position: 'fixed',
            inset: 0,
            zIndex: 9999,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: isDarkMode ? '#090d16' : '#ffffff',
            color: isDarkMode ? '#ffffff' : '#0f4c81',
          }}
        >
          <TravelExplore sx={{ fontSize: 70, mb: 2, animation: 'bounce 1.5s infinite' }} />
          <Typography variant="h4" fontWeight={800} sx={{ letterSpacing: 1, mb: 1 }}>
            Lakbay PH
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
            Loading...
          </Typography>
          <CircularProgress color="primary" size={40} thickness={4} />
        </Box>
      ) : (
        <Fade in={!initialSplash} timeout={800}>
          <Box>
            {/* Top Glass Navbar */}
            <AppBar
              position="sticky"
              elevation={0}
              sx={{
                backdropFilter: 'blur(16px)',
                backgroundColor: isDarkMode ? 'rgba(9, 13, 22, 0.85)' : 'rgba(255, 255, 255, 0.85)',
                borderBottom: '1px solid',
                borderColor: isDarkMode ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.08)',
              }}
            >
              <Toolbar sx={{ justifyContent: 'space-between', maxWidth: 'lg', width: '100%', mx: 'auto' }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                  <TravelExplore sx={{ color: isDarkMode ? '#38bdf8' : '#0f4c81', fontSize: 32 }} />
                  <Typography variant="h6" fontWeight={800}>
                    Lakbay PH
                  </Typography>
                  <Chip label="PRO" size="small" color="primary" sx={{ height: 20, fontSize: '0.65rem', fontWeight: 800 }} />
                </Box>

                <Tooltip title={isDarkMode ? 'Light Mode' : 'Dark Mode'}>
                  <IconButton onClick={() => setIsDarkMode(!isDarkMode)} color="inherit">
                    {isDarkMode ? <LightMode sx={{ color: '#fbbf24' }} /> : <DarkMode sx={{ color: '#0f4c81' }} />}
                  </IconButton>
                </Tooltip>
              </Toolbar>
            </AppBar>

            <Container maxWidth="lg" sx={{ minHeight: '100vh', py: 4 }}>
              {/* Hero Banner */}
              <Paper
                elevation={0}
                sx={{
                  p: { xs: 3, md: 5 },
                  borderRadius: 8,
                  textAlign: 'center',
                  mb: 4,
                  position: 'relative',
                  overflow: 'hidden',
                  color: '#ffffff',
                  background: isDarkMode
                    ? 'linear-gradient(135deg, #064e3b 0%, #0f172a 50%, #0369a1 100%)'
                    : 'linear-gradient(135deg, #0f4c81 0%, #059669 100%)',
                  boxShadow: '0 20px 50px rgba(6, 78, 59, 0.3)',
                }}
              >
                <Typography variant="h3" fontWeight={800} sx={{ mb: 1, letterSpacing: '-0.5px' }}>
                  🇵🇭 Lakbay PH
                </Typography>

                <Typography variant="body1" sx={{ opacity: 0.9, mb: 4, maxWidth: 600, mx: 'auto', fontWeight: 300 }}>
                  Explore tourist spots across regions, cities, and municipalities in the Philippines
                </Typography>

                {/* Form Container */}
                <Paper
                  elevation={0}
                  sx={{
                    p: 3,
                    borderRadius: 5,
                    backgroundColor: isDarkMode ? 'rgba(19, 28, 49, 0.85)' : 'rgba(255, 255, 255, 0.92)',
                    backdropFilter: 'blur(20px)',
                    border: '1px solid',
                    borderColor: isDarkMode ? 'rgba(255, 255, 255, 0.12)' : 'rgba(255, 255, 255, 0.8)',
                  }}
                >
                  <LocationForm onSearch={handleSearchSubmit} />
                </Paper>
              </Paper>

              {/* Status Header */}
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 3, px: 1 }}>
                <Typography variant="h6" fontWeight={700}>
                  Featured Spots in <span style={{ color: isDarkMode ? '#38bdf8' : '#0f4c81' }}>{activeLocation}</span>
                </Typography>
                <Chip label={`${photos.length} Photos`} size="small" variant="outlined" color="primary" />
              </Box>

              {/* Gallery Grid */}
              <MediaGallery photos={photos} loading={loading} />
            </Container>
          </Box>
        </Fade>
      )}
    </ThemeProvider>
  );
}