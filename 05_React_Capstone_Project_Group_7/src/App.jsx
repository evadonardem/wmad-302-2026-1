import React, { useState } from 'react';
import {
  Container,
  CssBaseline,
  ThemeProvider,
  createTheme,
  Typography,
  Box,
  IconButton,
  Paper,
} from '@mui/material';
import { LightMode, DarkMode } from '@mui/icons-material';
import LocationForm from './components/LocationForm';
import MediaGallery from './components/MediaGallery';
import { searchPhotosByLocation } from './services/geoPhotoService';

export default function App() {
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [photos, setPhotos] = useState([]);
  const [loading, setLoading] = useState(false);

  const theme = createTheme({
    palette: {
      mode: isDarkMode ? 'dark' : 'light',
      primary: { main: isDarkMode ? '#d9b875' : '#245b58' },
      secondary: { main: '#789b79' },
      background: {
        default: isDarkMode ? '#172724' : '#f7f5ec',
        paper: isDarkMode ? '#243632' : '#fffefa',
      },
    },
    shape: { borderRadius: 12 },
    typography: {
      fontFamily: 'Arial, sans-serif',
    },
  });

  const handleSearchSubmit = async (locationName) => {
    setLoading(true);

    try {
      const results = await searchPhotosByLocation(locationName);
      setPhotos(results);
    } catch (error) {
      console.error('Photo search failed:', error);
      setPhotos([]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />

      <Box
        sx={{
          minHeight: '100vh',
          boxSizing: 'border-box',
          p: { xs: 1.5, md: 2.5 },
          background: isDarkMode
            ? 'linear-gradient(135deg, #172724, #29443d)'
            : 'linear-gradient(135deg, #f7f5ec, #eaf0e6)',
        }}
      >
        <Container maxWidth="xl" disableGutters>
          {/* Header and Search */}
          <Paper
            elevation={0}
            sx={{
              p: { xs: 2, md: 3 },
              borderRadius: 3,
              border: '1px solid',
              borderColor: 'divider',
              textAlign: 'center',
              position: 'relative',
            }}
          >
            <Box
              sx={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
              }}
            >
              <Typography
                sx={{
                  fontSize: { md: '1.2rem' },
                }}
              >
                🌄 
              </Typography>

              <IconButton
                onClick={() => setIsDarkMode(!isDarkMode)}
                aria-label="Toggle dark mode"
                color="inherit"
              >
                {isDarkMode ? <LightMode /> : <DarkMode />}
              </IconButton>
            </Box>

            <Typography
              sx={{
                color: 'secondary.main',
                fontSize: '.75rem',
                fontWeight: 'bold',
                letterSpacing: 3,
                mt: 1,
              }}
            >
              YOUR NEXT ADVENTURE STARTS HERE
            </Typography>

            <Typography
              component="h1"
              sx={{
                fontWeight: 900,
                fontSize: { xs: '2.8rem', sm: '3.8rem', md: '4.5rem' },
                letterSpacing: '-2px',
                lineHeight: 1.1,
                color: 'primary.main',
                mt: 0.5,
              }}
            >
              Lakbay{' '}
              <Box component="span" sx={{ color: 'secondary.main' }}>
                PH!
              </Box>
            </Typography>

            <Typography
              color="text.secondary"
              sx={{ mt: 1, mb: 3, fontSize: { xs: '.9rem', md: '1rem' } }}
            >
              Discover tourist spots across the Philippines.
            </Typography>

            <Box
              sx={{
                maxWidth: 1000,
                mx: 'auto',
                p: { xs: 1.5, md: 2 },
                borderRadius: 3,
                backgroundColor: 'action.hover',
              }}
            >
              <LocationForm onSearch={handleSearchSubmit} />
            </Box>
          </Paper>

          {/* Photo Gallery */}
          <Paper
            elevation={0}
            sx={{
              mt: 2.5,
              p: { xs: 2, md: 3 },
              minHeight: 220,
              borderRadius: 3,
              border: '1px solid',
              borderColor: 'divider',
            }}
          >
            <Typography
              sx={{
                fontWeight: 'bold',
                fontSize: { xs: '1.1rem', md: '1.35rem' },
                mb: 0.5,
              }}
            >
              📸 Travel Inspiration
            </Typography>

            <Typography
              variant="body2"
              color="text.secondary"
              sx={{ mb: 2.5 }}
            >
              Find your next favorite destination.
            </Typography>

            <MediaGallery photos={photos} loading={loading} />
          </Paper>

          <Typography
            component="footer"
            variant="caption"
            color="text.secondary"
            sx={{ display: 'block', textAlign: 'center', mt: 2 }}
          >
            Lakbay PH • Explore the beauty of the Philippines 🇵🇭
          </Typography>
        </Container>
      </Box>
    </ThemeProvider>
  );
}
